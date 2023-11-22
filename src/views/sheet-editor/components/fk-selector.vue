<template>
  <div v-loading="loading" class="flex justify-between items-center" @dblclick.stop="">

    <div style="width: 100%;" v-if="isTree && setDisabled" @click="remoteMethod">
      {{ modelValue }}
    </div>
    <div v-if="isTree" style="width: 100%;">
      <el-popover placement="bottom-center" ref="treePopover" trigger="click" @show="onPopoverShow">
        <span slot="reference" v-if="modelValue && !setDisabled" class="cursor-pointer">{{ modelLabel || modelValue || ''
        }}</span>
        <span slot="reference" class="text-gray cursor-pointer" v-else-if="!setDisabled">点击进行选择</span>
        <el-input placeholder="输入关键字进行过滤" clearable v-model="filterText" @focus="onFocus" @input="onFilterInput"
          @clear="onFilterClear" style="max-width: 300px;margin-bottom: 5px;">
        </el-input>
        <el-cascader-panel :props="props" :is-border="false" :options="options" @change="onSelectChange" :emitPath="false"
          checkStrictly></el-cascader-panel>
      </el-popover>
    </div>

    <el-select ref="inputRef" v-model="modelValue" remote filterable reserve-keyword placeholder="请输入关键词"
      :remote-method="remoteMethod" :loading="loading" :value-key="srvInfo.refed_col" @click.native="remoteMethod"
      @dblclick.native="openDialog" @change="onSelectChange" @focus="onFocus" clearable :disabled="setDisabled" v-else>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
      </el-option>
    </el-select>
    <i class="el-icon-arrow-right cursor-pointer  m-l-[-5px] text-#C0C4CC" :class="{ 'cursor-not-allowed': setDisabled }"
      @click="openDialog" v-if="!isTree"></i>

    <el-dialog title="选择" :visible.sync="dialogVisible" width="80%" append-to-body v-loading="tableloading">
      <div @click.stop="">
        <div class="filter-box">
          <div class="text-bold">输入文字进行筛选:</div>
          <el-input placeholder="输入文字进行筛选" @change="toFilter" v-model="filterText" clearable></el-input>
        </div>
        <el-table :data="tableData" style="width: 100%" v-if="tableData.length" @row-dblclick="onDBClick">
          <el-table-column :prop="column.columns" :label="column.label" width="180" show-overflow-tooltip border
            v-for="column in tableColumns">
          </el-table-column>
        </el-table>
        <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[5, 10, 20, 30]"
          :page-size="rownumber" :total="total" :current-page="pageNo" layout="total, sizes, prev, pager, next">
        </el-pagination>
        <div class="text-red text-center m-t-4" v-if="tableData && tableData.length">
          双击列表进行选择
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getFkOptions, onSelect } from "../../../service/api";

