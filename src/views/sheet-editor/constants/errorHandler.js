import { Message, MessageBox } from 'element-ui'
import {
  ErrorCode,
  SheetError,
  NetworkError,
  AuthError,
  ValidationError,
  PermissionError,
  DataError,
  OperationError,
  ErrorSeverity,
  ErrorCategory,
} from './errorTypes'
import { getErrorMessage, ErrorActionLabels } from './errorMessages'
import { ErrorLogger } from './errorLogger'

class ErrorHandlerClass {
  constructor() {
    this.logger = new ErrorLogger()
    this.actionQueue = []
    this.userActionPath = []
    this.maxActionPathLength = 50
    this.notificationQueue = []
    this.isShowingNotification = false
  }

  recordUserAction(action, details = {}) {
    this.userActionPath.push({
      action,
      details,
      timestamp: new Date().toISOString(),
    })
    if (this.userActionPath.length > this.maxActionPathLength) {
      this.userActionPath.shift()
    }
  }

  clearUserActionPath() {
    this.userActionPath = []
  }

  getUserActionPath() {
    return [...this.userActionPath]
  }

  createError(code, options = {}) {
    const errorInfo = getErrorMessage(code)
    const ErrorClass = this.getErrorClass(code)
    return new ErrorClass(code, options.message || errorInfo.message, {
      ...options,
      suggestion: options.suggestion || errorInfo.suggestion,
      userActionPath: this.getUserActionPath(),
    })
  }

  getErrorClass(code) {
    const category = code.split('_')[0]
    const classMap = {
      NETWORK: NetworkError,
      AUTH: AuthError,
      VALIDATION: ValidationError,
      PERMISSION: PermissionError,
      DATA: DataError,
      OPERATION: OperationError,
    }
    return classMap[category] || SheetError
  }

  async handle(error, options = {}) {
    const sheetError = this.normalizeError(error)
    this.logger.log(sheetError)
    if (options.silent !== true) {
      await this.showNotification(sheetError, options)
    }
    return sheetError
  }

  normalizeError(error) {
    if (error instanceof SheetError) {
      return error
    }
    if (error?.response) {
      return this.normalizeAxiosError(error)
    }
    if (error instanceof Error) {
      return new SheetError(ErrorCode.SYSTEM.UNKNOWN, error.message, {
        originalError: error,
        userActionPath: this.getUserActionPath(),
      })
    }
    return new SheetError(ErrorCode.SYSTEM.UNKNOWN, String(error), {
      userActionPath: this.getUserActionPath(),
    })
  }

  normalizeAxiosError(error) {
    const response = error.response
    const status = response?.status
    const data = response?.data
    if (status === 401 || data?.resultCode === '0011') {
      return new AuthError(ErrorCode.AUTH.SESSION_EXPIRED, '登录信息已过期', {
        originalError: error,
        context: { status, resultCode: data?.resultCode },
        userActionPath: this.getUserActionPath(),
      })
    }
    if (status === 403) {
      return new PermissionError(ErrorCode.AUTH.PERMISSION_DENIED, '没有执行此操作的权限', {
        originalError: error,
        context: { status },
        userActionPath: this.getUserActionPath(),
      })
    }
    if (status === 404) {
      return new DataError(ErrorCode.DATA.NOT_FOUND, '请求的数据不存在', {
        originalError: error,
        context: { status },
        userActionPath: this.getUserActionPath(),
      })
    }
    if (status >= 500) {
      return new NetworkError(ErrorCode.NETWORK.SERVER_ERROR, '服务器错误', {
        originalError: error,
        context: { status },
        userActionPath: this.getUserActionPath(),
      })
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new NetworkError(ErrorCode.NETWORK.TIMEOUT, '请求超时', {
        originalError: error,
        userActionPath: this.getUserActionPath(),
      })
    }
    if (data?.state === 'FAILURE') {
      return new DataError(ErrorCode.DATA.SAVE_FAILED, data.resultMessage || '操作失败', {
        originalError: error,
        context: { resultCode: data.resultCode },
        userActionPath: this.getUserActionPath(),
      })
    }
    return new NetworkError(ErrorCode.NETWORK.REQUEST_FAILED, error.message || '网络请求失败', {
      originalError: error,
      userActionPath: this.getUserActionPath(),
    })
  }

