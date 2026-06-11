<template>
  <div class="fk-option-picker">
    <el-autocomplete
      v-if="uiMode === 'autocomplete'"
      ref="autocompleteRef"
      v-model="innerValue"
      :fetch-suggestions="querySearch"
      :placeholder="effectivePlaceholder"
      :disabled="disabled"
      clearable
      style="width: 100%"
      @select="handleAutocompleteSelect"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
      @input="handleAutocompleteInput"
    >
      <template slot-scope="{ item }">
        <div class="fk-option-picker__option">
          {{ item.label }}
        </div>
      </template>
    </el-autocomplete>

    <el-popover
      v-else
      ref="popoverRef"
      v-model="dropdownVisible"
      class="fk-option-picker__popover"
      placement="bottom-start"
      trigger="focus"
      :width="tableWidth"
      popper-class="fk-option-picker-popper"
      @show="syncTableLayout"
      @hide="handleDropdownHide"
    >
      <div class="fk-option-picker__dropdown" @mousedown.stop>
        <div
          class="fk-option-picker__drag-handle"
          @mousedown="handleDragStart"
        >
          <svg
            class="fk-option-picker__drag-icon"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <circle cx="5" cy="3" r="1.2" />
            <circle cx="5" cy="8" r="1.2" />
            <circle cx="5" cy="13" r="1.2" />
            <circle cx="11" cy="3" r="1.2" />
            <circle cx="11" cy="8" r="1.2" />
            <circle cx="11" cy="13" r="1.2" />
          </svg>
          <span class="fk-option-picker__tip">按住此处可拖动弹窗 · 双击列表进行选择</span>
        </div>
        <el-table
          ref="dropdownTable"
          :data="tableData"
          v-loading="loading"
          size="mini"
          border
          :height="tableHeight"
          :row-key="tableRowKey"
          :lazy="isTree"
          :load="loadTreeChildren"
          :tree-props="treeProps"
          empty-text="暂无数据"
          @row-dblclick="handleTableSelect"
        >
          <el-table-column
            v-for="tableColumn in tableDisplayColumns"
            :key="tableColumn.columns"
            :prop="tableColumn.columns"
            :label="tableColumn.label"
            :fixed="tableColumn.columns === keyDispCol ? 'left' : false"
            :min-width="tableColumn.list_min_width || 120"
            show-overflow-tooltip
          />
        </el-table>
        <div class="fk-option-picker__footer">
          <el-pagination
            v-if="!isTree"
            small
            :page-sizes="pageSizes"
            :page-size="pageSize"
            :total="total"
            :current-page="pageNo"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
      <el-input
        slot="reference"
        ref="inputRef"
        v-model="innerValue"
        clearable
        :placeholder="effectivePlaceholder"
        :disabled="disabled"
        style="width: 100%; padding: 0; overflow: hidden"
        @focus="openDropdown"
        @blur="handleBlur"
        @input="handleTableInput"
        @clear="handleClear"
      />
    </el-popover>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { onSelect } from "@/service/api";
import { renderStr } from "@/common/common";
import { resolveRowApp } from "@/utils/rowData";
import {
  buildFkOptionConfig,
  loadFkOptions,
  loadServiceColumns,
  normalizeFkOption,
} from "../../utils/fkOption";

