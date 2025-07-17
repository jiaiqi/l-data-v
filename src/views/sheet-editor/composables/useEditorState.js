import { ref, reactive, computed } from 'vue'

/**
 * 编辑器状态管理组合式函数
 */
export function useEditorState() {
  
  // 当前选中的行和列信息
  const currentRowIndex = ref(-1)
  const currentColumnIndex = ref(-1)
  const currentRow = ref(null)
  const currentColumn = ref(null)
  
  // 字段编辑器相关状态
  const fieldEditorParams = reactive({
    row: null,
    column: null,
    rowIndex: -1,
    columnIndex: -1,
    field: '',
    value: null,
    fieldInfo: {}
  })
  
  const fieldEditorRef = ref(null)
  
  // 选择状态
  const selectionRangeIndexes = ref([])
  const selectionRangeKeys = ref([])
  
  /**
   * 当前单元格的值
   */
  const currentCellValue = computed(() => {
    if (currentRow.value && currentColumn.value) {
      return currentRow.value[currentColumn.value.field]
    }
    return null
  })
  
  /**
   * 当前行数据
   */
  const currentRowData = computed(() => {
    return currentRow.value
  })
  
  /**
   * 是否有选中的单元格
   */
  const hasSelection = computed(() => {
    return currentRowIndex.value >= 0 && currentColumnIndex.value >= 0
  })
  
  /**
   * 是否正在编辑
   */
  const isEditing = computed(() => {
    return Object.keys(fieldEditorParams).length > 0 && fieldEditorParams.row !== null
  })
  
  /**
   * 设置当前选中的单元格
   */
  const setCurrentCell = (rowIndex, columnIndex, row, column) => {
    currentRowIndex.value = rowIndex
    currentColumnIndex.value = columnIndex
    currentRow.value = row
    currentColumn.value = column
  }
  
  /**
   * 清除当前选中的单元格
   */
  const clearCurrentCell = () => {
    currentRowIndex.value = -1
    currentColumnIndex.value = -1
    currentRow.value = null
    currentColumn.value = null
  }
  
  /**
   * 设置字段编辑器参数
   */
  const setFieldEditorParams = (params) => {
    Object.assign(fieldEditorParams, params)
  }
  
  /**
   * 清除字段编辑器参数
   */
  const clearFieldEditorParams = () => {
    Object.assign(fieldEditorParams, {
      row: null,
      column: null,
      rowIndex: -1,
      columnIndex: -1,
      field: '',
      value: null,
      fieldInfo: {}
    })
  }
  
  /**
   * 设置选择范围
   */
  const setSelectionRange = (indexes, keys) => {
    selectionRangeIndexes.value = indexes || []
    selectionRangeKeys.value = keys || []
  }
  
  /**
   * 清除选择范围
   */
  const clearSelectionRange = () => {
    selectionRangeIndexes.value = []
    selectionRangeKeys.value = []
  }
  
  /**
   * 获取选中的数据
   */
  const getSelectedData = (tableData) => {
    if (!selectionRangeIndexes.value.length || !tableData) {
      return []
    }
    
    const selectedData = []
    selectionRangeIndexes.value.forEach(range => {
      const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = range
      
      for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
        const row = tableData[rowIndex]
        if (row) {
          const rowData = {}
          for (let colIndex = startColumnIndex; colIndex <= endColumnIndex; colIndex++) {
            const key = selectionRangeKeys.value[colIndex - startColumnIndex]
            if (key && row[key] !== undefined) {
              rowData[key] = row[key]
            }
          }
          selectedData.push(rowData)
        }
      }
    })
    
    return selectedData
  }
  
  return {
    // 状态
    currentRowIndex,
    currentColumnIndex,
    currentRow,
    currentColumn,
    fieldEditorParams,
    fieldEditorRef,
    selectionRangeIndexes,
    selectionRangeKeys,
    
    // 计算属性
    currentCellValue,
    currentRowData,
    hasSelection,
    isEditing,
    
    // 方法
    setCurrentCell,
    clearCurrentCell,
    setFieldEditorParams,
    clearFieldEditorParams,
    setSelectionRange,
    clearSelectionRange,
    getSelectedData
  }
}