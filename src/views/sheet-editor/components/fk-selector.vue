<template>
  <div
    v-loading="loading"
    class="flex justify-between items-center"
    style="max-width: 500px"
  >
    <div style="width: 100%" v-if="isTree && setDisabled" @click="remoteMethod">
      {{ modelValue }}
    </div>
    <div v-else-if="setDisabled">{{ modelLabel || modelValue || "" }}</div>
    <multi-tab-option-select
      v-else-if="useMultiTabOptionSelect === true"
      :placeholder="fieldInfo.placeholder"
      :optionListV3="optionListV3"
      :field="fieldInfo"
      :disabled="setDisabled"
      v-model="modelValue"
      :app="app"
      @select="multiTabSelectChange"
    ></multi-tab-option-select>
    <div v-else-if="isTree" style="width: 100%">
      <el-popover
        placement="bottom-center"
        ref="treePopover"
        trigger="click"
        @show="onPopoverShow"
      >
        <span
          slot="reference"
          v-if="modelValue && !setDisabled"
          class="cursor-pointer"
          >{{ modelLabel || modelValue || "" }}</span
        >
        <span
          slot="reference"
          class="text-gray cursor-pointer"
          v-else-if="!setDisabled"
          >点击进行选择</span
        >
        <el-input
          placeholder="输入关键字进行过滤"
          clearable
          v-model="filterText"
          @focus="onFocus"
          @input="onFilterInput"
          @clear="onFilterClear"
          style="max-width: 300px; margin-bottom: 5px"
        >
        </el-input>
        <el-cascader-panel
          :props="props"
          :is-border="false"
          :options="options"
          @change="onSelectChange"
          :emitPath="false"
          checkStrictly
        ></el-cascader-panel>
      </el-popover>
    </div>
    <div
      v-else-if="srvInfo && srvInfo.refed_col"
      class="flex items-center justify-between w-full"
    >
      <div>{{ modelLabel || modelValue }}</div>
      <el-select
        ref="inputRef"
        v-model="modelValue"
        remote
        :filterable="true"
        reserve-keyword
        placeholder="请输入关键词"
        :remote-method="remoteMethod"
        :loading="loading"
        :label-key="srvInfo.key_disp_col"
        :value-key="srvInfo.refed_col"
        @click.native="remoteMethod"
        @dblclick.native="openDialog"
        @change="onSelectChange"
        @focus="onFocus"
        :clearable="false"
        :disabled="setDisabled"
        style="width: 0px; padding: 0; overflow: hidden"
      >
        <el-option
          v-for="(item, index) in options"
          :key="index"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
      <i
        class="el-icon-arrow-right cursor-pointer m-l-[-5px] text-#C0C4CC"
        :class="{ 'cursor-not-allowed': setDisabled }"
        @click.stop="openDialog"
        v-if="!isTree && !setDisabled"
      ></i>
    </div>
    <div v-else>{{ modelValue }}</div>

    <!-- <i
      class="el-icon-arrow-right cursor-pointer m-l-[-5px] text-#C0C4CC"
      :class="{ 'cursor-not-allowed': setDisabled }"
      @click="openDialog"
      v-if="!isTree && !setDisabled"
    ></i> -->

    <el-dialog
      title="选择"
      :visible.sync="dialogVisible"
      width="80%"
      append-to-body
      v-loading="tableLoading"
    >
      <div @click.stop="">
        <div class="filter-box">
          <div class="text-bold">输入文字进行筛选:</div>
          <el-input
            placeholder="输入文字进行筛选"
            @change="toFilter"
            v-model="filterText"
            clearable
          ></el-input>
        </div>
        <el-table
          :data="tableData"
          style="width: 100%"
          v-if="tableData.length"
          @row-dblclick="onDBClick"
        >
          <el-table-column
            :prop="column.columns"
            :label="column.label"
            width="180"
            show-overflow-tooltip
            border
            v-for="column in tableColumns"
            :key="column.columns"
          >
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :page-sizes="[5, 10, 20, 30]"
          :page-size="rownumber"
          :total="total"
          :current-page="pageNo"
          layout="total, sizes, prev, pager, next"
        >
        </el-pagination>
        <div
          class="text-red text-center m-t-4"
          v-if="tableData && tableData.length"
        >
          双击列表进行选择
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { clone, cloneDeep } from "lodash-es";
import { getFkOptions, onSelect } from "../../../service/api";
import multiTabOptionSelect from "./fk-select/multi-tab-option-select.vue";

