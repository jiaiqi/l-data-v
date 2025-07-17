import { ref, reactive, nextTick } from 'vue'

/**
 * 表格事件管理组合式函数
 */
export function useTableEvents(tableState, uiState, editorState) {
  
  /**
   * 处理单元格点击事件
   */
  const handleCellClick = ({ row, column, rowIndex, columnIndex }) => {
    console.log('单元格点击:', { row, column, rowIndex, columnIndex })
    
    // 设置当前选中的单元格
    editorState.currentRowIndex = rowIndex
    editorState.currentColumnIndex = columnIndex
    editorState.currentRow = row
    editorState.currentColumn = column
    
    // 如果是可编辑列，显示字段编辑器
    if (column.edit && !uiState.disabled) {
      showFieldEditor(row, column, rowIndex, columnIndex)
    }
  }

  /**
   * 处理单元格双击事件
   */
  const handleCellDoubleClick = ({ row, column, rowIndex, columnIndex }) => {
    console.log('单元格双击:', { row, column, rowIndex, columnIndex })
    
    if (column.edit && !uiState.disabled) {
      showFieldEditor(row, column, rowIndex, columnIndex)
    }
  }

  /**
   * 处理行点击事件
   */
  const handleRowClick = ({ row, rowIndex }) => {
    console.log('行点击:', { row, rowIndex })
    editorState.currentRow = row
    editorState.currentRowIndex = rowIndex
  }

  /**
   * 处理行右键事件
   */
  const handleRowContextmenu = ({ row, rowIndex, event }) => {
    console.log('行右键:', { row, rowIndex, event })
    
    event.preventDefault()
    
    // 设置右键菜单位置
    uiState.dTop = event.clientY
    uiState.dLeft = event.clientX
    uiState.showDropMenu = true
    
    // 设置当前行
    editorState.currentRow = row
    editorState.currentRowIndex = rowIndex
  }

  /**
   * 处理单元格值变更
   */
  const handleCellValueChange = ({ row, column, changeValue, rowIndex, columnIndex }) => {
    console.log('单元格值变更:', { row, column, changeValue, rowIndex, columnIndex })
    
    // 更新行数据
    if (row && column) {
      row[column.field] = changeValue
      
      // 标记行为已修改
      if (!row.__flag) {
        row.__flag = 'update'
      }
      
      // 触发自动保存
      triggerAutoSave()
    }
  }

  /**
   * 显示字段编辑器
   */
  const showFieldEditor = async (row, column, rowIndex, columnIndex) => {
    // 设置字段编辑器参数
    editorState.fieldEditorParams = {
      row,
      column,
      rowIndex,
      columnIndex,
      field: column.field,
      value: row[column.field],
      fieldInfo: column.__field_info || {}
    }
    
    // 显示字段编辑器
    uiState.showFieldEditor = true
    
    await nextTick()
    
    // 聚焦到字段编辑器
    if (editorState.fieldEditorRef) {
      editorState.fieldEditorRef.focus()
    }
  }

  /**
   * 隐藏字段编辑器
   */
  const hideFieldEditor = () => {
    uiState.showFieldEditor = false
    editorState.fieldEditorParams = {}
  }

  /**
   * 处理字段编辑器值变更
   */
  const handleFieldEditorChange = ({ value, field, row }) => {
    console.log('字段编辑器值变更:', { value, field, row })
    
    if (row && field) {
      row[field] = value
      
      // 标记行为已修改
      if (!row.__flag) {
        row.__flag = 'update'
      }
      
      // 触发自动保存
      triggerAutoSave()
    }
  }

  /**
   * 处理外键变更
   */
  const handleFkChange = ({ value, field, row, fkData }) => {
    console.log('外键变更:', { value, field, row, fkData })
    
    if (row && field) {
      row[field] = value
      
      // 如果有外键数据，更新相关字段
      if (fkData) {
        Object.keys(fkData).forEach(key => {
          if (key !== field) {
            row[key] = fkData[key]
          }
        })
      }
      
      // 标记行为已修改
      if (!row.__flag) {
        row.__flag = 'update'
      }
      
      // 触发自动保存
      triggerAutoSave()
    }
  }

  /**
   * 触发自动保存
   */
  const triggerAutoSave = () => {
    if (uiState.autoSaveTimeout) {
      clearTimeout(uiState.autoSaveTimeout)
    }
    
    uiState.autoSaveTimeout = setTimeout(() => {
      // 这里可以调用自动保存逻辑
      console.log('触发自动保存')
    }, 2000) // 2秒后自动保存
  }

  /**
   * 处理页面点击事件（用于隐藏字段编辑器）
   */
  const handlePageClick = (event) => {
    // 如果点击的不是字段编辑器区域，则隐藏字段编辑器
    if (uiState.showFieldEditor) {
      const fieldEditor = document.querySelector('.field-editor')
      if (fieldEditor && !fieldEditor.contains(event.target)) {
        hideFieldEditor()
      }
    }
    
    // 隐藏右键菜单
    if (uiState.showDropMenu) {
      uiState.showDropMenu = false
    }
  }

  return {
    handleCellClick,
    handleCellDoubleClick,
    handleRowClick,
    handleRowContextmenu,
    handleCellValueChange,
    showFieldEditor,
    hideFieldEditor,
    handleFieldEditorChange,
    handleFkChange,
    triggerAutoSave,
    handlePageClick
  }
}