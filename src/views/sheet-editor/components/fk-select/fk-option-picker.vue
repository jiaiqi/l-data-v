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
        <el-table
          ref="dropdownTable"
          :data="tableData"
          v-loading="loading"
          size="mini"
          border
          :height="tableHeight"
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
          <span class="fk-option-picker__tip">双击列表进行选择</span>
          <el-pagination
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
    };
  },
  computed: {
    keyDispCol() {
      return this.srvInfo?.key_disp_col;
    },
    refedCol() {
      return this.srvInfo?.refed_col;
    },
    effectivePlaceholder() {
      if (this.placeholder) {
        return this.placeholder;
      }
      const searchColumns = [
        this.srvInfo?.key_disp_col,
        this.srvInfo?.refed_col,
      ].filter(Boolean);
      const uniqueColumns = Array.from(new Set(searchColumns));
      if (uniqueColumns.length) {
        // return `输入${uniqueColumns.join(" / ")}模糊搜索`;
        return `输入关键词进行搜索`;
      }
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
  },
  methods: {
    formatOption(item) {
      return normalizeFkOption(item, this.srvInfo || {});
    },
    buildOption(queryString = "") {
      return buildFkOptionConfig(this.srvInfo || {}, queryString);
    },
    async loadColumns(useType = "selectlist") {
      if (!this.srvInfo?.serviceName) {
        return;
      }
      const app =
        this.srvInfo.srv_app ||
        this.app ||
        sessionStorage.getItem("current_app");
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
      })
        .then((res) => {
          if (res?.data?.length) {
            this.tableData = res.data;
            this.options = cloneDeep(this.tableData);
            this.total = res?.page?.total || this.tableData.length;
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
      this.syncTableLayout();
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
