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
import { $http } from "@/common/http";
import { getFkOptions } from "@/service/api";

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
      if (!item) {
        return item;
      }
      const option = cloneDeep(item);
      option.label =
        option[this.keyDispCol] || option.label || option[this.refedCol];
      option.value = option[this.refedCol] || option.value;
      return option;
    },
    buildOption(queryString = "") {
      const option = cloneDeep(this.srvInfo || {});
      const relationCondition = {
        relation: "OR",
        data: [],
      };
      if (queryString && option.key_disp_col) {
        relationCondition.data.push({
          colName: option.key_disp_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      if (queryString && option.refed_col) {
        relationCondition.data.push({
          colName: option.refed_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      if (relationCondition.data.length) {
        option.relation_condition = relationCondition;
      }
      return option;
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
      const req = {
        serviceName: "srvsys_service_columnex_v2_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_name",
            value: this.srvInfo.serviceName,
            ruleType: "eq",
          },
          { colName: "use_type", value: useType, ruleType: "eq" },
        ],
        order: [{ colName: "seq", orderType: "asc" }],
      };
      const url = `/${app}/select/srvsys_service_columnex_v2_select?colsel_v2=${this.srvInfo.serviceName}`;
      const res = await $http.post(url, req);
      const cols = res?.data?.data?.srv_cols || [];
      this.tableColumns = cols.filter(
        (item) => item.columns && item.in_list === 1
      );
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
      const option = this.buildOption(this.innerValue);
      return getFkOptions(
        { ...this.column, option_list_v2: option },
        this.row,
        this.app,
        this.pageNo,
        this.pageSize,
        {
          mainData: this.$route?.query || {},
        }
      )
        .then((res) => {
          if (res?.data?.length) {
            this.tableData = res.data.map((item) => this.formatOption(item));
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
        this.pendingInputValue = value || "";
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
        this.$emit("input", value);
      }
    },
    handleBlur() {
      this.focused = false;
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
      this.$emit("clear");
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
      this.pendingInputValue = null;
      this.$emit("input-change", this.innerValue, { source: "select" });
      this.$emit("input", this.innerValue);
      this.$emit("select", cloneDeep(selected));
    },
    handleAutocompleteSelect(item) {
      const selected = this.formatOption(item);
      this.innerValue = selected?.label || selected?.value || "";
      this.pendingInputValue = null;
      this.$emit("input-change", this.innerValue, { source: "select" });
      this.$emit("input", this.innerValue);
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
      const option = this.buildOption(queryString);
      getFkOptions(
        { ...this.column, option_list_v2: option },
        this.row,
        this.app,
        null,
        null,
        {
          mainData: this.$route?.query || {},
        }
      ).then((res) => {
        const results = res?.data?.length
          ? res.data.map((item) => this.formatOption(item))
          : [];
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
