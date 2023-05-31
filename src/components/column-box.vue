<template>
  <div class="dndList-list1">
    <div class="title">
      <span>{{ singList.name }}</span>
    </div>
    <div class="content">
      <el-checkbox-group
        v-model="checkList"
        @change="$emit('update:checkedColumns', $event)"
      >
        <draggable
          :list="singList.list"
          :options="deploy"
          class="dragArea"
          @start="start(singList)"
          @end="onMove($event, singList)"
          @add="add($event, singList)"
        >
          <div
            class="content_list"
            v-for="(item, index) in singList.list"
            :key="index"
          >
            <div
              v-if="singList.type === 'all'"
              class="value"
              :class="{ columns: singList.type === 'all' }"
            >
              <el-checkbox
                :label="item.columns"
                :name="item.columns"
                :value="item.columns"
              >
                {{ item.label }}</el-checkbox
              >
              <!-- {{ item.label }} -->
            </div>
            <div
              v-else
              class="value"
              :class="{ order_value: singList.type === 'order' }"
            >
              {{ item.label }}
            </div>
            <el-select
              v-model="item._condition.ruleType"
              filterable
              placeholder="请选择"
              v-if="singList.type == 'condition' && singList.list"
              class="el-select"
              @visible-change="selectConditionOperator(item, 'click')"
            >
              <el-option
                v-for="item in selectList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span style="float: left; font-size: 13px">{{
                  item.label + "-" + item.value
                }}</span>
              </el-option>
            </el-select>
            <el-select
              v-model="item._group.type"
              filterable
              placeholder="请选择"
              v-if="singList.type == 'group'"
              class="el-select"
              @visible-change="selectGroupOperator(item, 'click')"
            >
              <el-option
                v-for="item in selectList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
            <el-select
              v-model="item._order.orderType"
              filterable
              placeholder="请选择"
              v-if="singList.type == 'order'"
              class="el-select"
            >
              <el-option
                v-for="item in selectList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span style="float: left; font-size: 13px">{{
                  item.label + "-" + item.value
                }}</span>
              </el-option>
            </el-select>
            <el-select
              v-model="item._aggregation.type"
              filterable
              placeholder="请选择"
              v-if="singList.type == 'aggregation'"
              class="el-select"
            >
              <el-option
                v-for="(item, index) in selectList"
                :key="index"
                :label="item.label"
                :value="item.value"
                @visible-change="seleteAggregationOperator(item, 'click')"
              >
                <span style="float: left; font-size: 13px">{{
                  item.label + "-" + item.value
                }}</span>
              </el-option>
            </el-select>
            <el-input
              v-model="item._condition.value"
              v-if="
                singList.type != 'all' &&
                singList.type === 'condition' &&
                item.col_type !== 'DateTime' &&
                item.col_type !== 'Date'
              "
              placeholder="请输入内容"
              class="input-value"
            ></el-input>
            <el-input
              v-model="item.aliasName"
              v-if="
                singList.type === 'aggregation' || singList.type === 'group'
              "
              placeholder="请输入别名"
              class="input-value"
            ></el-input>
            <el-date-picker
              v-model="item._condition.value"
              v-if="
                (item.col_type == 'DateTime' || item.col_type == 'Date') &&
                singList.type === 'condition'
              "
              type="daterange"
              align="right"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :picker-options="pickerOptions"
            ></el-date-picker>
            <el-button
              type="danger"
              icon="el-icon-delete"
              @click.prevent.stop="deleteItem(item, singList, index)"
              v-if="singList.type != 'all'"
            ></el-button>
          </div>
        </draggable>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script>
import draggable from "vuedraggable";

