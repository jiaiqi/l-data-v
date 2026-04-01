/**
 * Sheet Editor 常量配置文件
 * 集中管理字段类型、操作类型、权限类型和错误消息等常量
 * @module sheet-editor/constants
 */

/**
 * 字段类型常量
 * @description 定义所有支持的字段类型，用于字段类型判断和渲染
 * @readonly
 * @enum {string}
 */
export const FIELD_TYPES = {
  DATE: 'Date',
  DATE_TIME: 'DateTime',
  ENUM: 'Enum',
  DICT: 'Dict',
  SET: 'Set',
  STRING: 'String',
  MULTILINE_TEXT: 'MultilineText',
  INTEGER: 'Integer',
  INT: 'Int',
  INT_LOWER: 'int',
  FLOAT: 'Float',
  MONEY: 'Money',
  DECIMAL: 'decimal',
  FILE_LIST: 'FileList',
  IMAGE: 'Image',
  NOTE: 'Note',
  RICH_TEXT: 'RichText',
  SNOTE: 'snote',
  FK: 'fk',
  FKS: 'fks',
  FK_JSON: 'fkjson',
  FK_JSONS: 'fkjsons',
  USER: 'User',
  DEPT: 'Dept',
  BXSYS_USER: 'bxsys_user',
  BXSYS_DEPT: 'bxsys_dept',
}

/**
 * 日期类型字段列表
 * @description 包含 Date 和 DateTime 类型
 * @type {ReadonlyArray<string>}
 */
export const DATE_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.DATE,
  FIELD_TYPES.DATE_TIME,
])

/**
 * 枚举类型字段列表
 * @description 包含 Enum, Dict, Set 类型
 * @type {ReadonlyArray<string>}
 */
export const ENUM_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.ENUM,
  FIELD_TYPES.DICT,
  FIELD_TYPES.SET,
])

/**
 * 数字类型字段列表
 * @description 包含 Integer, Float, Money, int, Int 类型及 decimal 类型
 * @type {ReadonlyArray<string>}
 */
export const NUMERIC_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.INTEGER,
  FIELD_TYPES.FLOAT,
  FIELD_TYPES.MONEY,
  FIELD_TYPES.INT,
  FIELD_TYPES.INT_LOWER,
])

/**
 * 整数类型字段列表
 * @description 用于判断是否需要 parseInt 处理
 * @type {ReadonlyArray<string>}
 */
export const INTEGER_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.INT,
  FIELD_TYPES.INT_LOWER,
  FIELD_TYPES.INTEGER,
])

/**
 * 富文本类型字段列表
 * @description 包含 Note, RichText, snote 类型
 * @type {ReadonlyArray<string>}
 */
export const RICH_TEXT_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.NOTE,
  FIELD_TYPES.RICH_TEXT,
  FIELD_TYPES.SNOTE,
])

/**
 * 文件类型字段列表
 * @description 包含 FileList, Image 类型，不支持双击编辑
 * @type {ReadonlyArray<string>}
 */
export const FILE_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.FILE_LIST,
  FIELD_TYPES.IMAGE,
])

/**
 * 外键类型字段列表
 * @description 包含 fks, fkjson, fkjsons 类型
 * @type {ReadonlyArray<string>}
 */
export const FK_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.FKS,
  FIELD_TYPES.FK_JSON,
  FIELD_TYPES.FK_JSONS,
])

/**
 * 用户/部门类型字段列表
 * @description 用于权限和选择器判断
 * @type {ReadonlyArray<string>}
 */
export const USER_DEPT_FIELD_TYPES = Object.freeze([
  FIELD_TYPES.USER,
  FIELD_TYPES.DEPT,
  FIELD_TYPES.BXSYS_USER,
  FIELD_TYPES.BXSYS_DEPT,
  FIELD_TYPES.FK,
])

/**
 * 操作类型常量
 * @description 定义数据操作类型，用于行状态标记和操作判断
 * @readonly
 * @enum {string}
 */
export const OPERATION_TYPES = {
  ADD: 'add',
  UPDATE: 'update',
  DELETE: 'delete',
  EDIT: 'edit',
  DETAIL: 'detail',
  ADD_CHILD_LIST: 'addchildlist',
  UPDATE_CHILD_LIST: 'updatechildlist',
  DETAIL_CHILD_LIST: 'detaillist',
}

/**
 * 新增操作类型列表
 * @description 包含所有新增相关的操作类型
 * @type {ReadonlyArray<string>}
 */
export const ADD_OPERATION_TYPES = Object.freeze([
  OPERATION_TYPES.ADD,
  OPERATION_TYPES.ADD_CHILD_LIST,
])

/**
 * 子表操作类型列表
 * @description 包含所有子表相关的操作类型
 * @type {ReadonlyArray<string>}
 */
export const CHILD_LIST_OPERATION_TYPES = Object.freeze([
  OPERATION_TYPES.ADD_CHILD_LIST,
  OPERATION_TYPES.UPDATE_CHILD_LIST,
  OPERATION_TYPES.DETAIL_CHILD_LIST,
])

/**
 * 权限类型常量
 * @description 定义按钮和操作权限类型
 * @readonly
 * @enum {string}
 */
export const PERMISSION_TYPES = {
  READONLY: 'readonly',
  DISABLED: 'disabled',
  EDITABLE: 'editable',
  HIDDEN: 'hidden',
}

/**
 * 按钮类型常量
 * @description 定义工具栏和行按钮类型
 * @readonly
 * @enum {string}
 */
