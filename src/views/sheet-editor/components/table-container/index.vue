<template>
  <div class="flex-1 list-container">
    <ve-table
      v-if="disabled"
      :columns="tableState.columns"
      border-x
      border-y
      :table-data="tableState.tableData"
      ref="tableRef"
      style="word-break: break-word; width: 100vw; height: 100%"
      max-height="calc(100vh - 40px)"
      fixed-header
    />
    <div v-else class="custom-style">
      <ve-table
        ref="tableRef"
        style="word-break: break-word; width: 100vw"
        max-height="calc(100vh - 80px)"
        fixed-header
        :scroll-width="0"
        border-y
        :columns="tableState.columns"
        :table-data="tableState.tableData"
        row-key-field-name="rowKey"
        :virtual-scroll-option="tableOptions.virtualScrollOption"
        :cell-autofill-option="tableOptions.cellAutofillOption"
        :cell-style-option="tableOptions.cellStyleOption"
        :edit-option="tableOptions.editOption"
        :clipboard-option="tableOptions.clipboardOption"
        :contextmenu-body-option="tableOptions.contextmenuBodyOption"
        :contextmenu-header-option="tableOptions.contextmenuHeaderOption"
        :row-style-option="tableOptions.rowStyleOption"
        :column-width-resize-option="tableOptions.columnWidthResizeOption"
        :event-custom-option="tableOptions.eventCustomOption"
        :columnHiddenOption="tableOptions.columnHiddenOption"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SheetTable',
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    tableState: {
      type: Object,
      required: true
    },
    tableOptions: {
      type: Object,
      required: true
    }
  },
  emits: ['cell-edit', 'row-context'],
  setup(props, { emit }) {
    const tableRef = ref(null)

    return {
      tableRef
    }
  }
}
</script>

<style lang="scss" scoped>
.list-container {
  overflow: hidden;
  transition: max-height 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.custom-style {
  .ve-table-container {
    min-height: 80px;
    height: calc(100vh - 80px) !important;
    overflow: auto;
  }

  .table-body-cell__add {
    background-color: #2ea269 !important;
    color: #fff !important;

    .el-select .el-input {
      .el-select__caret {
        color: #eee;
      }

      .el-input__inner::placeholder {
        color: #fff;
      }
    }

    .el-icon-arrow-right {
      color: #eee;
    }
  }

  .table-body-cell__update-index {
    background-color: rgba($color: #e83d4b, $alpha: 0.9) !important;
    color: #fff !important;
  }

  .table-body-cell__update {
    color: #e83d4b !important;

    .el-input {
      .el-input__inner {
        color: #e83d4b !important;
      }
    }

    .el-tag {
      color: #e83d4b !important;
    }
  }

  .ve-table-body-td {
    padding: 2px 8px !important;
  }

  .ve-table-body-tr {
    height: unset !important;
  }

  .ve-table-header-th {
    padding: 4px 0 !important;
    background-color: #f0f3f9 !important;
  }
}
</style>