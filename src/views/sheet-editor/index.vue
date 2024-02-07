<template>
  <div class="spreadsheet flex flex-col" v-loading="loading">
    <div class="flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 p-x-5 w-full">
      <div class="flex flex-1 items-center text-sm" v-if="addButton && addButton.service_name">
        <div class="m-r-2">添加</div>
        <el-input-number size="mini" v-model="insertRowNumber" style="width: 100px" />
        <div class="m-x-2">行</div>
        <el-button size="mini" type="primary" @click="batchInsertRows" :disabled="insertRowNumber === 0">添加</el-button>
      </div>
      <div class="text-sm text-gray cursor-not-allowed" v-else>
        没有添加权限
      </div>
      <div flex-1>
        <el-radio-group v-model="listType" @input="listTypeChange" size="mini" v-if="isTree">
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
        <!-- <el-button size="mini" type="primary" @click="repari">修复</el-button> -->
        <el-button size="mini" type="primary" @click="refreshData">刷新</el-button>
        <el-button size="mini" type="primary" @click="saveData"
          :disabled="!calcReqData || calcReqData.length == 0">保存</el-button>
        <el-button size="mini" type="primary" @click="saveColumnWidth"
          :disabled="!calcColumnWidthReq || calcColumnWidthReq.length == 0"
          v-if="calcColumnWidthReq && calcColumnWidthReq.length > 0">保存样式</el-button>
      </div>
    </div>
    <div class="flex-1" v-if="isFetched">
      <ve-table ref="tableRef" style="word-break: break-word; width: 100vw" max-height="calc(100vh - 80px)" fixed-header
        :scroll-width="0" border-y :columns="columns" :table-data="tableData" row-key-field-name="rowKey"
        :virtual-scroll-option="virtualScrollOption" :cell-autofill-option="cellAutofillOption"
        :cell-style-option="cellStyleOption" :edit-option="editOption" :clipboard-option="clipboardOption"
        :contextmenu-body-option="contextmenuBodyOption" :contextmenu-header-option="contextmenuHeaderOption"
        :row-style-option="rowStyleOption" :column-width-resize-option="columnWidthResizeOption"
        :event-custom-option="eventCustomOption" :columnHiddenOption="columnHiddenOption" />
    </div>
    <div class="empty-data" v-if="page.total === 0 && !loading">暂无数据</div>
    <div class="text-center">
      <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="page.pageNo"
        :page-sizes="[10, 20, 50, 100, 200, 500]" :page-size="page.rownumber" layout="total, sizes, pager,  jumper"
        :total="page.total">
      </el-pagination>
    </div>

    <select-parent-node ref="changeParentRef" :topTreeData="topTreeData" :srvApp="srvApp" :options="tableData.filter((item) => item.__flag !== 'add' && !item.__indent)
      " :option-info="parentColOption" @confirm="updateParentNo"></select-parent-node>

    <login-dialog ref="loginRef"></login-dialog>
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
import { uniqueId, cloneDeep } from "lodash-es";
import { Message } from "element-ui"; // 引入elementUI的Message组件
import HeaderCell from "./components/header-cell.vue";
import fkSelector from "./components/fk-selector.vue";
import RenderHtml from "./components/render-html.vue";
import FileUpload from "./components/file-upload.vue";
import selectParentNode from "./components/select-parent-node.vue";
import fkAutocomplate from "./components/fk-autocomplate.vue";
import { RecordManager } from "./util/recordManager.js";
import { Loading } from "element-ui";
import { $http } from "../../common/http";
import loginDialog from '../../components/login-dialog/index.vue'
import { processStrings,appendNumber } from '../../common/common'

const ignoreKeys = [
  "__id",
  "__flag",
  "rowKey",
  "id",
  "__button_auth",
  "_buttons",
  "__unfold",
];

