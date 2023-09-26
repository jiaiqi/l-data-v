<template>
  <div class="spreadsheet" v-loading="loading">
    <div
      class="flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 p-x-5"
    >
      <div class="flex w-100 items-center text-sm">
        <div class="m-r-2">添加</div>
        <el-input-number size="mini" v-model="insertRowNumber" style="width:100px"/>
        <div class="m-x-2">行</div>
        <el-button
          size="mini"
          type="primary"
          @click="batchInsertRows"
          :disabled="insertRowNumber === 0"
          >添加</el-button
        >
      </div>

      <div class="flex flex-items-center">
        <div class="color-map flex flex-items-center m-r-20">
          <div class="color-map-item flex flex-items-center">
            <div class="color bg-[#effbf2] w-4 h-4 m-r-2 rounded"></div>
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
          :disabled="buildReqParams.length === 0"
          >保存</el-button
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
      :columnHiddenOption="columnHiddenOption"
    />
    <div class="text-center">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page.pageNo"
        :page-sizes="[20, 50, 100, 200, 500]"
        :page-size="page.rownumber"
        layout="total, sizes, pager,  jumper"
        :total="page.total"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script>
import {
  getServiceV2,
  onSelect,
  onBatchOperate,
  onDelete,
} from "../../service/api";
import { buildSrvCols } from "@/utils/sheetUtils";
import { COLUMN_KEYS } from "@/utils/constant";
import { isEmpty, uniqueId, cloneDeep } from "lodash-es";
import { Message } from "element-ui"; // 引入elementUI的Message组件
import HeaderCell from "./components/header-cell.vue";
import fkSelector from "./components/fk-selector.vue";
// import { diffString, diff } from "json-diff";
import { RecordManager } from "./util/recordManager.js";

