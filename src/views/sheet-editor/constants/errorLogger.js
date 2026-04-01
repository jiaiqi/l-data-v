import { ErrorSeverity, ErrorCategory } from './errorTypes'

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
}

const SEVERITY_TO_LOG_LEVEL = {
  [ErrorSeverity.LOW]: LOG_LEVELS.INFO,
  [ErrorSeverity.MEDIUM]: LOG_LEVELS.WARN,
  [ErrorSeverity.HIGH]: LOG_LEVELS.ERROR,
  [ErrorSeverity.CRITICAL]: LOG_LEVELS.FATAL,
}

class ErrorLoggerClass {
  constructor(options = {}) {
    this.maxLogSize = options.maxLogSize || 100
    this.enableConsole = options.enableConsole !== false
    this.enableStorage = options.enableStorage !== false
    this.storageKey = options.storageKey || 'sheet_error_logs'
    this.remoteEndpoint = options.remoteEndpoint || null
    this.logBuffer = []
    this.sessionId = this.generateSessionId()
    this.userInfo = null
    this.appInfo = {
      version: import.meta.env?.VITE_APP_VERSION || 'unknown',
      environment: import.meta.env?.MODE || 'development',
    }
    this.loadFromStorage()
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserInfo(user) {
    this.userInfo = user ? {
      id: user.id || user.userno,
      name: user.name || user.username,
      dept: user.dept || user.dept_name,
    } : null
  }

  loadFromStorage() {
    if (!this.enableStorage) return
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.logBuffer = JSON.parse(stored)
      }
    } catch (e) {
      this.logBuffer = []
    }
  }

  saveToStorage() {
    if (!this.enableStorage) return
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logBuffer))
    } catch (e) {
      console.warn('无法保存错误日志到本地存储', e)
    }
  }

  log(error) {
    const logEntry = this.createLogEntry(error)
    this.addToBuffer(logEntry)
    this.outputToConsole(logEntry)
    this.saveToStorage()
    this.sendToRemote(logEntry)
    return logEntry
  }

  createLogEntry(error) {
    return {
      id: this.generateLogId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      error: error.toLogObject ? error.toLogObject() : {
        name: error.name || 'Error',
        code: error.code || 'UNKNOWN',
        message: error.message,
        stack: error.stack,
      },
      context: {
        url: window.location.href,
        route: this.getCurrentRoute(),
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      },
      user: this.userInfo,
      app: this.appInfo,
      userActionPath: error.userActionPath || [],
    }
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getCurrentRoute() {
    try {
      const path = window.location.pathname
      const query = window.location.search
      return `${path}${query}`
    } catch {
      return 'unknown'
    }
  }

  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry)
    if (this.logBuffer.length > this.maxLogSize) {
      this.logBuffer.shift()
    }
  }

  outputToConsole(logEntry) {
    if (!this.enableConsole) return
    const logLevel = SEVERITY_TO_LOG_LEVEL[logEntry.error.severity] || LOG_LEVELS.ERROR
    const consoleMethod = this.getConsoleMethod(logLevel)
    const prefix = `[${logEntry.timestamp}] [${logEntry.error.code}]`
    consoleMethod(prefix, logEntry.error.message)
    if (logLevel >= LOG_LEVELS.ERROR) {
      console.groupCollapsed('错误详情')
      console.log('错误信息:', logEntry.error)
      console.log('上下文:', logEntry.context)
      console.log('用户操作路径:', logEntry.userActionPath)
      if (logEntry.error.stack) {
        console.log('堆栈:', logEntry.error.stack)
      }
      console.groupEnd()
    }
  }

  getConsoleMethod(logLevel) {
    switch (logLevel) {
      case LOG_LEVELS.DEBUG:
      case LOG_LEVELS.INFO:
        return console.info.bind(console)
      case LOG_LEVELS.WARN:
        return console.warn.bind(console)
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL:
      default:
        return console.error.bind(console)
    }
  }

  async sendToRemote(logEntry) {
    if (!this.remoteEndpoint) return
    const logLevel = SEVERITY_TO_LOG_LEVEL[logEntry.error.severity] || LOG_LEVELS.ERROR
    if (logLevel < LOG_LEVELS.ERROR) return
    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
        keepalive: true,
      })
    } catch (e) {
      console.warn('发送错误日志到远程服务失败', e)
    }
  }

  getLogs(filter = {}) {
    let logs = [...this.logBuffer]
    if (filter.severity) {
      logs = logs.filter(log => log.error.severity === filter.severity)
    }
    if (filter.category) {
      logs = logs.filter(log => log.error.category === filter.category)
    }
    if (filter.code) {
      logs = logs.filter(log => log.error.code === filter.code)
    }
    if (filter.startTime) {
      const startTime = new Date(filter.startTime).getTime()
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= startTime)
    }
    if (filter.endTime) {
      const endTime = new Date(filter.endTime).getTime()
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= endTime)
    }
    return logs
  }

  getRecentErrors(count = 10) {
    return this.logBuffer.slice(-count)
  }

  getErrorStats() {
    const stats = {
      total: this.logBuffer.length,
      bySeverity: {},
      byCategory: {},
      byCode: {},
    }
    this.logBuffer.forEach(log => {
      const severity = log.error.severity || 'unknown'
      const category = log.error.category || 'unknown'
      const code = log.error.code || 'unknown'
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      stats.byCode[code] = (stats.byCode[code] || 0) + 1
    })
    return stats
  }

  clearLogs() {
    this.logBuffer = []
    if (this.enableStorage) {
      localStorage.removeItem(this.storageKey)
    }
  }

  exportLogs(format = 'json') {
    const logs = this.logBuffer
    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }
    if (format === 'csv') {
      return this.logsToCSV(logs)
    }
    return logs
  }

  logsToCSV(logs) {
    const headers = ['时间戳', '错误码', '错误消息', '严重程度', '类别', 'URL', '用户']
    const rows = logs.map(log => [
      log.timestamp,
      log.error.code,
      log.error.message,
      log.error.severity,
      log.error.category,
      log.context.url,
      log.user?.name || 'unknown',
    ])
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  setRemoteEndpoint(endpoint) {
    this.remoteEndpoint = endpoint
  }

  enableRemoteLogging(endpoint) {
    this.setRemoteEndpoint(endpoint)
  }

  disableRemoteLogging() {
    this.remoteEndpoint = null
  }
}

export const ErrorLogger = new ErrorLoggerClass()

export const logError = (error) => ErrorLogger.log(error)

export const getErrorLogs = (filter) => ErrorLogger.getLogs(filter)

export const clearErrorLogs = () => ErrorLogger.clearLogs()

export const exportErrorLogs = (format) => ErrorLogger.exportLogs(format)

export const getErrorStats = () => ErrorLogger.getErrorStats()
