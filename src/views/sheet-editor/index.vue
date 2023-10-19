<template>
  <div class="spreadsheet" v-loading="loading">
    <div
      class="flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 p-x-5"
    >
      <div
        class="flex flex-1 items-center text-sm"
        v-if="addButton && addButton.service_name"
      >
        <div class="m-r-2">添加</div>
        <el-input-number
          size="mini"
          v-model="insertRowNumber"
          style="width: 100px"
        />
        <div class="m-x-2">行</div>
        <el-button
          size="mini"
          type="primary"
          @click="batchInsertRows"
          :disabled="insertRowNumber === 0"
          >添加</el-button
        >
      </div>
      <div class="text-sm text-gray cursor-not-allowed" v-else>
        没有添加权限
      </div>
      <div flex-1>
        <el-radio-group
          v-model="listType"
          @input="listTypeChange"
          size="mini"
          v-if="isTree"
        >
          <el-radio-button label="list">普通列表</el-radio-button>
          <el-radio-button label="treelist">树型列表</el-radio-button>
        </el-radio-group>
      </div>

      <div class="flex flex-items-center flex-1 justify-end">
        <div class="color-map flex flex-items-center m-r-20">
          <div class="color-map-item flex flex-items-center">
            <div class="color bg-[#a4da89] w-4 h-4 m-r-2 rounded"></div>
            <div class="text">新增</div>
          </div>
          <div class="color-map-item flex flex-items-center m-l-5">
            <div class="color bg-[#c00] w-4 h-4 m-r-2 rounded"></div>
            <div class="text">更新</div>
          </div>
        </div>
        <el-button size="mini" type="primary" @click="refreshData"
          >刷新</el-button
        >
        <el-button
          size="mini"
          type="primary"
          @click="saveData"
          :disabled="!calcReqData || calcReqData.length == 0"
          >保存</el-button
        >
        <el-button
          size="mini"
          type="primary"
          @click="saveColumnWidth"
          :disabled="!calcColumnWidthReq || calcColumnWidthReq.length == 0"
          v-if="calcColumnWidthReq && calcColumnWidthReq.length > 0"
          >保存样式</el-button
        >
      </div>
    </div>
    <ve-table
      ref="tableRef"
      style="word-break: break-word; width: 100vw"
      fixed-header
      :scroll-width="0"
      max-height="calc(100vh - 80px)"
      border-y
      :columns="columns"
      :table-data="tableData"
      row-key-field-name="rowKey"
      :virtual-scroll-option="virtualScrollOption"
      :cell-autofill-option="cellAutofillOption"
      :cell-style-option="cellStyleOption"
      :edit-option="editOption"
      :clipboard-option="clipboardOption"
      :contextmenu-body-option="contextmenuBodyOption"
      :contextmenu-header-option="contextmenuHeaderOption"
      :row-style-option="rowStyleOption"
      :column-width-resize-option="columnWidthResizeOption"
      :event-custom-option="eventCustomOption"
      :columnHiddenOption="columnHiddenOption"
    />
    <div class="text-center">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page.pageNo"
        :page-sizes="[10, 20, 50, 100, 200, 500]"
        :page-size="page.rownumber"
        layout="total, sizes, pager,  jumper"
        :total="page.total"
      >
      </el-pagination>
    </div>

    <select-parent-node
      ref="changeParentRef"
      :srvApp="srvApp"
      :options="
        tableData.filter((item) => item.__flag !== 'add' && !item.__indent)
      "
      :option-info="parentColOption"
      @confirm="updateParentNo"
    ></select-parent-node>

    <!-- <div class="custom-contextmenu" :style="{top:ctop,left: cleft}">
      111111111
    </div> -->
  </div>
</template>

<script>
import {
  getServiceV2,
  onSelect,
  onBatchOperate,
  onDelete,
} from "../../service/api";
import dayjs from "dayjs";
import { buildSrvCols } from "../../utils/sheetUtils";
import { COLUMN_KEYS } from "../../utils/constant";
import { isEmpty, uniqueId, cloneDeep, cond } from "lodash-es";
import { Message, MessageBox } from "element-ui"; // 引入elementUI的Message组件
import HeaderCell from "./components/header-cell.vue";
import fkSelector from "./components/fk-selector.vue";
import RenderHtml from "./components/render-html.vue";
import selectParentNode from "./components/select-parent-node.vue";
import { RecordManager } from "./util/recordManager.js";
import { Loading } from "element-ui";
import { $http } from "../../common/http";

