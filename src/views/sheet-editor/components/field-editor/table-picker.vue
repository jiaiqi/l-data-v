<template>
  <div>
    <el-popover
      trigger="focus"
      ref="show_popover"
      :disabled="disabled"
    >
      <template slot="reference">
        <el-select
          style="width: 100%"
          :disabled="disabled"
          v-model="selected"
          :value-key="valueCol"
          popper-class="popper-class"
          placeholder="请选择"
          :multiple="isMulti"
          clearable
          @remove-tag="removeTag"
          @clear="clearSelect"
          @focus="onSearch"
        >
          <el-option
            v-for="item in allData"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </template>
      <div class="picker-view">
        <div class="top-bar">
          <el-input
            placeholder="输入查询条件"
            suffix-icon="el-icon-search"
            v-model="inputVal"
            clearable
            @keyup.enter.native="onSearch"
          >
          </el-input>
          <el-button type="primary" icon="el-icon-search" @click="onSearch"
            >搜索</el-button
          >
        </div>
        <el-table
          class="el-table"
          ref="multipleTable"
          :data="gridData"
          row-key="id"
          lazy
          :load="loadChild"
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          :highlight-current-row="!isMulti"
          @row-click="clickRow"
          @selection-change="handleSelectionChange"
        >
          <el-table-column width="120" v-if="isMulti">
            <template #header>
              <div>
                <el-checkbox
                  :value="
                    gridData.every((item) => selected.includes(item[valueCol]))
                  "
                  @change="onCheckedAll"
                ></el-checkbox>
              </div>
            </template>
            <template slot-scope="scope">
              <el-checkbox
                :value="selected.includes(scope.row[valueCol])"
                @change="changeSelected(scope.$index, scope.row)"
              ></el-checkbox>
            </template>
          </el-table-column>
          <!-- <el-table-column type="selection" width="55" v-if="isMulti">
          </el-table-column> -->
          <el-table-column
            :min-width="flexColumnWidth(item.label, item.column)"
            :label="item.label"
            v-for="item in setGridHeader"
            :key="item.column"
            v-if="item.srvcol && item.srvcol.in_list == 1"
            :prop="item.column"
          ></el-table-column>
        </el-table>
        <div class="bottom-bar">
          <div></div>
          <el-pagination
            background
            layout="prev, pager, next"
            :total="page.total"
            :current-page="page.pageNo"
            :page-size="page.rownumber"
            @current-change="changePage"
          >
          </el-pagination>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