  async showNotification(error, options = {}) {
    const errorInfo = getErrorMessage(error.code)
    const title = options.title || errorInfo.title
    const message = options.message || error.message
    const suggestion = error.suggestion || errorInfo.suggestion
    const actions = errorInfo.actions || ['cancel']
    if (actions.length === 1 && actions[0] === 'cancel') {
      this.showMessage(title, message, suggestion, error.severity)
      return
    }
    await this.showConfirm(title, message, suggestion, actions, error.severity)
  }

  showMessage(title, message, suggestion, severity) {
    const type = this.getMessageType(severity)
    const fullMessage = suggestion ? `${message}\n${suggestion}` : message
    Message({
      title,
      message: fullMessage,
      type,
      duration: severity === ErrorSeverity.CRITICAL ? 0 : 5000,
      showClose: true,
    })
  }

  async showConfirm(title, message, suggestion, actions, severity) {
    const type = this.getMessageType(severity)
    const fullMessage = suggestion ? `${message}\n\n建议：${suggestion}` : message
    const primaryAction = actions[0]
    const primaryLabel = ErrorActionLabels[primaryAction] || '确定'
    try {
      await MessageBox.confirm(fullMessage, title, {
        confirmButtonText: primaryLabel,
        cancelButtonText: '取消',
        type,
      })
      return { action: primaryAction, confirmed: true }
    } catch {
      return { action: 'cancel', confirmed: false }
    }
  }

  getMessageType(severity) {
    const typeMap = {
      [ErrorSeverity.LOW]: 'info',
      [ErrorSeverity.MEDIUM]: 'warning',
      [ErrorSeverity.HIGH]: 'error',
      [ErrorSeverity.CRITICAL]: 'error',
    }
    return typeMap[severity] || 'error'
  }

  networkTimeout(message, options = {}) {
    return this.createError(ErrorCode.NETWORK.TIMEOUT, { message, ...options })
  }

  networkError(message, options = {}) {
    return this.createError(ErrorCode.NETWORK.REQUEST_FAILED, { message, ...options })
  }

  authExpired(message, options = {}) {
    return this.createError(ErrorCode.AUTH.SESSION_EXPIRED, { message, ...options })
  }

  permissionDenied(message, options = {}) {
    return this.createError(ErrorCode.AUTH.PERMISSION_DENIED, { message, ...options })
  }

  noRowEditPermission(message, options = {}) {
    return this.createError(ErrorCode.PERMISSION.NO_ROW_EDIT, { message, ...options })
  }

  noColumnEditPermission(message, options = {}) {
    return this.createError(ErrorCode.PERMISSION.NO_COLUMN_EDIT, { message, ...options })
  }

  validationError(message, options = {}) {
    return this.createError(ErrorCode.VALIDATION.INVALID_INPUT, { message, ...options })
  }

  requiredField(field, options = {}) {
    return this.createError(ErrorCode.VALIDATION.REQUIRED_FIELD, {
      message: `请填写必填字段：${field}`,
      context: { field },
      ...options,
    })
  }

  dataNotFound(message, options = {}) {
    return this.createError(ErrorCode.DATA.NOT_FOUND, { message, ...options })
  }

  saveFailed(message, options = {}) {
    return this.createError(ErrorCode.DATA.SAVE_FAILED, { message, ...options })
  }

  operationInProgress(message, options = {}) {
    return this.createError(ErrorCode.OPERATION.IN_PROGRESS, { message, ...options })
  }

  unsupportedOperation(message, options = {}) {
    return this.createError(ErrorCode.OPERATION.UNSUPPORTED, { message, ...options })
  }

  wrapAsync(fn, options = {}) {
    return async (...args) => {
      try {
        this.recordUserAction(options.actionName || fn.name, { args })
        return await fn(...args)
      } catch (error) {
        const handled = await this.handle(error, options)
        if (options.throwHandled !== false) {
          throw handled
        }
        return null
      }
    }
  }

  wrapSync(fn, options = {}) {
    return (...args) => {
      try {
        this.recordUserAction(options.actionName || fn.name, { args })
        return fn(...args)
      } catch (error) {
        const handled = this.handle(error, { ...options, silent: options.silentOnError })
        if (options.throwHandled !== false) {
          throw handled
        }
        return null
      }
    }
  }
}

export const ErrorHandler = new ErrorHandlerClass()

export const handleError = (error, options = {}) => ErrorHandler.handle(error, options)

export const createError = (code, options = {}) => ErrorHandler.createError(code, options)

export const recordAction = (action, details = {}) => ErrorHandler.recordUserAction(action, details)