export const BUTTON_TYPES = {
  ADD: 'add',
  UPDATE: 'update',
  DELETE: 'delete',
  EDIT: 'edit',
  DETAIL: 'detail',
}

/**
 * 列表类型常量
 * @description 定义列表显示类型
 * @readonly
 * @enum {string}
 */
export const LIST_TYPES = {
  LIST: 'list',
  TREE_LIST: 'treelist',
}

/**
 * 错误消息常量
 * @description 定义所有错误和警告消息
 * @readonly
 */
export const ERROR_MESSAGES = Object.freeze({
  INVALID_DATE_FORMAT: '非日期类型字符串',
  INVALID_NUMBER_FORMAT: '请输入数字',
  ADD_ROW_COLUMN_NOT_EDITABLE: '新增行不支持编辑当前列',
  NO_COLUMN_EDIT_PERMISSION: '没有编辑当前列的权限',
  NO_ROW_EDIT_PERMISSION: '没有当前行的编辑权限！',
  COLUMN_NOT_EDITABLE: '当前列不支持编辑',
  OPERATION_IN_PROGRESS: '正在进行其他操作，请稍候重试~',
  FIELD_TYPE_NOT_SUPPORT_EDIT: (fieldType) => `【${fieldType}】类型字段不支持双击进行编辑`,
  UPDATE_FIELD_FAILED: (message) => `更新表字段失败：${message}`,
})

/**
 * 成功消息常量
 * @description 定义所有成功消息
 * @readonly
 */
export const SUCCESS_MESSAGES = Object.freeze({
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  ADD_SUCCESS: '添加成功',
  UPDATE_SUCCESS: '更新成功',
})

/**
 * 警告消息常量
 * @description 定义所有警告消息
 * @readonly
 */
export const WARNING_MESSAGES = Object.freeze({
  NO_DATA: '暂无数据',
  UNSAVED_CHANGES: '有未保存的更改',
})

/**
 * 行状态标记常量
 * @description 定义行数据状态标记字段名
 * @readonly
 * @enum {string}
 */
export const ROW_FLAGS = Object.freeze({
  ADD: 'add',
  UPDATE: 'update',
})

/**
 * 内部字段名常量
 * @description 定义内部使用的特殊字段名
 * @readonly
 * @enum {string}
 */
export const INTERNAL_FIELDS = Object.freeze({
  __ID: '__id',
  __FLAG: '__flag',
  __PARENT_ROW: '__parent_row',
  ROW_KEY: 'rowKey',
  ID: 'id',
  __BUTTON_AUTH: '__button_auth',
  _BUTTONS: '_buttons',
  __UNFOLD: '__unfold',
  __INDENT: '__indent',
  __UPDATE_COL: '__update_col',
  LIST_TYPE: 'listType',
  _EDIT_FIELD: '_edit_field',
})

/**
 * 分页配置常量
 * @description 定义分页相关配置
 * @readonly
 */
export const PAGINATION_CONFIG = Object.freeze({
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100, 200, 500],
})

/**
 * 判断字段是否为日期类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isDateFieldType = (fieldType) => {
  return DATE_FIELD_TYPES.includes(fieldType) || 
         fieldType?.toLowerCase() === 'date' || 
         fieldType?.toLowerCase() === 'datetime'
}

/**
 * 判断字段是否为数字类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isNumericFieldType = (fieldType) => {
  return NUMERIC_FIELD_TYPES.includes(fieldType) || 
         fieldType?.includes(FIELD_TYPES.DECIMAL)
}

/**
 * 判断字段是否为枚举类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isEnumFieldType = (fieldType) => {
  return ENUM_FIELD_TYPES.includes(fieldType)
}

/**
 * 判断字段是否为富文本类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isRichTextFieldType = (fieldType) => {
  return RICH_TEXT_FIELD_TYPES.includes(fieldType)
}

/**
 * 判断字段是否为文件类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isFileFieldType = (fieldType) => {
  return FILE_FIELD_TYPES.includes(fieldType)
}

/**
 * 判断字段是否为外键类型
 * @param {string} fieldType - 字段类型
 * @returns {boolean}
 */
export const isFkFieldType = (fieldType) => {
  return FK_FIELD_TYPES.includes(fieldType)
}

/**
 * 判断操作是否为新增操作
 * @param {string} operationType - 操作类型
 * @returns {boolean}
 */
export const isAddOperation = (operationType) => {
  return ADD_OPERATION_TYPES.includes(operationType)
}

/**
 * 判断操作是否为子表操作
 * @param {string} operationType - 操作类型
 * @returns {boolean}
 */
export const isChildListOperation = (operationType) => {
  return CHILD_LIST_OPERATION_TYPES.includes(operationType)
}

export {
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  SheetError,
  NetworkError,
  AuthError,
  ValidationError,
  PermissionError,
  DataError,
  OperationError,
  isErrorType,
  isRecoverable,
  getErrorSeverity,
} from './errorTypes'

export {
  ErrorMessages as DetailedErrorMessages,
  ErrorActionLabels,
  getErrorMessage,
  getErrorSuggestion,
  getErrorActions,
} from './errorMessages'

export {
  ErrorHandler,
  handleError,
  createError,
  recordAction,
} from './errorHandler'

export {
  ErrorLogger,
  logError,
  getErrorLogs,
  clearErrorLogs,
  exportErrorLogs,
  getErrorStats,
} from './errorLogger'