import { wrapHeader } from "@/common/wrapper_util.js";
import cloneDeep from "lodash/cloneDeep";
import uniqBy from "lodash/uniqBy";
export default {
  props: {
    srvApp:String,
    field: {
      type: Object,
    },
    finderSelected: {
      type: String,
    },
    selectedGridData: {
      type: Array,
    },
    defaultValues: {
      type: Object,
    },
    mainformDatas: {
      type: Object,
    },
    disabled: {
      type: Boolean,
    },
    formModel: {
      type: Object,
    },
  },
  data() {
    return {
      inputVal: "",
      tableSelected: [],
      selected: [],
      visible: false,
      page: {
        total: 0,
        rownumber: 5,
        pageNo: 1,
      },
      options: [],
      gridHeader: [],
      gridData: [],
      allData: [],
      isCheckedFirstPage: false, //已经将第一页数据默认选中
      listV2: null,
    };
  },
  computed: {
    service() {
      return this.optionListV2?.serviceName || this.field.info?.fmt?.service;
    },
    optionListV2() {
      return this.field?.info?.srvCol?.option_list_v2;
    },
    checkedAll() {
      // 默认选中所有数据 不带分页
      return this.field?.info?.moreConfig?.checkedAll;
    },
    checkedFirstPage() {
      // 默认选中带分页查询的第一页数据
      return this.field?.info?.moreConfig?.checkedFirstPage;
    },
    isAdd() {
      return this.field?.info?.srvCol?.service_name?.includes("_add");
    },
    fieldType() {
      let fieldInfo = this.field.info;
      if (fieldInfo && fieldInfo.type) {
        if (fieldInfo.moreConfig?.multi === true) {
          return "fks";
        }
        return fieldInfo.type;
      }
    },
    isMulti() {
      return (
        ["fks", "fkjsons"].includes(this.fieldType) ||
        this.field.info.moreConfig?.multi === true
      );
    },
    isTree() {
      return (
        this.optionListV2?.is_tree === true || this.listV2?.is_tree === true
      );
    },
    valueCol() {
      return this.fmt && this.fmt.primary_col;
    },
    labelCol() {
      return this.fmt && this.fmt.disp_col;
    },
    fmt() {
      const result =
        this.field?.info?.fmt || this.field?.info?.dispLoader || {};
      if (!result.primary_col && result.refedCol) {
        result.primary_col = result.refedCol;
      }
      if (!result.disp_col && result.dispCol) {
        result.disp_col = result.dispCol;
      }
      if (!result.cols) {
        result.cols = [result.disp_col, result.primary_col];
      }
      return result;
    },
    setGridHeader() {
      let arr = [];
      let cols = [];
      if (this.fmt && this.fmt.cols && this.fmt.cols.length > 0) {
        this.fmt.cols.forEach((item) => {
          arr.push(item);
        });
      } else {
        if (this.fmt && this.fmt.disp_col) {
          arr.push(this.fmt.disp_col);
        }
        if (this.fmt && this.fmt.primary_col) {
          arr.push(this.fmt.primary_col);
        }
      }
      if (Array.isArray(this.gridHeader)) {
        cols = this.gridHeader.filter((item) => arr.includes(item.column));
      }
      return cols;
    },
  },
  created() {
    this.initSelected();
    this.getListV2().then(() => {
      this.buildGridHeader();
    });
  },
  watch: {
    gridData: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        // //模拟触发元素被点击：
        // this.$refs?.show_popover?.dispatchEvent(new MouseEvent('click'));
        //重新计算弹框的位置：
        this.$nextTick(() => {
          this.$refs.show_popover.updatePopper();
        });
      },
    },
  },
  methods: {
    /**
     * el-table-column 自适应列宽
     * @param prop_label: 表名
     * @param table_data: 表格数据
     */
    flexColumnWidth(label, prop) {
      const arr = this.gridData.map((x) => x[prop]);
      let max = 25;
      if (arr.length > 0) {
        arr.push(label);
        max += this.getMaxLength(arr);
      }
      if (max > 250) {
        max = 250;
      }
      return max;
    },
    /**计算列内容最大宽度
     * 遍历列的所有内容，获取最宽一列的宽度
     * @param arr
     */
    getMaxLength(arr) {
      return arr.reduce((acc, item) => {
        if (item) {
          const calcLen = this.getTextWidth(item);
          if (acc < calcLen) {
            acc = calcLen;
          }
        }
        return acc;
      }, 0);
    },
    /**
     * 使用span标签包裹内容，然后计算span的宽度 width： px
     * @param valArr
     */
    getTextWidth(str) {
      let width = 0;
      const html = document.createElement("span");
      html.innerText = str;
      html.className = "getTextWidth";
      document.querySelector("body").appendChild(html);
      width = document.querySelector(".getTextWidth").offsetWidth;
      document.querySelector(".getTextWidth").remove();
      return width;
    },
    async getListV2() {
      const res = await this.loadColsV2(
        this.service,
        "selectlist",
        this.srvApp 
      );
      if (res?.data?.state === "SUCCESS") {
        this.listV2 = res.data.data;
      }
      return res;
    },
    initSelected() {
      let obj = {};
      if (["fkjson", "fkjsons"].includes(this.fieldType)) {
        try {
          obj = JSON.parse(this.finderSelected);
        } catch (error) {
          console.log(error);
        }
      }

      if (this.finderSelected){
        switch (this.fieldType) {
          case "fkjson":
            if (obj && obj[this.valueCol]) {
              this.selected = obj[this.valueCol];
            }
            break;
          case "fkjsons":
            if (Array.isArray(obj)) {
              this.selected = obj
                .map((item) => item[this.valueCol])
                .filter((item) => item && item);
            }
            break;
          case "fk":
            this.selected = this.finderSelected;
            break;
          case "fks":
            this.selected = this.finderSelected.split(",");
            break;
        }
      }
        
    },
    setFieldVal() {
      let val = "";
      if (Array.isArray(this.selected)) {
        switch (this.fieldType) {
          case "fkjsons":
            val = this.allData
              .filter(
                (item) => this.selected.indexOf(item[this.valueCol]) !== -1
              )
              .map((item) => {
                delete item.checked;
                Object.keys(item).forEach((key) => {
                  if (!this.fmt?.cols?.includes(key)) {
                    delete item[key];
                  }
                });
                return item;
              });
            val = JSON.stringify(val);
            break;
          case "fks":
            val = this.selected.toString();
            break;
        }
        if (this.selected.length === 0) {
          val = "";
        }
      } else if (this.selected) {
        val = this.selected;
        switch (this.fieldType) {
          case "fkjson":
            val = this.allData.find(
              (item) => this.selected.indexOf(item[this.valueCol]) !== -1
            );
            if (val && typeof val === "object") {
              // if (this.labelCol !== "label") {
              //   delete val.label;
              // }
              // if (this.valueCol !== "value") {
              //   delete val.value;
              // }
              delete val.checked;
              val = JSON.stringify(val);
            } else {
              val = null;
            }
            break;
          case "fk":
            val = this.selected;
            break;
        }
      }
      this.$emit("on-selected", val);
    },
    onSearch() {
      this.changePage(1);
    },

    clearSelect() {
      this.initTableSelection();
      this.setFieldVal();
    },
    removeTag(e) {
      if (e) {
        let val = e;
        // let val = e[ this.valueCol ]
        this.selected = this.selected.filter((item) => item !== val);
        this.initTableSelection();
        this.setFieldVal();
      }
    },
    initTableSelection() {
      if (Array.isArray(this.allData) && this.allData.length > 0) {
        this.gridData = this.gridData.map((item) => {
          if (this.selected.indexOf(item[this.valueCol]) !== -1) {
            item.checked = true;
          } else {
            item.checked = false;
          }
          return item;
        });
      }
    },
    handleSelectionChange(val) {
      console.log(val);
      // this.setFieldVal();
      // this.selected = val.map((item) => item[this.valueCol]);
      // this.setFieldVal();
    },
    onCheckedAll() {
      if (
        this.gridData.every((item) =>
          this.selected.includes(item[this.valueCol])
        )
      ) {
        // 取消全选
        this.selected = this.selected.filter(
          (no) => !this.gridData.find((item) => item[this.valueCol] === no)
        );
        this.gridData.forEach((item) => {
          this.$set(item, "chcecked", false);
        });
      } else {
        // 全选
        this.selected = [
          ...new Set([
            ...this.selected,
            ...this.gridData.map((item) => item[this.valueCol]),
          ]),
        ];
        this.gridData.forEach((item) => {
          this.$set(item, "chcecked", true);
        });
      }
      this.setFieldVal();
    },
    changeSelected(index, row) {
      this.clickRow(row);

      // this.selected = this.allData.filter(item => item[ this.valueCol ] === row[ this.valueCol ])
    },
    clickRow(row) {
      if (this.isMulti) {
        // 多选模式
        let parent_no_col = this.listV2?.parent_no_col;
        let rowChildren = [];
        if (parent_no_col) {
          rowChildren = this.allData
            .filter((item) => item[parent_no_col] === row[this.valueCol])
            .map((item) => item[this.valueCol]);
        }
        if (this.selected.indexOf(row[this.valueCol]) > -1) {
          this.$set(row, "chcecked", false);
          this.selected = this.selected.filter(
            (item) => item !== row[this.valueCol]
          );
          if (rowChildren?.length) {
            this.selected = this.selected.filter(
              (item) => rowChildren.indexOf(item) === -1
            );
          }
        } else {
          this.$set(row, "chcecked", true);
          this.selected.push(row[this.valueCol]);
          if (rowChildren?.length) {
            this.selected = this.selected.concat(rowChildren);
          }
        }
      } else {
        // 单选模式
        this.selected = row[this.valueCol];
        this.visible = false;
        this.$refs.show_popover?.doClose();
      }

      this.setFieldVal();
    },
    changePage(page) {
      this.page.pageNo = page;
      this.loadOptions();
    },
    async buildGridHeader() {
      if (this.fmt && this.fmt.service) {
        let res = await this.loadColsV2(this.fmt.service, "list");
        let respData = res.data.data;
        let srv_cols = respData["srv_cols"];
        let gridHeader = [];
        for (var serviceCol of srv_cols) {
          let colName = serviceCol["columns"];
          if (colName == "id") {
            continue;
          }

          if (serviceCol.col_type === "InlineList") {
            continue;
          }

          let header = {};
          header.srvcol = serviceCol;
          let more_config =
            serviceCol["more_config"] !== null &&
            serviceCol["more_config"] !== undefined &&
            serviceCol["more_config"] !== ""
              ? JSON.parse(serviceCol["more_config"])
              : null;
          let colType = serviceCol["col_type"];
          header["column"] = colName;
          header["label"] = serviceCol["label"];
          header["width"] = "";
          header["show"] = serviceCol["in_list"] === 1;
          header["sortable"] = true;
          header["col_type"] = colType;
          header["list_min_width"] = serviceCol["list_min_width"];
          header["show_option_icon"] =
            serviceCol["more_config"] &&
            JSON.parse(serviceCol["more_config"]).option_icon &&
            JSON.parse(serviceCol["more_config"]).option_icon !== null
              ? JSON.parse(serviceCol["more_config"]).option_icon
              : false;
          header["align"] = this.getColAlign(colType);
          header["format"] =
            serviceCol["more_config"] &&
            JSON.parse(serviceCol["more_config"]).format &&
            JSON.parse(serviceCol["more_config"]).format !== null
              ? JSON.parse(serviceCol["more_config"]).format
              : null;
          header["more_config"] =
            serviceCol["more_config"] && JSON.parse(serviceCol["more_config"])
              ? JSON.parse(serviceCol["more_config"])
              : null;

          header["backgroundMap"] =
            header["more_config"]?.backgroundMap || false;
          header["colorMap"] = header["more_config"]?.colorMap || false;
          if (
            more_config !== null &&
            more_config.hasOwnProperty("list_width")
          ) {
            header["width"] = more_config.list_width;
          }
          if (more_config !== null && more_config.hasOwnProperty("rowFixed")) {
            header["rowFixed"] = more_config.rowFixed;
          } else {
            header["rowFixed"] = false;
          }
          if (
            more_config !== null &&
            more_config.hasOwnProperty("onListShowExp")
          ) {
            header["showListExp"] = more_config.onListShowExp;
          }
          if (
            serviceCol["col_type"] == "Enum" ||
            serviceCol["col_type"] == "Dict"
          ) {
            let filters = [];
            var option_list_v2 = serviceCol["option_list_v2"];
            if (option_list_v2 && Array.isArray(option_list_v2)) {
              for (var item of option_list_v2) {
                filters.push({ text: item["label"], value: item["value"] });
              }
            }
            header["filters"] = filters;
          }
          gridHeader.push(wrapHeader(header));
        }
        this.gridHeader = gridHeader;
        // this.buildGridHeaders(respData[ "srv_cols" ]);
        if (this.disabled !== true) {
          if (this.finderSelected) {
            try {
              this.allData = JSON.parse(this.finderSelected).map((item) => {
                item.label = item[this.labelCol];
                item.value = item[this.valueCol];
                return item;
              });
            } catch (error) {}
          }
          this.loadOptions();
        } else if (this.finderSelected) {
          this.gridData = JSON.parse(this.finderSelected).map((item) => {
            item.label = item[this.labelCol];
            item.value = item[this.valueCol];
            return item;
          });
          this.allData = JSON.parse(this.finderSelected).map((item) => {
            item.label = item[this.labelCol];
            item.value = item[this.valueCol];
            return item;
          });
        }
      }
    },
    loadChild(tree, treeNode, resolve) {
      if (tree[this.listV2.no_col]) {
        let queryJson = {
          serviceName: this.service,
          colNames: ["*"],
          condition: [
            {
              colName: this.listV2.parent_no_col,
              ruleType: "eq",
              value: tree[this.listV2.no_col],
            },
          ],
          page: {
            pageNo: 1,
            rownumber: 999,
          },
        };

        if (this.optionListV2?.child_condition) {
          let rc = JSON.stringify(this.optionListV2.child_condition);
          rc = JSON.parse(
            this.renderStr(rc, { data: this.formModel, top: top })
          );
          queryJson.condition = rc;
        }

        if (this.optionListV2?.child_relation_condition) {
          let rc = JSON.stringify(this.optionListV2.child_relation_condition);
          rc = JSON.parse(
            this.renderStr(rc, { data: this.formModel, top: top })
          );
          queryJson.relation_condition = rc;
        }

        this.selectList(queryJson).then((res) => {
          if (res?.data?.state === "SUCCESS") {
            res.data.data = res.data.data.map((item) => {
              if (this.isTree) {
                item.hasChildren = item.is_leaf === "否";
              }
              if (this.selected.includes(item[this.listV2.no_col])) {
                item.checked = true;
              }
              return item;
            });
            let allData = uniqBy(
              [
                ...res.data.data,
                ...this.gridData,
                ...this.allData,
                ...cloneDeep(this.selectedGridData),
              ],
              this.valueCol
            );
            this.allData = cloneDeep(allData).map((item) => {
              item.label = item[this.labelCol];
              item.value = item[this.valueCol];
              return item;
            });
            //重新计算弹框的位置：
            this.$nextTick(() => {
              this.$refs?.show_popover?.updatePopper();
            });
            resolve(res.data.data);
          }
        });
      }
    },
    loadOptions(query = {}) {
      let fieldInfo = this.field.info;
      let loader = fieldInfo.fmt;
      let queryJson = {
        serviceName: this.service,
        colNames: ["*"],
        condition: [],
        page: {
          pageNo: this.page.pageNo,
          rownumber: this.page.rownumber,
        },
      };
      if (Array.isArray(this.setGridHeader) && this.setGridHeader.length > 0) {
        queryJson.colNames = this.setGridHeader.map((item) => item.column);
        queryJson.colNames.push(
          this.listV2.no_col,
          this.listV2.parent_no_col,
          "is_leaf",
          "path",
          "id"
        );
      }
      if (this.fmt && this.fmt.seq_col) {
        if (this.fmt.order_type) {
          queryJson.order = [
            {
              colName: this.fmt.seq_col,
              orderType: this.fmt.order_type === "升序" ? "asc" : "desc",
            },
          ];
        }
      }

      let fmtConditions = this.fmt.condition || this.fmt.conditions;
      let defaultValues = this.defaultValues;
      if (!defaultValues) {
        let allFields = this.field?.form?.allFields;

        if (allFields && Object.keys(allFields).length > 0) {
          defaultValues = {};
          Object.keys(allFields).forEach((key) => {
            if (allFields[key].getSrvVal) {
              defaultValues[key] = allFields[key].getSrvVal();
            }
          });
        }
      }
      if (Array.isArray(fmtConditions) && fmtConditions.length > 0) {
        for (var condition of fmtConditions) {
          let obj = {
            colName: condition.colName,
            ruleType: condition.ruleType,
            value: condition.value,
          };
          if (typeof condition.value === "object") {
            if (condition.value["value_type"] == "constant") {
              obj.value = condition.value["value"];
            } else if (condition.value["value_type"] == "sysvar") {
              if (condition.value["value"] == "nowdate") {
                obj.value = this.formatDateTime(new Date());
              } else {
                obj.value = eval("top." + condition.value["value"]);
              }
            } else if (condition.value["value_type"] == "rowData") {
              if (
                defaultValues &&
                defaultValues[condition.value["value_key"]]
              ) {
                obj.value = defaultValues[condition.value["value_key"]];
              } else {
                obj.value = null;
              }
            } else if (condition.value["value_type"] == "mainData") {
              // 主表数据
              if (
                this.mainformDatas &&
                typeof this.mainformDatas === "object" &&
                this.mainformDatas[condition.value["value_key"]]
              ) {
                obj.value =
                  this.mainformDatas[condition.value["value_key"]] || null;
              }
            }
          } else if (condition.value?.includes("data.")) {
            try {
              let key = condition.value.split("data.")[1];
              if (key) {
                obj.value = defaultValues[key];
              }
            } catch (error) {}
          }
          queryJson.condition.push(obj);
        }
      }
      let fmtRelationCondition = this.fmt.relation_condition;
      if (this.inputVal) {
        let relation_condition = {
          relation: "OR",
          data: [
            {
              relation: "AND",
              data: [
                {
                  colName: this.valueCol,
                  value: this.inputVal,
                  ruleType: "[like]",
                },
              ],
            },
            {
              relation: "AND",
              data: [
                {
                  colName: this.labelCol,
                  value: this.inputVal,
                  ruleType: "[like]",
                },
              ],
            },
          ],
        };
        queryJson.relation_condition = relation_condition;
      }

      if (Array.isArray(this.setGridHeader) && this.setGridHeader.length > 0) {
        queryJson.colNames = this.setGridHeader.map((item) => item.column);
      }
      if (this.listV2?.is_tree === true) {
        queryJson.colNames.push(
          this.listV2.no_col,
          this.listV2.parent_no_col,
          "is_leaf",
          "path",
          "id"
        );
        queryJson.use_type = "treelist";
        // queryJson.condition.push({
        //   colName: this.listV2.parent_no_col,
        //   ruleType: "isnull",
        //   value: null,
        // });
        queryJson.rdt = "ttd";
        delete queryJson.page;
      }

      if (loader && loader.orders) {
        queryJson.order = loader.orders;
      }

      if (this.checkedAll && !this.isCheckedFirstPage) {
        // 默认选中所有数据 不分页
        delete queryJson.page;
      }

      return this.selectList(queryJson).then((response) => {
        if (response && response.data && response.data.data) {
          this.gridData = cloneDeep(response.data.data).map((item) => {
            if (this.isTree) {
              item.hasChildren = item.is_leaf === "否";
            }
            item.checked = false;
            return item;
          });
          let allData = uniqBy(
            [
              ...this.gridData,
              ...this.allData,
              ...cloneDeep(this.selectedGridData),
            ],
            this.valueCol
          );
          this.allData = cloneDeep(allData).map((item) => {
            item.label = item[this.labelCol];
            item.value = item[this.valueCol];
            return item;
          });
          if (this.isMulti && this.isAdd) {
            if (
              !this.listV2.is_tree &&
              (this.checkedFirstPage || this.checkedAll) &&
              !this.isCheckedFirstPage &&
              this.allData?.length
            ) {
              // 默认选中查到的所有数据
              this.allData.forEach((item) => {
                this.clickRow(item);
              });
              this.isCheckedFirstPage = true;
            }
          }
          this.initTableSelection();
          if (response.data.page) {
            if (this.listV2?.is_tree === true) {
              this.page.total = response.data.data.length;
            } else {
              this.page.total = response.data.page.total;
            }
          }
        }
      });
    },
    getColAlign: function (colType) {
      if (
        colType === "Money" ||
        colType === "int" ||
        colType === "Integer" ||
        colType === "Email" ||
        colType === "TelNo"
      ) {
        return "right";
      } else if (
        colType === "Enum" ||
        colType === "Dict" ||
        colType === "Date" ||
        colType === "DateRange" ||
        colType === "DateTime"
      ) {
        return "center";
      } else {
        return "left";
      }
    },
  },
};
</script>

<style lang="scss">
.popper-class {
  display: none;
}

.bottom-bar,
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;

  .el-input {
    flex: 1;
    margin-right: 10px;
  }
}

.bottom-bar {
  justify-content: center;
}

.el-table th {
  padding: 0 4px !important;
}

.el-table th > .cell {
  padding: 8px;
}

.el-table td .cell {
  display: flex;
}

.picker-view {
  .el-table {
    max-height: 500px;
    overflow-y: auto;
  }
}
</style>