export default {
  components: {
    multiTabOptionSelect,
  },
  props: {
    app: {
      type: String,
      default: "",
    },
    // srvInfo: {
    //   type: Object,
    // },
    fieldInfo: {
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
      tableLoading: false,
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
    currentModel() {
      if (this.modelValue) {
        return this.allOptions.find((item) => item.value === this.modelValue);
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
      return this.optionListV2?.is_tree && this.optionListV2?.parent_col
        ? true
        : false;
    },
    optionListV3() {
      return this.fieldInfo?.option_list_v3;
    },
    srvInfo() {
      return this.optionListV2;
    },
    optionListV2() {
      let result = null;
      if (this.optionListV3?.length) {
        // 如果有v3 则使用v3
        const option_list_v3 = this.optionListV3;
        const data = this.row;
        if (option_list_v3.find((item) => !item.conds)) {
          result = option_list_v3.find((item) => !item.conds);
        } else {
          result = option_list_v3.find(
            (item) =>
              !item.conds?.length ||
              item.conds?.every(
                (cond) =>
                  data?.[cond.case_col] &&
                  cond.case_val?.includes?.(data?.[cond.case_col])
              )
          );
        }
      } else if (this.fieldInfo?.option_list_v2) {
        result = this.fieldInfo.option_list_v2;
      }
      result = cloneDeep(result);
      // if (!result) {
      //   result = this.field?.info?.srvCol?.option_list_v2;
      // }
      if (
        Array.isArray(result?.condition) &&
        !Array.isArray(result?.conditions)
      ) {
        result.conditions = result.condition;
      }
      // if (this.field?.info?._upstreamCondition?.colName) {
      //   if (Array.isArray(result?.conditions)) {
      //     result.conditions.push(cloneDeep(this.field.info._upstreamCondition));
      //   } else if (result) {
      //     result.conditions = [cloneDeep(this.field.info._upstreamCondition)];
      //   }
      // }
      return result;
    },
    useMultiTabOptionSelect() {
      // 条件外键，没有符合的条件，使用多tab下拉组件
      return (
        !this.optionListV2 &&
        this.optionListV3?.filter((item) => item.conds?.length)?.length > 0
      );
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
      handler(newValue, oldValue) {
        if (this.modelValue !== newValue) {
          this.modelValue = newValue;
          // this.remoteMethod(this.value);
          if (
            (this.row?.__flag === "add" || this.row?.__flag === "update") &&
            newValue
          ) {
            if (this.isTree) {
              this.$refs?.treePopover?.doShow();
              // this.remoteMethod(newValue);
            } else {
              this.remoteMethod(newValue).then((res) => {
                if (res?.length > 1) {
                  this.$refs?.inputRef?.focus();
                } else if (this.srvInfo?.refed_col) {
                  this.onSelectChange(
                    res.map((item) => item[this.srvInfo?.refed_col])
                  );
                }
              });
            }
          }
        }
        if (newValue && this.row?.__flag === "add") {
          // 新增数据 如果是fk字段并且有默认值 自动查找fk选项
          this.remoteMethod(newValue);
        } else if (
          !newValue &&
          newValue !== oldValue &&
          newValue !== undefined
        ) {
          if (newValue === null && oldValue === undefined) {
            return;
          }
          this.onSelectChange();
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
    multiTabSelectChange(item, cfg) {
      if (cfg?.case_col) {
        this.$emit("multi-tab-option-select-change", item, cfg);
      }
      this.onSelectChange(item[cfg.refed_col || cfg.refedCol]);
      // this.field?.form?.allFields?.[cfg.case_col]?.setSrvVal?.(cfg.case_val);
      // this.$nextTick(() => {
      //   this.handleSelect(item, cfg);
      // });
    },
    onFilterClear() {
      this.filterText = "";
      this.$emit("input", "");
      this.remoteMethod();
    },
    onFilterInput(value) {
      this.modelValue = value;
      this.remoteMethod(value);
    },
    onPopoverShow() {
      // this.onFocus()
      this.filterText = this.value;
      this.remoteMethod(this.filterText).then((res) => {
        if (res?.length === 1 && this.srvInfo?.refed_col) {
          this.onSelectChange(res.map((item) => item[this.srvInfo.refed_col]));
        }
      });
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
        if (res?.data && option?.refed_col) {
          const result = res.data.map((item) => {
            item.label = item[option.key_disp_col];
            item.value = item[option.refed_col];
            item.leaf = item.is_leaf === "是";
            return item;
          });
          this.allOptions.push(...result);
          return result;
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
      // this.tableLoading = true;

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
      if (option?.refed_col && queryString) {
        relation_condition.data.push({
          colName: option?.refed_col,
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
        this.rownumber,
        {
          mainData: this.$route.query,
        }
      ).then((res) => {
        if (res?.data?.length && option?.refed_col) {
          this.tableData = res.data.map((item) => {
            item.label = item[option.key_disp_col];
            item.value = item[option.refed_col];
            item.leaf = item.is_leaf === "是";
            return item;
          });
          this.allOptions.push(...this.tableData);

          this.total = res?.page?.total;
        } else {
          this.options = [];
        }
        // this.tableLoading = false;
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
      console.log("onSelectChange", val);

      if (Array.isArray(val) && val?.length) {
        val = val[0];
      }
      this.$refs?.treePopover?.doClose();

      let currentValue = this.allOptions.find(
        (item) => val && item[this.srvInfo?.refed_col] === val
      );
      this.modelValue = val;
      if (currentValue) {
        this.$emit("select", {
          value: this.modelValue,
          rawData: currentValue,
        });
      } else {
        this.$emit("select", {
          value: this.modelValue,
          rawData: null,
        });
        this.$emit("input", val);
      }
    },
    onDBClick(row, column, cell, event) {
      // this.modelValue = row[this.srvInfo?.refed_col];
      this.options = JSON.parse(JSON.stringify(this.tableData));
      this.dialogVisible = false;
      this.filterText = "";
      this.onSelectChange(row[this.srvInfo?.refed_col]);
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
      this.tableLoading = true;
      setTimeout(() => {
        this.tableLoading = false;
      }, 5000);
      const srvInfo = JSON.parse(JSON.stringify(this.srvInfo));
      if (this.filterText) {
        // srvInfo;
      }
      getFkOptions(
        { ...this.column, option_list_v2: srvInfo },
        this.row,
        this.app,
        this.pageNo,
        this.rownumber,
        {
          mainData: this.$route.query,
        }
      ).then((res) => {
        if (res?.data?.length && srvInfo?.refed_col) {
          this.tableData = res.data.map((item) => {
            item.label = item[srvInfo.key_disp_col];
            item.value = item[srvInfo.refed_col];
            item.leaf = item.is_leaf === "是";
            return item;
          });
          this.allOptions.push(...this.tableData);

          this.total = res?.page?.total;
        } else {
          this.tableData = [];
        }
        this.tableLoading = false;
      });
    },
    openDialog() {
      if (this.setDisabled) {
        return;
      }
      if (this.isTree) {
        this.remoteMethod();
        return;
      }
      this.filterText = "";
      this.dialogVisible = true;
      this.pageNo = 1;
      this.rownumber = 5;
      this.getTableData();

      // if (!this.tableColumns?.length) {
      this.getFkColumns();
      // }
    },
    filterMethod(node, query) {},
    remoteMethod(query) {
      if (this.useMultiTabOptionSelect) {
        return;
      }
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
      const option = JSON.parse(JSON.stringify(this.srvInfo));

      // let option = JSON.parse(JSON.stringify(this.srvInfo));
      let relation_condition = {
        relation: "OR",
        data: [],
      };
      if (!option?.key_disp_col && !option?.refed_col) {
        this.loading = false;
        return new Promise((resolve) => {
          resolve([]);
        });
      }
      if (queryString && queryString !== "$firstRowData") {
        if (option.key_disp_col) {
          relation_condition.data.push({
            colName: option.key_disp_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
        if (option.refed_col) {
          relation_condition.data.push({
            colName: option.refed_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
      }
      option.relation_condition = relation_condition;
      return new Promise((resolve) => {
        getFkOptions(
          { ...this.column, option_list_v2: option },
          this.row,
          this.app,
          null,
          null,
          {
            mainData: this.$route.query,
          }
        ).then((res) => {
          if (res?.data?.length && option?.refed_col) {
            this.options = res.data.map((item) => {
              item.label = item[option.key_disp_col];
              item.value = item[option.refed_col];
              item.leaf = item.is_leaf === "是";
              return item;
            });
            this.allOptions.push(...this.options);
            if (this.modelValue) {
              if (this.modelValue === "$firstRowData") {
                if (res.data.length) {
                  this.modelValue = res.data[0][option.refed_col];
                }
              }
              let currentValue = this.options.find(
                (item) => item[option.refed_col] === this.modelValue
              );
              if (currentValue) {
                console.log("fkSelector:select", currentValue);

                this.$emit("select", {
                  value: this.modelValue,
                  rawData: currentValue,
                });
              }
            }
            resolve(this.options);
          } else {
            this.options = [];
          }
          this.loading = false;
        });
      });
    },

    buildRelationConditionInfo(dispLoader, queryString) {
      let self = this;
      let relaTemp = {
        relation: "AND",
        data: [],
      };
      let condition = [];
      let dataTemp = {
        relation: "AND",
        data: [],
      };
      console.log("dispLoader:", dispLoader);

      let relation_condition = {};
      if (dispLoader.conditions) {
        this.buildConditions(dispLoader).forEach((c) => condition.push(c));
        // condition = this.pruneConditions(condition);

        if (condition.length > 0) {
          relaTemp.relation = "OR";
          dataTemp.data = [];
          let dataItem = {
            colName: "",
            value: "",
            ruleType: "",
          };
          // dataTemp.data = condition
          // relaTemp.data.push(cloneDeep(dataTemp))
          dataTemp.data = [];
          dataItem.ruleType = "[like]";
          dataItem.colName = this.field.info.valueCol;
          dataItem.value = queryString == null ? "" : queryString;
          dataTemp.data.push(cloneDeep(dataItem));
          relaTemp.data.push(cloneDeep(dataTemp));
          dataTemp.data = [];
          dataItem.ruleType = "[like]";
          dataItem.colName = this.field.info.dispCol;
          dataItem.value = queryString == null ? "" : queryString;
          dataTemp.data.push(cloneDeep(dataItem));
          relaTemp.data.push(cloneDeep(dataTemp));
        } else {
          relaTemp.relation = "OR";
          dataTemp.data = [];
          let dataItem = {
            colName: "",
            value: "",
            ruleType: "",
          };
          dataItem.ruleType = "[like]";
          dataItem.colName = this.field.info.valueCol;
          dataItem.value = queryString == null ? "" : queryString;
          dataTemp.data.push(cloneDeep(dataItem));
          relaTemp.data.push(cloneDeep(dataTemp));
          dataTemp.data = [];
          dataItem.ruleType = "[like]";
          dataItem.colName = this.field.info.dispCol;
          dataItem.value = queryString == null ? "" : queryString;
          dataTemp.data.push(cloneDeep(dataItem));
          relaTemp.data.push(cloneDeep(dataTemp));
        }
      } else {
        // 默认的 value  disp 字段模糊查询条件
        relaTemp.relation = "OR";
        dataTemp.data = [];
        let dataItem = {
          colName: "",
          value: "",
          ruleType: "",
        };
        dataItem.ruleType = "[like]";
        dataItem.colName = this.field.info.valueCol;
        dataItem.value = queryString == null ? "" : queryString;
        dataTemp.data.push(cloneDeep(dataItem));
        relaTemp.data.push(cloneDeep(dataTemp));
        dataTemp.data = [];
        dataItem.ruleType = "[like]";
        dataItem.colName = this.field.info.dispCol;
        dataItem.value = queryString == null ? "" : queryString;
        dataTemp.data.push(cloneDeep(dataItem));
        relaTemp.data.push(cloneDeep(dataTemp));
      }
      return relaTemp;
    },
    buildRelationCondition(dispLoader) {
      let self = this;
      function evalCustomizer(value, key, obj, stack) {
        if (key === "value" && !obj.literal) {
          try {
            return self.evalExprOrFunc(
              value,
              self.field.form.srvValFormModel(),
              null
            );
          } catch (e) {
            return value;
          }
        }
      }

      var evaled = cloneDeepWith(
        dispLoader.relation_conditions,
        evalCustomizer
      );

      function pruneCustomizer(value, key, obj, stack) {
        if (
          key === "data" &&
          Array.isArray(value) &&
          !isEmpty(value) &&
          value[0].hasOwnProperty("colName")
        ) {
          return value.filter(
            (leafCondition) =>
              leafCondition.value !== "" &&
              leafCondition.value !== null &&
              leafCondition.value !== undefined
          );
        }
      }
      var result = cloneDeepWith(evaled, pruneCustomizer);
      return result;
    },

    buildConditions: function (dispLoader) {
      let ret = [];
      const rowData = this.row;
      const mainData = {};
      for (let i in dispLoader.conditions) {
        let cond = dispLoader.conditions[i];
        let condition = {};
        try {
          condition.colName = cond.colName;
          condition.ruleType = cond.ruleType;
          if (cond.disableExpr && eval(cond.disableExpr)) {
            continue;
          }

          let valueExpr = cond.valueExpr || cond.value;
          if (valueExpr?.value_type && valueExpr?.value_key) {
            if (valueExpr?.value_type === "rowData") {
              condition.value = rowData[valueExpr.value_key];
            } else if (valueExpr?.value_type === "mainData") {
              condition.value = mainData[valueExpr.value_key];
            } else if (
              valueExpr?.value_type === "constant" &&
              valueExpr.value
            ) {
              condition.value = valueExpr.value;
            }
          } else if (valueExpr) {
            // literal value or js expr
            if (cond.literalValue) {
              condition.value = valueExpr;
            } else {
              condition.value = this.evalExprOrFunc(
                valueExpr,
                this.row,
                null,
                mainData
              );
            }
          } else if (cond.valueFunc) {
            condition.value = cond.valueFunc();
          }
        } catch (e) {
          continue;
        }
        if (condition.ruleType === "isnull") {
          /**
           * 增加支持 ruleType === isnull
           */
          ret.push(condition);
        } else {
          if (condition.value != null && condition.value != "") {
            if (Array.isArray(condition.value)) {
              if (condition.value.length == 0) {
                continue;
              }
            }
            ret.push(condition);
          } else if (
            !this.field.info._finderAuto &&
            condition.value === null &&
            cond.value !== null
          ) {
            condition.value = "";
            ret.push(condition);
          }
        }
      }

      return ret;
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .el-cascader-node {
  max-width: 300px;
}
.cursor-pointer{
  font-size: 14px;
}
</style>
