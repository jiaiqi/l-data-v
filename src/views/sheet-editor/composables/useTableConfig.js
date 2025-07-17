import { computed, reactive } from 'vue'
import { createCellStyleHandler } from '../utils/cellStyleHandler'
import { createTableEventHandlers } from '../utils/tableEventHandlers'

/**
 * 表格配置管理组合式函数
 */
export function useTableConfig(tableState) {
  
  /**
   * 表格选项配置
   */
  const tableOptions = computed(() => ({
    // 虚拟滚动配置
    virtualScrollOption: {
      enable: false,
      scrolling: (data) => {
        console.log('虚拟滚动:', data)
      }
    },

    // 单元格自动填充配置
    cellAutofillOption: {
      directionX: false,
      directionY: true,
      afterAutofill: ({ targetSelectionRangeIndexes, sourceSelectionData }) => {
        console.log('自动填充完成:', { targetSelectionRangeIndexes, sourceSelectionData })
      },
      beforeAutofill: (params) => {
        return handleBeforeAutofill(params)
      }
    },

    // 单元格样式配置
    cellStyleOption: {
      bodyCellClass: createCellStyleHandler(tableState.tableData, tableState.oldTableData)
    },

    // 编辑配置
    editOption: {
      beforeCellValueChange: ({ row, column, changeValue }) => {
        console.log('单元格值变更前:', { row, column, changeValue })
        return true
      },
      afterCellValueChange: ({ row, column, changeValue }) => {
        console.log('单元格值变更后:', { row, column, changeValue })
      }
    },

    // 剪贴板配置
    clipboardOption: {
      beforePaste: ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
        return handleBeforePaste({ data, selectionRangeIndexes, selectionRangeKeys })
      }
    },

    // 右键菜单配置
    contextmenuBodyOption: {
      beforeShow: ({ isWholeRowSelection, selectionRangeKeys, selectionRangeIndexes }) => {
        console.log('右键菜单显示前:', { isWholeRowSelection, selectionRangeKeys, selectionRangeIndexes })
        return false // 暂时禁用右键菜单
      }
    },

    contextmenuHeaderOption: {
      // 表头右键菜单配置
    },

    // 行样式配置
    rowStyleOption: {
      clickHighlight: false,
      hoverHighlight: true
    },

    // 列宽调整配置
    columnWidthResizeOption: {
      enable: true,
      minWidth: 30,
      sizeChange: ({ column, differWidth, columnWidth }) => {
        console.log('列宽变更:', { column, differWidth, columnWidth })
      }
    },

    // 事件配置
    eventCustomOption: createTableEventHandlers(),

    // 列隐藏配置
    columnHiddenOption: {
      // 列隐藏相关配置
    }
  }))

  /**
   * 工具栏配置
   */
  const toolbarConfig = computed(() => ({
    addButton: {
      service_name: 'add_service'
    },
    isTree: false,
    listType: 'list',
    gridButton: [],
    hasChanges: false,
    hasColumnWidthChanges: false,
    onHandler: false,
    autoSaveTimeout: 0,
    childListType: null
  }))

  /**
   * 处理自动填充前的逻辑
   */
  const handleBeforeAutofill = (params) => {
    const {
      direction,
      sourceSelectionRangeIndexes,
      targetSelectionRangeIndexes,
      sourceSelectionData,
      targetSelectionData
    } = params

    // 这里可以添加自动填充的自定义逻辑
    console.log('自动填充前处理:', params)
    
    return true // 返回 true 继续填充，false 阻止填充
  }

  /**
   * 处理粘贴前的逻辑
   */
  const handleBeforePaste = ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
    console.log('粘贴前处理:', { data, selectionRangeIndexes, selectionRangeKeys })
    
    // 这里可以添加粘贴数据的验证和处理逻辑
    
    return true // 返回 true 继续粘贴，false 阻止粘贴
  }

  return {
    tableOptions,
    toolbarConfig
  }
}