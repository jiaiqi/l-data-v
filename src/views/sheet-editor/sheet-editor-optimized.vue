<template>
  <div
    class="spreadsheet-optimized flex flex-col"
    :class="{ 'child-list': childListType }"
    ref="spreadsheet"
    @click="handlePageClick"
  >
    <!-- 加载状态 -->
    <loading-view
      v-if="uiState.loading"
      mask
      type="surround"
      :maskOpacity="0.2"
      showText
      textColor="#fff"
    />

    <!-- 工具栏 -->
    <sheet-toolbar
      v-if="!disabled"
      :ui-state="uiState"
      :table-state="tableState"
      :config="toolbarConfig"
      @add-rows="handleBatchInsertRows"
      @refresh="handleRefreshData"
      @save="handleSaveData"
      @save-column-width="handleSaveColumnWidth"
      @list-type-change="handleListTypeChange"
      @grid-button-click="handleGridButton"
    />

    <!-- 表格容器 -->
    <sheet-table
      v-if="tableState.isFetched || childListType"
      ref="tableRef"
      :disabled="disabled"
      :table-state="tableState"
      :table-options="tableOptions"
      @cell-edit="handleCellEdit"
      @row-context="handleRowContext"
    />

    <!-- 空数据提示 -->
    <div
      class="empty-data"
      v-if="!childListType && tableState.page.total === 0 && !uiState.loading"
    >
      暂无数据
    </div>

    <!-- 分页组件 -->
    <sheet-pagination
      v-if="shouldShowPagination"
      :page="tableState.page"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />

    <!-- 弹窗和菜单组件 -->
    <sheet-dialogs
      :ui-state="uiState"
      :editor-state="editorState"
      :current-row-data="currentRowData"
      :row-button="rowButton"
      @dialog-change="handleDialogChange"
      @row-button-click="handleRowButton"
    />
  </div>
</template>

<script>
import { reactive, computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { mapState } from 'pinia'
import { useUserStore } from '@/stores/user.js'

// 导入拆分后的组件
import LoadingView from './components/loading/index.vue'
import SheetToolbar from './components/toolbar/index.vue'
import SheetTable from './components/table-container/index.vue'
import SheetPagination from './components/pagination/index.vue'
import SheetDialogs from './components/dialogs/index.vue'

// 导入组合式函数
import { useTableData } from './composables/useTableData.js'
import { useTableConfig } from './composables/useTableConfig'
import { useTableEvents } from './composables/useTableEvents'
import { useEditorState } from './composables/useEditorState'
import { useBroadcastChannel } from './composables/useBroadcastChannel'

export default {
  name: 'SheetEditorOptimized',
  components: {
    LoadingView,
    SheetToolbar,
    SheetTable,
    SheetPagination,
    SheetDialogs
  },
  setup() {
    // 响应式状态
    const uiState = reactive({
      loading: false,
      showFieldEditor: false,
      showDropMenu: false,
      showGridButton: false
    })

    const tableState = reactive({
      tableData: [],
      oldTableData: [],
      columns: [],
      isFetched: false,
      page: {
        total: 0,
        rownumber: 20,
        pageNo: 1
      }
    })

    const editorState = reactive({
      fieldEditorParams: null,
      currentRowIndex: -1,
      autoSaveTimeout: 0
    })

    // 组合式函数
    const {
      initTableData,
      refreshTableData,
      saveTableData,
      buildReqParams
    } = useTableData(tableState, uiState)

    const {
      tableOptions,
      toolbarConfig
    } = useTableConfig(tableState)

    const {
      handleCellEdit,
      handleRowContext,
      handlePageClick
    } = useTableEvents(tableState, editorState, uiState)

    const {
      currentCellValue,
      clearFieldEditorParams
    } = useEditorState(editorState, tableState)

    const {
      initBroadcastChannel,
      closeBroadcastChannel
    } = useBroadcastChannel()

    // 计算属性
    const shouldShowPagination = computed(() => {
      return !['add', 'addchildlist'].includes(this.childListType)
    })

    const currentRowData = computed(() => {
      if (typeof editorState.currentRowIndex === 'number' && editorState.currentRowIndex > -1) {
        return tableState.tableData[editorState.currentRowIndex]
      }
      return null
    })

    // 事件处理方法
    const handleBatchInsertRows = () => {
      // 批量插入行逻辑
    }

    const handleRefreshData = () => {
      refreshTableData()
    }

    const handleSaveData = () => {
      saveTableData()
    }

    const handleSaveColumnWidth = () => {
      // 保存列宽逻辑
    }

    const handleListTypeChange = (type) => {
      // 列表类型切换逻辑
    }

    const handleGridButton = (button) => {
      // 网格按钮点击逻辑
    }

    const handleSizeChange = (size) => {
      tableState.page.rownumber = size
      refreshTableData()
    }

    const handleCurrentChange = (page) => {
      tableState.page.pageNo = page
      refreshTableData()
    }

    const handleDialogChange = (data) => {
      // 弹窗数据变更逻辑
    }

    const handleRowButton = (button, row) => {
      // 行按钮点击逻辑
    }

    // 生命周期
    onMounted(() => {
      initTableData()
      initBroadcastChannel()
    })

    onBeforeUnmount(() => {
      closeBroadcastChannel()
    })

    return {
      uiState,
      tableState,
      editorState,
      tableOptions,
      toolbarConfig,
      shouldShowPagination,
      currentRowData,
      handleBatchInsertRows,
      handleRefreshData,
      handleSaveData,
      handleSaveColumnWidth,
      handleListTypeChange,
      handleGridButton,
      handleSizeChange,
      handleCurrentChange,
      handleDialogChange,
      handleRowButton,
      handleCellEdit,
      handleRowContext,
      handlePageClick
    }
  },
  computed: {
    ...mapState(useUserStore, ['userInfo', 'tenants']),
    
    rowButton() {
      return this.v2data?.rowButton
        ?.filter((item, index) => {
          item._index = index
          return !['edit'].includes(item.button_type) && item.permission
        })
        ?.map((item) => ({
          label: item.button_name,
          ...item
        }))
    }
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    childListType: {
      type: String,
      default: null
    }
  }
}
</script>

<style lang="scss" scoped>
.spreadsheet-optimized {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  &.child-list {
    height: unset;
  }
}

.empty-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #666;
  font-size: 16px;
  border: 1px solid #eee;
  border-top: 0;
}
</style>