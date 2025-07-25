<template>
  <div class="flex items-center autocomplete-box">
    <div
      v-if="
        column &&
        linkToDetail &&
        column.redundant_options &&
        (column.redundant_options.autocompleteInput === true ||
          column.subtype === 'autocomplete')
      "
      class="flex-1 text-left"
      :class="{ 'cursor-pointer text-blue': linkToDetail }"
      @click="toDetail"
    >
      {{ modelValue }}
    </div>
    <div
      v-else-if="isTree && !setDisabled"
      style="width: 100%"
    >
      <el-popover
        placement="bottom-center"
        ref="treePopover"
        trigger="click"
        @show="onPopoverShow"
        :popper-options="popperOptions"
      >
        <div
          slot="reference"
          v-if="modelValue && !setDisabled"
          class="cursor-pointer"
        >
          <span>
            {{ modelLabel || modelValue || "" }}
          </span>
          <!-- <el-input  v-model="modelValue"></el-input> -->
        </div>
        <div
          slot="reference"
          class="text-gray cursor-pointer"
          v-else-if="!setDisabled"
        >
          请选择
        </div>
        <el-input
          placeholder="输入关键字进行过滤"
          clearable
          v-model="modelValue"
          @focus="onFocus"
          @input="onFilterInput"
          @clear="onFilterClear"
          style="max-width: 300px; margin-bottom: 5px; height: 30px"
        >
        </el-input>
        <el-cascader-panel
          :props="props"
          :is-border="false"
          :options="options"
          @change="onSelectChange"
          :emitPath="false"
          checkStrictly
          style="max-width: 1200px;overflow-x: auto;"
        >
          <template
            slot-scope="{ node, data }"
            v-if="props.checkStrictly !== false"
          >
            <span
              :title="node.label"
              @click.stop="clickNode(node, data)"
            >{{ node.label }}</span>
          </template>
        </el-cascader-panel>
      </el-popover>
    </div>
    <div
      v-else-if="!setDisabled"
      class="flex items-center justify-between w-full"
    >
      <!-- <span class="text-[14px]" @click="showFinder">{{ modelValue }}</span> -->
      <el-autocomplete
        append-to-body
        clearable
        ref="inputRef"
        @focus="onFocus"
        class="inline-input"
        v-model="modelValue"
        :value-key="redundant.refedCol"
        :fetch-suggestions="querySearch"
        @clear="onFilterClear"
        placeholder="请输入"
        @select="handleSelect"
        style="padding: 0; overflow: hidden;"
      >
      </el-autocomplete>
      <i
        class="el-icon-arrow-right cursor-pointer text-#C0C4CC"
        :class="{ 'cursor-not-allowed': setDisabled }"
        @click="openDialog"
        v-if="!setDisabled"
      ></i>
    </div>

    <span v-else>{{ modelValue }}</span>

    <el-dialog
      title="选择"
      :visible.sync="dialogVisible"
      width="80%"
      append-to-body
      v-loading="tableloading"
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
import { $http } from "../../../common/http.js";
import { cloneDeep } from "lodash-es";
import { getFkOptions, onSelect } from "../../../service/api";
import { renderStr } from "../../../common/common";
export default {
  data() {
    return {
      allOptions: [],
      options: [],
      dialogVisible: false,
      tableColumns: [],
      tableData: [],
      pageNo: 1,
      rownumber: 10,
      total: 0,
      tableloading: false,
      filterText: "",
      modelValue: "",
      popperOptions: null,
      props: {
        emitPath: false,
        checkStrictly: true,
        value: "value",
        label: "label",
        lazy: true,
        leaf: "leaf",
        lazyLoad: (node, resolve) => {
          this.loadTree(node).then((res) => {
            resolve(res);
          });
        },
      },
    };
  },
  props: {
    value: {
      type: [Number, String, Array, Object],
      default: null,
    },
    column: Object,
    row: {
      // 行数据
      type: Object,
      default: null,
    },
    app: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: "请选择",
    },
    defaultConditionsMap: Object,
    detailButton: Object,
  },
  computed: {
    linkToDetail() {
      return (
        this?.column?.linkToDetail === true && this.detailButton?.permission
      );
    },
    srvApp() {
      return this.srvInfo?.srv_app || this.app;
    },
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
    redundant() {
      return this.column?.redundant;
    },
    srvInfo() {
      return this.column?.redundant_options;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== this.modelValue) {
          this.modelValue = newValue;
          if (
            (this.row?.__flag === "add" || this.row?.__flag === "update") &&
            newValue
          ) {
            this.$nextTick(() => {
              // this.$refs?.inputRef?.focus()
              this.loadOptions(newValue).then((res) => {
                if (res?.length > 1) {
                  // 模糊匹配结果数量大于1
                  let matchedVal = res.find(
                    (item) => item.value === this.value
                  );
                  if (matchedVal) {
                    this.$emit("select", cloneDeep(matchedVal));
                  }
                  this.$refs?.inputRef?.focus();
                } else if (res?.length) {
                  // 模糊匹配结果数量为1
                  this.$emit("select", cloneDeep(res[0]));
                  if (this.$refs?.inputRef?.activated) {
                    this.$nextTick(() => {
                      this.$refs.inputRef.activated = false;
                    });
                  }
                }
              });
            });
          }
          if (
            !newValue &&
            newValue !== oldValue &&
            newValue !== undefined &&
            oldValue !== undefined
          ) {
            this.$emit("select", null);
          }
        }
      },
    },
  },
  created() {
    if (
      !this.defaultConditionsMap?.[this.column.columns] &&
      (!this.value || this.options.length === 0) &&
      this.row?.__flag === "add" &&
      this.row[`_${this.column?.redundant?.dependField}_init_val`]
    ) {
      this.loadOptions(
        null,
        this.row[`_${this.column?.redundant?.dependField}_init_val`]
      );
    }
  },
  mounted() {
    this.popperOptions = {
      boundariesElement: document.querySelector("body"),
      gpuAcceleration: true,
      positionFixed: true,
      preventOverflow: true,
    };
  },
  methods: {
    showFinder() {
      this.$refs.inputRef?.focus();
    },
    clickNode(node, data) {
      if (this.props.checkStrictly === false) {
        if (data.is_leaf !== "是") {
          // 非叶子节点 只能选择叶子节点
          return;
        }
      }
      console.log(node, data, "clickNode");
      let val = node.value;
      let currentValue = this.allOptions.find(
        (item) => item[this.srvInfo.refed_col] === val
      );
      if (currentValue) {
        this.$emit("select", currentValue);
        this.modelValue = currentValue.label;
      }
      this.$emit("input", this.modelValue);
      // this.field.model = data;
      // if (this.dispLoaderV2?.lazyLoad === false) {
      //   this.selected = [data[this.props.value]];
      // } else {
      // this.selected = node.path;
      // }
      // this.$emit("field-value-changed", this.field.info.name, this.field);
      this.$nextTick(() => {
        this.$refs.treePopover?.doClose?.();
      });
    },
    toDetail() {
      if (this.linkToDetail) {
        let address = `/vpages/#/detail/${this.srvInfo.serviceName}/${this.row.id}?srvApp=${this.app}`;
        let tab_title = this.detailButton.service_view_name;
        let disp_col = this.detailButton._disp_col;
        let disp_value = this.row[disp_col]; //详情页面上的标签
        tab_title = tab_title.replace("查询", "");
        if (disp_value != null && disp_value != undefined && disp_value != "") {
          tab_title = disp_value + "(" + tab_title + "详情)";
        } else {
          tab_title = tab_title + "详情";
        }
        let page = {
          title: tab_title,
          url: address,
          icon: "",
          app: this.app,
        };
        if (window.top.tab) {
          window.top.tab.addTab(page);
        } else {
          // 没有tab实例，在浏览器中打开新标签页
          const page = window.open(address);
          setTimeout(() => {
            page.document.title = tab_title;
          }, 500);
        }
      }
    },
    onFocus() {
      console.log("onfocus");
      this.$emit("onfocus");
    },
    onFilterClear() {
      this.modelValue = "";
      this.$emit("input", "");
      this.$emit("select", null);
      this.remoteMethod();
    },
    onFilterInput(value) {
      // this.$emit('input',value)
      this.modelValue = value;
      this.remoteMethod(value);
    },
    onPopoverShow() {
      // this.onFocus()
      this.modelValue = this.value;
      this.remoteMethod(this.modelValue);
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
            item.leaf = item.is_leaf === "是";
            return item;
          });
          this.allOptions.push(...result);
          return result;
        } else return [];
      }
    },
    remoteMethod(query) {
      let queryString = this.modelValue;
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
              item.leaf = item.is_leaf === "是";
              return item;
            });
            this.allOptions.push(...this.options);
            // if (this.modelValue) {
            //   let currentValue = this.options.find(item => item[option.refed_col] === this.modelValue);
            //   if (currentValue) {
            //     this.$emit('select', currentValue)
            //   }
            // }
            resolve(this.options);
          } else {
            this.options = [];
          }
          this.loading = false;
        });
      });
    },
    onSelectChange(val) {
      if (Array.isArray(val) && val?.length) {
        val = val[0];
      }
      this.$refs?.treePopover?.doClose();
      let currentValue = this.allOptions.find(
        (item) => item[this.srvInfo.refed_col] === val
      );
      if (currentValue) {
        this.$emit("select", currentValue);
        this.modelValue = currentValue.label;
      }
      this.$emit("input", this.modelValue);
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
            return item;
          });
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
    onDBClick(row, column, cell, event) {
      this.$emit("select", cloneDeep(row));
      // this.modelValue = row[this.srvInfo.refed_col];
      // this.$emit("input", this.modelValue);
      this.options = JSON.parse(JSON.stringify(this.tableData));
      this.dialogVisible = false;
      this.filterText = "";
      if (this.$refs?.inputRef?.activated) {
        this.$nextTick(() => {
          this.$refs.inputRef.activated = false;
        });
      }
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
      getFkOptions(
        { ...this.column, option_list_v2: srvInfo },
        this.row,
        this.app,
        this.pageNo,
        this.rownumber
      ).then((res) => {
        if (res?.data?.length) {
          this.tableData = res.data.map((item) => {
            // item.label = item[this.srvInfo.key_disp_col];
            // item.value = item[this.srvInfo.refed_col];
            return item;
          });
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
      this.filterText = "";
      this.dialogVisible = true;
      this.pageNo = 1;
      this.rownumber = 5;
      this.getTableData();

      if (!this.tableColumns?.length) {
        this.getFkColumns();
      }
    },
    handleSelect(item) {
      this.$emit("select", cloneDeep(item));
    },
    querySearch(queryString, callback) {
      // 关键词搜索
      this.loadOptions(queryString).then((res) => {
        callback(res);
      });
    },
    async loadOptions(queryString, initValue) {
      // 查询选项
      const srvInfo = this.srvInfo;
      const req = {
        serviceName: srvInfo?.serviceName,
        colNames: ["*"],
        condition: [],
        page: {
          pageNo: 1,
          rownumber: 50,
        },
      };
      let appName =
        srvInfo?.srv_app || this.app || sessionStorage.getItem("current_app");
      if (!req.serviceName || !appName) {
        return;
      }
      appName = renderStr(appName, { data: this.row });

      let loginUser = JSON.parse(
        sessionStorage.getItem("current_login_user") || "{}"
      );
      if (srvInfo?.conditions?.length) {
        for (let i = 0; i < srvInfo.conditions.length; i++) {
          const obj = {
            colName: srvInfo?.conditions[i]?.colName,
            ruleType: srvInfo?.conditions[i]?.ruleType,
            value: srvInfo?.conditions[i]?.value,
          };
          if (obj.value.indexOf("data.") !== -1) {
            let colName = obj.value.slice(obj.value.indexOf("data.") + 5);
            if (this.row[colName]) {
              obj.value = this.row[colName];
            }
          } else if (obj.value.indexOf("top.user.") !== -1) {
            let colName = obj.value.slice(obj.value.indexOf("top.user.") + 9);
            if (loginUser[colName]) {
              obj.value = loginUser[colName];
            }
          } else if (
            obj.value.indexOf("'") === 0 &&
            obj.value.lastIndexOf("'") === obj.value.length - 1
          ) {
            // 常量，去掉单引号
            obj.value = obj.value.replace(/\'/gi, "");
          }
          req.condition.push(obj);
        }
      }
      if (queryString) {
        req.condition = [
          ...req.condition,
          // {
          //   colName: this.srvInfo.key_disp_col,
          //   ruleType: "like",
          //   value: queryString,
          // },
        ];
        req.relation_condition = {
          relation: "OR",
          data: [{
            colName: this.srvInfo.key_disp_col,
            ruleType: "like",
            value: queryString,
          },
          {
            colName: this.srvInfo.refed_col,
            ruleType: "like",
            value: queryString,
          },]
        }
      }

      if (initValue) {
        req.condition = [
          ...req.condition,
          {
            colName: this.srvInfo.refed_col,
            ruleType: "eq",
            value: initValue,
          },
        ];

      }
      if (srvInfo?.relation_condition) {
        req.relation_condition = srvInfo?.relation_condition;
      }
      const url = `/${appName}/select/${srvInfo?.serviceName}`;
      const res = await $http.post(url, req);
      if (res.data.state === "SUCCESS") {
        this.options = res.data.data.map(item => {
          item.label = item[this.srvInfo.key_disp_col];
          item.value = item[this.srvInfo.refed_col];
          return item;
        });
        if (initValue && this.options?.length) {
          this.$emit("select", cloneDeep(this.options[0]));
        } else if (queryString && this.options?.length) {
          // let matchedVal = this.options.filter(item => item[this.srvInfo.refed_col] === queryString)
          // if (matchedVal?.length) {
          //   this.$emit('select', cloneDeep(matchedVal[0]))
          //   if (matchedVal?.length === 1) {
          //     // 有唯一精确匹配结果
          //     if (this.$refs?.inputRef) {
          //       this.$nextTick(() => {
          //         this.$refs.inputRef.activated = false
          //       })
          //     }
          //   }
          // } else {
          //   let fuzzyMatchedVal = this.options.filter(item => item[this.srvInfo.refed_col]?.includes(queryString))
          //   if (fuzzyMatchedVal?.length) {
          //     if (fuzzyMatchedVal?.length === 1) {
          //       // 有唯一模糊匹配结果
          //       this.$emit('select', cloneDeep(fuzzyMatchedVal[0]))
          //       if (this.$refs?.inputRef) {
          //         this.$nextTick(() => {
          //           this.$refs.inputRef.activated = false
          //         })
          //       }
          //     }
          //   }
          // }
        }
        return res.data.data;
      } else {
        this.options = [];
        return [];
      }
    },
  },
};
</script>

<style lang="scss">
.cursor-pointer {
  font-size: 14px;
}

.el-popover {
  // position: fixed;
}

.el-autocomplete-suggestion.el-popper {
  min-width: 200px !important;
}

.text-gray {
  font-size: 12px;
}

.table-body-cell__add {
  .autocomplete-box {}

  .text-gray {
    color: #fff;
  }
}

.autocomplete-box {
  .el-cascader-node .el-icon-arrow-right {
    color: #ccc;
  }

  .el-input {
    .el-input__inner {
      padding-right: 0 !important;
    }

    .el-input__inner::placeholder {
      font-size: 12px;
    }
  }
}
</style>