export default {
  name: "FkOptionPicker",
  props: {
    app: {
      type: String,
      default: "",
    },
    column: {
      type: Object,
      default: () => ({}),
    },
    row: {
      type: Object,
      default: () => ({}),
    },
    columns: {
      type: Array,
      default: () => [],
    },
    srvInfo: {
      type: Object,
      default: null,
    },
    inputValue: {
      type: [String, Number],
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    allowFreeInput: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    uiMode: {
      type: String,
      default: "table",
      validator: (value) => ["table", "autocomplete"].includes(value),
    },
    tableWidth: {
      type: [String, Number],
      default: 720,
    },
    tableHeight: {
      type: [String, Number],
      default: 260,
    },
    pageSizes: {
      type: Array,
      default: () => [5, 10, 20, 30],
    },
    defaultPageSize: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      innerValue: "",
      dropdownVisible: false,
      tableColumns: [],
      tableData: [],
      options: [],
      pageNo: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      searchTimer: null,
      focused: false,
      pendingInputValue: null,
      dragState: null,
    };
  },
  computed: {
    keyDispCol() {
      return this.srvInfo?.key_disp_col;
    },
    refedCol() {
      return this.srvInfo?.refed_col;
    },
    isTree() {
      return Boolean(this.srvInfo?.is_tree && this.srvInfo?.parent_col);
    },
    tableRowKey() {
      return this.refedCol || "value";
    },
    treeProps() {
      return {
        children: "children",
        hasChildren: "hasChildren",
      };
    },
    effectivePlaceholder() {
      if (this.placeholder) {
        return this.placeholder;
      }
      // const searchColumns = [
      //   this.srvInfo?.key_disp_col,
      //   this.srvInfo?.refed_col,
      // ].filter(Boolean);
      // const uniqueColumns = Array.from(new Set(searchColumns));
      // if (uniqueColumns.length) {
      //   // return `输入${uniqueColumns.join(" / ")}模糊搜索`;
      //   return `输入关键词进行搜索`;
      // }
      // if (this.allowFreeInput) {
      //   return this.uiMode === "table"
      //     ? "可直接输入，或搜索后双击选择"
      //     : "可直接输入，或搜索后选择";
      // }
      return this.uiMode === "table"
        ? "输入关键词搜索，双击选择已有数据"
        : "输入关键词搜索，请从结果中选择";
    },
    tableDisplayColumns() {
      const columns = Array.isArray(this.tableColumns)
        ? [...this.tableColumns]
        : [];
      if (!this.keyDispCol) {
        return columns;
      }
      const index = columns.findIndex(
        (item) => item.columns === this.keyDispCol
      );
      if (index <= 0) {
        return columns;
      }
      const [keyColumn] = columns.splice(index, 1);
      return [keyColumn, ...columns];
    },
    /**
     * 从 tableColumns 中提取所有字符串类型字段，作为模糊搜索的额外列
     * 匹配规则：col_type === "String" 或 bx_col_type === "string"
     */
    stringSearchCols() {
      if (!Array.isArray(this.tableColumns)) return [];
      return this.tableColumns
        .filter(
          (col) =>
            col &&
            (col.col_type === "String" || col.bx_col_type === "string")
        )
        .map((col) => col.columns)
        .filter(Boolean);
    },
  },
  watch: {
    inputValue: {
      immediate: true,
      handler(value) {
        if (value !== this.innerValue) {
          this.innerValue = value || "";
        }
      },
    },
    defaultPageSize: {
      immediate: true,
      handler(value) {
        this.pageSize = value || 10;
      },
    },
    dropdownVisible(value) {
      this.$emit("dropdown-visible-change", value);
    },
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.releaseDragListeners();
  },
  methods: {
    formatOption(item) {
      return normalizeFkOption(item, this.srvInfo || {});
    },
    formatTreeRow(item = {}) {
      return {
        ...item,
        hasChildren: item.is_leaf !== "是",
      };
    },
    getTreeNodeValue(row = {}) {
      return row[this.refedCol] || row.value || row.id;
    },
    async loadTreeChildren(row, treeNode, resolve) {
      const parentValue = this.getTreeNodeValue(row);
      if (!this.isTree || !parentValue) {
        resolve([]);
        return;
      }
      const app = resolveRowApp(
        this.srvInfo?.srv_app || this.app || sessionStorage.getItem("current_app"),
        this.row,
        this.columns,
        renderStr
      );
      const res = await onSelect(
        this.srvInfo.serviceName,
        app,
        [
          {
            colName: this.srvInfo.parent_col,
            ruleType: "eq",
            value: parentValue,
          },
        ],
        {
          rownumber: 100,
          pageNo: 1,
        }
      );
      const children = (res?.data || []).map((item) => this.formatTreeRow(item));
      resolve(children);
    },
    buildOption(queryString = "") {
      return buildFkOptionConfig(this.srvInfo || {}, queryString);
    },
    async loadColumns(useType = "selectlist") {
      if (!this.srvInfo?.serviceName) {
        return;
      }
      const app = resolveRowApp(
        this.srvInfo.srv_app ||
        this.app ||
        sessionStorage.getItem("current_app"),
        this.row,
        this.columns,
        renderStr
      );
      if (!app) {
        return;
      }
      this.tableColumns = await loadServiceColumns({
        app,
        serviceName: this.srvInfo.serviceName,
        useType,
      });
      this.syncTableLayout();
      if (!this.tableColumns.length && useType === "selectlist") {
        await this.loadColumns("list");
      }
    },
    loadTableData() {
      if (!this.srvInfo) {
        return Promise.resolve([]);
      }
      this.loading = true;
      return loadFkOptions({
        column: this.column,
        row: this.row,
        app: this.app,
        srvInfo: this.srvInfo,
        keyword: this.innerValue,
        pageNo: this.pageNo,
        rownumber: this.pageSize,
        mainData: this.$route?.query || {},
        searchCols: this.stringSearchCols,
        columns: this.columns,
      })
        .then((res) => {
          if (res?.data?.length) {
            this.tableData = this.isTree
              ? res.data.map((item) => this.formatTreeRow(item))
              : res.data;
            this.options = cloneDeep(this.tableData);
            this.total = this.isTree
              ? this.tableData.length
              : res?.page?.total || this.tableData.length;
          } else {
            this.tableData = [];
            this.options = [];
            this.total = 0;
          }
          this.loading = false;
          this.syncTableLayout();
          return this.tableData;
        })
        .catch((error) => {
          this.loading = false;
          throw error;
        });
    },
    openDropdown() {
      if (this.disabled) {
        return;
      }
      this.handleFocus();
      this.dropdownVisible = true;
      this.pageNo = 1;
      if (!this.tableColumns.length) {
        this.loadColumns();
      }
      this.loadTableData();
      this.syncTableLayout();
    },
    handleFocus() {
      this.focused = true;
      this.$emit("focus");
    },
    emitDeferredInput(value, source = "input") {
      if (this.focused) {
        // 聚焦期间输入内容只作为搜索关键词，先不更新父组件。
        // 等失焦后再统一提交，避免表格单元格在每次按键时被改写。
        this.pendingInputValue = value || "";
        this.$emit("search-change", this.pendingInputValue);
        return;
      }
      this.$emit("input-change", value || "", { source });
      if (this.allowFreeInput) {
        this.$emit("input", value || "");
      }
    },
    flushDeferredInput() {
      if (this.pendingInputValue === null) {
        return;
      }
      const value = this.pendingInputValue;
      this.pendingInputValue = null;
      this.$emit("input-change", value, { source: "input" });
      if (this.allowFreeInput) {
        this.$emit("free-input-commit", value);
        this.$emit("input", value);
      }
    },
    handleBlur() {
      this.focused = false;
      // 双击表格行时输入框会先触发 blur，再触发行选择事件。
      // 延迟提交可让真正的选择事件有机会取消待提交的搜索词。
      setTimeout(() => {
        this.flushDeferredInput();
        this.$emit("blur");
        console.log("handleBlur");
      }, 120);
    },
    handleTableInput(value) {
      this.innerValue = value || "";
      this.emitDeferredInput(this.innerValue);
      this.dropdownVisible = true;
      this.pageNo = 1;
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      this.searchTimer = setTimeout(() => {
        this.loadTableData();
      }, 250);
    },
    handleAutocompleteInput(value) {
      this.innerValue = value || "";
      this.emitDeferredInput(this.innerValue);
    },
    handleClear() {
      this.innerValue = "";
      this.pageNo = 1;
      this.pendingInputValue = "";
      this.$emit("search-change", "");
      this.$emit("clear", { source: "clear" });
      this.$emit("select", null);
      if (this.uiMode === "table") {
        this.dropdownVisible = true;
        this.loadTableData();
      }
    },
    handleTableSelect(row) {
      const selected = this.formatOption(row);
      this.innerValue = selected?.label || selected?.value || "";
      this.dropdownVisible = false;
      // 已确认的选项选择优先于临时搜索词，避免把搜索词误提交给父组件。
      this.pendingInputValue = null;
      this.$emit("input-change", this.innerValue, { source: "select" });
      this.$emit("input", this.innerValue);
      this.$emit("option-select", cloneDeep(selected));
      this.$emit("select", cloneDeep(selected));
    },
    handleAutocompleteSelect(item) {
      const selected = this.formatOption(item);
      this.innerValue = selected?.label || selected?.value || "";
      // 已确认的选项选择优先于临时搜索词，避免把搜索词误提交给父组件。
      this.pendingInputValue = null;
      this.$emit("input-change", this.innerValue, { source: "select" });
      this.$emit("input", this.innerValue);
      this.$emit("option-select", cloneDeep(selected));
      this.$emit("select", cloneDeep(selected));
    },
    handleSizeChange(value) {
      this.pageSize = value;
      this.pageNo = 1;
      this.loadTableData();
    },
    handleCurrentChange(value) {
      this.pageNo = value;
      this.loadTableData();
    },
    handleDropdownHide() {
      this.releaseDragListeners();
      this.syncTableLayout();
    },
    /**
     * 获取当前实际可见的 popper 元素。el-popover 默认使用 transform 定位，
     * 拖拽前需要先把它转换为 left/top 才能持续生效。
     */
    getActivePopper() {
      // 同页可能存在多个 fk-option-picker，需要找到当前显示的那个。
      const candidates = document.querySelectorAll(".fk-option-picker-popper");
      for (let i = 0; i < candidates.length; i += 1) {
        const el = candidates[i];
        const style = window.getComputedStyle(el);
        if (style.display !== "none" && style.visibility !== "hidden") {
          return el;
        }
      }
      return candidates[0] || null;
    },
    handleDragStart(event) {
      if (event.button !== 0) return;
      const popperEl = this.getActivePopper();
      if (!popperEl) return;
      const rect = popperEl.getBoundingClientRect();
      // 把 el-popover 用 transform 设置的位置固化为 left/top，
      // 这样后续拖拽更新 left/top 时不会被 popper 内部重置逻辑覆盖。
      popperEl.style.left = `${rect.left}px`;
      popperEl.style.top = `${rect.top}px`;
      popperEl.style.transform = "none";
      popperEl.style.position = "fixed";
      this.dragState = {
        startX: event.clientX,
        startY: event.clientY,
        baseLeft: rect.left,
        baseTop: rect.top,
        popperEl,
      };
      document.addEventListener("mousemove", this.handleDragMove);
      document.addEventListener("mouseup", this.handleDragEnd);
      event.preventDefault();
    },
    handleDragMove(event) {
      if (!this.dragState) return;
      const { startX, startY, baseLeft, baseTop, popperEl } = this.dragState;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const maxLeft = window.innerWidth - popperEl.offsetWidth - 4;
      const maxTop = window.innerHeight - popperEl.offsetHeight - 4;
      const nextLeft = Math.max(4, Math.min(baseLeft + dx, maxLeft));
      const nextTop = Math.max(4, Math.min(baseTop + dy, maxTop));
      popperEl.style.left = `${nextLeft}px`;
      popperEl.style.top = `${nextTop}px`;
    },
    handleDragEnd() {
      this.releaseDragListeners();
    },
    releaseDragListeners() {
      document.removeEventListener("mousemove", this.handleDragMove);
      document.removeEventListener("mouseup", this.handleDragEnd);
      this.dragState = null;
    },
    syncTableLayout() {
      this.$nextTick(() => {
        this.$refs.dropdownTable?.doLayout?.();
        setTimeout(() => {
          this.$refs.dropdownTable?.doLayout?.();
        }, 80);
      });
    },
    querySearch(queryString, callback) {
      if (!this.srvInfo) {
        callback([]);
        return;
      }
      loadFkOptions({
        column: this.column,
        row: this.row,
        app: this.app,
        srvInfo: this.srvInfo,
        keyword: queryString,
        mainData: this.$route?.query || {},
        searchCols: this.stringSearchCols,
        columns: this.columns,
      }).then((res) => {
        const results = res?.data || [];
        this.options = results;
        callback(results);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-option-picker-popper {
  padding: 8px;
}

.fk-option-picker {
  width: 100%;
  height: 100%;
  .el-input__inner {
    border: none;
    padding-left: 5px;
  }
}

.fk-option-picker__popover {
  width: 100%;
  height: 100%;
}

.fk-option-picker__dropdown {
  width: 100%;

  .el-table {
    font-size: 12px;
  }

  .el-table__row {
    cursor: pointer;
  }
}

.fk-option-picker__drag-handle {
  // 抵消 .fk-option-picker-popper 的 padding:8px，让标题栏贴近弹窗边缘
  margin: -8px -8px 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #f5f7fa 0%, #ebeef5 100%);
  border-bottom: 1px solid #dcdfe6;
  border-radius: 4px 4px 0 0;
  cursor: move;
  user-select: none;

  .fk-option-picker__drag-icon {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    fill: #909399;
  }

  .fk-option-picker__tip {
    color: #606266;
    font-size: 12px;
  }

  &:hover {
    background: linear-gradient(180deg, #ebeef5 0%, #dcdfe6 100%);
  }

  &:active {
    cursor: grabbing;
  }
}

.fk-option-picker__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.fk-option-picker__tip {
  flex-shrink: 0;
  color: #909399;
  font-size: 12px;
}

.fk-option-picker__option {
  padding: 4px 0;
}
</style>
