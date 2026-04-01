export const ErrorCode = {
  NETWORK: {
    TIMEOUT: 'NETWORK_TIMEOUT',
    REQUEST_FAILED: 'NETWORK_REQUEST_FAILED',
    SERVER_ERROR: 'NETWORK_SERVER_ERROR',
    CONNECTION_LOST: 'NETWORK_CONNECTION_LOST',
  },
  AUTH: {
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
    PERMISSION_DENIED: 'AUTH_PERMISSION_DENIED',
    TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  },
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
    REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  },
  DATA: {
    NOT_FOUND: 'DATA_NOT_FOUND',
    DUPLICATE: 'DATA_DUPLICATE',
    CONFLICT: 'DATA_CONFLICT',
    SAVE_FAILED: 'DATA_SAVE_FAILED',
    DELETE_FAILED: 'DATA_DELETE_FAILED',
    LOAD_FAILED: 'DATA_LOAD_FAILED',
  },
  PERMISSION: {
    NO_ROW_EDIT: 'PERMISSION_NO_ROW_EDIT',
    NO_COLUMN_EDIT: 'PERMISSION_NO_COLUMN_EDIT',
    NO_OPERATION: 'PERMISSION_NO_OPERATION',
    NO_DELETE: 'PERMISSION_NO_DELETE',
  },
  OPERATION: {
    IN_PROGRESS: 'OPERATION_IN_PROGRESS',
    INVALID_STATE: 'OPERATION_INVALID_STATE',
    UNSUPPORTED: 'OPERATION_UNSUPPORTED',
    CANCELLED: 'OPERATION_CANCELLED',
  },
  FILE: {
    UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
    DOWNLOAD_FAILED: 'FILE_DOWNLOAD_FAILED',
    INVALID_TYPE: 'FILE_INVALID_TYPE',
    SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  },
  SYSTEM: {
    UNKNOWN: 'SYSTEM_UNKNOWN',
    CONFIG_ERROR: 'SYSTEM_CONFIG_ERROR',
    INIT_FAILED: 'SYSTEM_INIT_FAILED',
  },
}

export const ErrorCategory = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  DATA: 'data',
  PERMISSION: 'permission',
  OPERATION: 'operation',
  FILE: 'file',
  SYSTEM: 'system',
}

export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

export class SheetError extends Error {
  constructor(code, message, options = {}) {
    super(message)
    this.name = 'SheetError'
    this.code = code
    this.category = options.category || this.getCategoryFromCode(code)
    this.severity = options.severity || ErrorSeverity.MEDIUM
    this.context = options.context || {}
    this.timestamp = new Date().toISOString()
    this.recoverable = options.recoverable !== false
    this.suggestion = options.suggestion || null
    this.originalError = options.originalError || null
    this.userActionPath = options.userActionPath || []
  }

  getCategoryFromCode(code) {
    const prefix = code.split('_')[0]
    const categoryMap = {
      NETWORK: ErrorCategory.NETWORK,
      AUTH: ErrorCategory.AUTH,
      VALIDATION: ErrorCategory.VALIDATION,
      DATA: ErrorCategory.DATA,
      PERMISSION: ErrorCategory.PERMISSION,
      OPERATION: ErrorCategory.OPERATION,
      FILE: ErrorCategory.FILE,
      SYSTEM: ErrorCategory.SYSTEM,
    }
    return categoryMap[prefix] || ErrorCategory.SYSTEM
  }

  toLogObject() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      userActionPath: this.userActionPath,
      stack: this.stack,
      originalError: this.originalError?.message || null,
    }
  }
}

export class NetworkError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.NETWORK })
    this.name = 'NetworkError'
  }
}

export class AuthError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.AUTH, severity: ErrorSeverity.HIGH })
    this.name = 'AuthError'
  }
}

export class ValidationError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.VALIDATION })
    this.name = 'ValidationError'
    this.field = options.field || null
    this.value = options.value || null
  }
}

export class PermissionError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.PERMISSION, severity: ErrorSeverity.HIGH })
    this.name = 'PermissionError'
  }
}

export class DataError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.DATA })
    this.name = 'DataError'
  }
}

export class OperationError extends SheetError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, category: ErrorCategory.OPERATION })
    this.name = 'OperationError'
  }
}

export const isErrorType = (error, errorClass) => {
  return error instanceof errorClass
}

export const isRecoverable = (error) => {
  if (error instanceof SheetError) {
    return error.recoverable
  }
  return true
}

export const getErrorSeverity = (error) => {
  if (error instanceof SheetError) {
    return error.severity
  }
  return ErrorSeverity.MEDIUM
}