export default {
  name: "listhaul",
  components: {
    draggable,
  },
  props: {
    singList: {
      type: Object,
      default: function () {
        return {};
      },
    },
    props: {
      operator: {
        type: Array,
        default: () => {},
      },
    },
    allowCheck: {
      type: Boolean,
      default: false,
    },
    checkedColumns: {
      type: Array,
    },
  },
  mounted() {
    if (Array.isArray(this.checkedColumns) && this.checkedColumns.length > 0) {
      this.checkList = JSON.parse(JSON.stringify(this.checkedColumns));
    }
  },
  data() {
    return {
      checkList: [],
      deploy: {},
      selectList: [],
      modelType: "",
      singListBak: {},
      falgs: "article",
      endData: {
        condition: [],
        group: [],
        order: [],
        aggregation: [],
      },
      orderList: [
        {
          label: "升序",
          value: "asc",
        },
        {
          label: "降序",
          value: "desc",
        },
        {
          label: "默认",
          value: "",
        },
      ],
      pickerOptions: {
        shortcuts: [
          {
            text: "今天",
            onClick(picker) {
              picker.$emit("pick", new Date());
            },
          },
          {
            text: "昨天",
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit("pick", date);
            },
          },
          {
            text: "一周前",
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", date);
            },
          },
        ],
      },
    };
  },
  methods: {
    deleteAllData() {
      // 清除组装的数据
    },
    start(list) {
      if (list.type === "group" || list.type === "aggregation") {
        this.deploy.group.name = "order";
      } else if (list.type === "condition") {
        this.deploy.group = "a";
      }
    },
    setEndData(list) {
      let endData = null;
      if (list.type === "condition") {
        this.condition = [];
        list.list.forEach((item) => {
          this.condition.push(item._condition);
        });
        this.endData.condition = this.condition;
      } else if (list.type === "group") {
        this.group = [];
        list.list.forEach((item) => {
          this.group.push(item._group);
        });
        this.endData.group = this.group;
      } else if (list.type === "aggregation") {
        this.aggregation = [];
        list.list.forEach((item) => {
          this.aggregation.push(item._aggregation);
        });
        this.endData.aggregation = this.aggregation;
      } else if (list.type === "order") {
        this.order = [];
        list.list.forEach((item) => {
          this.order.push(item._order);
        });
        this.endData.order = this.order;
      }
    },
    add(ev, list) {
      let num = 0;
      for (let i = 0; i < list.list.length; i++) {
        if (list.list[i].id === list.list[ev.newIndex].id) {
          num++;
          if (num !== 1) {
            list.list.splice(ev.newIndex, 1);
            break;
          }
        }
      }
      this.setEndData(list);

      this.$emit("save", list, this.endData);
    },
    deleteItem(sign, list, i) {
      this.setEndData(list);
      sign.aliasName = "";
      sign._condition.value = "";
      sign._condition.ruleType = "";
      sign._aggregation.type = "";
      sign._group.type = "";
      sign._order.orderType = "";

      for (let i = 0; i < list.list.length; i++) {
        if (list.list[i].id === sign.id) {
          list.list.splice(i, 1);
        }
      }

      if (list.type === "condition") {
        this.endData.condition.splice(i, 1);
      } else if (list.type === "group") {
        this.endData.group.splice(i, 1);
      } else if (list.type === "order") {
        this.endData.order.splice(i, 1);
      } else if (list.type === "aggregation") {
        this.endData.aggregation.splice(i, 1);
      }
      this.$emit("save", list, this.endData);
    },
    onMove(e, list) {
      if (list.type === "group" || list.type === "aggregation") {
        this.deploy.group.name = "article";
      } else if (list.type === "condition") {
        this.deploy.group = "article";
      }
    },
    selectConditionOperator(sign, isClick) {
      // 切换condition的操作符
      if (isClick) {
        let dataType = sign.col_type; // 暂定有时间、数字、其它三种
        if (dataType == "Date" || dataType == "DateTime") {
          dataType = "date";
        } else if (dataType == "String" || dataType == "string") {
          dataType = "string";
        } else if (
          dataType == "Number" ||
          dataType == "number" ||
          dataType == "int"
        ) {
          dataType = "number";
        }
        let operator = [];
        switch (dataType) {
          case "date": // 时间类型
            operator = [
              {
                label: "等于",
                value: "eq",
              },
              {
                label: "不等于",
                value: "ne",
              },
              {
                label: "近似于",
                value: "like",
              },
              {
                label: "包含",
                value: "in",
              },
              {
                label: "起止时间",
                value: "between",
              },
            ];
            break;
          case "number": // 数字类型
            operator = [
              {
                label: "等于",
                value: "eq",
              },
              {
                label: "小于等于",
                value: "le",
              },
              {
                label: "大于等于",
                value: "ge",
              },
              {
                label: "大于",
                value: "gt",
              },
              {
                label: "小于",
                value: "lt",
              },
              {
                label: "不等于",
                value: "ne",
              },
              {
                label: "包含",
                value: "in",
              },
            ];
            break;
          default:
            operator = [
              {
                label: "等于",
                value: "eq",
              },
              {
                label: "不等于",
                value: "ne",
              },
              {
                label: "近似于",
                value: "like",
              },
              {
                label: "包含",
                value: "in",
              },
            ];
            break;
        }
        this.selectList = operator;
      } else {
        sign.forEach((item) => {
          let dataType = item.col_type; // 暂定有时间、数字、其它三种
          if (dataType == "Date" || dataType == "DateTime") {
            dataType = "date";
          } else if (dataType == "String" || dataType == "string") {
            dataType = "string";
          } else if (
            dataType == "Number" ||
            dataType == "number" ||
            dataType == "int"
          ) {
            dataType = "number";
          }
          let operator = [];
          switch (dataType) {
            case "date": // 时间类型
              operator = [
                {
                  label: "等于",
                  value: "eq",
                },
                {
                  label: "不等于",
                  value: "ne",
                },
                {
                  label: "近似于",
                  value: "like",
                },
                {
                  label: "包含",
                  value: "in",
                },
                {
                  label: "起止时间",
                  value: "between",
                },
              ];
              break;
            case "number": // 数字类型
              operator = [
                {
                  label: "等于",
                  value: "eq",
                },
                {
                  label: "小于等于",
                  value: "le",
                },
                {
                  label: "大于等于",
                  value: "ge",
                },
                {
                  label: "大于",
                  value: "gt",
                },
                {
                  label: "小于",
                  value: "lt",
                },
                {
                  label: "不等于",
                  value: "ne",
                },
                {
                  label: "包含",
                  value: "in",
                },
              ];
              break;
            default:
              operator = [
                {
                  label: "等于",
                  value: "eq",
                },
                {
                  label: "不等于",
                  value: "ne",
                },
                {
                  label: "近似于",
                  value: "like",
                },
                {
                  label: "包含",
                  value: "in",
                },
              ];
              break;
          }

          this.selectList = operator;
        });
      }
    },
    selectGroupOperator(sign, isClick) {
      let self = this;
      if (isClick) {
        let dataType = sign.col_type; // 暂定有时间、数字、其它三种
        if (dataType == "Date" || dataType == "DateTime") {
          dataType = "date";
        } else {
          dataType = "others";
        }
        let operator = [];
        switch (dataType) {
          case "date":
            this.selectList = [
              {
                label: "by",
                value: "by",
              },
              {
                label: "按年统计",
                value: "by_year",
              },
              {
                label: "按月统计",
                value: "by_month",
              },
              {
                label: "按周统计",
                value: "by_week",
              },
              {
                label: "按天统计",
                value: "by_date",
              },
              {
                label: "按小时统计",
                value: "by_hour",
              },
              {
                label: "按分统计",
                value: "by_minute",
              },
              {
                label: "按秒统计",
                value: "by_second",
              },
              {
                label: "按每年的每个月统计",
                value: "by_month_of_year",
              },
              {
                label: "按每年的每周统计",
                value: "by_week_of_year",
              },
              {
                label: "按每年的每天统计",
                value: "by_date_of_year",
              },
              {
                label: "按每天的每小时统计",
                value: "by_hour_of_date",
              },
              {
                label: "按每天的每分钟统计",
                value: "by_minute_of_date",
              },
            ];
            break;
          default:
            self.selectList = [
              {
                label: "by",
                value: "by",
              },
            ];
            break;
        }
      } else {
        sign.forEach((item) => {
          // 切换group的操作符
          let dataType = item.col_type; // 暂定有时间、数字、其它三种
          if (dataType == "Date" || dataType == "DateTime") {
            dataType = "date";
          } else {
            dataType = "others";
          }
          let operator = [];
          switch (dataType) {
            case "date":
              self.selectList = [
                {
                  label: "by",
                  value: "by",
                },
                {
                  label: "按年统计",
                  value: "by_year",
                },
                {
                  label: "按月统计",
                  value: "by_month",
                },
                {
                  label: "按周统计",
                  value: "by_week",
                },
                {
                  label: "按天统计",
                  value: "by_date",
                },
                {
                  label: "按小时统计",
                  value: "by_hour",
                },
                {
                  label: "按分统计",
                  value: "by_minute",
                },
                {
                  label: "按秒统计",
                  value: "by_second",
                },
                {
                  label: "按每年的每个月统计",
                  value: "by_month_of_year",
                },
                {
                  label: "按每年的每周统计",
                  value: "by_week_of_year",
                },
                {
                  label: "按每年的每天统计",
                  value: "by_date_of_year",
                },
                {
                  label: "按每天的每小时统计",
                  value: "by_hour_of_date",
                },
                {
                  label: "按每天的每分钟统计",
                  value: "by_minute_of_date",
                },
              ];
              break;
            default:
              self.selectList = [
                {
                  label: "by",
                  value: "by",
                },
              ];
              break;
          }
        });
      }
    },
    seleteAggregationOperator(sign, isClick) {
      let self = this;
      if (isClick) {
        let dataType = sign.col_type;
        if (dataType == "Date" || dataType == "DateTime") {
          dataType = "date";
        } else if ( ['string','String'].includes(dataType)) {
          dataType = "string";
        } else if (['Number','number','int'].includes(dataType)) {
          dataType = "number";
        }
        let operator = [];
        switch (dataType) {
          case "number":
            operator = [
              {
                label: "字段值之和",
                value: "sum",
              },
              {
                label: "最小值",
                value: "min",
              },
              {
                label: "最大值",
                value: "max",
              },
              {
                label: "平均值",
                value: "avg",
              },
              {
                label: "非空数据条数",
                value: "count",
              },
              {
                label: "数据总条数",
                value: "count_all",
              },
              {
                label: "去重后的数据条数",
                value: "distinct_count",
              },
            ];
            break;
          default:
            operator = [
              {
                label: "非空数据条数",
                value: "count",
              },
              {
                label: "数据总条数",
                value: "count_all",
              },
              {
                label: "去重后的数据条数",
                value: "distinct_count",
              },
            ];
            break;
        }

        self.selectList = operator;
      } else {
        sign.forEach((item) => {
          // 切换聚合条件
          let dataType = item.col_type;
          if (dataType == "Date" || dataType == "DateTime") {
            dataType = "date";
          } else if (dataType == "String" || dataType == "string") {
            dataType = "string";
          } else if (
            dataType == "Number" ||
            dataType == "number" ||
            dataType == "int"
          ) {
            dataType = "number";
          }
          let operator = [];
          switch (dataType) {
            case "number":
              operator = [
                {
                  label: "和",
                  value: "sum",
                },
                {
                  label: "最小值",
                  value: "min",
                },
                {
                  label: "最大值",
                  value: "max",
                },
                {
                  label: "平均值",
                  value: "avg",
                },
                {
                  label: "非空条数",
                  value: "count",
                },
                {
                  label: "总条数",
                  value: "count_all",
                },
                {
                  label: "去重后条数",
                  value: "distinct_count",
                },
              ];
              break;
            default:
              operator = [
                {
                  label: "非空数据条数",
                  value: "count",
                },
                {
                  label: "数据总条数",
                  value: "count_all",
                },
                {
                  label: "去重后的数据条数",
                  value: "distinct_count",
                },
              ];
              break;
          }

          self.selectList = operator;
        });
      }
    },
    selectData(initial) {},
  },
  created() {
    let val = this.singList;
    let deploy = {};
    if (val.type === "all") {
      deploy = {
        group: { name: this.falgs, pull: "clone" },
        sort: false,
      };
    } else if (val.type === "order") {
      deploy = {
        group: "order",
        disabled: false,
      };
    } else if (val.type === "group" || val.type === "aggregation") {
      deploy = {
        group: { name: "article", pull: "clone" },
        disabled: false,
      };
    } else {
      deploy = {
        group: "article",
        disabled: false,
      };
    }
    this.deploy = deploy;

    if (this.singList.type === "order") {
      this.selectList = this.orderList;
    }
  },

  watch: {
    checkedColumns: {
      handler(newVal, oldVal) {
        if (Array.isArray(newVal) && newVal.length > 0) {
          this.checkList = JSON.parse(JSON.stringify(newVal));
        }
      },
    },
    singList: {
      handler(newVal, oldVal) {
        if (newVal.type === "condition") {
          this.selectConditionOperator(newVal.list);
        }
        if (newVal.type === "order") {
          this.selectList = this.orderList;
        }
        if (newVal.type === "group") {
          this.selectGroupOperator(newVal.list);
        }
        if (newVal.type === "aggregation") {
          this.seleteAggregationOperator(newVal.list);
        }
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.parentMenu {
  min-width: 100px;
  background: white;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #ccc;
  span {
    font-size: 12px;
    padding-left: 15px;
    margin: 2px 0;
    border-bottom: 1px solid #ffffff;
    cursor: default;
    &:hover {
      background: #cccccc;
    }
  }
}
.menu {
  height: 70vh;
}
.wrap {
  display: flex;
}
.dndList-list1 {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-weight: 600;
  border: 1px solid #ebebeb;
  border-top: none;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
  .title {
    display: inline-block;
    color: #fff;
    font-weight: 600;
    font-size: 0.8rem;
    width: calc(100% + 1px);
    text-indent: 1.5rem;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    line-height: 2rem;
    background: #198edc;
  }
  .content {
    height: 87%;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      width: 0px;
      height: 0;
    }
    .dragArea {
      height: calc(100% - 0.1rem);
      &.el-input__inner {
        border-radius: 0;
      }
    }
    .content_list {
      display: flex;
      justify-content: space-between;
      margin-top: 0.1rem;
      cursor: move;
      // line-height: 1.5rem;
      color: #fff;
      &:nth-child(2n) .value {
        color: #606266;
        background-color: #fafafa;
      }
      .value {
        min-width: 35%;
        font-size: 14px;
        background-color: #fff;
        color: #606266;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        line-height: 38px;
        border-radius: 0;
        text-align: center;
      }
      .order_value {
        flex: 1;
      }
      .columns {
        // text-indent: 0.5rem;
        line-height: 1.5rem;
        width: 100%;
        text-align: left;
        border-radius: 0;
      }
      .el-select {
        border-radius: 0;
        max-width: 18%;
      }
      .date-picker {
        width: 100%;
        border-radius: 0;
        max-width: 25%;
        // flex: 1;
      }
      .input-value {
        // max-width: 25%;
        border: none;
        flex: 1;
        border-radius: 0;
      }
      .input-value ::v-deep.el-input__inner {
        border-radius: 0;
        // border-left: 0;
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
      }
      .date-picker ::v-deep .el-input__inner {
        border-radius: 0;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
      .el-select ::v-deep.el-input__inner {
        border-radius: 0;
        border-right: 0;
      }
    }
    .content_list ::v-deep .el-button--danger {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-radius: 0;
    }
  }
}
.el-checkbox-group {
  height: 100%;
}
</style>