export default {
  name: "SheetEditor",
  mounted() {
    this.tableMaxHeight = document.body.clientHeight - 80
    window.addEventListener('resize', () => {
      this.tableMaxHeight = document.body.clientHeight - 80
    })
    this.bindKeyboardEvent(this.undo, this.redo);
    this.initPage().then(() => {
      if (this.v2data?.is_tree === true && this.listType !== "treelist") {
        this.listType = "treelist";
        this.initPage();
      }
    });
  },
  components: {
    selectParentNode,
    loginDialog
  },
  data() {
    return {
      initExprCols: [],
      initCond: [],
      tableMaxHeight: 1000,
      onPopup: false,//弹窗是否打开状态
      calcReqData: null,
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
      isFetched: false, //数据加载完成
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
            !["__flag", "rowKey", "__id", "__unfold"].includes(column.field)
          ) {
            // 某行某列绑定的值跟备份的数据中此行此列绑定的值不同时  增加class
            const oldRowData = this.oldTableData.find(
              (item) => item.__id && item.__id === row.__id
            );
            if (row[column.field] !== oldRowData[column.field]) {
              if (row[column.field] === null || row[column.field] === "") {
                return "table-body-cell__update null-value";
              }
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
        beforeAutofill: ({
          direction,
          sourceSelectionRangeIndexes,
          targetSelectionRangeIndexes,
          sourceSelectionData,
          targetSelectionData,
        }) => {
          console.log(direction,
            sourceSelectionRangeIndexes,
            targetSelectionRangeIndexes,
            sourceSelectionData,
            targetSelectionData);
          if (sourceSelectionRangeIndexes.startRowIndex !== targetSelectionRangeIndexes.endRowIndex) {
            if (sourceSelectionData?.length > 1) {
              let val = null
              let key = Object.keys(sourceSelectionData[0]).find(e => e !== 'rowKey')
              let customFill = sourceSelectionData.every((item, index) => {
                if (index <= sourceSelectionData.length - 1 && index > 0 && !isNaN(Number(item[key]))) {
                  val = item[key] - sourceSelectionData[index - 1][key]
                  if (val === item[key] - sourceSelectionData[index - 1][key]) {
                    return true
                  }
                  return false
                }
                return true
              })
              if (sourceSelectionData.length === 2 && sourceSelectionData[0][key] !== sourceSelectionData[1][key]) {
                if (!isNaN(sourceSelectionData[1][key] - sourceSelectionData[0][key])) {
                  customFill = true
                  val = sourceSelectionData[1][key] - sourceSelectionData[0][key]
                }
              }

              if (customFill) {
                let lastVal = sourceSelectionData[sourceSelectionData.length - 1][key]
                let diff = null
                if (sourceSelectionData.length > 1) {
                  diff = processStrings(sourceSelectionData[0][key], sourceSelectionData[1][key])?.diff
                }
                if (diff) {
                  let isProcess = sourceSelectionData.every((item, index) => {
                    if (index === sourceSelectionData.length - 1) {
                      return true
                    }
                    return processStrings(item[key], sourceSelectionData[index + 1][key])?.diff === diff
                  })
                  if (isProcess) {
                    this.tableData.forEach(item => {
                      let index = targetSelectionData.findIndex(e => e.rowKey && e.rowKey === item.rowKey)
                      if (index > -1){
                        // 等差递增
                        let curVal = appendNumber(lastVal,diff,index+1)
                        if(typeof lastVal==="number"){
                          curVal = Number(curVal)
                        }
                        this.$set(item, key, curVal)
                      }
                    })
                    this.triggerEditCell(targetSelectionRangeIndexes)
                    return false
                  }
                }

                this.tableData.forEach((item) => {
                  let index = targetSelectionData.findIndex(e => e.rowKey && e.rowKey === item.rowKey)
                  if (index > -1) {
                    // 等差递增
                    let curVal = Number(lastVal) + val * (index + 1)
                    if (typeof lastVal === 'string') {
                      curVal = curVal + ''
                    }
                    this.$set(item, key, curVal)
                  }
                })
                this.triggerEditCell(targetSelectionRangeIndexes)
                return false
              }
            }
          }
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
                      this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
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
              this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
            }
          }
        },
      },
      // 单元格编辑配置
      editOption: {
        beforeCellValueChange: ({ row, column, changeValue }) => {
          const colType = column?.__field_info?.col_type;
          // console.log(row, column, changeValue);
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
          // console.log("beforeStartCellEditing：",row,column, cellValue);
          // const colType = column?.__field_info?.col_type;
          // if(column?.__field_info?.bx_col_type==='fk'){
          //   return false
          // }
          let oldRowData = this.oldTableData.find(
            (item) => item.__id === row.__id
          );
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
            if (this.updateColsMap?.[column.field]?.in_update !== 1) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
          }
          // let editBtnIndex = this.v2data.rowButton?.findIndex(item=>item.button_type==='edit')
          // if (row.__flag !== "add" && !row?._buttons[editBtnIndex]) {
          if (
            row.__flag !== "add" &&
            !row?.__button_auth?.edit &&
            oldRowData?.[column.field] !== row[column.field]
          ) {
            Message.error("没有当前行的编辑权限！");
            if (oldRowData) {
              // 恢复原来的值
              const index = this.tableData.findIndex(
                (item) => item.__id === row.__id
              );
              let rowData = this.tableData[index];
              this.$set(rowData, column.field, oldRowData[column.field]);
            }
            this.$nextTick(() => {
              this.$refs["tableRef"].stopEditingCell();
              this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
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
          if (column?.__field_info?.redundant_options?._target_column) {
            // 处理autocomplete对应的fk字段
            console.log('changeValue:', changeValue, column.field);
            const col = column?.__field_info?.redundant_options?._target_column;

            if (!changeValue) {
              // 清空值后，对应fk字段的值也要清空

              const fkColumnInfo = this.setAllFields.find(item => item.columns === col)
              if (fkColumnInfo && row[col]) {
                row[col] = null;
                this.$set(this.tableData, rowIndex, row);
                // this.$refs["tableRef"].startEditingCell({
                //   rowKey: row.rowKey,
                //   colKey: col,
                //   defaultValue: null,
                // });
                // this.$refs["tableRef"].stopEditingCell();
                this.handlerRedundant({}, col, row.rowKey, rowIndex);
              }
            } else {
              // this.handlerRedundant({}, col, row.rowKey, rowIndex);

            }
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
  watch: {
    tableData: {
      deep: true,
      handler(newValue, oldValue) {
        const currentSelection = this.$refs?.tableRef?.getRangeCellSelection();
        console.log(currentSelection);
        this.calcReqData = this.buildReqParams();
        if (
          currentSelection?.selectionRangeIndexes?.startRowIndex &&
          currentSelection?.selectionRangeIndexes?.startRowIndex !== -1
        ) {
          this.triggerEditCell(currentSelection?.selectionRangeIndexes);
        }
      },
    },
  },
  computed: {
    setAllFields() {
      // 所有字段
      return this.v2data?.srv_cols || []
    },
    topTreeData() {
      return !!this.$route?.query?.topTreeData
    },
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
            // 添加下级节点后展开当前节点
            this.$set(this.tableData[startRowIndex], "__unfold", true);
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
            let lastChildIndex = -1;
            if (this.listType === "treelist" && this.treeInfo?.pidCol) {
              // 树列表 下方插入行时判断当前行有没有子节点 有的话则新增行在子节点之后
              lastChildIndex = this.tableData.findLastIndex(
                (item) =>
                  item[this.treeInfo.pidCol] === startRow[this.treeInfo.idCol]
              );
              // 如果当前行有子节点 则新增行在子节点之后
              if (lastChildIndex != -1) {
                startRowIndex = lastChildIndex;
              }
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
            let text = `此操作将永久删除该第${selectionRangeIndexes.startRowIndex + 1
              }至第${selectionRangeIndexes.endRowIndex + 1
              }行数据，是否继续操作？`;
            if (
              selectionRangeIndexes.endRowIndex -
              selectionRangeIndexes.startRowIndex ==
              0
            ) {
              text = `此操作将永久删除该第${selectionRangeIndexes.startRowIndex + 1
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
          ).filter(item => !this.setFilterState.find(e => e.colName === item)),
        };
      }
    },
    defaultConditions() {
      const query = this.$route.query;
      let defaultConditions = [];
      if (query && Object.keys(query).length > 0) {
        Object.keys(query).forEach((key) => {
          if (
            ![
              "srvApp",
              "isTree",
              "topTreeData",
              "fixedCol",
              "initCond",
              'colSrv' // 用来查找显示的列的服务
            ].includes(key)
          ) {
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
    tableHeader() {
      return this.v2data?.allFields;
    },
    serviceName() {
      return this.$route.params?.service || this.$route.query?.service;
    },
    colSrv() {
      return this.$route.params?.colSrv || this.$route.query?.colSrv;
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
    repari() {
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 10);
    },
    isFk(column) {
      if (column?.col_type || column?.bx_col_type) {
        const fkTypes = ["User", "Dept", "bxsys_user", "bxsys_dept", 'fk'];
        return fkTypes.includes(column.col_type) || column.bx_col_type === 'fk' || column.bx_col_type?.indexOf('bx') === 0
      }
    },
    explainValue(value, column) {
      let userInfo = sessionStorage.getItem("current_login_user") || "";
      if (value?.includes("top.user.")) {
        let key = value.split("top.user.");
        key = key.length > 1 ? key[1] : "";
        if (key) {
          if (userInfo) {
            userInfo = JSON.parse(userInfo);
          }
          value = userInfo?.[key];
        }
      } if (value?.includes("userInfo.")) {
        let key = value.split("userInfo.");
        key = key.length > 1 ? key[1] : "";
        if (key) {
          if (userInfo) {
            userInfo = JSON.parse(userInfo);
          }
          value = userInfo?.[key];
        }
      } else if (value?.includes("new Date()")) {
        value = dayjs().format("YYYY-MM-DD");
      } else if (['本人'].includes(value) && column && this.isFk(column)) {
        value = userInfo?.user_no;
      }
      return value
    },
    buildInitCond() {
      let arr = [];
      let initExprFields = this.initExprCols
      // || this.allFields.filter(item => !!item.init_expr)
      // 只有init_expr 使用init_expr
      if (initExprFields?.length) {
        initExprFields.forEach(item => {
          if (this.filterState[item.columns] !== null && !this.filterState[item.columns]) {
            let obj = {
              colName: item.columns,
              ruleType: 'eq'
            }
            if (item.init_expr?.indexOf("'") === 0) {
              obj.value = item.init_expr.replaceAll("'", '')
            }
            if (obj.value) {
              arr.push(obj)
            }
          }

        })
      }
      if (this.$route?.query?.initCond) {
        let str = this.$route?.query?.initCond;
        try {
          str = JSON.parse(decodeURIComponent(str));
          if (Array.isArray(str) && str?.length) {
            str.forEach((item) => {
              item.value = this.explainValue(item.value)
              // init_expr跟initCond都有 使用initCond
              arr = arr.filter(e => e.colName !== item.colName)
              arr.push(item);
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
      let query_init_value_lsit = this.v2data.srv_cols.filter(item => item.query_init_value?.value)
      if (query_init_value_lsit?.length) {
        query_init_value_lsit.forEach(item => {
          let obj = {
            colName: item.columns,
            ruleType: 'eq',
            value: item.query_init_value.value
          }
          obj.value = this.explainValue(obj.value)
          if (Array.isArray(obj.value) && obj.value.length === 2) {
            obj.ruleType = 'between'
          } else if (Array.isArray(obj.value)) {
            obj.ruleType = 'in'
            obj.value = obj.value.join(',')
          }
          // 优先使用query_init_value配置的初始查询条件
          arr = arr.filter(e => e.colName !== obj.colName)
          arr.push(obj)
        })
      }
      this.initCond = arr
    },
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
    async initPage(refresh = true) {
      if (this.serviceName) {
        this.loading = true;
        const v2Data = await this.getV2Data();
        this.buildInitCond()
        this.loading = false;
        if (refresh) {
          setTimeout(() => {
            this.isFetched = false
            this.getList().then(()=>{
              this.isFetched = true
            });
          }, 500);
        }
        return;
      }
    },
    listTypeChange(val) {
      console.log(val);
      this.initPage()
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
      // 触发编辑事件
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
          // this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
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
              edit: item.editable === true || item.canAdd == true, // 不再根据字段类型控制是否可编辑，所有类型字段都可以编辑，未适配的类型当作String处理
              // ((item.editable === true || item.canAdd == true) &&
              //   [
              //     "String",
              //     "User",
              //     "Note",
              //     "RichText",
              //     "MultilineText",
              //     "Enum","Dict",
              //     "Set",
              //     "Integer",
              //     "Float",
              //     "Money",
              //     "Date",
              //     "DateTime",
              //     "int",
              //   ].includes(item.col_type)) ||
              // item?.col_type?.includes("decimal") ||
              // item?.bx_col_type == "fk",
              // edit: ['Integer', 'String', 'Float', "Money"].includes(item.col_type) || item.col_type.includes('decimal'),
              __field_info: { ...item },
            };

            // Image
            if (index === 0) {
              if (this.isTree) {
                // 首列 如果有下级则展示展开折叠图标
                columnObj.isFirstCol = true;
              }
            }
            // // 设置固定列
            // let fixedCol = Number(this.$route.query?.fixedCol || 1);
            // if (isNaN(fixedCol)) {
            //   fixedCol = 1;
            // }
            // for (let fIndex = 0; fIndex < fixedCol; fIndex++) {
            //   if (index === fIndex) {
            //     columnObj.fixed = "left";
            //   }
            // }

            // if (this.defaultConditions?.length) {
            //   columnObj.disabled = this.defaultConditions.some(
            //     (col) => col.colName === item.columns
            //   );
            //   columnObj.edit = !columnObj.disabled && columnObj.edit;
            // }

            columnObj.renderHeaderCell = ({ column }, h) => {
              const conditions = [...this.initCond, ...this.defaultConditions]
              // const conditions = [...this.defaultConditions]
              // if (Array.isArray(this.initCond) && this.initCond.length) {
              //   this.initCond.forEach(item => {
              //     if (!conditions.find(col => col.colName === item.colName)) {
              //       conditions.push(item)
              //     }
              //   })
              // }
              return h(HeaderCell, {
                attrs: {
                  app: this.srvApp,
                  list: this.tableData,
                  column: { ...item, edit: columnObj.edit },
                  sortState: this.setSortState,
                  service: this.serviceName,
                  condition: JSON.parse(JSON.stringify(conditions)),
                },
                on: {
                  "filter-change": (event) => {
                    if (event?.colName) {
                      if (this.initCond?.find(item => item.colName === event.colName)) {
                        // 清空初始查询条件
                        this.initCond = this.initCond.filter(item => item.colName !== event.colName)
                      }
                      if (event.remove) {
                        this.$set(this.filterState, event.colName, null);
                      } else {
                        this.$set(this.filterState, event.colName, event);
                      }
                      if (event?.refresh !== false) {
                        this.$nextTick(() => {
                          this.page.pageNo = 1;
                          this.getList(false);
                        });
                      }
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
                    this.page.pageNo = 1;
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
                if (this.updateColsMap?.[item.columns]?.option_list_v2) {
                  item.option_list_v2 =
                    this.updateColsMap?.[item.columns]?.option_list_v2;
                } else if (this.addColsMap?.[item.columns]?.option_list_v2) {
                  item.addColsMap =
                    this.updateColsMap?.[item.columns]?.option_list_v2;
                } else if (!item.option_list_v2) {
                  item.option_list_v2 = {
                    refed_col: "user_no",
                    srv_app: "sso",
                    serviceName: "srvsso_user_select",
                    key_disp_col: "user_disp",
                  };
                }
              }
              // if (item.bx_col_type === "fk") {
              columnObj.renderBodyCell = ({ row, column, rowIndex }, h) => {

                const oldRowData = this.oldTableData.find(
                  (item) => item.__id && item.__id === row.__id
                );
                let setColumn =
                  row.__flag === "add"
                    ? this.addColsMap[column.field]
                    : this.updateColsMap[column.field];
                if (!setColumn) {
                  setColumn = column.__field_info;
                }
                if (column.__field_info?.redundant_options) {
                  setColumn.redundant_options = column.__field_info.redundant_options
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
                if (setColumn.redundant_options) {
                  return h(fkAutocomplate, {
                    attrs: {
                      row,
                      column: setColumn,
                      disabled: !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                      app: this.srvApp,
                      value: row[column.field],
                      defaultConditionsMap: this.defaultConditionsMap,
                    },
                    on: {
                      onfocus: () => {
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                      },
                      input: (event) => {
                        row[column.field] = event;
                        this.$set(this.tableData, rowIndex, row);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                      },
                      select: (rawData) => {
                        // 对应的fk字段

                        const fkColumn = setColumn.redundant_options._target_column
                        if (fkColumn) {
                          const fkColumnInfo = this.setAllFields.find(item => item.columns === fkColumn)
                          if (fkColumnInfo) {
                            let data = rawData || {}
                            row[fkColumn] = data[setColumn.redundant_options.refed_col];
                            row[`_${fkColumn}_data`] = rawData
                            this.$set(this.tableData, rowIndex, row);
                            if (this.allFields.find(e => e.columns === fkColumn)) {
                              this.$refs["tableRef"].startEditingCell({
                                rowKey: row.rowKey,
                                colKey: fkColumn,
                                defaultValue: row[fkColumn],
                              });
                              this.$refs["tableRef"].stopEditingCell();
                              this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                            }

                            this.handlerRedundant(data, fkColumn, row.rowKey, rowIndex);
                          }
                        }
                      }
                    }
                  })
                } else if (item.bx_col_type === "fk") {
                  return h(fkSelector, {
                    attrs: {
                      value: row[column.field],
                      size: "mini",
                      srvInfo:
                        this.updateColsMap[column.field]?.option_list_v2 ||
                        item.option_list_v2,
                      app: this.srvApp,
                      row,
                      column,
                      listType: this.listType,
                      disabled: !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                    },
                    on: {
                      onfocus: () => {
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                      },
                      select: (event) => {
                        // fk选项发生变化
                        row[column.field] = event.value;
                        this.$set(this.tableData, rowIndex, row);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: row[column.field],
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                        this.handlerRedundant(event?.rawData, column.field, row.rowKey, rowIndex);
                      },
                      input: (event) => {
                        row[column.field] = event;
                        this.$set(this.tableData, rowIndex, row);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                        this.handlerRedundant({}, column.field, row.rowKey, rowIndex);
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
                      style: `width:${item.col_type === "DateTime" ? 180 : 130
                        }px;`,
                      valueFormat:
                        item.col_type === "DateTime"
                          ? "yyyy-MM-dd HH:mm:ss"
                          : "yyyy-MM-dd",
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
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                      },
                    },
                  });
                } else if (
                  ['Enum', 'Dict'].includes(item.col_type)
                ) {
                  if (!item.option_list_v2) {
                    item.option_list_v2 = []
                  }
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
                          this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
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
                } else if (['Set'].includes(item.col_type)) {
                  let value = [];
                  if (row[column.field]) {
                    value = row[column.field].split(",");
                  }
                  if (!item.option_list_v2) {
                    item.option_list_v2 = []
                  }
                  return h(
                    "el-select",
                    {
                      attrs: {
                        collapseTags: false,
                        multiple: true,
                        disabled:
                          !columnObj.edit ||
                          (row.__flag !== "add" &&
                            row?.__button_auth?.edit === false),
                        value: value,
                        size: "mini",
                        clearable: true,
                      },
                      on: {
                        input: (event) => {
                          // this.$set(row, column.field, event.toString());
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: column.field,
                            defaultValue: event.toString(),
                          });
                          this.$refs["tableRef"].stopEditingCell();
                          this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
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
                } else if (
                  ["FileList", "Image"].includes(item.col_type)
                ) {
                  // 文件
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
                  return h(FileUpload, {
                    attrs: {
                      row,
                      column: setColumn,
                      disabled: !editable,
                      value: row[column.field],
                      app: this.srvApp,
                    },
                    on: {
                      change: (event) => {
                        this.$set(row, column.field, event);
                        this.$set(
                          row,
                          "__flag",
                          row.__flag === "add" ? "add" : "update"
                        );
                        console.log("data-change:", row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                        // this.calcReqData = this.buildReqParams()
                      },
                    },
                  });
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
                      oldValue: oldRowData?.[column.field],
                      listType: this.listType,
                      app: this.srvApp,
                    },
                    on: {
                      needLogin: (callback) => {
                        this.$refs?.loginRef?.open(() => {
                          callback?.(true)
                        })
                      },
                      onfocus: () => {
                        this.$refs[
                          "tableRef"
                        ].clearCellSelectionCurrentCell();
                      },
                      onpopup: (val) => {
                        this.onPopup = val
                      },
                      unfold: (event, callback) => {
                        this.loadTree(event, row, rowIndex, callback);
                      },
                      change: (event) => {
                        this.$set(row, column.field, event);
                        console.log("data-change:", row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
                      },
                    },
                  });
                }

              };
            }
            return columnObj;
          })
        );
        // 设置固定列
        let fixedCol = Number(this.$route.query?.fixedCol);
        if (this.$route.query?.fixedCol) {
          fixedCol = columns.filter((item, index) => index !== 0 && !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(item.key)).filter((item, index) => index < this.$route.query?.fixedCol).map(item => item.key)
        } else {
          fixedCol = columns.find((item, index) => {
            return index !== 0 && !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(item.key)
          })
          fixedCol = [fixedCol?.key]
        }
        columns = columns.map((item) => {
          if (fixedCol?.includes(item.key)) {
            item.fixed = "left";
          }
          return item
        })
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
    handlerRedundant(rawData = {}, fkColumn, rowKey, rowIndex) {
      // 处理冗余
      const row = this.tableData[rowIndex];
      let columns = this.setAllFields.filter(item => {
        if (fkColumn) {
          let redundant = item?.redundant || this.addColsMap[item.columns]?.redundant || this.updateColsMap[item.columns]?.redundant || {}
          if (redundant?.dependField === fkColumn && redundant.refedCol) {
            return true
          }
        }
      })
      if (columns?.length) {
        columns.forEach(item => {
          if (item.redundant.trigger === "isnull") {
            if (row[item.columns] || row[item.columns] === 0 || row[item.columns] === false) {
              return
            }
          }
          row[item.columns] = rawData[item.redundant.refedCol] || null
          this.$set(this.tableData, rowIndex, row);
          if (this.allFields.find(e => e.columns === item.columns)) {
            this.$refs["tableRef"].startEditingCell({
              rowKey: rowKey,
              colKey: item.columns,
              defaultValue: rawData[item.redundant.refedCol] || null,
            });
            this.$refs["tableRef"].stopEditingCell();
            this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
          }
        })
      }
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
                key.indexOf("_") !== 0 &&
                !ignoreKeys.includes(key) &&
                this.updateColsMap?.[key]?.in_update !== 0
              ) {
                if (oldItem[key] !== item[key]) {
                  if (item[key] === '' || item[key] == undefined) {
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
              if (item.value && !addObj[item.colName]) {
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
            if (addObj[key] === '' || addObj[key] === undefined || addObj[key] === null) {
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
      return reqData?.length ? reqData : null;
    },
    refreshData() {
      this.sortState = [];
      const reqData = this.buildReqParams();

      if (reqData?.length === 0 || !reqData) {
        this.page.pageNo = 1;
        this.getList();
        return;
      }
      this.$confirm("刷新后之前的操作都将重置, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.page.pageNo = 1;
          this.isFetched = false
          debugger
          this.getList().then(()=>{
            this.isFetched = true
          });
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
        let service = reqData.every(
          (item) => item.serviceName === this.addButton?.service_name
        )
          ? this.addButton?.service_name
          : this.updateButton.service_name;
        onBatchOperate(reqData, service, this.srvApp).then((res) => {
          if (res?.state === "SUCCESS") {
            Message({
              showClose: true,
              message: res.resultMessage,
              type: "success",
            });
            console.log(res);
            if (this.listType === "treelist" && this.treeInfo.idCol) {
              let unfoldIds = this.tableData
                .filter((item) => !!item?.__unfold)
                .map((item) => item[this.treeInfo.idCol]);
              if (unfoldIds?.length) {
                this.getList(true, unfoldIds);
                return;
              }
            }
            this.getList();
          } else if (res?.resultMessage) {
            if (res.resultCode === '0011') {
              this.$refs?.loginRef?.open(() => {
                this.initPage(false).then(() => {
                  if (!this.tableData.length) {
                    this.getList()
                  }
                })
              })
            }
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
        // 冗余字段auto complete特性
        const fkCols = this.setAllFields.reduce((res, cur) => {
          if (cur?.option_list_v2?.serviceName) {
            res[cur.columns] = {
              ...cur.option_list_v2,
              _target_column: cur.columns,
              init_expr: cur.init_expr || this.addColsMap?.[cur.columns]?.init_expr,
            };
          }
          return res;
        }, {});
        this.allFields.forEach((field) => {
          if (field.editable) {
            dataItem[field.columns] = null;
            let init_expr = null
            let fk_init_expr = null
            let fk_column = null
            if (field.subtype === "autocomplete") {
            }
            if (this.addColsMap[field.columns]?.init_expr) {
              init_expr = this.addColsMap[field.columns]?.init_expr;
            } else if (field.subtype === "autocomplete" &&
              field.redundant?.dependField && fkCols[field.redundant?.dependField]?.init_expr) {
              fk_init_expr = fkCols[field.redundant?.dependField]?.init_expr
              init_expr = fk_init_expr
              fk_column = fkCols[field.redundant?.dependField]?._target_column
            }
            if (init_expr) {
              // 初始值
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
                if (typeof val === "string" && val?.includes("top.user.")) {
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
              if (fk_init_expr) {
                dataItem[`_${fk_column}_init_val`] = val;
              } else {
                dataItem[field.columns] = val;
              }
            }
          }
          if (
            this.defaultConditionsMap &&
            this.defaultConditionsMap[field.columns]
          ) {
            if (!['Date', "DateTime"].includes(field.col_type)) {
              dataItem[field.columns] = this.defaultConditionsMap[field.columns];
            }
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
          // 树型数据
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
    async loadChildren(ids, tableData) {
      if (!ids?.length) {
        return tableData;
      }
      tableData = cloneDeep(tableData);
      let loadingInstance = Loading.service({ fullscreen: true });
      const res = await onSelect(
        this.serviceName,
        this.srvApp,
        [
          {
            colName: this.treeInfo.pidCol,
            ruleType: "in",
            value: ids.toString(),
          },
        ],
        {
          rownumber: 100000,
          pageNo: 1,
          vpage_no: this.v2data?.vpage_no,
          order: this.sortState,
          use_type:
            this.isTree && this.listType === "treelist" ? "treelist" : "list",
        }
      );
      loadingInstance.close();
      if (res?.state === "SUCCESS") {
        for (let index = 0; index < tableData.length; index++) {
          const row = tableData[index];
          if (row?.__children) {
            break;
          }
          let children = res.data.filter(
            (e) => e[this.treeInfo.pidCol] === row[this.treeInfo.idCol]
          );
          if (children?.length) {
            children = children.map((child) => {
              const __id = uniqueId("table_item_");
              child.__button_auth = this.setButtonAuth(
                this.v2data?.rowButton,
                child
              );
              let __indent = 40;
              if (row.__indent === 0 || row.__indent > 0) {
                __indent = row.__indent + 40;
              }

              let dataItem = {
                rowKey: __id,
                __id,
                __flag: null,
                ...child,
                __indent,
                // 给每一行子数据存储它的父数据
                __parent_row: cloneDeep(row),
              };
              return dataItem;
            });
            this.$set(row, "__children", cloneDeep(children));
            this.$set(row, "__unfold", true);
            tableData.splice(index + 1, 0, ...children);
          }
        }
      }
      return tableData;
    },
    loadTree(load, row, rowIndex, callback) {
      // 将展开状态存储到行数据
      this.$set(this.tableData[rowIndex], "__unfold", load);
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
            use_type:
              this.isTree && this.listType === "treelist" ? "treelist" : "list",
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
            // this.$set(this.tableData[rowIndex], "__unfold", load);
            callback?.(true);
          } else {
            // this.$set(this.tableData[rowIndex], "__unfold", load);
            callback?.(false);
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
    async getList(insertNewRows = true, unfoldIds) {
      if (!unfoldIds && this.listType === "treelist" && this.treeInfo.idCol) {
        unfoldIds = this.tableData
          .filter((item) => !!item?.__unfold)
          .map((item) => item[this.treeInfo.idCol]);
      }
      if (this.serviceName) {
        this.loading = true;
        let condition = [...this.defaultConditions];
        if (this.initCond?.length) {
          this.initCond.forEach((item) => {
            if (!condition.find((c) => c.colName === item.colName)) {
              if (item.ruleType === "eq" && item.value === undefined) {
                // 变量值不存在的默认条件忽略掉
                return;
              }
              condition.push(item);
            }
          });
        }
        condition = condition.map((item) => {
          if (item.value === "null") {
            if (item.ruleType === "eq" || item.ruleType === "isnull") {
              item.ruleType = "isnull";
            } else {
              item.ruleType = "notnull";
            }
          }
          return item;
        });
        const res = await onSelect(this.serviceName, this.srvApp, condition, {
          rownumber: this.page.rownumber,
          pageNo: this.page.pageNo,
          vpage_no: this.v2data?.vpage_no,
          order: this.sortState,
          isTree: this.isTree && this.listType === "treelist",
          pidCol: this.treeInfo?.pidCol,
          forceUseTTD: this.$route?.query?.topTreeData,
        });
        this.loading = false;

        if (res?.data?.length) {
          res.data = res.data.map((item) => {
            item.__button_auth = this.setButtonAuth(
              this.v2data?.rowButton,
              item
            );
            return item;
          });
        } else if (res?.resultCode === '0011') {
          // this.$message.error('登录超时请重新登录')
          this.$refs?.loginRef?.open(() => {
            this.initPage(false)
          })
          return
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
          if (unfoldIds && unfoldIds?.includes(res.data[i].id)) {
            dataItem.__unfold = true;
          }
          tableData.push(dataItem);
        }

        if (unfoldIds?.length) {
          this.tableData = await this.loadChildren(unfoldIds, tableData);
        } else {
          this.tableData = tableData;
        }

        this.oldTableData = JSON.parse(JSON.stringify(this.tableData));
        this.recordManager = new RecordManager();
        this.recordManager?.push(cloneDeep(this.oldTableData));

        if (this.tableData?.length === 0 && insertNewRows) {
          this.insert2Rows(0);
        }
      }
    },
    async getColsV2() {
      if (this.colSrv) {
        const use_type = this.colSrv?.includes('_add') ? 'add' : this.colSrv?.includes('_update') ? 'update' : 'list'
        const res = await getServiceV2(
          this.colSrv,
          use_type,
          this.srvApp,
          true
        );
        if (res?.state === "SUCCESS") {
          return res?.data?.srv_cols?.map(item => {
            // 列表字段显示隐藏默认用的in_list控制 在使用自定义的服务来显示列时使用对应的use_type控制
            item.in_list = item[`in_${use_type}`] === 1 ? 1 : item[`in_${use_type}`]
            return item
          })
        }
      }
    },
    async getV2Data(force = false) {
      const res = await getServiceV2(
        this.serviceName,
        this.listType,
        this.srvApp,
        force
      );

      if (res?.state === "SUCCESS") {
        this.v2data = res.data;
        this.initExprCols = res.data.srv_cols.reduce((pre, cur) => {
          if (cur.init_expr) {
            pre.push(cur)
          }
          return pre
        }, [])

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
          );
          this.addColsMap = ress?.data?.srv_cols?.reduce((pre, cur) => {
            pre[cur.columns] = cur;
            return pre;
          }, {});
        }
        if (this.colSrv) {
          const srv_cols = await this.getColsV2()
          if (srv_cols?.length) {
            this.v2data.srv_cols = srv_cols
          }
        }
        if (Array.isArray(this.v2data.srv_cols)) {
          this.v2data.srv_cols = this.v2data.srv_cols.map(item => {
            if (item.more_config) {
              try {
                const moreConfig = JSON.parse(item.more_config)
                if (moreConfig?.query_init_value) {
                  item.query_init_value = moreConfig.query_init_value
                  if (item.col_type === 'fk') {
                    item.option_list_v2.query_init_value = moreConfig.query_init_value
                  }
                }
              } catch (error) {

              }
            }
            return item
          })
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
        return res.data
      }
    },
    scrolling({ startRowIndex }) {
      this.startRowIndex = startRowIndex;
    },
    // 取消监听撤销重做事件
    unbindKeyboardEvent() {

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
        if (ctrlDown && !this.onPopup) {
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
.empty-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: #666;
  font-size: 16px;
  border: 1px solid #eee;
  border-top: 0;
}

.table-body-cell__add {
  background-color: #a4da89 !important;

  .el-select .el-input {
    .el-select__caret {
      color: #eee;
    }

    .el-input__inner::placeholder {
      color: #fff;
    }
  }


  .el-icon-arrow-right {
    color: #eee;
  }
}

.table-body-cell__update {
  // color: #2087cc !important;
  color: #f00 !important;

  .el-input {
    .el-input__inner {
      // color: #2087cc !important;
      color: #f00 !important;
    }
  }

  .el-tag {
    color: #f00 !important;
  }

  // background-color: #2087CC !important;
}

// .table-body-cell__update_border {
//   border: 1px solid #2087cc !important;
// }
.ve-table-body-td {
  padding: 2px 5px !important;
}

.ve-table-body-tr {
  height: unset !important;
  ;
}

.ve-table-header-th {
  padding: 2px 0 !important;
  background-color: #e5e7ea !important;
}

.spreadsheet {
  width: 100vw;
  height: 100vh;

  // padding: 0 10px;
  // margin: 20px 0;
  .el-select,
  .el-autocomplete {
    .el-input__inner {
      border: none !important;
      background-color: transparent !important;
      padding-left: 0;
      padding-right: 25px;
      height: 25px;
      line-height: 25px;
    }

    .el-icon-arrow-right {
      color: #eee;
    }

    .el-select__caret {
      color: #eee;
    }

    .el-input__inner::placeholder {
      color: #ccc;
    }

  }


}

.ve-table-container {
  min-height: 80px;
  // height: calc(100vh - 80px)!important;
  // overflow: auto;
}
</style>