export default {
  props: {
    app: {
      type: String,
      default: "",
    },
    srvInfo: {
      type: Object,
    },
    value: String,
    column: Object,
    row: Object,
    defaultOptions: Array,
    disabled: Boolean,
  },
  data() {
    return {
      allOptions: [],
      loading: false,
      options: [],
      modelValue: null,
      dialogVisible: false,
      tableColumns: [],
      tableData: [],
      pageNo: 1,
      rownumber: 10,
      total: 0,
      tableloading: false,
      filterText: "",
      props: {
        emitPath: false,
        checkStrictly: true,
        value: "value",
        label: "label",
        lazy: true,
        lazyLoad: (node, resolve) => {
          this.loadTree(node).then((res) => {
            resolve(res);
          });
        },
      },
    };
  },
  computed: {
    setoptions() {
      // 根据搜索值动态得到匹配的选项
      return this.options?.filter(item => {
        return item?.label?.indexOf(this.filterText) > -1;
      });
    },
    currentModel() {
      if (this.modelValue) {
        return this.allOptions.find(item => item.value === this.modelValue);
      }
    },
    modelLabel() {
      if (this.currentModel) {
        return this.currentModel.label;
      }
    },
    srvApp() {
      return this.srvInfo?.srv_app || this.app;
    },
    isTree() {
      return this.srvInfo?.is_tree && this.srvInfo?.parent_col ? true : false;
    },
    setDisabled() {
      if (
        this.row?.__flag !== "add" &&
        this.row?._button_auth?.edit === false
      ) {
        return true;
      }
      return this.disabled;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (this.modelValue !== newValue) {
          this.modelValue = newValue;
          // this.remoteMethod(this.value);
          if (this.row?.__flag === 'add' || this.row?.__flag === 'update') {
            if (this.isTree) {
              this.$refs?.treePopover?.doShow()
              // this.remoteMethod(newValue);
            } else {
              this.remoteMethod(newValue).then(res => {
                if (res?.length > 1) {
                  this.$refs?.inputRef?.focus()
                }else{}
              });
            }
          }
        }
        if (newValue && this.row?.__flag === 'add') {
          // 新增数据 如果是fk字段并且有默认值 自动查找fk选项
          this.remoteMethod(newValue);
        }
      },
    },
    modelValue: {
      immediate: true,
      handler(newValue) {
        if (newValue !== this.value) {
          this.$emit("input", newValue);
        }
      },
    },
  },
  created() {

    // if(this.value&&this.row?.__flag==='add'){
    //   // 新增数据 如果是fk字段并且有默认值 自动查找fk选项
    //   this.remoteMethod(this.value);
    // }
    if (this.defaultOptions?.length) {
      this.options = [...this.defaultOptions];
    }

  },
  methods: {
    onFilterClear() {
      this.filterText = ''
      this.$emit('input', '')
      this.remoteMethod()
    },
    onFilterInput(value) {
      // this.$emit('input',value)
      this.modelValue = value
      this.remoteMethod()
    },
    onPopoverShow() {
      // this.onFocus()
      this.filterText = this.value
      this.remoteMethod(this.filterText)
    },
    async loadTree(node) {
      if (node?.value) {
        const option = this.srvInfo;
        const condition = [
          {
            colName: this.srvInfo.parent_col,
            ruleType: "eq",
            value: node.value,
          },
        ];
        const res = await onSelect(
          this.srvInfo.serviceName,
          this.srvApp,
          condition,
          {
            rownumber: 100,
            pageNo: 1,
          }
        );
        if (res?.data) {
          const result = res.data.map((item) => {
            item.label = item[option.key_disp_col];
            item.value = item[option.refed_col];
            item.leaf = item.is_leaf === '是'
            return item;
          });
          this.allOptions.push(...result)
          return result
        } else return [];
      }
    },
    onFocus() {
      console.log("onfocus");
      this.$emit("onfocus");
    },
    toFilter(query) {
      this.pageNo = 1;
      this.total = 0;
      // this.tableloading = true;

      let queryString = "";
      if (query && typeof query === "string") {
        queryString = query;
      }

      let option = JSON.parse(JSON.stringify(this.srvInfo));
      let relation_condition = {
        relation: "OR",
        data: [],
      };
      if (!option.key_disp_col && !option.refed_col) {
        return;
      }
      if (option.key_disp_col && queryString) {
        relation_condition.data.push({
          colName: option.key_disp_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      if (option.refed_col && queryString) {
        relation_condition.data.push({
          colName: option.refed_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      option.relation_condition = relation_condition;
      getFkOptions(
        { ...this.column, option_list_v2: option },
        this.row,
        this.app,
        this.pageNo,
        this.rownumber
      ).then((res) => {
        if (res?.data?.length) {
          this.tableData = res.data.map((item) => {
            item.label = item[option.key_disp_col];
            item.value = item[option.refed_col];
            item.leaf = item.is_leaf === '是'
            return item;
          });
          this.allOptions.push(...this.tableData)

          this.total = res?.page?.total;
        } else {
          this.options = [];
        }
        // this.tableloading = false;
      });
    },
    handleSizeChange(val) {
      this.rownumber = val;
      this.pageNo = 1;
      this.getTableData();
    },
    handleCurrentChange(val) {
      this.pageNo = val;
      this.getTableData();
    },
    onSelectChange(val) {
      if (Array.isArray(val) && val?.length) {
        val = val[0]
      }
      this.$refs?.treePopover?.doClose()
      this.modelValue = val;
      let currentValue = this.options.find(item => item[this.srvInfo.refed_col] === this.modelValue);
      if (currentValue) {
        this.$emit('select', {
          value: this.modelValue,
          rawData: currentValue
        })
      } else {
        this.$emit("input", val);
      }
    },
    onDBClick(row, column, cell, event) {
      this.modelValue = row[this.srvInfo.refed_col];
      this.$emit("input", this.modelValue);
      this.options = JSON.parse(JSON.stringify(this.tableData));
      this.dialogVisible = false;
      this.filterText = "";
    },
    getFkColumns() {
      const req = {
        serviceName: "srvsys_service_columnex_v2_select",
        colNames: ["*"],
        condition: [
          {
            colName: "service_name",
            value: this.srvInfo.serviceName,
            ruleType: "eq",
          },
          { colName: "use_type", value: "selectlist", ruleType: "eq" },
        ],
        order: [{ colName: "seq", orderType: "asc" }],
      };
      const app =
        this.srvInfo.srv_app ||
        this.app ||
        sessionStorage.getItem("current_app");
      if (app) {
        const url = `/${app}/select/srvsys_service_columnex_v2_select?colsel_v2=${this.srvInfo.serviceName}`;
        this.$http.post(url, req).then((res) => {
          if (res?.data?.data?.srv_cols?.length) {
            this.tableColumns = res.data.data.srv_cols.filter(
              (item) => item.columns && item.in_list === 1
            );
          }
        });
      }
    },
    getTableData() {
      this.tableloading = true;
      setTimeout(() => {
        this.tableloading = false;
      }, 5000);
      const srvInfo = JSON.parse(JSON.stringify(this.srvInfo));
      if (this.filterText) {
        srvInfo;
      }
      getFkOptions(
        { ...this.column, option_list_v2: this.srvInfo },
        this.row,
        this.app,
        this.pageNo,
        this.rownumber
      ).then((res) => {
        if (res?.data?.length) {
          this.tableData = res.data.map((item) => {
            item.label = item[this.srvInfo.key_disp_col];
            item.value = item[this.srvInfo.refed_col];
            item.leaf = item.is_leaf === '是'
            return item;
          });
          this.allOptions.push(...this.tableData)

          this.total = res?.page?.total;
        } else {
          this.tableData = [];
        }
        this.tableloading = false;
      });
    },
    openDialog() {
      if (this.setDisabled) {
        return;
      }
      if (this.isTree) {
        this.remoteMethod()
        return
      }
      this.filterText = "";
      this.dialogVisible = true;
      this.pageNo = 1;
      this.rownumber = 5;
      this.getTableData();

      if (!this.tableColumns?.length) {
        this.getFkColumns();
      }
    },
    filterMethod(node, query) { },
    remoteMethod(query) {
      let queryString = this.value;
      if (query && typeof query === "string") {
        queryString = query;
      }
      //   if (query !== "") {
      if (!this.options?.length) {
        this.loading = true;
        setTimeout(() => {
          this.loading = false;
        }, 5000);
      }
      let option = JSON.parse(JSON.stringify(this.srvInfo));
      let relation_condition = {
        relation: "OR",
        data: [],
      };
      if (!option.key_disp_col && !option.refed_col) {
        return;
      }
      if (option.key_disp_col && queryString) {
        relation_condition.data.push({
          colName: option.key_disp_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      if (option.refed_col && queryString) {
        relation_condition.data.push({
          colName: option.refed_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      option.relation_condition = relation_condition;
      return new Promise((resolve) => {
        getFkOptions(
          { ...this.column, option_list_v2: option },
          this.row,
          this.app
        ).then((res) => {
          if (res?.data?.length) {
            this.options = res.data.map((item) => {
              item.label = item[option.key_disp_col];
              item.value = item[option.refed_col];
              item.leaf = item.is_leaf === '是'
              return item;
            });
            this.allOptions.push(...this.options)
            if (this.modelValue) {
              let currentValue = this.options.find(item => item[option.refed_col] === this.modelValue);
              if (currentValue) {
                this.$emit('select', {
                  value: this.modelValue,
                  rawData: currentValue
                })
              }
            }
            resolve(this.options)
          } else {
            this.options = [];
          }
          this.loading = false;
        });
      });

    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .el-cascader-node {
  max-width: 300px;
}
</style>
