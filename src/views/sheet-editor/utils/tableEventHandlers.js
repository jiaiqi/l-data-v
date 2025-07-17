/**
 * 创建表格事件处理器
 */
export function createTableEventHandlers() {
  return {
    // 单元格点击事件
    bodyCellClick: ({ row, column, rowIndex, columnIndex, event }) => {
      console.log('单元格点击:', { row, column, rowIndex, columnIndex })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('cell-click', {
        detail: { row, column, rowIndex, columnIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 单元格双击事件
    bodyCellDoubleClick: ({ row, column, rowIndex, columnIndex, event }) => {
      console.log('单元格双击:', { row, column, rowIndex, columnIndex })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('cell-double-click', {
        detail: { row, column, rowIndex, columnIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 单元格右键事件
    bodyCellContextmenu: ({ row, column, rowIndex, columnIndex, event }) => {
      console.log('单元格右键:', { row, column, rowIndex, columnIndex })
      
      event.preventDefault()
      
      // 发送自定义事件
      const customEvent = new CustomEvent('cell-contextmenu', {
        detail: { row, column, rowIndex, columnIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 行点击事件
    bodyRowClick: ({ row, rowIndex, event }) => {
      console.log('行点击:', { row, rowIndex })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('row-click', {
        detail: { row, rowIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 行双击事件
    bodyRowDoubleClick: ({ row, rowIndex, event }) => {
      console.log('行双击:', { row, rowIndex })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('row-double-click', {
        detail: { row, rowIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 行右键事件
    bodyRowContextmenu: ({ row, rowIndex, event }) => {
      console.log('行右键:', { row, rowIndex })
      
      event.preventDefault()
      
      // 发送自定义事件
      const customEvent = new CustomEvent('row-contextmenu', {
        detail: { row, rowIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 表头单元格点击事件
    headerCellClick: ({ column, columnIndex, event }) => {
      console.log('表头单元格点击:', { column, columnIndex })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('header-cell-click', {
        detail: { column, columnIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 表头单元格右键事件
    headerCellContextmenu: ({ column, columnIndex, event }) => {
      console.log('表头单元格右键:', { column, columnIndex })
      
      event.preventDefault()
      
      // 发送自定义事件
      const customEvent = new CustomEvent('header-cell-contextmenu', {
        detail: { column, columnIndex, event }
      })
      document.dispatchEvent(customEvent)
    },

    // 选择变更事件
    selectionChange: ({ selectionRangeIndexes, selectionRangeKeys }) => {
      console.log('选择变更:', { selectionRangeIndexes, selectionRangeKeys })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('selection-change', {
        detail: { selectionRangeIndexes, selectionRangeKeys }
      })
      document.dispatchEvent(customEvent)
    },

    // 滚动事件
    scroll: ({ scrollLeft, scrollTop, isScrollToLeft, isScrollToRight, isScrollToTop, isScrollToBottom }) => {
      console.log('滚动:', { scrollLeft, scrollTop, isScrollToLeft, isScrollToRight, isScrollToTop, isScrollToBottom })
      
      // 发送自定义事件
      const customEvent = new CustomEvent('table-scroll', {
        detail: { scrollLeft, scrollTop, isScrollToLeft, isScrollToRight, isScrollToTop, isScrollToBottom }
      })
      document.dispatchEvent(customEvent)
    }
  }
}

/**
 * 创建键盘事件处理器
 */
export function createKeyboardEventHandlers() {
  return {
    // 键盘按下事件
    keydown: (event) => {
      console.log('键盘按下:', event.key)
      
      // 处理常用快捷键
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 's':
            // Ctrl+S 保存
            event.preventDefault()
            handleSave()
            break
          case 'z':
            // Ctrl+Z 撤销
            event.preventDefault()
            handleUndo()
            break
          case 'y':
            // Ctrl+Y 重做
            event.preventDefault()
            handleRedo()
            break
          case 'c':
            // Ctrl+C 复制
            handleCopy()
            break
          case 'v':
            // Ctrl+V 粘贴
            handlePaste()
            break
          case 'x':
            // Ctrl+X 剪切
            handleCut()
            break
          case 'a':
            // Ctrl+A 全选
            event.preventDefault()
            handleSelectAll()
            break
        }
      } else {
        switch (event.key) {
          case 'Delete':
            // Delete 删除
            handleDelete()
            break
          case 'Enter':
            // Enter 确认编辑
            handleEnter()
            break
          case 'Escape':
            // Escape 取消编辑
            handleEscape()
            break
          case 'Tab':
            // Tab 切换到下一个单元格
            handleTab(event)
            break
          case 'F2':
            // F2 进入编辑模式
            event.preventDefault()
            handleF2()
            break
        }
      }
    }
  }
}

/**
 * 处理保存
 */
function handleSave() {
  console.log('处理保存')
  const customEvent = new CustomEvent('keyboard-save')
  document.dispatchEvent(customEvent)
}

/**
 * 处理撤销
 */
function handleUndo() {
  console.log('处理撤销')
  const customEvent = new CustomEvent('keyboard-undo')
  document.dispatchEvent(customEvent)
}

/**
 * 处理重做
 */
function handleRedo() {
  console.log('处理重做')
  const customEvent = new CustomEvent('keyboard-redo')
  document.dispatchEvent(customEvent)
}

/**
 * 处理复制
 */
function handleCopy() {
  console.log('处理复制')
  const customEvent = new CustomEvent('keyboard-copy')
  document.dispatchEvent(customEvent)
}

/**
 * 处理粘贴
 */
function handlePaste() {
  console.log('处理粘贴')
  const customEvent = new CustomEvent('keyboard-paste')
  document.dispatchEvent(customEvent)
}

/**
 * 处理剪切
 */
function handleCut() {
  console.log('处理剪切')
  const customEvent = new CustomEvent('keyboard-cut')
  document.dispatchEvent(customEvent)
}

/**
 * 处理全选
 */
function handleSelectAll() {
  console.log('处理全选')
  const customEvent = new CustomEvent('keyboard-select-all')
  document.dispatchEvent(customEvent)
}

/**
 * 处理删除
 */
function handleDelete() {
  console.log('处理删除')
  const customEvent = new CustomEvent('keyboard-delete')
  document.dispatchEvent(customEvent)
}

/**
 * 处理回车
 */
function handleEnter() {
  console.log('处理回车')
  const customEvent = new CustomEvent('keyboard-enter')
  document.dispatchEvent(customEvent)
}

/**
 * 处理ESC
 */
function handleEscape() {
  console.log('处理ESC')
  const customEvent = new CustomEvent('keyboard-escape')
  document.dispatchEvent(customEvent)
}

/**
 * 处理Tab
 */
function handleTab(event) {
  console.log('处理Tab')
  const customEvent = new CustomEvent('keyboard-tab', {
    detail: { shiftKey: event.shiftKey }
  })
  document.dispatchEvent(customEvent)
}

/**
 * 处理F2
 */
function handleF2() {
  console.log('处理F2')
  const customEvent = new CustomEvent('keyboard-f2')
  document.dispatchEvent(customEvent)
}