export default {
  name: "SheetEditor",
  mounted() {
    this.bindKeyboardEvent(this.undo, this.redo);
    this.initPage().then(() => {
      if (this.v2data?.is_tree === true) {
        this.listType = "treelist";
        this.initPage();
      }
      this.getList();
    });
  },
  components: {
    selectParentNode,
  },
  data() {
    return {
      columnWidthMap: {}, //存储改变后的列宽
      ctop: "-100vh",
      cleft: "-100vw",
      changeParentdialogVisible: false,
      pageNo: uniqueId("pageNo"),
      listType: "list",
      treeList: [],
      page: {
        //分页信息
        total: 0,
        rownumber: 20,
        pageNo: 1,
      },
      sortState: [], // 表头排序
      filterState: {}, //筛选
      listColsMap: null, //列表字段映射
      addColsMap: null, //新增字段映射
      updateColsMap: null, //编辑字段映射
      loading: false,
      recordManager: new RecordManager(), //编辑记录
      tableData: [],
      oldTableData: [], //源数据
      v2data: {}, //select v2
      allFields: [], //所有字段
      columns: [], //表头字段
      eventCustomOption: {
        bodyCellEvents: ({ row, column, rowIndex }) => {
          return {
            // click: (event) => {
            //   console.log("click::", row, column, rowIndex, event);
            // },
            // dblclick: (event) => {
            //   console.log("dblclick::", row, column, rowIndex, event);
            // },
            contextmenu: (event) => {
              console.log("bodyCellEvents::", row, column, rowIndex, event);
              this.cleft = event.x + "px";
              this.ctop = event.y + "px";
            },
            // mouseenter: (event) => {
            //   console.log("mouseenter::", row, column, rowIndex, event);
            // },
            // mouseleave: (event) => {
            //   console.log("mouseleave::", row, column, rowIndex, event);
            // },
          };
        },
        bodyRowEvents: ({ row, rowIndex }) => {
          return {
            // click: (event) => {
            //   console.log("click::", row, rowIndex, event);
            // },
            dblclick: (event) => {
              console.log("dblclick::", row, rowIndex, event);
              return false;
            },
            contextmenu: (event) => {
              console.log("bodyRowEvents::", row, rowIndex, event);
              event.preventDefault();
              return false;
            },
            // mouseenter: (event) => {
            //   console.log("mouseenter::", row, rowIndex, event);
            // },
            // mouseleave: (event) => {
            //   console.log("mouseleave::", row, rowIndex, event);
            // },
          };
        },
      },
      cellStyleOption: {
        bodyCellClass: ({ row, column, rowIndex }) => {
          if (row?.__flag === "add") {
            // 新增行直接显示为绿色背景 不用判断字段有没有值
            return "table-body-cell__add";
            // 新增数据 整行某个字段有值后 增加class
            // return Object.keys(row).some(
            //   (key) => !["__flag", "rowKey", "__id"].includes(key) && !!row[key]
            // )
            //   ? "table-body-cell__add"
            //   : "";
          }
          if (
            row?.__flag === "update" &&
            !["__flag", "rowKey", "__id"].includes(column.field)
          ) {
            // 某行某列绑定的值跟备份的数据中此行此列绑定的值不同时  增加class
            const oldRowData = this.oldTableData.find(
              (item) => item.__id && item.__id === row.__id
            );
            if (row[column.field] !== oldRowData[column.field]) {
              return "table-body-cell__update";
            }
          }
        },
      },
      insertRowNumber: 1,
      startRowIndex: 0,
      // 是否开启列宽可变
      columnWidthResizeOption: {
        enable: true,
        minWidth: 30,
        sizeChange: ({ column, differWidth, columnWidth }) => {
          console.log({
            column,
            differWidth,
            columnWidth,
          });
          this.$set(this.columnWidthMap, column.field, {
            width: columnWidth,
            fieldInfo: column.__field_info,
          });
        },
      },
      // 虚拟滚动配置
      virtualScrollOption: {
        enable: false,
        scrolling: this.scrolling,
      },
      // 单元格自动填充配置
      cellAutofillOption: {
        directionX: false,
        directionY: true,
        afterAutofill: ({ targetSelectionRangeIndexes }) => {
          //targetSelectionRangeIndexes 自动填充目标的行和列索引
          this.triggerEditCell(targetSelectionRangeIndexes);
        },
      },
      // 剪贴板配置
      clipboardOption: {
        beforePaste: ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
          console.log(selectionRangeIndexes);

          if (Array.isArray(data) && data?.length) {
            let isValid = true;
            for (let index = 0; index < data.length; index++) {
              const element = data[index];
              this.columns.forEach((col) => {
                const colType = col?.__field_info?.col_type;
                if (colType) {
                  const changeValue = element[col.field];
                  if (changeValue) {
                    if (
                      ["Integer", "Float", "Money", "int", "Int"].includes(
                        colType
                      ) ||
                      colType.includes("decimal")
                    ) {
                      // 校验数字
                      if (
                        isNaN(Number(changeValue))
                        // /^-?\d{1,100}(,\d{3})*(\.\d{1,10})?$/.test(changeValue) !==
                        // true
                      ) {
                        isValid = false;
                        this.$message({
                          message: "请输入数字",
                          type: "warning",
                        });
                      }
                    }
                  }
                }
              });
            }
            if (isValid) {
              // 获取选中单元格信息
              const rangeCellSelection =
                this.$refs["tableRef"].getRangeCellSelection();
              // 选中单元格起始索引
              const selectionRangeIndexes =
                rangeCellSelection.selectionRangeIndexes;
              // 只有复制了单行单列 才可以这样批量粘贴
              if (selectionRangeIndexes && data?.length == 1) {
                const {
                  startRowIndex,
                  endRowIndex,
                  startColIndex,
                  endColIndex,
                } = selectionRangeIndexes;
                // 选中区域大于一行或者一列
                if (
                  endRowIndex - startRowIndex > 0 ||
                  endColIndex - startColIndex > 0
                ) {
                  const columns = this.columns.filter(
                    (item) =>
                      !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
                        item.field
                      )
                  );
                  for (let i = startRowIndex; i <= endRowIndex; i++) {
                    const row = this.tableData[i];
                    for (let j = startColIndex; j <= endColIndex; j++) {
                      const col = columns[j];
                      this.$refs["tableRef"].startEditingCell({
                        rowKey: row.rowKey,
                        colKey: col.field,
                        defaultValue: data[0][selectionRangeKeys.startColKey],
                      });
                      this.$refs["tableRef"].stopEditingCell();
                    }
                  }
                  return false;
                }
              }
            }
            return isValid;
          }
        },
        afterPaste: ({ selectionRangeIndexes }) => {
          //selectionRangeIndexes ：拷贝区域的索引信息
          this.triggerEditCell(selectionRangeIndexes);
        },
        afterCut: ({ selectionRangeIndexes }) => {
          const { startRowIndex, endRowIndex, startColIndex, endColIndex } =
            selectionRangeIndexes;
          const columns = this.columns.filter(
            (item) =>
              !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
                item.field
              )
          );
          for (let i = startRowIndex; i <= endRowIndex; i++) {
            const row = this.tableData[i];
            for (let j = startColIndex; j <= endColIndex; j++) {
              const col = columns[j];
              this.$refs["tableRef"].startEditingCell({
                rowKey: row.rowKey,
                colKey: col.field,
                defaultValue: row[col.field],
              });
              this.$refs["tableRef"].stopEditingCell();
            }
          }
        },
      },
      // 单元格编辑配置
      editOption: {
        beforeCellValueChange: ({ row, column, changeValue }) => {
          const colType = column?.__field_info?.col_type;
          console.log(row, column, changeValue);
          if (row.__flag === "add") {
            // 新增行 处理in_add
            if (this.addColsMap[column.field]?.in_add !== 1) {
              this.$message({
                message: "新增行不支持编辑当前列",
                type: "warning",
              });
              return false;
            }
          } else {
            // 编辑行 处理in_update
            if (this.updateColsMap[column.field]?.in_update !== 1) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
          }
          if (
            ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
            colType.includes("decimal")
          ) {
            // 数字 校验
            if (isNaN(Number(changeValue))) {
              this.$message({
                message: "请输入数字",
                type: "warning",
              });
              return false;
            }
          }
        },
        beforeStartCellEditing: ({ row, column, cellValue }) => {
          console.log("beforeStartCellEditing：", cellValue);
          // const colType = column?.__field_info?.col_type;
          // if(column?.__field_info?.bx_col_type==='fk'){
          //   return false
          // }
          if (row.__flag === "add") {
            // 新增行 处理in_add
            if (this.addColsMap[column.field]?.in_add !== 1) {
              this.$message({
                message: "新增行不支持编辑当前列",
                type: "warning",
              });
              return false;
            }
          } else {
            // 编辑行 处理in_update
            if (this.updateColsMap[column.field]?.in_update !== 1) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
          }
          // let editBtnIndex = this.v2data.rowButton?.findIndex(item=>item.button_type==='edit')
          // if (row.__flag !== "add" && !row?._buttons[editBtnIndex]) {
          if (row.__flag !== "add" && !row?.__button_auth?.edit) {
            Message.error("没有当前行的编辑权限！");
            this.$nextTick(() => {
              this.$refs["tableRef"].stopEditingCell();
            });
            return false;
          }
        },
        afterCellValueChange: ({ row, column, changeValue, rowIndex }) => {
          // console.log("afterCellValueChange");
          // console.log("row::", row);
          // console.log("column::", column);
          // console.log("changeValue::", changeValue);
          const colType = column?.__field_info?.col_type;
          // console.log("afterCellValueChange", row, column, changeValue);

          // 数字类型 如果改变的值对应字段是数字类型 但是值是字符串 将其转为数字
          if (
            ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
            colType.includes("decimal")
          ) {
            if (changeValue && typeof changeValue === "string") {
              this.tableData.forEach((item) => {
                if (item.__id === row.__id && item.__id) {
                  // item[column.field] = Number(changeValue)
                  this.$set(item, column.field, Number(changeValue));
                }
              });
            }
          }

          if (row.__id && row.__flag !== "add") {
            row.__flag = "update";
          }
          this.recordManager?.push(cloneDeep(this.tableData));
        },
      },
      // header 右键菜单配置
      contextmenuHeaderOption: {
        // contextmenus: [
        //     {
        //         type: "CUT",
        //     },
        //     {
        //         type: "COPY",
        //     },
        //     {
        //         type: "EMPTY_COLUMN",
        //     },
        // ],
      },

      // 行样式配置
      rowStyleOption: {
        clickHighlight: false,
        hoverHighlight: true,
      },
    };
  },
  computed: {
    // 更新表字段的最小列宽的请求参数
    calcTableColumnWidthReq() {
      if (Object.keys(this.columnWidthMap)?.length) {
        const arr = [];
        Object.keys(this.columnWidthMap).forEach((key) => {
          if (
            this.columnWidthMap[key]?.width &&
            !isNaN(parseFloat(this.columnWidthMap[key].width))
          ) {
            arr.push({
              serviceName: "srvsys_table_columns_update",
              data: [{ list_min_width: this.columnWidthMap[key].width }],
              condition: [
                { colName: "column_name", value: key, ruleType: "eq" },
                {
                  colName: "table_name",
                  value: this.columnWidthMap[key].fieldInfo.table_name,
                  ruleType: "eq",
                },
              ],
            });
          }
        });
        return arr;
      }
    },
    // 更新服务列最小列宽的请求参数
    calcColumnWidthReq() {
      if (Object.keys(this.columnWidthMap)?.length) {
        const arr = [];
        Object.keys(this.columnWidthMap).forEach((key) => {
          if (
            this.columnWidthMap[key]?.width &&
            !isNaN(parseFloat(this.columnWidthMap[key].width))
          ) {
            arr.push({
              serviceName: "srvsys_service_columns_query_update",
              data: [{ list_min_width: this.columnWidthMap[key].width }],
              condition: [
                { colName: "columns", value: key, ruleType: "eq" },
                {
                  colName: "service_name",
                  value: this.columnWidthMap[key].fieldInfo.service_name,
                  ruleType: "eq",
                },
                {
                  colName: "table_name",
                  value: this.columnWidthMap[key].fieldInfo.table_name,
                  ruleType: "eq",
                },
              ],
            });
          }
        });
        return arr;
      }
    },
    calcReqData() {
      return this.buildReqParams() || [];
    },
    // body 右键菜单配置
    contextmenuBodyOption() {
      return {
        beforeShow: ({
          isWholeRowSelection,
          selectionRangeKeys,
          selectionRangeIndexes,
        }) => {
          console.log("---contextmenu header beforeShow--");
          console.log("isWholeColSelection::", isWholeRowSelection);
          console.log("selectionRangeKeys::", selectionRangeKeys);
          console.log("selectionRangeIndexes::", selectionRangeIndexes);
          let startRowIndex = selectionRangeIndexes.startRowIndex;
          return false;
        },
        afterMenuClick: ({
          type,
          selectionRangeKeys,
          selectionRangeIndexes,
        }) => {
          console.log("---contextmenu body afterMenuClick--");
          console.log("type::", type);
          console.log("selectionRangeKeys::", selectionRangeKeys);
          console.log("selectionRangeIndexes::", selectionRangeIndexes);
          const endRowIndex = selectionRangeIndexes.endRowIndex;
          let startRowIndex = selectionRangeIndexes.startRowIndex;
          const startRow = cloneDeep(this.tableData[startRowIndex]);
          if (type === "addchild") {
            // 添加下级节点
            if (startRow?.__flag === "add") {
              this.$message.error("新增行不能直接添加下级节点,请先保存操作!");
              return;
            }
            this.insert2Rows(startRowIndex + 1, startRow);
          } else if (type === "changeParent") {
            // 更改父节点
            if (startRow?.__flag === "add") {
              this.$message.error("新增行不能直接更改父节点,请先保存操作!");
              return;
            }
            // if (startRow.__flag !== "add" && !this.updateButton?.permission) {
            if (startRow.__flag !== "add" && !startRow?.__button_auth?.edit) {
              this.$message.error("没有当前行的编辑权限");
              return;
            }
            this.showChangeParent(startRow);
          } else if (["insertRowBelow", "insertRowsBelow"].includes(type)) {
            //下方插入行
            let lastChildIndex = this.tableData.findLastIndex(
              (item) =>
                item[this.treeInfo.pidCol] === startRow[this.treeInfo.idCol]
            );
            // 如果当前行有子节点 则新增行在子节点之后
            if (lastChildIndex != -1) {
              startRowIndex = lastChildIndex;
            }
            let aNumber = 1;
            if (type === "insertRowsBelow") {
              // 下方插入多行
              aNumber = Number(window.prompt("输入插入的行数", ""));
              if (!aNumber) {
                this.$message("用户取消操作");
                return;
              } else if (aNumber < 0) {
                this.$message("只能输入大于0的整数");
                return;
              }
            }
            for (let index = 0; index < aNumber; index++) {
              const rIndex = startRowIndex + index + 1;
              this.insert2Rows(rIndex, startRow?.__parent_row);
            }
          } else if (["insertRowAbove", "insertRowsAbove"].includes(type)) {
            // 上方插入行
            let aNumber = 1;
            if (type === "insertRowsAbove") {
              // 上方插入多行
              aNumber = Number(window.prompt("输入插入的行数", ""));
              if (!aNumber) {
                this.$message("用户取消操作");
                return;
              } else if (aNumber < 0) {
                this.$message("只能输入大于0的整数");
                return;
              }
            }
            for (let index = 0; index < aNumber; index++) {
              this.insert2Rows(startRowIndex + index, startRow?.__parent_row);
            }
          } else if (type === "removeRow") {
            let willDeleteLocalRows = []; //新增待删除行
            let willDeleteOriginRows = []; //远程数据中的待删除行
            this.tableData.forEach((item, index) => {
              if (index >= startRowIndex && index <= endRowIndex) {
                if (item.__flag == "add") {
                  item.__index = index;
                  willDeleteLocalRows.push(item.__id);
                } else {
                  willDeleteOriginRows.push(item);
                }
              }
            });

            // 删除选中行数据
            let text = `此操作将永久删除该第${
              selectionRangeIndexes.startRowIndex + 1
            }至第${
              selectionRangeIndexes.endRowIndex + 1
            }行数据，是否继续操作？`;
            if (
              selectionRangeIndexes.endRowIndex -
                selectionRangeIndexes.startRowIndex ==
              0
            ) {
              text = `此操作将永久删除该第${
                selectionRangeIndexes.startRowIndex + 1
              }行数据，是否继续操作？`;
            }
            this.$confirm(text, "提示", {
              distinguishCancelAndClose: true,
              confirmButtonText: "确认",
              cancelButtonText: "点错了",
              type: "error",
              // center: true
            })
              .then(() => {
                if (willDeleteLocalRows?.length) {
                  this.tableData = this.tableData.filter(
                    (item) => !willDeleteLocalRows.includes(item.__id)
                  );
                }
                if (willDeleteOriginRows?.length) {
                  if (!this.deleteButton?.service_name) {
                    this.$message({
                      type: "error",
                      message: "没有删除已有数据权限",
                    });
                    return false;
                  }
                  this.deleteRow(willDeleteOriginRows);
                }
              })
              .catch((action) => {
                this.$message({
                  type: "info",
                  message: "用户取消操作",
                });
              });
          }
        },
        contextmenus: this.contextMenus,
      };
    },
    contextMenus() {
      let arr = [
        {
          type: "CUT",
        },
        {
          type: "COPY",
        },
        {
          type: "SEPARATOR",
        },
        {
          type: "insertRowAbove",
          label: "上方插入行",
        },
        {
          type: "insertRowsAbove",
          label: "上方插入多行",
        },
        {
          type: "insertRowBelow",
          label: "下方插入行",
        },
        {
          type: "insertRowsBelow",
          label: "下方插入多行",
        },
        {
          type: "SEPARATOR",
        },
        {
          type: "removeRow",
          label: "删除选中行数据",
        },
      ];

      let addChildButton = this.v2data?.rowButton?.find((item) =>
        item.button_type.includes("addchild")
      );
      if (addChildButton) {
        const treeMenus = [
          {
            type: "addchild",
            label: "添加下级节点",
          },
          {
            type: "changeParent",
            label: "更改父节点",
          },
          {
            type: "SEPARATOR",
          },
        ];
        arr.unshift(...treeMenus);
      }
      return arr;
    },
    setFilterState() {
      let keys = Object.keys(this.filterState);
      let condition = [];
      if (keys?.length) {
        keys.forEach((key) => {
          if (this.filterState?.[key]?.["condition"]) {
            condition.push(...this.filterState[key]["condition"]);
          }
        });
      }
      return condition;
    },
    setSortState() {
      let obj = {};
      if (this.sortState?.length) {
        this.sortState.forEach((item) => {
          obj[item.colName] = item.orderType;
        });
      }
      return obj;
    },
    defaultConditionsMap() {
      if (this.defaultConditions?.length) {
        return this.defaultConditions.reduce((pre, cur) => {
          pre[cur.colName] = cur.value;
          return pre;
        }, {});
      }
    },
    columnHiddenOption() {
      // 隐藏作为条件传入的列
      if (this.defaultConditions?.length) {
        return {
          defaultHiddenColumnKeys: this.defaultConditions.map(
            (item) => item.colName
          ),
        };
      }
    },
    defaultConditions() {
      const query = this.$route.query;
      let defaultConditions = [];
      if (query && Object.keys(query).length > 0) {
        Object.keys(query).forEach((key) => {
          if (!["srvApp", "isTree", "topTreeData", "fixedCol"].includes(key)) {
            defaultConditions.push({
              colName: key,
              ruleType: "eq",
              value: query[key],
            });
          }
        });
        if (defaultConditions?.length === 0 && this.fkCondition) {
          defaultConditions = [this.fkCondition];
        }
      }
      if (this.setFilterState?.length) {
        defaultConditions.push(...this.setFilterState);
      }
      // if (this.isTree && this.listType === "treelist") {
      //   defaultConditions.push({
      //     colName: this.treeInfo.pidCol,
      //     ruleType: "isnull",
      //   });
      // }
      return defaultConditions;
    },
    fkCondition() {
      const fkCol = this.$route?.params?.fkCol || this.$route?.query?.fkCol;
      const fkVal = this.$route?.params?.fkVal || this.$route?.query?.fkVal;
      if (fkCol && fkVal) {
        return {
          colName: fkCol,
          ruleType: "eq",
          value: fkVal,
        };
      }
    },
    addChildButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type.includes("addchild")
      );
    },
    addButton() {
      return this.v2data?.gridButton?.find((item) =>
        item.button_type.includes("add")
      );
    },
    deleteButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type.includes("delete")
      );
    },
    updateButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type?.includes("edit")
      );
    },
    // buildReqParams() {
    //   const tableData = JSON.parse(JSON.stringify(this.tableData));
    //   const reqData = [];
    //   const addDatas = [];
    //   const ignoreKeys = [
    //     "__id",
    //     "__flag",
    //     "rowKey",
    //     "id",
    //     "__button_auth",
    //     "_buttons",
    //   ];
    //   tableData.forEach((item, index) => {
    //     if (
    //       item.__flag === "update" &&
    //       item.id &&
    //       this.updateButton?.service_name
    //     ) {
    //       const oldItem = this.oldTableData.find((d) => d.__id === item.__id);
    //       const updateObj = {};
    //       if (oldItem) {
    //         Object.keys(oldItem).forEach((key) => {
    //           if (
    //             key.indexOf("_") !== 0 &&
    //             !ignoreKeys.includes(key) &&
    //             this.updateColsMap?.[key]?.in_update !== 0
    //           ) {
    //             if (oldItem[key] !== item[key]) {
    //               if (!item[key]) {
    //                 item[key] = null;
    //               }
    //               updateObj[key] = item[key];
    //             }
    //           }
    //         });
    //         if (Object.keys(updateObj)?.length) {
    //           reqData.push({
    //             serviceName: this.updateButton.service_name,
    //             condition: [{ colName: "id", ruleType: "eq", value: item.id }],
    //             data: [updateObj],
    //           });
    //         }
    //       }
    //     } else if (item.__flag === "add" && this.addButton?.service_name) {
    //       const addObj = {
    //         ...item,
    //       };
    //       Object.keys(addObj).forEach((key) => {
    //         if (addObj[key] === null || this.addColsMap?.[key]?.in_add !== 1) {
    //           delete addObj[key];
    //         }
    //       });
    //       if (this.defaultConditions?.length) {
    //         this.defaultConditions.forEach((item) => {
    //           if (item.value) {
    //             addObj[item.colName] = item.value;
    //           }
    //         });
    //       } else if (this.fkCondition?.colName) {
    //         addObj[this.fkCondition.colName] = this.fkCondition.value;
    //       }
    //       delete addObj.__id;
    //       delete addObj.__flag;
    //       delete addObj.rowKey;
    //       Object.keys(addObj).forEach((key) => {
    //         if (ignoreKeys.includes(key) || key.indexOf("_") === 0) {
    //           delete addObj[key];
    //         }
    //       });
    //       if (
    //         Object.keys(addObj).length > 0 &&
    //         Object.keys(addObj).some(
    //           (key) =>
    //             addObj[key] !== undefined &&
    //             addObj[key] !== null &&
    //             addObj[key] !== ""
    //         )
    //       ) {
    //         addDatas.push(addObj);
    //       }
    //     }
    //   });
    //   if (addDatas?.length) {
    //     reqData.push({
    //       serviceName: this.addButton.service_name,
    //       data: addDatas,
    //     });
    //   }
    //   return reqData;
    // },

    tableHeader() {
      return this.v2data?.allFields;
    },
    serviceName() {
      return this.$route.params?.service || this.$route.query?.service;
    },
    isTree() {
      return this.treeInfo && this.v2data?.is_tree === true;
    },
    parentColOption() {
      if (
        this.treeInfo?.pidCol &&
        this.updateColsMap?.[this.treeInfo.pidCol]?.in_update === 1
      ) {
        return this.updateColsMap[this.treeInfo.pidCol]["option_list_v2"];
      }
    },
    treeInfo() {
      if (this.v2data?.parent_no_col && this.v2data?.no_col) {
        return {
          pidCol: this.v2data?.parent_no_col,
          idCol: this.v2data?.no_col,
          dispCol: this.v2data?.key_disp_col,
          service: this.serviceName,
        };
      }
    },
    srvApp() {
      return (
        this.$route.params?.app ||
        this.$route.query?.srvApp ||
        sessionStorage.getItem("current_app")
      );
    },
  },
  methods: {
    updateParentNo(val, row) {
      if (this.updateButton?.service_name) {
        const url = `/${this.srvApp}/operate/${this.updateButton?.service_name}`;
        const req = [
          {
            serviceName: this.updateButton?.service_name,
            condition: [{ colName: "id", ruleType: "eq", value: row.id }],
            data: [
              {
                [this.v2data?.parent_no_col]: val,
              },
            ],
          },
        ];
        $http.post(url, req).then((res) => {
          if (res?.data?.state == "SUCCESS") {
            this.$message.success(res.data.resultMessage);
          } else {
            this.$message.error(res.data.resultMessage);
          }
          this.getList();
        });
      }
    },
    showChangeParent(row) {
      // 显示更改父节点弹窗
      // this.changeParentdialogVisible = true
      this.$refs?.changeParentRef?.open(row);
    },
    async initPage() {
      if (this.serviceName) {
        this.loading = true;
        await this.getV2Data();
        this.loading = false;
        return;
      }
    },
    listTypeChange(val) {
      console.log(val);
      this.initPage().then(() => {
        this.getList();
      });
    },
    handleCurrentChange(val) {
      this.page.pageNo = val;
      this.getList();
    },
    handleSizeChange(val) {
      this.page.rownumber = val;
      this.page.pageNo = 1;
      this.getList();
    },
    triggerEditCell({
      startRowIndex,
      endRowIndex,
      startColIndex,
      endColIndex,
    }) {
      const columns = this.columns.filter(
        (item) =>
          !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
            item.field
          )
      );
      for (let i = startRowIndex; i <= endRowIndex; i++) {
        const row = this.tableData[i];
        for (let j = startColIndex; j <= endColIndex; j++) {
          const col = columns[j];
          this.$refs["tableRef"].startEditingCell({
            rowKey: row.rowKey,
            colKey: col.field,
            defaultValue: row[col.field],
          });
          this.$refs["tableRef"].stopEditingCell();
        }
      }
    },
    undo() {
      // ctrl+z 撤销
      const tableData = this.recordManager?.undo();
      if (Array.isArray(tableData) && tableData?.length) {
        this.tableData = cloneDeep(tableData);
      }
    },
    redo() {
      // ctrl+y 重做
      const tableData = this.recordManager?.redo();
      if (Array.isArray(tableData) && tableData?.length) {
        this.tableData = cloneDeep(tableData);
      }
    },
    buildColumns() {
      const startRowIndex = this.startRowIndex;
      let columns = [
        {
          field: "index",
          key: "index",
          operationColumn: true,
          title: "#",
          width: 50,
          fixed: "left",
          renderBodyCell: function ({ rowIndex, row }) {
            return startRowIndex + rowIndex + 1;
          },
        },
      ];
      if (Array.isArray(this.allFields) && this.allFields.length > 0) {
        let minWidth = (window.innerWidth + 50) / this.allFields.length;
        if (minWidth < 200) {
          minWidth = 200;
        }
        columns = columns.concat(
          this.allFields.map((item, index) => {
            let width = minWidth;
            const length = item.label.replace(
              /[^A-Za-z0-9\u4e00-\u9fa5+]/g,
              ""
            )?.length;
            if (length > 6) {
              // 去掉符号的字符数长度大于4
              console.log(`${item.label}:${length}`);
              width = length * 30;
            }
            if (item.col_span) {
              let cfgWidth = item.col_span * 600;
              if (width < cfgWidth) {
                width = cfgWidth;
              }
            }
            if (item.list_min_width) {
              width = parseFloat(item.list_min_width);
            }
            const columnObj = {
              title: item.label,
              field: item.columns,
              key: item.columns,
              width: width,
              edit:
                ((item.editable === true || item.canAdd == true) &&
                  [
                    "String",
                    "User",
                    "Note",
                    "RichText",
                    "MultilineText",
                    "Enum",
                    "Integer",
                    "Float",
                    "Money",
                    "Date",
                    "DateTime",
                    "int",
                  ].includes(item.col_type)) ||
                item?.col_type?.includes("decimal") ||
                item?.bx_col_type == "fk",
              // edit: ['Integer', 'String', 'Float', "Money"].includes(item.col_type) || item.col_type.includes('decimal'),
              __field_info: { ...item },
            };
            if (index === 0) {
              if (this.isTree) {
                // 首列 如果有下级则展示展开折叠图标
                columnObj.isFirstCol = true;
              }
            }
            // 设置固定列
            let fixedCol = Number(this.$route.query?.fixedCol || 1);
            if (isNaN(fixedCol)) {
              fixedCol = 1;
            }
            for (let fIndex = 0; fIndex < fixedCol; fIndex++) {
              if (index === fIndex) {
                columnObj.fixed = "left";
              }
            }

            if (this.defaultConditions?.length) {
              columnObj.disabled = this.defaultConditions.some(
                (col) => col.colName === item.columns
              );
              columnObj.edit = !columnObj.disabled && columnObj.edit;
            }

            columnObj.renderHeaderCell = ({ column }, h) => {
              return h(HeaderCell, {
                attrs: {
                  app: this.srvApp,
                  list: this.tableData,
                  column: { ...item, edit: columnObj.edit },
                  sortState: this.setSortState,
                },
                on: {
                  "filter-change": (event) => {
                    if (event?.colName) {
                      if (event.remove) {
                        this.$set(this.filterState, event.colName, null);
                      } else {
                        this.$set(this.filterState, event.colName, event);
                      }
                      this.$nextTick(() => {
                        this.getList();
                      });
                    }
                  },
                  "sort-change": (event) => {
                    const curSortIndex = this.sortState.findIndex(
                      (item) => item.colName && item.colName === event
                    );
                    if (curSortIndex > -1) {
                      const sortState = this.sortState[curSortIndex];
                      if (!sortState?.orderType) {
                        this.sortState.push({
                          colName: event,
                          orderType: "ASC",
                        });
                      } else if (sortState?.orderType === "ASC") {
                        this.$set(this.sortState, curSortIndex, {
                          colName: event,
                          orderType: "DESC",
                        });
                      } else {
                        this.sortState = this.sortState.filter(
                          (item) => item.colName !== event
                        );
                      }
                    } else {
                      this.sortState.push({
                        colName: event,
                        orderType: "ASC",
                      });
                    }

                    this.getList();
                  },
                },
              });
            };

            if (["MultilineText"].includes(item.col_type)) {
              columnObj.align = "left";
            }
            if (!columnObj.disabled) {
              if (item.col_type === "User") {
                item.bx_col_type = "fk";
                if (this.updateColsMap[item.columns]?.option_list_v2) {
                  item.option_list_v2 =
                    this.updateColsMap[item.columns]?.option_list_v2;
                } else if (this.addColsMap[item.columns]?.option_list_v2) {
                  item.addColsMap =
                    this.updateColsMap[item.columns]?.option_list_v2;
                } else if (!item.option_list_v2) {
                  item.option_list_v2 = {
                    refed_col: "user_no",
                    srv_app: "sso",
                    serviceName: "srvsso_user_select",
                    key_disp_col: "user_disp",
                  };
                }
              }
              if (true) {
                // if (item.bx_col_type === "fk") {
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  let setColumn =
                    row.__flag === "add"
                      ? this.addColsMap[column.field]
                      : this.updateColsMap[column.field];
                  if (!setColumn) {
                    setColumn = column.__field_info;
                  }
                  if (columnObj.isFirstCol === true) {
                    setColumn.isFirstCol = true;
                    // 首列 判断是否是叶子节点 不是则显示展开收起
                    if (row?.is_leaf === "否") {
                      // 有下级节点
                      // if(row?.__indent){
                      //   row?.__indent+=50
                      //   this.$set()
                      // }else{
                      //   row?.__indent = 50
                      // }
                    }
                  }
                  if (item.bx_col_type === "fk") {
                    return h(fkSelector, {
                      attrs: {
                        value: row[column.field],
                        size: "mini",
                        srvInfo: item.option_list_v2,
                        app: this.srvApp,
                        row,
                        column,
                        listType: this.listType,
                        disabled: !columnObj.edit,
                      },
                      on: {
                        onfocus: () => {
                          this.$refs[
                            "tableRef"
                          ].clearCellSelectionCurrentCell();
                        },
                        input: (event) => {
                          // self.$set(row, column.field, event);
                          console.log(row, column.field, event);
                          row[column.field] = event;
                          this.$set(this.tableData, rowIndex, row);
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: column.field,
                            defaultValue: event,
                          });
                          this.$refs["tableRef"].stopEditingCell();
                        },
                      },
                    });
                  } else if (["Date", "DateTime"].includes(item.col_type)) {
                    return h("el-date-picker", {
                      attrs: {
                        disabled:
                          !columnObj.edit ||
                          (row.__flag !== "add" &&
                            row?.__button_auth?.edit === false),
                        value: row[column.field]
                          ? new Date(row[column.field])
                          : "",
                        size: "mini",
                        type: item.col_type.toLowerCase(),
                        style: `width:${
                          item.col_type === "DateTime" ? 180 : 130
                        }px;`,
                        valueFormat: "yyyy-MM-dd HH:mm:ss",
                      },
                      nativeOn: {
                        click: (event) => {
                          event.stopPropagation();
                          event.preventDefault();
                        },
                      },
                      on: {
                        input: (event) => {
                          console.log;
                          // self.$set(row, column.field, event);
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: column.field,
                            defaultValue: event || null,
                          });
                          this.$refs["tableRef"].stopEditingCell();
                        },
                      },
                    });
                  } else if (item.col_type === "Enum") {
                    return h(
                      "el-select",
                      {
                        attrs: {
                          disabled:
                            !columnObj.edit ||
                            (row.__flag !== "add" &&
                              row?.__button_auth?.edit === false),
                          value: row[column.field],
                          size: "mini",
                          clearable: true,
                        },
                        on: {
                          input: (event) => {
                            // self.$set(row, column.field, event);
                            this.$refs["tableRef"].startEditingCell({
                              rowKey: row.rowKey,
                              colKey: column.field,
                              defaultValue: event,
                            });
                            this.$refs["tableRef"].stopEditingCell();
                          },
                        },
                      },
                      item.option_list_v2.map((op) => {
                        return h("el-option", {
                          attrs: {
                            key: op.value,
                            label: op.label,
                            value: op.value,
                          },
                        });
                      })
                    );
                  } else {
                    let editable = true;
                    if (row.__flag === "add") {
                      // 新增行 处理in_add
                      if (this.addColsMap[column.field]?.in_add !== 1) {
                        editable = false;
                      }
                    } else {
                      // 编辑行 处理in_update
                      if (this.updateColsMap[column.field]?.in_update !== 1) {
                        editable = false;
                      }
                    }
                    if (row.__flag !== "add" && !row?.__button_auth?.edit) {
                      editable = false;
                    }
                    return h(RenderHtml, {
                      attrs: {
                        treeInfo: this.treeInfo,
                        row,
                        column: setColumn,
                        editable: editable,
                        html: row[column.field],
                        listType: this.listType,
                      },
                      on: {
                        onfocus: () => {
                          this.$refs[
                            "tableRef"
                          ].clearCellSelectionCurrentCell();
                        },
                        unfold: (event, callback) => {
                          this.loadTree(event, row, rowIndex, callback);
                        },
                        change: (event) => {
                          // self.$set(row, column.field, event);
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: column.field,
                            defaultValue: event || null,
                          });
                          this.$refs["tableRef"].stopEditingCell();
                        },
                      },
                    });
                  }
                };
              } else if (["Date", "DateTime"].includes(item.col_type)) {
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  return h("el-date-picker", {
                    attrs: {
                      disabled:
                        !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                      value: row[column.field]
                        ? new Date(row[column.field])
                        : "",
                      size: "mini",
                      type: item.col_type.toLowerCase(),
                      style: `width:${
                        item.col_type === "DateTime" ? 180 : 130
                      }px;`,
                      valueFormat: "yyyy-MM-dd HH:mm:ss",
                    },
                    nativeOn: {
                      click: (event) => {
                        event.stopPropagation();
                        event.preventDefault();
                      },
                    },
                    on: {
                      input: (event) => {
                        console.log;
                        // self.$set(row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                      },
                    },
                  });
                };
              } else if (item.col_type === "Enum") {
                // columnObj.width = 120;
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  return h(
                    "el-select",
                    {
                      attrs: {
                        disabled:
                          !columnObj.edit ||
                          (row.__flag !== "add" &&
                            row?.__button_auth?.edit === false),
                        value: row[column.field],
                        size: "mini",
                        clearable: true,
                      },
                      on: {
                        input: (event) => {
                          // self.$set(row, column.field, event);
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: column.field,
                            defaultValue: event,
                          });
                          this.$refs["tableRef"].stopEditingCell();
                        },
                      },
                    },
                    item.option_list_v2.map((op) => {
                      return h("el-option", {
                        attrs: {
                          key: op.value,
                          label: op.label,
                          value: op.value,
                        },
                      });
                    })
                  );
                };
              } else {
                // } else if (["Note", "RichText"].includes(item.col_type)) {
                // 富文本 暂时只能展示 不能编辑 可以从别的地方复制然后粘进来
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  let editable = true;
                  if (row.__flag === "add") {
                    // 新增行 处理in_add
                    if (this.addColsMap[column.field]?.in_add !== 1) {
                      editable = false;
                    }
                  } else {
                    // 编辑行 处理in_update
                    if (this.updateColsMap[column.field]?.in_update !== 1) {
                      editable = false;
                    }
                  }
                  if (row.__flag !== "add" && !row?.__button_auth?.edit) {
                    editable = false;
                  }
                  return h(RenderHtml, {
                    attrs: {
                      treeInfo: this.treeInfo,
                      row,
                      column:
                        row.__flag === "add"
                          ? this.addColsMap[column.field]
                          : this.updateColsMap[column.field],
                      editable: editable,
                      html: row[column.field],
                    },
                    on: {
                      change: (event) => {
                        // self.$set(row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                      },
                    },
                  });
                };
              }
            }
            return columnObj;
          })
        );
        return columns;
      }
      columns = columns.concat(
        COLUMN_KEYS.map((keyValue) => {
          return {
            title: keyValue,
            field: keyValue,
            key: keyValue,
            width: 90,
            edit: true,
          };
        })
      );
      return columns;
    },
    buildReqParams() {
      const tableData = JSON.parse(JSON.stringify(this.tableData));
      const reqData = [];
      const addDatas = [];
      const ignoreKeys = [
        "__id",
        "__flag",
        "rowKey",
        "id",
        "__button_auth",
        "_buttons",
      ];
      tableData.forEach((item, index) => {
        if (
          item.__flag === "update" &&
          item.id &&
          this.updateButton?.service_name
        ) {
          const oldItem = this.oldTableData.find((d) => d.__id === item.__id);
          const updateObj = {};
          if (oldItem) {
            Object.keys(oldItem).forEach((key) => {
              if (
                key.indexOf("_") !== 0 &&
                !ignoreKeys.includes(key) &&
                this.updateColsMap?.[key]?.in_update !== 0
              ) {
                if (oldItem[key] !== item[key]) {
                  if (!item[key]) {
                    item[key] = null;
                  }
                  updateObj[key] = item[key];
                }
              }
            });
            if (Object.keys(updateObj)?.length) {
              reqData.push({
                serviceName: this.updateButton.service_name,
                condition: [{ colName: "id", ruleType: "eq", value: item.id }],
                data: [updateObj],
              });
            }
          }
        } else if (item.__flag === "add" && this.addButton?.service_name) {
          const addObj = {
            ...item,
          };
          Object.keys(addObj).forEach((key) => {
            if (addObj[key] === null || this.addColsMap?.[key]?.in_add !== 1) {
              delete addObj[key];
            }
          });
          if (this.defaultConditions?.length) {
            this.defaultConditions.forEach((item) => {
              if (item.value) {
                addObj[item.colName] = item.value;
              }
            });
          } else if (this.fkCondition?.colName) {
            addObj[this.fkCondition.colName] = this.fkCondition.value;
          }

          Object.keys(addObj).forEach((key) => {
            if (ignoreKeys.includes(key) || key.indexOf("__") === 0) {
              delete addObj[key];
            }
          });

          if (
            Object.keys(addObj).length > 0 &&
            Object.keys(addObj).some(
              (key) =>
                addObj[key] !== undefined &&
                addObj[key] !== null &&
                addObj[key] !== ""
            )
          ) {
            addDatas.push(addObj);
          }
        }
      });
      if (addDatas?.length) {
        reqData.push({
          serviceName: this.addButton.service_name,
          data: addDatas,
        });
      }
      return reqData;
    },
    refreshData() {
      this.sortState = [];
      const reqData = this.buildReqParams();
      if (reqData?.length === 0) {
        this.getList();
        return;
      }
      this.$confirm("刷新后之前的操作都将重置, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.getList();
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "用户取消操作",
          });
        });
    },
    deleteRow(rows) {
      const deleIds = rows.map((item) => item.id);
      if (deleIds.length > 0) {
        onDelete(
          deleIds.toString(),
          this.deleteButton?.service_name,
          this.srvApp
        ).then((res) => {
          if (res?.state === "SUCCESS") {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "success",
            });
            this.getList();
          } else if (res?.resultMessage) {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "error",
            });
          }
        });
      }
    },
    // 更新服务列的最小宽度
    saveColumnWidth() {
      const url = `/${this.srvApp}/operate/srvsys_service_columns_query_update`;
      const req = this.calcColumnWidthReq;
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 5000);
      $http.post(url, req).then((res) => {
        if (res?.data?.state === "SUCCESS") {
          this.$message.success(res.data.resultMessage);
          this.updateTableColumn();
          this.columnWidthMap = {};
          this.getV2Data(true).then(() => {
            this.loading = false;
          });
        } else {
          this.$message.error(res.data.resultMessage);
        }
      });
    },
    // 更新表字段的最小宽度
    updateTableColumn() {
      const url = `/${this.srvApp}/operate/srvsys_table_columns_update`;
      const req = this.calcTableColumnWidthReq;
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 5000);
      $http.post(url, req).then((res) => {
        this.loading = false;
        if (res?.data?.state === "SUCCESS") {
          // this.$message.success(res.data.resultMessage);
        } else {
          console.error(`更新表字段失败：${res.data.resultMessage}`);
          this.$message.error(`更新表字段失败：${res.data.resultMessage}`);
        }
      });
    },
    saveData() {
      // const reqData = this.buildReqParams;
      const reqData = this.buildReqParams();
      if (!reqData?.length) {
        this.$message.error("没有需要保存的操作！");
        return;
      }
      if (
        Array.isArray(reqData) &&
        reqData.length > 0 &&
        this.updateButton?.service_name
      ) {
        onBatchOperate(
          reqData,
          this.updateButton.service_name,
          this.srvApp
        ).then((res) => {
          if (res?.state === "SUCCESS") {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "success",
            });
            this.getList();
          } else if (res?.resultMessage) {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "error",
            });
          }
        });
      }
    },
    /**
     *
     * @param {*} index 插入到第几条数据
     * @param {*} parentRow 父节点数据
     */
    insert2Rows(index, parentRow) {
      // 插入到第几行
      if (index >= 0) {
        const __id = uniqueId("table_item_");
        const dataItem = {
          rowKey: __id,
          __id,
          __flag: "add",
          __parent_row: cloneDeep(parentRow),
        };
        this.allFields.forEach((field) => {
          if (field.editable) {
            dataItem[field.columns] = null;
          }
          if (this.addColsMap[field.columns]?.init_expr && field.editable) {
            // 初始值
            let init_expr = this.addColsMap[field.columns]?.init_expr;
            let val = null;
            if (init_expr) {
              init_expr = init_expr.replace(/\'|\"/g, "");
              if (
                init_expr.indexOf("'") == -1 &&
                init_expr.lastIndexOf("'") === init_expr.length - 1
              ) {
                // 变量
                val = eval(init_expr);
              } else {
                val = init_expr;
              }
              const colType = field?.col_type;
              // 日期
              if (val === "new Date()" || val?.indexOf("new Da") > -1) {
                // 兼容单词书写错误的情况
                val = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
              }
              if (
                ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
                colType.includes("decimal")
              ) {
                // 数字类型 初始值处理
                val = Number(val);
              }
              if (val?.includes("top.user.")) {
                let key = val.split("top.user.");
                key = key.length > 1 ? key[1] : "";
                if (key) {
                  let userInfo = sessionStorage.getItem("current_login_user");
                  if (userInfo) {
                    userInfo = JSON.parse(userInfo);
                  }
                  val = userInfo?.[key];
                }
              }
            }
            dataItem[field.columns] = val;
          }
          if (
            this.defaultConditionsMap &&
            this.defaultConditionsMap[field.columns]
          ) {
            dataItem[field.columns] = this.defaultConditionsMap[field.columns];
          }
        });
        if (this.defaultConditions?.length) {
          this.defaultConditions.forEach((item) => {
            if (!dataItem[item.colName]) {
              dataItem[item.colName] = item.value;
            }
          });
        }
        if (parentRow && parentRow[this.treeInfo.idCol]) {
          dataItem[this.treeInfo.pidCol] = parentRow[this.treeInfo.idCol];
          dataItem.__indent = parentRow.__indent ? parentRow.__indent + 40 : 40;
        }
        this.tableData.splice(index, 0, dataItem);
      }
    },
    batchInsertRows() {
      console.log(this.$refs.tableRef.getRangeCellSelection());
      if (this.insertRowNumber > 0) {
        for (let index = 0; index < this.insertRowNumber; index++) {
          // 批量插入数据 每次都插入到第0行
          this.insert2Rows(0);
        }
      }
      this.insertRowNumber = 1;
    },
    loadTree(load, row, rowIndex, callback) {
      if (load) {
        // 加载当前数据的子数据
        let loadingInstance = Loading.service({ fullscreen: true });

        onSelect(
          this.serviceName,
          this.srvApp,
          [
            {
              colName: this.treeInfo.pidCol,
              ruleType: "eq",
              value: row[this.treeInfo.idCol],
            },
          ],
          {
            rownumber: this.page.rownumber,
            pageNo: this.page.pageNo,
            vpage_no: this.v2data?.vpage_no,
            order: this.sortState,
          }
        ).then((res) => {
          loadingInstance.close();
          if (res?.state === "SUCCESS") {
            let tableData = cloneDeep(this.tableData);
            let __indent = 40;
            if (row.__indent === 0 || row.__indent > 0) {
              __indent = row.__indent + 40;
            }

            let resData = res.data.map((item) => {
              const __id = uniqueId("table_item_");
              item.__button_auth = this.setButtonAuth(
                this.v2data?.rowButton,
                item
              );

              let dataItem = {
                rowKey: __id,
                __id,
                __flag: null,
                ...item,
                __indent,
                // 给每一行子数据存储它的父数据
                __parent_row: cloneDeep(row),
              };
              return dataItem;
            });
            this.$set(row, "__children", cloneDeep(resData));
            tableData.splice(rowIndex + 1, 0, ...cloneDeep(resData));
            this.tableData = cloneDeep(tableData);
            let oldTableData = this.oldTableData;
            const oldRowDataIndex = oldTableData.findIndex(
              (item) => item.__id && item.__id === row.__id
            );
            oldTableData.splice(oldRowDataIndex + 1, 0, ...cloneDeep(resData));
            this.oldTableData = cloneDeep(oldTableData);
            callback(true);
          } else {
            callback(false);
          }
        });
      } else {
        // 隐藏当前数据的子数据
        this.tableData = this.tableData.filter((item) => {
          if (item.path) {
            return (
              item[this.treeInfo["idCol"]] === row[this.treeInfo["idCol"]] ||
              !item.path.includes(row[this.treeInfo["idCol"]])
            );
          } else {
            return (
              item[this.treeInfo["pidCol"]] !== row[this.treeInfo["idCol"]]
            );
          }
        });
        callback();
      }
    },
    setButtonAuth(btns, data) {
      const obj = {};
      if (Array.isArray(btns) && btns?.length) {
        btns.forEach((btn, index) => {
          if (
            data?._buttons?.length &&
            data?._buttons?.length === btns?.length
          ) {
            if (data?._buttons[index] === 1) {
              obj[btn.button_type] = true;
            } else if (data?._buttons[index] === 0) {
              obj[btn.button_type] = false;
            }
          } else {
            // 兼容后端没返回_buttons的情况
            obj[btn.button_type] = btn.permission === true;
          }
        });
      }
      return obj;
    },
    async getList() {
      if (this.serviceName) {
        this.loading = true;
        const res = await onSelect(
          this.serviceName,
          this.srvApp,
          this.defaultConditions,
          {
            rownumber: this.page.rownumber,
            pageNo: this.page.pageNo,
            vpage_no: this.v2data?.vpage_no,
            order: this.sortState,
            isTree: this.isTree && this.listType === "treelist",
            pidCol: this.treeInfo?.pidCol,
            forceUseTTD: this.$route?.query?.topTreeData,
          }
        );
        this.loading = false;

        if (res?.data?.length) {
          res.data = res.data.map((item) => {
            item.__button_auth = this.setButtonAuth(
              this.v2data?.rowButton,
              item
            );
            return item;
          });
        }
        this.page.total = res.page.total;

        let tableData = [];
        for (let i = 0; i < res.data.length; i++) {
          const __id = uniqueId("table_item_");
          let dataItem = {
            rowKey: __id,
            __id,
            __flag: null,
            ...res.data[i],
            // __flag: "update",
          };
          tableData.push(dataItem);
        }

        this.tableData = tableData;

        this.oldTableData = JSON.parse(JSON.stringify(tableData));
        this.recordManager = new RecordManager();
        this.recordManager?.push(cloneDeep(this.oldTableData));
        if (tableData.length === 0) {
          this.insert2Rows(0);
        }
      }
    },
    async getV2Data(force = false) {
      const res = await getServiceV2(
        this.serviceName,
        this.listType,
        this.srvApp,
        this.pageNo,
        force
      );
      if (res?.state === "SUCCESS") {
        this.v2data = res.data;
        const editBtn = res.data?.rowButton?.find(
          (item) => item.button_type === "edit"
        );
        if (editBtn?.service_name) {
          const ress = await getServiceV2(
            editBtn.service_name,
            "update",
            this.srvApp,
            this.pageNo
          );
          this.updateColsMap = ress?.data?.srv_cols?.reduce((pre, cur) => {
            pre[cur.columns] = cur;
            return pre;
          }, {});
        }
        const addBtn = res.data?.gridButton?.find(
          (item) => item.button_type === "add"
        );
        if (addBtn?.service_name) {
          const ress = await getServiceV2(
            addBtn.service_name,
            "add",
            this.srvApp,
            this.pageNo
          );
          this.addColsMap = ress?.data?.srv_cols?.reduce((pre, cur) => {
            pre[cur.columns] = cur;
            return pre;
          }, {});
        }

        this.v2data.allFields = buildSrvCols(
          this.v2data.srv_cols,
          this.updateColsMap,
          this.addColsMap
        );
        this.allFields = this.v2data.allFields;
        this.listColsMap = this.allFields?.reduce((pre, cur) => {
          pre[cur.columns] = cur;
          return pre;
        }, {});
        document.title = res.data.service_view_name;
        this.columns = this.buildColumns();
      }
    },
    scrolling({ startRowIndex }) {
      this.startRowIndex = startRowIndex;
    },
    /**
     * @description 绑定ctrl+z ctrl+y事件
     * @param {*} callBackCZ 撤销/回退事件
     * @param {*} callBackCY 前进事件
     */
    bindKeyboardEvent(callBackCZ = null, callBackCY = null) {
      //记录特殊键被按下
      let ctrlDown = false;
      let shiftDown = false;
      window.addEventListener("keydown", (e) => {
        if (["Control", "Meta"].includes(e.key)) {
          ctrlDown = true;
        }
        if (e.key === "Shift") {
          shiftDown = true;
        }
        if (ctrlDown) {
          if (
            (shiftDown && ["z", "Z"].includes(e.key)) ||
            (!shiftDown && ["Y", "y"].includes(e.key))
          ) {
            // 前进/重做 shift+ctrl+z | ctrl+y
            callBackCY?.();
          } else if (!shiftDown && ["z", "Z"].includes(e.key)) {
            //后退/撤销 ctrl+z
            callBackCZ?.();
          }
        }
      });
      // 松开按键
      window.addEventListener("keyup", function (e) {
        if (["Control", "Meta"].includes(e.key)) {
          ctrlDown = false;
        }
        if (e.key === "Shift") {
          shiftDown = false;
        }
      });
      // 浏览器脱离焦点，释放
      window.onblur = function () {
        ctrlDown = false;
        shiftDown = false;
      };
    },
  },
};
</script>
<style lang="scss">
.table-body-cell__add {
  background-color: #a4da89 !important;
  .el-select .el-input {
    .el-select__caret {
      color: #fff;
    }
    .el-input__inner::placeholder {
      color: #fff;
    }
  }
  .el-icon-arrow-right {
    color: #fff;
  }
}
.table-body-cell__update {
  // color: #2087cc !important;
  color: #cc0000 !important;
  .el-input {
    .el-input__inner {
      // color: #2087cc !important;
      color: #cc0000 !important;
    }
  }
  // background-color: #2087CC !important;
}
// .table-body-cell__update_border {
//   border: 1px solid #2087cc !important;
// }
.ve-table-header-th,
.ve-table-body-td {
  padding: 10px 0 !important;
}
.spreadsheet {
  width: 100vw;
  height: 100vh;
  // padding: 0 10px;
  // margin: 20px 0;
  .el-select .el-input__inner {
    border: none !important;
    background-color: transparent !important;
  }
  .el-select .el-icon-arrow-right {
  }
}

.ve-table-container {
  min-height: 60px;
}
.custom-contextmenu {
  position: fixed;
  background-color: #fff;
}
</style>
