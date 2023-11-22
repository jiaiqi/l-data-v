<template>
  <div @dblclick.stop="" class="flex items-center autocomplete-box">
    <el-autocomplete ref="inputRef" class="inline-input" v-model="modelValue" :value-key="redundant.refedCol"
      :fetch-suggestions="querySearch" placeholder="请输入内容" @select="handleSelect" @click.native="" v-if="!disabled">
    </el-autocomplete>
    <span v-else>{{ modelValue }}</span>
    <i class="el-icon-arrow-right cursor-pointer  p-l-2 text-#C0C4CC" :class="{ 'cursor-not-allowed': setDisabled }"
      @click="openDialog" v-if="!disabled"></i>

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
import { $http } from '../../../common/http.js'
import { cloneDeep } from 'lodash-es'
import { getFkOptions, onSelect } from "../../../service/api";

export default {
  data() {
    return {
      options: [],
      dialogVisible: false,
      tableColumns: [],
      tableData: [],
      pageNo: 1,
      rownumber: 10,
      total: 0,
      tableloading: false,
      filterText: "",
      modelValue: ""
    }
  },
  props: {
    value: {
      type: [Number, String, Array, Object],
      default: null
    },
    column: Object,
    row: {
      // 行数据
      type: Object,
      default: null
    },
    app: {
      type: String,
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
  },
  computed: {
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
      return this.column?.redundant
    },
    srvInfo() {
      return this.column?.redundant_options
    },
    // modelValue: {
    //   get() {
    //     return this.value
    //   },
    //   set(val) {
    //     // let data = this.options.find(item => item.value == val)
    //     // this.$emit('input', val, data)
    //   }
    // }
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== this.modelValue) {
          this.modelValue = newValue;
          if ((this.row?.__flag === 'add' || this.row?.__flag === 'update') && newValue) {
            this.$nextTick(() => {
              // this.$refs?.inputRef?.focus()
              this.loadOptions(newValue).then(res => {
                if (res?.length > 1) {
                  // 模糊匹配结果数量大于1
                  let matchedVal = res.find(item => item.value === this.value)
                  if (matchedVal) {
                    this.$emit('select', cloneDeep(matchedVal))
                  }
                  this.$refs?.inputRef?.focus()
                } else if (res?.length) {
                  // 模糊匹配结果数量为1
                  this.$emit('select', cloneDeep(res[0]))
                  if (this.$refs?.inputRef?.activated) {
                    this.$nextTick(() => {
                      this.$refs.inputRef.activated = false
                    })
                  }
                }
              })
            })
          }
        }

      },
    },
  },
  created() {
    if ((!this.value || this.options.length === 0) && this.row?.__flag === 'add' && this.row[`_${this.column?.redundant?.dependField}_init_val`]) {
      this.loadOptions(null, this.row[`_${this.column?.redundant?.dependField}_init_val`]);
    }
  },
  methods: {
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
      this.$emit('select', cloneDeep(row))
      // this.modelValue = row[this.srvInfo.refed_col];
      // this.$emit("input", this.modelValue);
      this.options = JSON.parse(JSON.stringify(this.tableData));
      this.dialogVisible = false;
      this.filterText = "";
      if (this.$refs?.inputRef?.activated) {
        this.$nextTick(() => {
          this.$refs.inputRef.activated = false
        })
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
      this.$emit('select', cloneDeep(item))
    },
    querySearch(queryString, callback) {
      // 关键词搜索
      this.loadOptions(queryString).then(res => {
        callback(res)
      })
    },
    async loadOptions(queryString, initValue) {
      // 查询选项
      const srvInfo = this.srvInfo
      const req = {
        serviceName: srvInfo?.serviceName,
        colNames: ['*'],
        condition: [],
        page: {
          pageNo: 1,
          rownumber: 50
        }
      };
      let appName = srvInfo?.srv_app || this.app || sessionStorage.getItem('current_app');
      if (!req.serviceName || !appName) {
        return
      }
      let loginUser = JSON.parse(sessionStorage.getItem('current_login_user') || '{}');
      if (srvInfo?.conditions?.length) {
        for (let i = 0; i < srvInfo.conditions.length; i++) {
          const obj = {
            colName: srvInfo?.conditions[i]?.colName,
            ruleType: srvInfo?.conditions[i]?.ruleType,
            value: srvInfo?.conditions[i]?.value
          }
          if (obj.value.indexOf('data.') !== -1) {
            let colName = obj.value.slice(obj.value.indexOf('data.') + 5);
            if (this.row[colName]) {
              obj.value = this.row[colName];
            }
          } else if (obj.value.indexOf('top.user.') !== -1) {
            let colName = obj.value.slice(obj.value.indexOf('top.user.') + 9);
            if (loginUser[colName]) {
              obj.value = loginUser[colName];
            }
          } else if (obj.value.indexOf("'") === 0 && obj.value.lastIndexOf(
            "'") === obj.value
              .length - 1) {
            // 常量，去掉单引号
            obj.value = obj.value.replace(/\'/gi, '');
          }
          req.condition.push(obj)
        }
      }
      if (queryString) {
        req.condition = [
          ...req.condition,
          {
            colName: this.srvInfo.key_disp_col,
            ruleType: 'like',
            value: queryString
          }
        ]
      }
      if (initValue) {
        req.condition = [
          ...req.condition,
          {
            colName: this.srvInfo.refed_col,
            ruleType: 'eq',
            value: initValue
          }
        ]
      }
      if (srvInfo?.relation_condition) {
        req.relation_condition = srvInfo?.relation_condition
      }

      const url = `/${appName}/select/${srvInfo?.serviceName}`
      const res = await $http.post(url, req)
      if (res.data.state === 'SUCCESS') {
        this.options = res.data.data
        if (initValue && this.options?.length) {
          this.$emit('select', cloneDeep(this.options[0]))
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
        return res.data.data
      } else {
        this.options = []
        return []
      }
    },
  },
};
</script>

<style lang="scss" >
.el-autocomplete-suggestion.el-popper {
  min-width: 200px !important;
}

.autocomplete-box {
  .el-input {
    .el-input__inner {
      padding-right: 0 !important;
    }
  }
}
</style>
