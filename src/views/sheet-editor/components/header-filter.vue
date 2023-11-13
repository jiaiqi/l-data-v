<template>
  <div class="header-filter" v-if="colType">
    <el-popover placement="bottom" trigger="click" v-model="filterVisible" @show="showPopover">
      <div class="filter-box">
        <!-- Enum、Set -->
        <div class="option-list" v-if="['枚举', '集合'].includes(colType)">
          <el-checkbox-group v-model="modelValue">
            <el-checkbox class="el-checkbox" v-for="item in optionList" :label="item.value" :key="item.value">{{
              item.label }}</el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="number-range" v-else-if="colType === '数字'">
          <div class="label">输入数值范围：</div>
          <div class="">
            <el-input placeholder="请输入最小值" v-model="min"></el-input>
            <div>至</div>
            <el-input placeholder="请输入最大值" v-model="max"></el-input>
          </div>
        </div>
        <div class="date-range" v-else-if="['时间'].includes(colType)">
          <div class="label">选择时间范围：</div>
          <el-time-select v-model="min" :picker-options="{
            start: '00:00',
            step: '00:15',
            end: '23:59',
            selectableRange: '00:00:00 - 23:59:59',
          }" placeholder="选择开始时间">
          </el-time-select>
          <div>至</div>
          <el-time-select v-model="max" :picker-options="{
            start: '00:00',
            step: '00:15',
            end: '23:59',
            // selectableRange: '18:30:00 - 20:30:00',
          }" placeholder="选择结束时间">
          </el-time-select>
        </div>

        <div class="date-range" v-else-if="['时间', '日期', '时间日期'].includes(colType)">
          <!-- <div class="label">选择日期范围：</div> -->
          <div class="flex flex-col">
            <div class="text-bold">快捷筛选：</div>
            <div class="m-b-2">
              日：<el-button size="mini" :type="modelValue === item ? 'primary' : ''" plain
                v-for="item in dateShortcuts.day" :key="item" @click="shortFilter(item)">{{
                  item }}</el-button>
            </div>
            <div class="m-b-2">
              周：<el-button size="mini" :type="modelValue === item ? 'primary' : ''" plain
                v-for="item in dateShortcuts.week" :key="item" @click="shortFilter(item)">{{
                  item }}</el-button>
            </div>
            <div class="m-b-2">
              月：<el-button size="mini" :type="modelValue === item ? 'primary' : ''" plain
                v-for="item in dateShortcuts.month" :key="item" @click="shortFilter(item)">{{
                  item }}</el-button>
            </div>
          </div>
          <div class="flex flex-col">
            <div class="text-bold">选择日期范围：</div>
            <div class="w-[100%] m-y-2">
              <el-button size="mini" v-for="item in datePickerShortcuts" :key="item.text" @click="item.onClick">{{
                item.text }}</el-button>
            </div>
            <div class="flex items-center">
              <el-date-picker v-model="min" valueFormat="yyyy-MM-dd HH:mm:ss" :pickerOptions="pickerOptions"
                :type="colType === '日期' ? 'date' : 'datetime'">
              </el-date-picker>
              <div class="m-x-2">至</div>
              <el-date-picker v-model="max" valueFormat="yyyy-MM-dd HH:mm:ss"
                :type="colType === '日期' ? 'date' : 'datetime'">
              </el-date-picker>
            </div>
          </div>
        </div>
        <div class="input-box" v-else-if="['富文本', '字符串'].includes(colType)">
          <div class="label">内容过滤：</div>
          <el-input v-model="modelValue" clearable></el-input>
          <el-checkbox-group style="width: 100%; overflow-x: auto" v-model="strList" v-if="colType === '字符串'">
            <el-checkbox class="el-checkbox" v-for="item in optionList" :label="item" :key="item">{{
              item
            }}</el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="input-box" v-else-if="colType === '外键'">
          <div class="label">内容过滤：</div>
          <el-input v-model="filterText" clearable @change="getFkOptions"></el-input>
          <el-checkbox-group v-model="modelValue">
            <el-checkbox class="el-checkbox" v-for="item in optionList" :label="item" :key="item">{{
              item
            }}</el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="handler-bar flex justify-end m-t-2">
          <el-button class="text-gray" size="mini" @click="filterVisible = false">取消</el-button>
          <el-button size="mini" @click="resetFilter">重置</el-button>
          <el-button size="mini" @click="toFilter" type="primary">筛选</el-button>
        </div>
      </div>

      <svg slot="reference" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16">
        <path :fill="onFilter ? '#409eff' : 'currentColor'"
          d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
      </svg>
    </el-popover>
  </div>
</template>

