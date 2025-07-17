/**
 * 创建单元格样式处理器
 */
export function createCellStyleHandler(tableData, oldTableData) {
  return ({ row, column, rowIndex, columnIndex }) => {
    const classes = []
    
    // 根据行状态添加样式类
    if (row.__flag === 'add') {
      classes.push('cell-add')
    } else if (row.__flag === 'update') {
      classes.push('cell-update')
    }
    
    // 检查单元格是否有变更
    if (oldTableData && oldTableData.length > 0) {
      const oldRow = oldTableData.find(old => old.__id === row.__id)
      if (oldRow && oldRow[column.field] !== row[column.field]) {
        classes.push('cell-changed')
      }
    }
    
    // 根据列类型添加样式类
    if (column.__field_info) {
      const fieldInfo = column.__field_info
      
      // 必填字段
      if (fieldInfo.is_required === 1) {
        classes.push('cell-required')
      }
      
      // 只读字段
      if (fieldInfo.in_list_edit === 0) {
        classes.push('cell-readonly')
      }
      
      // 外键字段
      if (fieldInfo.fk_table_name) {
        classes.push('cell-fk')
      }
      
      // 数值字段
      if (['int', 'float', 'decimal', 'number'].includes(fieldInfo.data_type)) {
        classes.push('cell-number')
      }
      
      // 日期字段
      if (['date', 'datetime', 'timestamp'].includes(fieldInfo.data_type)) {
        classes.push('cell-date')
      }
    }
    
    // 空值样式
    if (row[column.field] === null || row[column.field] === undefined || row[column.field] === '') {
      classes.push('cell-empty')
    }
    
    // 错误状态
    if (row.__errors && row.__errors[column.field]) {
      classes.push('cell-error')
    }
    
    return classes.join(' ')
  }
}

/**
 * 创建行样式处理器
 */
export function createRowStyleHandler(tableData, oldTableData) {
  return ({ row, rowIndex }) => {
    const classes = []
    
    // 根据行状态添加样式类
    if (row.__flag === 'add') {
      classes.push('row-add')
    } else if (row.__flag === 'update') {
      classes.push('row-update')
    } else if (row.__flag === 'delete') {
      classes.push('row-delete')
    }
    
    // 选中状态
    if (row.__selected) {
      classes.push('row-selected')
    }
    
    // 错误状态
    if (row.__errors && Object.keys(row.__errors).length > 0) {
      classes.push('row-error')
    }
    
    // 树形结构缩进
    if (row.__indent) {
      classes.push(`row-indent-${row.__indent}`)
    }
    
    // 展开/折叠状态
    if (row.__expanded !== undefined) {
      classes.push(row.__expanded ? 'row-expanded' : 'row-collapsed')
    }
    
    return classes.join(' ')
  }
}

/**
 * 获取单元格显示值
 */
export function getCellDisplayValue(value, column) {
  if (value === null || value === undefined) {
    return ''
  }
  
  const fieldInfo = column.__field_info
  if (!fieldInfo) {
    return value
  }
  
  // 根据字段类型格式化显示值
  switch (fieldInfo.data_type) {
    case 'date':
      return formatDate(value)
    case 'datetime':
    case 'timestamp':
      return formatDateTime(value)
    case 'decimal':
    case 'float':
      return formatNumber(value, fieldInfo.decimal_places || 2)
    case 'int':
    case 'number':
      return formatNumber(value, 0)
    case 'boolean':
      return value ? '是' : '否'
    default:
      return value
  }
}

/**
 * 格式化日期
 */
function formatDate(value) {
  if (!value) return ''
  
  try {
    const date = new Date(value)
    return date.toLocaleDateString('zh-CN')
  } catch (error) {
    return value
  }
}

/**
 * 格式化日期时间
 */
function formatDateTime(value) {
  if (!value) return ''
  
  try {
    const date = new Date(value)
    return date.toLocaleString('zh-CN')
  } catch (error) {
    return value
  }
}

/**
 * 格式化数字
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '') return ''
  
  const num = parseFloat(value)
  if (isNaN(num)) return value
  
  return num.toFixed(decimals)
}