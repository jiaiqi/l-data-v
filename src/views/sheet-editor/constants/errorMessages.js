import { ErrorCode } from './errorTypes'

export const ErrorMessages = {
  [ErrorCode.NETWORK.TIMEOUT]: {
    title: '请求超时',
    message: '网络请求超时，请检查网络连接后重试',
    suggestion: '请检查网络连接是否正常，或稍后重试',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.NETWORK.REQUEST_FAILED]: {
    title: '请求失败',
    message: '网络请求失败，请稍后重试',
    suggestion: '请检查网络连接，或联系技术支持',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.NETWORK.SERVER_ERROR]: {
    title: '服务器错误',
    message: '服务器处理请求时发生错误',
    suggestion: '请稍后重试，如问题持续请联系技术支持',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.NETWORK.CONNECTION_LOST]: {
    title: '连接断开',
    message: '网络连接已断开',
    suggestion: '请检查网络连接后刷新页面',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.AUTH.UNAUTHORIZED]: {
    title: '未授权',
    message: '您没有权限执行此操作',
    suggestion: '请联系管理员获取相应权限',
    actions: ['login', 'cancel'],
  },
  [ErrorCode.AUTH.SESSION_EXPIRED]: {
    title: '会话过期',
    message: '登录信息已过期，请重新登录',
    suggestion: '请重新登录以继续操作',
    actions: ['login', 'cancel'],
  },
  [ErrorCode.AUTH.PERMISSION_DENIED]: {
    title: '权限不足',
    message: '您没有执行此操作的权限',
    suggestion: '请联系管理员获取相应权限',
    actions: ['cancel'],
  },
  [ErrorCode.AUTH.TOKEN_INVALID]: {
    title: '凭证无效',
    message: '登录凭证无效，请重新登录',
    suggestion: '请重新登录以继续操作',
    actions: ['login', 'cancel'],
  },
  [ErrorCode.VALIDATION.INVALID_INPUT]: {
    title: '输入无效',
    message: '输入的数据格式不正确',
    suggestion: '请检查输入内容是否符合要求',
    actions: ['edit', 'cancel'],
  },
  [ErrorCode.VALIDATION.REQUIRED_FIELD]: {
    title: '必填字段',
    message: '请填写所有必填字段',
    suggestion: '请填写标记为必填的字段',
    actions: ['edit', 'cancel'],
  },
  [ErrorCode.VALIDATION.INVALID_FORMAT]: {
    title: '格式错误',
    message: '数据格式不符合要求',
    suggestion: '请按照提示的格式输入数据',
    actions: ['edit', 'cancel'],
  },
  [ErrorCode.VALIDATION.OUT_OF_RANGE]: {
    title: '超出范围',
    message: '输入的值超出了允许的范围',
    suggestion: '请输入在允许范围内的值',
    actions: ['edit', 'cancel'],
  },
  [ErrorCode.DATA.NOT_FOUND]: {
    title: '数据不存在',
    message: '请求的数据不存在或已被删除',
    suggestion: '请刷新页面查看最新数据',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.DATA.DUPLICATE]: {
    title: '数据重复',
    message: '该数据已存在，请勿重复添加',
    suggestion: '请检查是否已存在相同的数据',
    actions: ['edit', 'cancel'],
  },
  [ErrorCode.DATA.CONFLICT]: {
    title: '数据冲突',
    message: '数据已被其他用户修改',
    suggestion: '请刷新页面获取最新数据后重试',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.DATA.SAVE_FAILED]: {
    title: '保存失败',
    message: '数据保存失败，请重试',
    suggestion: '请检查数据是否正确，或联系技术支持',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.DATA.DELETE_FAILED]: {
    title: '删除失败',
    message: '数据删除失败，请重试',
    suggestion: '请检查是否有依赖数据，或联系技术支持',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.DATA.LOAD_FAILED]: {
    title: '加载失败',
    message: '数据加载失败，请刷新页面重试',
    suggestion: '请刷新页面，如问题持续请联系技术支持',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.PERMISSION.NO_ROW_EDIT]: {
    title: '无编辑权限',
    message: '没有当前行的编辑权限',
    suggestion: '请联系管理员获取编辑权限',
    actions: ['cancel'],
  },
  [ErrorCode.PERMISSION.NO_COLUMN_EDIT]: {
    title: '无列编辑权限',
    message: '没有当前列的编辑权限',
    suggestion: '请联系管理员获取编辑权限',
    actions: ['cancel'],
  },
  [ErrorCode.PERMISSION.NO_OPERATION]: {
    title: '无操作权限',
    message: '没有执行此操作的权限',
    suggestion: '请联系管理员获取相应权限',
    actions: ['cancel'],
  },
  [ErrorCode.PERMISSION.NO_DELETE]: {
    title: '无删除权限',
    message: '没有删除此数据的权限',
    suggestion: '请联系管理员获取删除权限',
    actions: ['cancel'],
  },
  [ErrorCode.OPERATION.IN_PROGRESS]: {
    title: '操作进行中',
    message: '正在进行其他操作，请稍候重试',
    suggestion: '请等待当前操作完成后再试',
    actions: ['wait', 'cancel'],
  },
  [ErrorCode.OPERATION.INVALID_STATE]: {
    title: '状态无效',
    message: '当前状态无法执行此操作',
    suggestion: '请刷新页面后重试',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.OPERATION.UNSUPPORTED]: {
    title: '不支持的操作',
    message: '当前不支持此操作',
    suggestion: '请联系技术支持了解更多',
    actions: ['cancel'],
  },
  [ErrorCode.OPERATION.CANCELLED]: {
    title: '操作已取消',
    message: '操作已被用户取消',
    suggestion: '',
    actions: ['cancel'],
  },
  [ErrorCode.FILE.UPLOAD_FAILED]: {
    title: '上传失败',
    message: '文件上传失败，请重试',
    suggestion: '请检查文件大小和格式是否符合要求',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.FILE.DOWNLOAD_FAILED]: {
    title: '下载失败',
    message: '文件下载失败，请重试',
    suggestion: '请检查网络连接后重试',
    actions: ['retry', 'cancel'],
  },
  [ErrorCode.FILE.INVALID_TYPE]: {
    title: '文件类型错误',
    message: '不支持的文件类型',
    suggestion: '请上传支持的文件类型',
    actions: ['cancel'],
  },
  [ErrorCode.FILE.SIZE_EXCEEDED]: {
    title: '文件过大',
    message: '文件大小超过了限制',
    suggestion: '请上传较小的文件',
    actions: ['cancel'],
  },
  [ErrorCode.SYSTEM.UNKNOWN]: {
    title: '未知错误',
    message: '发生了未知错误',
    suggestion: '请刷新页面重试，如问题持续请联系技术支持',
    actions: ['refresh', 'cancel'],
  },
  [ErrorCode.SYSTEM.CONFIG_ERROR]: {
    title: '配置错误',
    message: '系统配置有误',
    suggestion: '请联系技术支持修复配置',
    actions: ['cancel'],
  },
  [ErrorCode.SYSTEM.INIT_FAILED]: {
    title: '初始化失败',
    message: '系统初始化失败',
    suggestion: '请刷新页面重试，如问题持续请联系技术支持',
    actions: ['refresh', 'cancel'],
  },
}

export const ErrorActionLabels = {
  retry: '重试',
  cancel: '取消',
  refresh: '刷新页面',
  login: '重新登录',
  edit: '修改',
  wait: '等待',
}

export const getErrorMessage = (code) => {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.SYSTEM.UNKNOWN]
}

export const getErrorSuggestion = (code) => {
  const errorInfo = ErrorMessages[code]
  return errorInfo?.suggestion || ''
}

export const getErrorActions = (code) => {
  const errorInfo = ErrorMessages[code]
  return errorInfo?.actions || ['cancel']
}