export default {
  name: "SheetEditor",
  mounted() {
    this.bindKeyboardEvent(this.undo, this.redo);
    if (this.serviceName) {
      this.getV2Data().then(() => {
        this.getList().then(() => {
          this.recordManager?.push(cloneDeep(this.oldTableData));
        });
      });
    }
  },
  data() {
    return {
      page: {
        total: 0,
        rownumber: 50,
        pageNo: 1,
      },
      listColsMap: null,
      addColsMap: null,
      updateColsMap: null,
      loading: false,
      recordManager: new RecordManager(),
      columns: [],
      cellStyleOption: {
        bodyCellClass: ({ row, column, rowIndex }) => {
          if (row?.__flag === "add") {
            // 新增数据 整行某个字段有值后 增加class
            return Object.keys(row).some(
              (key) => !["__flag", "rowKey", "__id"].includes(key) && !!row[key]
            )
              ? "table-body-cell__add"
              : "";
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
      insertRowNumber: 0,
      startRowIndex: 0,
      // 是否开启列宽可变
      columnWidthResizeOption: {
        enable: true,
        minWidth: 30,
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
                        /^-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(changeValue) !==
                        true
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
          if (
            ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
            colType.includes("decimal")
          ) {
            // 数字 校验
            if (/^-?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(changeValue) !== true) {
              this.$message({
                message: "请输入数字",
                type: "warning",
              });
              return false;
            }
          }
        },
        afterCellValueChange: ({ row, column, changeValue }) => {
          console.log("afterCellValueChange", row, column, changeValue);

          if (row.__id && row.__flag !== "add") {
            row.__flag = "update";
          }
          this.recordManager?.push(cloneDeep(this.tableData));
          // console.log(this.tableData);
        },
        beforeStartCellEditing: ({ row, column, cellValue }) => {
          console.log(row, column, cellValue);
          if (column.__field_info.col_type !== "String") {
            return;
          }
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
      // body 右键菜单配置
      contextmenuBodyOption: {
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
          const startRowIndex = selectionRangeIndexes.startRowIndex;

          if (type === "insertRowBelow") {
            const index = selectionRangeIndexes.startRowIndex;
            this.insert2Rows(index + 1);
          } else if (type === "insertRowAbove") {
            const index = selectionRangeIndexes.startRowIndex;
            this.insert2Rows(index);
          } else if (type === "removeRow") {
            let willDeleteLocalRows = []; //新增待删除行
            let willDeleteOriginRows = []; //远程数据中的待删除行
            this.tableData.forEach((item, index) => {
              if (startRowIndex >= 0 && index <= endRowIndex) {
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
        contextmenus: [
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
            type: "insertRowBelow",
            label: "下方插入行",
          },
          {
            type: "SEPARATOR",
          },
          {
            type: "removeRow",
            label: "删除选中行数据",
          },
        ],
      },
      // 行样式配置
      rowStyleOption: {
        clickHighlight: false,
        hoverHighlight: true,
      },
      tableData: [],
      oldTableData: [],
      list: {},
      v2data: {},
      allFields: [],
    };
  },
  computed: {
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
      if (query && Object.keys(query).length > 0) {
        let defaultConditions = [];
        Object.keys(query).forEach((key) => {
          if (!["srvApp"].includes(key)) {
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
        return defaultConditions;
      }
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
    buildReqParams() {
      const tableData = JSON.parse(JSON.stringify(this.tableData));
      const reqData = [];
      const addDatas = [];
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
                !["__id", "__flag", "rowKey", "id"].includes(key) &&
                this.updateColsMap?.[key]?.in_update === 1
              ) {
                if (oldItem[key] !== item[key]) {
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
              addObj[item.colName] = item.value;
            });
          } else if (this.fkCondition?.colName) {
            addObj[this.fkCondition.colName] = this.fkCondition.value;
          }
          delete addObj.__id;
          delete addObj.__flag;
          delete addObj.rowKey;
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
            // reqData.push({
            //   serviceName: this.addButton.service_name,
            //   data: [addObj],
            // });
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

    tableHeader() {
      return this.v2data?.allFields;
    },
    serviceName() {
      return this.$route.params?.service || this.$route.query?.service;
    },
    srvApp() {
      return (
        this.$route.params?.app ||
        this.$route.query?.srvApp ||
        sessionStorage.getItem("current_app")
      );
      // return (
      //   this.$route.params?.app ||
      //   this.$route.query?.app ||
      //   this.$route.query?.srvApp ||
      //   sessionStorage.getItem("current_app")
      // );
    },
  },
  methods: {
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
      const self = this;
      const startRowIndex = this.startRowIndex;
      let columns = [
        {
          field: "index",
          key: "index",
          operationColumn: true,
          title: "#",
          width: 80,
          fixed: "left",
          renderBodyCell: function ({ rowIndex }) {
            return startRowIndex + rowIndex + 1;
          },
          // renderBodyCell: this.renderRowIndex,
        },
      ];
      if (Array.isArray(this.allFields) && this.allFields.length > 0) {
        let minWidth = (window.innerWidth + 50) / this.allFields.length;
        if (minWidth < 200) {
          minWidth = 200;
        }
        columns = columns.concat(
          this.allFields.map((item) => {
            const columnObj = {
              title: item.label,
              field: item.columns,
              key: item.columns,
              width: minWidth,
              edit:
                (item.editable === true &&
                  [
                    "String",
                    "MultilineText",
                    "Enum",
                    "Integer",
                    "Float",
                    "Money",
                    "Date",
                    "DateTime",
                    "int",
                  ].includes(item.col_type)) ||
                item.col_type.includes("decimal") ||
                item.bx_col_type == "fk",
              // edit: ['Integer', 'String', 'Float', "Money"].includes(item.col_type) || item.col_type.includes('decimal'),
              __field_info: { ...item },
            };

            if (this.defaultConditions?.length) {
              // columnObj.edit =
              //   columnObj.edit &&
              //   this.defaultConditions?.every(
              //     (col) => col.colName !== item.columns
              //   );
              columnObj.disabled = this.defaultConditions.some(
                (col) => col.colName === item.columns
              );
              columnObj.edit = !columnObj.disabled && columnObj.edit;
            }

            columnObj.renderHeaderCell = ({ column }, h) => {
              return h(HeaderCell, {
                attrs: {
                  column: { ...item, edit: columnObj.edit },
                },
              });
            };

            if (["MultilineText"].includes(item.col_type)) {
              columnObj.align = "left";
            }
            if (!columnObj.disabled) {
              // if (
              //   ["Integer", "Float", "Money",'int','Int'].includes(item.col_type) ||
              //   item.col_type.includes("decimal")
              // ) {
              //   let precision = null;
              //   let step = 1;
              //   if (["Float", "Money"].includes(item.col_type)) {
              //     precision = 2;
              //     step = 0.01;
              //   }
              //   if (item.col_type.includes("decimal")) {
              //     const str = item.col_type;
              //     const regex = /decimal\((\d+),(\d+)\)/;
              //     const match = str.match(regex);
              //     precision = match[2] * 1;
              //     step = 1 / 10 ** match[2];
              //   }
              //   columnObj.width = 150;
              //   columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
              //     return h("elInputNumber", {
              //       attrs: {
              //         value: row[column.field] || undefined,
              //         size: "mini",
              //         step,
              //         precision,
              //       },
              //       nativeOn: {
              //         click: (event) => {
              //           event.stopPropagation();
              //           event.preventDefault();
              //         },
              //       },
              //       on: {
              //         input: (event) => {
              //           if (
              //             event !== undefined &&
              //             event !== row[column.field]
              //           ) {
              //             this.$refs["tableRef"].startEditingCell({
              //               rowKey: row.rowKey,
              //               colKey: column.field,
              //               defaultValue: event,
              //             });
              //             this.$refs["tableRef"].stopEditingCell();
              //           }
              //           // self.$set(row, column.field, event);
              //         },
              //       },
              //     });
              //   };
              // } else
              if (item.bx_col_type === "fk") {
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  return h(fkSelector, {
                    attrs: {
                      value: row[column.field],
                      size: "mini",
                      srvInfo: item.option_list_v2,
                      app: this.srvApp,
                      row,
                      column,
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
                  });
                };
              } else if (["Date", "DateTime"].includes(item.col_type)) {
                columnObj.width = 150;
                if (item.col_type === "DateTime") {
                  columnObj.width = 200;
                }
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  return h("el-date-picker", {
                    attrs: {
                      value: row[column.field],
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
                        // self.$set(row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                      },
                    },
                  });
                };
              } else if (item.col_type === "Enum") {
                columnObj.width = 120;
                columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {
                  return h(
                    "el-select",
                    {
                      attrs: {
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
    refreshData() {
      if (this.buildReqParams?.length === 0) {
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
    saveData() {
      const reqData = this.buildReqParams;
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
    insert2Rows(index) {
      // 插入到第几行
      if (index >= 0) {
        const __id = uniqueId("table_item_");
        const dataItem = {
          rowKey: __id,
          __id,
          __flag: "add",
        };
        this.allFields.forEach((field) => {
          if (field.editable) {
            dataItem[field.columns] = null;
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
        this.tableData.splice(index, 0, dataItem);
      }
    },
    batchInsertRows() {
      if (this.insertRowNumber > 0) {
        for (let index = 0; index < this.insertRowNumber; index++) {
          // 批量插入数据 每次都插入到第0行
          this.insert2Rows(0);
        }
      }
      this.insertRowNumber = 0
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
          }
        );
        this.loading = false;

        this.list.data = res.data;
        // this.tableData = res.data
        this.list.page = res.page;
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

        // for (let i = res.data.length - 1; i >= 0; i--) {
        //   const __id = uniqueId("table_item_");
        //   let dataItem = {
        //     rowKey: __id,
        //     __id,
        //     __flag: null,
        //     ...res.data[i],
        //     // __flag: "update",
        //   };
        //   tableData.push(dataItem);
        // }
        this.tableData = tableData;

        this.oldTableData = JSON.parse(JSON.stringify(tableData));
        if (tableData.length === 0) {
          this.insert2Rows(0);
        }
        // this.$nextTick(() => {
        //   this.$refs["tableRef"].scrollToRowKey({
        //     rowKey: this.tableData[this.tableData.length - 1]["__id"],
        //   });
        // });
      }
    },
    async getV2Data() {
      const res = await getServiceV2(this.serviceName, "list", this.srvApp);
      if (res?.state === "SUCCESS") {
        this.v2data = res.data;
        const editBtn = res.data?.rowButton?.find(
          (item) => item.button_type === "edit"
        );
        if (editBtn?.service_name) {
          const ress = await getServiceV2(
            editBtn.service_name,
            "update",
            this.srvApp
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
            this.srvApp
          );
          this.addColsMap = ress?.data?.srv_cols?.reduce((pre, cur) => {
            pre[cur.columns] = cur;
            return pre;
          }, {});
        }

        this.v2data.allFields = await buildSrvCols(
          this.v2data.srv_cols,
          this.updateColsMap,
          this.addColsMap
        );
        this.allFields = this.v2data.allFields;
        this.listColsMap = this.allFields?.reduce((pre, cur) => {
          pre[cur.columns] = cur;
          return pre;
        }, {});
        // this.initTableData();
        document.title = res.data.service_view_name;
        this.columns = this.buildColumns();
      }
    },
    scrolling({ startRowIndex }) {
      this.startRowIndex = startRowIndex;
    },
    // 初始化表格
    initTableData() {
      let tableData = [];
      for (let i = 0; i < 100; i++) {
        const __id = uniqueId("table_item_");
        let dataItem = {
          rowKey: __id,
          __id,
        };
        this.allFields.forEach((field) => {
          dataItem[field.columns] = "";
        });
        tableData.push(dataItem);
      }
      this.tableData = tableData;
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
.spreadsheet {
  width: 100vw;
  height: 100vh;
  // padding: 0 10px;
  // margin: 20px 0;
  .el-select .el-input__inner {
    border: none !important;
    background-color: transparent !important;
  }
}

.ve-table-container {
  min-height: 60px;
}
</style>
