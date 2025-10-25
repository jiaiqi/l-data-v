<template>
  <div class="dndList-list1">
    <div class="title">
      <span>{{ singList.name }}</span>
    </div>
    <div class="content">
      <el-checkbox-group
        v-model="checkList"
        @change="handleCheckChange"
      >
        <draggable
          :list="singList.list"
          :options="deploy"
          class="dragArea"
          handle=".handle"
          @start="onStart($event, singList)"
          @end="onEnd($event, singList)"
          @add="onAdd($event, singList)"
        >
          <div
            class="content_list"
            v-for="(item, index) in singList.list"
            :key="index"
            :data-column="item.columns"
          >
            <div
              v-if="singList.type === 'all'"
              class=""
              :class="{ columns: singList.type === 'all' }"
            >
              <el-checkbox
                :label="item.columns"
                :name="item.columns"
                class="flex items-center flex-1"
              >
                <div class="flex items-center w-full all-column-item flex-1">
                  <div class="flex justify-center flex-col flex-1 truncate">
                    <div class="truncate">
                      {{ item.label }}
                    </div>
                    <div class="truncate">{{ item.columns }}</div>
                  </div>
                  <i
                    class="i-ri-drag-drop-fill handle cursor-move hover-show"
                    title="拖动"
                  ></i>
                  <!-- <i
                    class="i-ri:drag-move-2-fill hover-show handle ml-2px cursor-move text-gray-500 hover:text-blue-500"
                  ></i> -->
                  <i
                    class="i-ri-file-copy-2-fill hover-show ml-2px cursor-pointer "
                    title="复制"
                    @click.stop.prevent="copyColumn(item)"
                  ></i>
                </div>
              </el-checkbox>
            </div>
            <div
              v-else
              class="value handle"
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
              @click.stop
            ></el-input>
            <el-input
              v-model="item._aggregation.aliasName"
              v-if="singList.type === 'aggregation'"
              placeholder="请输入别名"
              class="input-value"
            ></el-input>
            <el-input
              v-model="item._group.aliasName"
              v-if="singList.type === 'group'"
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
              onSt-placeholder="开始日期"
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
import { debounce } from "lodash-es";
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
  watch: {
    checkedColumns: {
      handler(newVal) {
        if (Array.isArray(newVal)) {
          const newValStr = JSON.stringify(newVal);
          const currentValStr = JSON.stringify(this.checkList);
          if (newValStr !== currentValStr) {
            this.checkList = JSON.parse(JSON.stringify(newVal));
          }
        }
      },
      deep: true
    }
  },
  data() {
    return {
      checkList: [],
      deploy: {},
      selectList: [],
      modelType: "",
      singListBak: {},
      flags: "article",
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
    copyColumn(item) {
      const textToCopy = item.columns;

      // 使用 Clipboard API 如果可用
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            this.$message.success(`字段[${textToCopy} ]已复制`);
          })
          .catch((err) => {
            this.$message.error("复制失败: ", err);
          });
      } else {
        // 回退到 execCommand 方式
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.top = "-999999px";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            this.$message.success(`字段[${textToCopy} ]已复制`);
          } else {
            throw new Error("execCommand 复制失败");
          }
        } catch (err) {
          this.$message.error("复制失败，请升级浏览器或切换为 HTTPS 环境");
        }

        document.body.removeChild(textArea);
      }
    },
    handleCheckChange(values) {
      // 确保没有重复值，只保留唯一的字段名
      const uniqueValues = [...new Set(values)];
      // 更新本地checkList
      this.checkList = uniqueValues;
      // 通知父组件更新
      this.$emit('update:checkedColumns', uniqueValues);
    },
    deleteAllData() {
      // 清除组装的数据
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
    onAdd(ev, list) {
      // 如果是order类型，需要验证字段是否在aggregation或group中存在
      let canAdd = true;
      if (list.type === "order") {
        const draggedItem = list.list[ev.newIndex];
        const endData = this.$attrs.endData;
        if (draggedItem && endData) {
          const { aggregation = [], group = [] } = endData;
          // 如果分组跟聚合中没有拖入任何字段，则允许直接从所有字段拖入
          if (aggregation.length > 0 || group.length > 0) {
            const draggedColumn = draggedItem.columns;
            // 检查字段是否在aggregation或group中存在
            const existsInAggregation = aggregation.some(
              (item) => item.colName === draggedColumn
            );
            const existsInGroup = group.some(
              (item) => item.colName === draggedColumn
            );
            // 如果字段不在aggregation和group中，则不允许拖入
            if (!existsInAggregation && !existsInGroup) {
              // 显示提示信息
              this.$message.warning(
                `字段 "${draggedItem.label}" 必须先添加到聚合或分组中才能进行排序`
              );
              canAdd = false;
            }
          }
        }
      }
      if (canAdd === false) {
        // 移除拖入的项
        list.list.splice(ev.newIndex, 1);
        return;
      }
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
    onStart(event, list) {
      // if (list.type === "group" || list.type === "aggregation") {
      //   this.deploy.group.name = "order";
      // } else if (list.type === "condition") {
      //   this.deploy.group = "a";
      // }
    },
    onEnd(event, list) {
      // if (list.type === "group" || list.type === "aggregation") {
      //   this.deploy.group.name = "article";
      // } else if (list.type === "condition") {
      //   this.deploy.group = "article";
      // }
    },
    selectConditionOperator(sign, isClick) {
      // 切换condition的操作符
      if (isClick) {
        let dataType = sign.col_type; // 暂定有时间、数字、其它三种
        if (dataType) {
          dataType = dataType.toLowerCase();
        }
        if (dataType == "Date" || dataType == "DateTime") {
          dataType = "date";
        } else if (dataType == "string") {
          dataType = "string";
        } else if (["float", "int", "money", "number"].includes(dataType)) {
          dataType = "number";
        }
        // enum('等于','不等于','大于','小于','近似于','开始于','结束于','包含','不包含','为空','不为空','在集合中','在两者之间')
        let operator = [
          {
            label: "等于",
            value: "eq",
          },
          {
            label: "不等于",
            value: "ne",
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
            label: "近似于",
            value: "like",
          },
          {
            label: "开始于",
            value: "like]",
          },
          {
            label: "结束于",
            value: "[like",
          },
          {
            label: "包含",
            value: "in",
          },
          {
            label: "不包含",
            value: "notin",
          },
          {
            label: "为空",
            value: "isnull",
          },
          {
            label: "不为空",
            value: "notnull",
          },
          {
            label: "在集合中",
            value: "inset",
          },
          {
            label: "在两者之间",
            value: "between",
          },
        ];
        // switch (dataType) {
        //   case "date": // 时间类型
        //     operator = [
        //       {
        //         label: "等于",
        //         value: "eq",
        //       },
        //       {
        //         label: "不等于",
        //         value: "ne",
        //       },
        //       {
        //         label: "大于",
        //         value: "gt",
        //       },
        //       {
        //         label: "小于",
        //         value: "lt",
        //       },
        //       {
        //         label: "近似于",
        //         value: "like",
        //       },
        //       {
        //         label: "开始于",
        //         value: "like]",
        //       },
        //       {
        //         label: "结束于",
        //         value: "[like",
        //       },
        //       {
        //         label: "包含",
        //         value: "in",
        //       },
        //       {
        //         label: "不包含",
        //         value: "notin",
        //       },
        //       {
        //         label: "为空",
        //         value: "isnull",
        //       },
        //       {
        //         label: "不为空",
        //         value: "notnull",
        //       },
        //       {
        //         label: "在集合中",
        //         value: "inset",
        //       },
        //       {
        //         label: "在两者之间",
        //         value: "between",
        //       },
        //     ];
        //     break;
        //   case "number": // 数字类型
        //     operator = [
        //       {
        //         label: "等于",
        //         value: "eq",
        //       },
        //       {
        //         label: "小于等于",
        //         value: "le",
        //       },
        //       {
        //         label: "大于等于",
        //         value: "ge",
        //       },
        //       {
        //         label: "大于",
        //         value: "gt",
        //       },
        //       {
        //         label: "小于",
        //         value: "lt",
        //       },
        //       {
        //         label: "不等于",
        //         value: "ne",
        //       },
        //       {
        //         label: "包含",
        //         value: "in",
        //       },
        //     ];
        //     break;
        //   default:
        //     operator = [
        //       {
        //         label: "等于",
        //         value: "eq",
        //       },
        //       {
        //         label: "不等于",
        //         value: "ne",
        //       },
        //       {
        //         label: "近似于",
        //         value: "like",
        //       },
        //       {
        //         label: "包含",
        //         value: "in",
        //       },
        //     ];
        //     break;
        // }
        this.selectList = operator;
      } else {
        sign.forEach((item) => {
          let dataType = item.col_type || "string"; // 暂定有时间、数字、其它三种

          dataType = dataType.toLowerCase();
          if (dataType == "Date" || dataType == "DateTime") {
            dataType = "date";
          } else if (dataType == "string") {
            dataType = "string";
          } else if (["float", "int", "money", "number"].includes(dataType)) {
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
          let dataType = item.col_type || "string"; // 暂定有时间、数字、其它三种

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
      if (isClick && sign?.col_type) {
        let dataType = sign.col_type?.toLowerCase();
        if (["date", "datetime"].includes(dataType)) {
          dataType = "date";
        } else if (["string"].includes(dataType)) {
          dataType = "string";
        } else if (
          ["money", "number", "int", "float", "integer"].includes(dataType)
        ) {
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
          let dataType = item.col_type?.toLowerCase() || "string";
          if (["date", "datetime"].includes(dataType)) {
            dataType = "date";
          } else if (["string"].includes(dataType)) {
            dataType = "string";
          } else if (
            ["money", "number", "int", "float", "integer"].includes(dataType)
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
        group: { name: this.flags, pull: "clone" },
        sort: false,
      };
    } else if (val.type === "order") {
      deploy = {
        // group: "order",
        group: { name: this.flags, pull: "clone" },
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
    // this.setEndData(this.singList);
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
        this.setEndData(newVal);
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
.parentMenu {
  min-width: 120px;
  background: white;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;

  span {
    font-size: 13px;
    padding: 8px 15px;
    margin: 0;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f0f7ff;
      color: #409eff;
    }

    &:last-child {
      border-bottom: none;
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
  font-weight: 500;
  background-color: #fff;
  border-radius: 8px;

  .title {
    display: flex;
    align-items: center;
    color: #fff;
    font-weight: 500;
    font-size: 14px;
    width: 100%;
    padding: 0 16px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    height: 48px;
    background: linear-gradient(135deg, #1989fa, #096dd9);
  }

  .content {
    height: calc(100% - 48px);
    overflow-y: auto;
    padding: 8px;
    border: 1px solid #f0f0f0;
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: #e0e0e0;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 3px;
    }

    .dragArea {
      height: 100%;

      &.el-input__inner {
        border-radius: 4px;
      }
    }

    .content_list {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      cursor: move;
      color: #606266;
      background-color: #fff;
      border-radius: 4px;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      .hover-show {
        display: none;
        color: #606266;
        margin-left: 8px;
      }
      .all-column-item {
        &:hover {
          .hover-show {
            color: #409eff;
            display: inline-block;
          }
        }
      }
      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

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
        border-radius: 4px 0 0 4px;
        line-height: 38px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .order_value {
        flex: 1;
      }

      .columns {
        line-height: 1.5rem;
        width: 100%;
        text-align: left;
        border-radius: 4px;
        padding: 8px;
        border: 1px solid #ebeef5;
      }

      .el-select {
        border-radius: 0;
        max-width: 18%;
      }

      .date-picker {
        width: 100%;
        border-radius: 0;
        max-width: 25%;
      }

      .input-value {
        border: none;
        flex: 1;
        border-radius: 0;
      }

      .input-value ::v-deep .el-input__inner {
        border-radius: 0;
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        transition: all 0.2s;

        &:focus {
          border-color: #409eff;
        }
      }

      .date-picker ::v-deep .el-input__inner {
        border-radius: 0;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }

      .el-select ::v-deep .el-input__inner {
        border-radius: 0;
        border-right: 0;
      }

      .el-button--danger {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-radius: 0 4px 4px 0;
        margin-left: 0;
        transition: all 0.2s;

        &:hover {
          background-color: #f56c6c;
          border-color: #f56c6c;
          color: #fff;
        }
      }
    }
  }
}

.el-checkbox-group {
  height: 100%;
}

// 优化复制图标样式
.i-ri-file-copy-2-fill,
.i-ri-drag-drop-fill,
ic:baseline-drag-handle {
  font-size: 16px;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    transform: scale(1.1);
  }
}

// 优化checkbox样式
.el-checkbox {
  margin-right: 0;
  width: 100%;

  ::v-deep .el-checkbox__input {
    vertical-align: middle;
  }

  ::v-deep .el-checkbox__label {
    padding-left: 8px;
    width: 100%;
  }
}
</style>
