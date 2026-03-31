<template>
  <div class="simple-table">
    <el-table
      :data="tableData"
      v-loading="loading"
      :stripe="stripe"
      :border="border"
      :height="height"
      :max-height="maxHeight"
      :row-key="rowKey"
      :empty-text="emptyText"
      style="width: 100%"
    >
      <el-table-column
        v-for="col in columnsData"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :fixed="col.fixed"
        :sortable="col.sortable"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
      >
        <template slot-scope="scope">
          <span>{{ scope.row[col.prop] }}</span>
        </template>
      </el-table-column>
      <slot name="append"></slot>
    </el-table>

    <div v-if="showPagination" class="pagination-wrapper">
      <el-pagination
        background
        :current-page="internalCurrentPage"
        :page-size="internalPageSize"
        :page-sizes="pageSizes"
        :total="internalTotal"
        :layout="paginationLayout"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script>
import { $http } from "@/common/http";

export default {
  name: "SimpleTable",
  props: {
    data: {
      type: Array,
      default: null,
    },
    columns: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    stripe: {
      type: Boolean,
      default: true,
    },
    border: {
      type: Boolean,
      default: true,
    },
    height: {
      type: [String, Number],
      default: null,
    },
    maxHeight: {
      type: [String, Number],
      default: null,
    },
    rowKey: {
      type: String,
      default: "id",
    },
    emptyText: {
      type: String,
      default: "暂无数据",
    },
    showPagination: {
      type: Boolean,
      default: true,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    total: {
      type: Number,
      default: 0,
    },
    pageSizes: {
      type: Array,
      default: () => [5, 10, 20, 50, 100],
    },
    paginationLayout: {
      type: String,
      default: "total, sizes, prev, pager, next, jumper",
    },
    app: {
      type: String,
      default: "",
    },
    serviceName: {
      type: String,
      default: "",
    },
    condition: {
      type: Array,
      default: () => [],
    },
    useType: {
      type: String,
      default: "list",
    },
    colNames: {
      type: Array,
      default: () => ["*"],
    },
    autoLoad: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      internalLoading: false,
      internalCurrentPage: 1,
      internalPageSize: 10,
      internalTotal: 0,
      internalTableData: [],
      internalColumns: [],
    };
  },
  computed: {
    tableData() {
      return this.data !== null ? this.data : this.internalTableData;
    },
    columnsData() {
      return this.columns.length > 0 ? this.columns : this.internalColumns;
    },
    loadingState() {
      return this.loading || this.internalLoading;
    },
  },
  watch: {
    currentPage: {
      handler(val) {
        this.internalCurrentPage = val;
      },
      immediate: true,
    },
    pageSize: {
      handler(val) {
        this.internalPageSize = val;
      },
      immediate: true,
    },
    total: {
      handler(val) {
        this.internalTotal = val;
      },
      immediate: true,
    },
    columns: {
      handler(val) {
        if (val.length > 0) {
          this.internalColumns = val;
        }
      },
      immediate: true,
    },
  },
  mounted() {
    if (this.autoLoad && this.serviceName) {
      this.loadColumns();
      this.loadData();
    }
  },
  methods: {
    async loadColumns() {
      if (!this.serviceName) {
        console.warn("serviceName is required for loading columns");
        return;
      }

      const url = `${this.app}/select/srvsys_service_columnex_v2_select`;
      const req = {
        serviceName: "srvsys_service_columnex_v2_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_name",
            value: this.serviceName,
            ruleType: "eq",
          },
          { colName: "use_type", value: this.useType, ruleType: "eq" },
        ],
        order: [{ colName: "seq", orderType: "asc" }],
      };

      try {
        const res = await $http.post(url, req);
        if (res.data.state === "SUCCESS") {
          const meta = res.data.data;
          if (meta?.srv_cols?.length) {
            this.internalColumns = meta.srv_cols
              .filter((item) => item.in_list === 1)
              .map((item) => ({
                prop: item.columns,
                label: item.label,
                width: item.width || undefined,
                minWidth: item.list_min_width || 100,
                align: item.align || "left",
                col_type: item.col_type,
                sortable: item.sortable === true ? "custom" : false,
                showOverflowTooltip: true,
                option_list: item.option_list,
                formatter: this.createColumnFormatter(item),
              }));
          }
        }
      } catch (error) {
        console.error("加载列配置失败:", error);
        this.$message?.error("加载列配置失败");
      }
    },
    async loadData() {
      if (!this.serviceName) {
        console.warn("serviceName is required for loading data");
        return;
      }

      this.internalLoading = true;
      const url = `/${this.app}/select/${this.serviceName}`;
      const req = {
        serviceName: this.serviceName,
        colNames: this.colNames,
        condition: this.condition,
        page: {
          rownumber: this.internalPageSize,
          pageNo: this.internalCurrentPage,
        },
        use_type: this.useType,
      };

      try {
        const res = await $http.post(url, req);
        if (res.data.state === "SUCCESS") {
          this.internalTableData = res.data.data || [];
          this.internalTotal = res.data.total || 0;
        }
      } catch (error) {
        console.error("加载数据失败:", error);
        this.$message?.error("加载数据失败");
      } finally {
        this.internalLoading = false;
      }
    },
    createColumnFormatter(colInfo) {
      return (row, column, cellValue) => {
        if (cellValue === null || cellValue === undefined) {
          return "--";
        }

        switch (colInfo.col_type) {
          case "Date":
            return this.formatDate(cellValue, colInfo.subtype);
          case "DateTime":
            return this.formatDateTime(cellValue, colInfo.subtype);
          case "Enum":
          case "Dict":
            return this.formatEnum(cellValue, colInfo.option_list);
          default:
            return cellValue;
        }
      };
    },
    formatDate(value, subtype) {
      if (!value) return "--";
      try {
        const date = new Date(value);
        if (subtype === "year") {
          return date.getFullYear().toString();
        } else if (subtype === "month") {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        } else {
          return date.toLocaleDateString("zh-CN");
        }
      } catch (e) {
        return value;
      }
    },
    formatDateTime(value, subtype) {
      if (!value) return "--";
      try {
        const date = new Date(value);
        if (subtype === "Hour") {
          return date.getHours().toString();
        } else if (subtype === "minute") {
          return `${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}`;
        } else if (subtype === "second") {
          return `${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
        } else {
          return date.toLocaleString("zh-CN");
        }
      } catch (e) {
        return value;
      }
    },
    formatEnum(value, optionList) {
      if (!optionList || !Array.isArray(optionList)) {
        return value;
      }
      const option = optionList.find((opt) => opt.value === value);
      return option ? option.label : value;
    },
    handlePageChange(page) {
      this.internalCurrentPage = page;
      this.$emit("page-change", page);
      if (this.autoLoad) {
        this.loadData();
      }
    },
    handleSizeChange(size) {
      this.internalPageSize = size;
      this.internalCurrentPage = 1;
      this.$emit("size-change", size);
      if (this.autoLoad) {
        this.loadData();
      }
    },
    refresh() {
      this.loadData();
    },
  },
};
</script>

<style lang="scss" scoped>
.simple-table {
  .pagination-wrapper {
    margin-top: 16px;
    text-align: right;
    padding: 0 8px;
  }
}
</style>