<script>
import { getFkOptions } from "../../../service/api";
import dayjs from "dayjs";
export default {
  props: {
    column: Object,
    condition: Array,
    app: String,
    list: Array,
    service: String,
  },
  computed: {
    colType() {
      let res = null;
      switch (this.column?.col_type) {
        case "Enum":
          res = "枚举";
          break;
        case "Set":
          res = "集合";
          break;
        case "Float":
        case "Int":
        case "int":
        case "Integer":
        case "Money":
        case "Float":
          res = "数字";
          break;
        case "DateTime":
          res = "时间日期";
          break;
        case "Date":
          res = "日期";
          break;
        case "Time":
          res = "时间";
          break;
        case "Note":
          res = "富文本";
          break;
        default:
          res = "字符串";
          break;
      }
      if (this.column?.col_type?.includes("decimal")) {
        res = "数字";
      }
      if (this.column?.bx_col_type == "fk") {
        res = "外键";
      }
      return res;
    },
    optionList() {
      let res = null;
      if (this.colType === "枚举") {
        res = this.column?.option_list_v2;
      } else if (this.filterOptions?.length) {
        res = [...new Set(this.filterOptions)];
        if (this.filterText) {
          res = res.filter((item) => item.includes(this.filterText));
        }
      } else if (this.colType === "外键") {
        res = this.fkOptions || [];
      } else if (this.colType === "字符串") {
        if (this.list?.length) {
          res = this.list
            .map((item) => item[this.column.columns])
            .filter((item) => !!item);
          res = [...new Set(res)];
        }
      }
      return res;
    },
  },
  data() {
    return {
      filterOptions: null,
      filterVisible: false,
      modelValue: null,
      filterText: "",
      strList: [],
      onFilter: false, // 已选择筛选项
      min: null,
      max: null,
      fkPage: {
        total: 0,
        rownumber: 20,
        pageNo: 1,
      },
      fkOptions: [],
      dateShortcuts: {
        day: ['今天', '昨天', '明天', '过去3天', '未来3天'],
        week: ['本周', '上周', '下周', '过去1周', '未来1周'],
        month: ['本月', '上月', '下月', '过去1月', '未来1月']
      },
      datePickerShortcuts: [
        {
          text: "今天",
          onClick: () => {
            const date = new Date();
            this.min = date;
            this.max = date;
          },
        },
        {
          text: "昨天",
          onClick: () => {
            const date = new Date(dayjs().subtract(1, "day"));
            this.min = date;
            this.max = date;
          },
        },
        {
          text: "明天",
          onClick: () => {
            const date = new Date(dayjs().add(1, "day"));
            this.min = date;
            this.max = date;
          },
        },
        {
          text: "本周",
          onClick: () => {
            const end = new Date(dayjs().endOf("week").add(1, "day"));
            const start = new Date(dayjs().startOf("week").add(1, "day"));
            this.min = start;
            this.max = end;
          },
        },
        {
          text: "上周",
          onClick: () => {
            const start = new Date(
              dayjs().startOf("week").subtract(1, "week").add(1, "day")
            );
            const end = new Date(dayjs(start).add(6, "day"));
            this.min = start;
            this.max = end;
          },
        },
        {
          text: "下周",
          onClick: () => {
            const start = new Date(
              dayjs().startOf("week").add(1, "week").add(1, "day")
            );
            const end = new Date(dayjs(start).add(6, "day"));
            this.min = start;
            this.max = end;
          },
        },
      ],
      pickerOptions: {
        shortcuts: [
          {
            text: "今天",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              // start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              this.min = start;
              this.max = end;
              // picker.$emit('pick', [start, end]);
            },
          },
          {
            text: "昨天",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 1);
              this.min = start;
              this.max = start;
              // picker.$emit('pick', [start, end]);
            },
          },
          {
            text: "明天",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() + 3600 * 1000 * 24 * 1);
              this.min = start;
              this.max = start;
              // picker.$emit('pick', [start, end]);
            },
          },

          {
            text: "最近一周",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              this.min = start;
              this.max = end;
              // picker.$emit('pick', [start, end]);
            },
          },
          {
            text: "最近一个月",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              this.min = start;
              this.max = end;
              // picker.$emit('pick', [start, end]);
            },
          },
          {
            text: "最近三个月",
            onClick: (picker) => {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              this.min = start;
              this.max = end;
              // picker.$emit('pick', [start, end]);
            },
          },
        ],
      },
    };
  },
  methods: {

    showPopover() {
      if (["外键", "字符串"].includes(this.colType)) {
        this.getFilterOptions();
      }
    },
    getFilterOptions() {
      // 查找筛选项列表
      const url = `/${this.app}/select/${this.service}`;
      const req = {
        serviceName: this.service,
        colNames: ["*"],
        condition: [],
        use_type: "list",
        group: [
          {
            colName: this.column.columns,
            type: "by",
          },
        ],
      };
      if (Array.isArray(this.condition) && this.condition.length) {
        req.condition = this.condition.filter(
          (item) => item.colName !== this.column.columns
        );
      }
      this.$http.post(url, req).then((res) => {
        if (res?.data?.data?.length) {
          this.filterOptions = res.data.data.map(
            (item) => item[this.column.columns] || "null"
          );
        }
      });
    },
    getFkOptions(val) {
      console.log(val);
      const srvInfo = JSON.parse(JSON.stringify(this.column.option_list_v2));
      if (val) {
        srvInfo.relation_condition = {
          relation: "OR",
          data: [
            {
              colName: srvInfo.key_disp_col,
              ruleType: "like",
              value: val,
            },
            {
              colName: srvInfo.refed_col,
              ruleType: "like",
              value: val,
            },
          ],
        };
      }
      const req = {
        serviceName: srvInfo.serviceName,
        colNames: ["*"],
        condition: [],
        page: { pageNo: 1, rownumber: 20 },
      };
      getFkOptions(
        { ...this.column, option_list_v2: srvInfo },
        null,
        this.app,
        this.fkPage.pageNo,
        this.fkPage.rownumber
      ).then((res) => {
        if (res?.data?.length) {
          this.fkOptions = res.data.map((item) => {
            item.label = item[srvInfo.key_disp_col];
            item.value = item[srvInfo.refed_col];
            return item;
          });
          this.fkPage.total = res?.page?.total;
        } else {
          this.fkOptions = [];
        }
      });
    },
    initModelValue() {
      if (this.condition?.length) {
        for (let i = 0; i < this.condition.length; i++) {
          let item = this.condition[i];
          if (item.colName === this.column.columns && item.ruleType === 'eq' && item.value) {
            this.$nextTick(() => {
              this.modelValue = item.value
              this.onFilter = true
            });
          }
        }
      }
      //枚举类型 多选 绑定值默认为空数组
      if (["枚举", "集合", "外键"].includes(this.colType)) {
        this.modelValue = [];
      } else {
        this.modelValue = null;
      }
    },
    resetFilter() {
      this.$emit("filter-change", {
        colName: this.column.columns,
        remove: true, //移除当前筛选条件
      });
      this.$nextTick(() => {
        this.filterVisible = false;
        this.onFilter = false;
        this.min = null;
        this.max = null;
        this.strList = [];
        this.initModelValue();
      })
    },
    shortFilter(key) {
      // 快捷筛选
      if (this.modelValue === key) {
        // 取消此筛选条件
        this.resetFilter();
        return
      }
      this.modelValue = key
      this.onFilter = !!key;
      this.filterVisible = false;
      this.min = null
      this.max = null
      let val = {
        colName: this.column.columns,
        remove: true, //移除当前筛选条件
      };
      if (this.onFilter) {
        val.condition = [
          {
            colName: this.column.columns,
            ruleType: "eq",
            value: key,
          },
        ]
        val.remove = false
      }

      this.$emit("filter-change", val);
    },
    toFilter() {
      this.filterVisible = false;
      let val = {
        colName: this.column.columns,
        remove: false, //移除当前筛选条件
      };
      switch (this.colType) {
        case "集合":
          val.condition = [
            {
              colName: this.column.columns,
              ruleType: "inset",
              value: this.modelValue.toString(),
            },
          ];
          val.remove = !this.modelValue?.length;
          this.onFilter = !!this.modelValue?.length;
          break;
        case "枚举":
          val.condition = [
            {
              colName: this.column.columns,
              ruleType: "in",
              value: this.modelValue.toString(),
            },
          ];
          val.remove = !this.modelValue?.length;
          this.onFilter = !!this.modelValue?.length;
          break;
        case "日期":
        case "数字":
          val.condition = [];
          let min = this.min;
          let max = this.max;
          if (this.colType === "日期") {
            min = dayjs(this.min).format("YYYY-MM-DD");
            max = dayjs(this.max).format("YYYY-MM-DD");
          }
          if (min) {
            val.condition.push({
              colName: this.column.columns,
              ruleType: "ge",
              value: min,
            });
          }
          if (max) {
            val.condition.push({
              colName: this.column.columns,
              ruleType: "le",
              value: max,
            });
          }
          val.remove = !this.min && !this.max;
          if (val.remove) {
            delete val.condition;
          }
          this.onFilter = (this.min || this.max) && true;
          break;
        case "字符串":
          if (this.strList?.length) {
            val.condition = [
              {
                colName: this.column.columns,
                ruleType: "in",
                value: this.strList.toString(),
              },
            ];
            this.modelValue = "";
            this.onFilter = true;
          } else if (this.modelValue) {
            val.condition = [
              {
                colName: this.column.columns,
                ruleType: "like",
                value: this.modelValue,
              },
            ];
            this.onFilter = true;
          } else {
            this.onFilter = false;
          }
          break;
        case "外键":
          if (this.modelValue?.length) {
            val.condition = [
              {
                colName: this.column.columns,
                ruleType: "in",
                value: this.modelValue.toString(),
              },
            ];
            this.onFilter = true;
          } else {
            this.onFilter = false;
          }
          break;
      }
      this.$emit("filter-change", val);
    },
  },
  created() {
    this.initModelValue();
    // setTimeout(() => {
    //   if (this.colType === "外键") {
    //     this.getFkOptions();
    //   }
    // }, 1000);
  },
};
</script>

<style lang="scss" scoped>
.filter-box {
  min-width: 500px;
  max-width: 1000px;

  .option-list {
    width: 200px;
  }

  .el-checkbox-group {
    max-height: 50vh;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .input-box {
    // max-width: 300px;
  }
}

.number-range {}

.el-checkbox {
  padding: 5px 10px;
  min-width: 90px;

  ::v-deep .el-checkbox__label:hover {
    color: #409eff;
  }
}
</style>
