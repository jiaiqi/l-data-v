<template>
  <div
    class="spreadsheet flex flex-col"
    :class="{ 'child-list': childListType }"
    ref="spreadsheet"
    @click="clickPage"
  >
    <loading-view
      v-if="loading"
      mask
      type="surround"
      :maskOpacity="0.2"
      showText
      textColor="#fff"
    ></loading-view>
    <div
      class="flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 w-full"
      v-if="disabled !== true"
    >
      <div
        class="flex flex-1 items-center text-sm p-x-2"
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
          class="icon-button"
          title="添加(ctrl + 加号键)"
          size="mini"
          type="primary"
          @click="batchInsertRows"
          :disabled="insertRowNumber === 0"
        >
          <!-- 添加 -->
          <i class="i-ic-baseline-add"></i>
        </el-button>
      </div>
      <div class="text-sm text-gray cursor-not-allowed" v-else>
        <!-- 没有添加权限 -->
      </div>
      <div class="p-x-2 flex-1 flex justify-center">
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

      <div class="flex flex-items-center flex-1 justify-end p-x-2">
        <div
          class="color-map flex flex-items-center m-r-20"
          v-if="!['add', 'addchildlist'].includes(childListType)"
        >
          <div class="color-map-item flex flex-items-center">
            <!-- <div class="color bg-[#a4da89] w-4 h-4 m-r-2 rounded"></div> -->
            <div class="color bg-[#2EA269] w-4 h-4 m-r-2 rounded"></div>
            <div class="text">新增</div>
          </div>
          <div class="color-map-item flex flex-items-center m-l-5">
            <div class="color bg-[#E83D4B] w-4 h-4 m-r-2 rounded"></div>
            <div class="text">更新</div>
          </div>
        </div>
        <div class="relative" v-if="gridButton && gridButton.length">
          <div class="grid-button-box" :class="{ show: showGridButton }">
            <el-button
              size="mini"
              type="primary"
              :title="item.button_name"
              v-for="item in gridButton"
              class="button"
              @click="onGridButton(item)"
            >
              {{ item.button_name }}
            </el-button>
          </div>
          <el-button
            class="icon-button mr-1"
            size="mini"
            type="primary"
            @click="showGridButton = !showGridButton"
          >
            <i
              class="i-ic-sharp-keyboard-double-arrow-right icon"
              :class="{ show: showGridButton }"
              :title="showGridButton ? '收起操作按钮' : '展开操作按钮'"
            ></i>
          </el-button>
        </div>

        <el-button
          class="icon-button"
          size="mini"
          type="primary"
          @click="refreshData"
          v-if="!['add', 'addchildlist'].includes(childListType)"
          title="刷新（F5）"
        >
          <!-- 刷新 -->

          <i class="i-ic-baseline-refresh"></i>
        </el-button>
        <el-button
          class="icon-button"
          size="mini"
          type="primary"
          @click="saveData"
          :disabled="!calcReqData || calcReqData.length == 0"
          v-if="!['add', 'addchildlist'].includes(childListType)"
          v-loading="onHandler"
          title="保存（Ctrl+S）"
        >
          <!-- 保存 -->
          <i class="i-ic-baseline-save"></i>
          <span
            v-if="autoSaveTimeout && autoSaveTimeout > 0"
            class="text-xs"
            title="自动保存倒计时"
          >
            {{ autoSaveTimeout }}
          </span>
        </el-button>
        <el-button
          class="icon-button"
          size="mini"
          type="primary"
          @click="saveColumnWidth"
          v-loading="onHandler"
          :disabled="!calcColumnWidthReq || calcColumnWidthReq.length == 0"
          v-if="
            !childListType &&
            calcColumnWidthReq &&
            calcColumnWidthReq.length > 0
          "
          title="保存列宽"
        >
          <!-- 保存列宽 -->
          <i class="i-ic-baseline-view-column"></i>
        </el-button>
      </div>
    </div>
    <!--    <div class="flex-1 list-container" v-if="isFetched || childListType" :style="{'max-height': listMaxHeight+'px'}">-->
    <div class="flex-1 list-container" v-if="isFetched || childListType">
      <ve-table
        :columns="columns"
        border-x
        border-y
        :table-data="tableData"
        v-if="disabled"
        ref="tableRef"
        style="word-break: break-word; width: 100vw; height: 100%"
        max-height="calc(100vh - 40px)"
        fixed-header
      />
      <div class="custom-style" v-else>
        <ve-table
          ref="tableRef"
          style="word-break: break-word; width: 100vw"
          max-height="calc(100vh - 80px)"
          fixed-header
          :scroll-width="0"
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
      </div>
    </div>
    <div
      class="empty-data"
      v-if="!childListType && listMaxHeight && page.total === 0 && !loading"
    >
      暂无数据
    </div>
    <!--    列表为新增子表时不显示分页-->
    <div
      class="text-center flex justify-between"
      v-if="!['add', 'addchildlist'].includes(childListType)"
    >
      <div class="position-relative">
        <choose-tenant />
      </div>
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
      <div class="flex items-center"></div>
    </div>

    <select-parent-node
      ref="changeParentRef"
      :topTreeData="topTreeData"
      :srvApp="srvApp"
      :options="
        tableData.filter((item) => item.__flag !== 'add' && !item.__indent)
      "
      :option-info="parentColOption"
      @confirm="updateParentNo"
    ></select-parent-node>

    <login-dialog ref="loginRef"></login-dialog>
    <drop-menu
      v-if="showDropMenu"
      v-model="showDropMenu"
      :row="currentRowData"
      :items="rowButton"
      :position="{ top: dTop, left: dLeft }"
      @select="onRowButton"
    />
    <out-form-dialog ref="outFormDialog"></out-form-dialog>

    <Teleport to=".ve-table-content-wrapper" v-if="showFieldEditor">
      <field-editor
        ref="fieldEditor"
        :disabled="disabled"
        :detailButton="detailButton"
        :serviceName="serviceName"
        :app="srvApp"
        :listType="listType"
        :keyDispCol="(v2data && v2data.key_disp_col) || ''"
        :value="currentCellValue"
        :show.sync="showFieldEditor"
        v-bind="fieldEditorParams"
        @change="dialogChange"
        @fk-autocomplete-change="fkAutocompleteChange"
        @fk-change="fkChange"
        @fks-change="fksChange"
        @save="dialogChange"
        @close="dialogClose"
        @focus="onFieldEditorFocus"
        @blur="onFieldEditorBlur"
      ></field-editor>
    </Teleport>
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
import { mapState } from "pinia";
import { useUserStore } from "@/stores/user.js";
import {
  buildSrvCols,
  isFkAutoComplete,
  isFk,
  getFieldType,
} from "../../utils/sheetUtils";
import { COLUMN_KEYS } from "../../utils/constant";
import { uniqueId, cloneDeep } from "lodash-es";
import { Message } from "element-ui"; // 引入elementUI的Message组件
import HeaderCell from "./components/header-cell.vue";
import fkSelector from "./components/fk-selector.vue";
import RenderHtml from "./components/render-html.vue";
import FileUpload from "./components/file-upload.vue";
import selectParentNode from "./components/select-parent-node.vue";
import fkAutocomplete from "./components/fk-autocomplete.vue";
import { RecordManager } from "./util/recordManager.js";
import { Loading } from "element-ui";
import { $http } from "../../common/http";
import loginDialog from "../../components/login-dialog/index.vue";
import { processStrings, appendNumber } from "../../common/common";
import IconFold from "../../components/icons/icon-fold.vue";
import IconUnfold from "../../components/icons/icon-unfold.vue";
import LoadingView from "./components/loading/index.vue";
import ChooseTenant from "./components/choose-tenant/index.vue";
import Teleport from "vue2-teleport";

import {
  extractAndFormatDatesOrTimestamps,
  extractConcatNumbersWithSingleDecimal,
} from "@/common/DataUtil.js";
import { rowButtonClick, customizeOperate } from "./util/buttonHandler.js";
import { copyTextToClipboard } from "@/common/common.js";
import DropMenu from "./components/drop-menu/drop-menu.vue";
import OutFormDialog from "./components/out-comp/dialog.vue";
import FieldEditor from "./components/field-editor/index.vue";
import debounce from "lodash/debounce";
import { FkUtil } from "./util/fkUtil.js";
let broadcastChannel = null; //跨iframe通信的实例
const ignoreKeys = [
  "__id",
  "__flag",
  "__parent_row",
  "rowKey",
  "id",
  "__button_auth",
  "_buttons",
  "__unfold",
  "__indent",
  "__update_col",
  "listType",
];

function getElementFullInfo(element) {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    // left: rect.left + window.scrollX,
    // top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
  };
}
export default {
  name: "SheetEditor",
  beforeDestroy() {
    broadcastChannel?.close();
    broadcastChannel = null;
    // 移除事件监听
    this.removeDocumentEventListener();
    // 在组件销毁前清除定时器
    this.stopAutoSave();
  },
  mounted() {
    if (this.srvApp) {
      sessionStorage.setItem("current_app", this.srvApp);
    }
  },
  async created() {
    if (this.$route.query?.listType) {
      this.listType = this.$route.query?.listType;
    }
    if (this.$route.query.isTree) {
      this.listType = "treelist";
    }
    if (this.$route.query?.disabled) {
      this.disabled = true;
    }
    if (this.$route.params?.mainService) {
      this.mainService = this.$route.params?.mainService;
    }
    if (this.$route.params?.childListType) {
      // 子表类型 add|update|detail
      this.childListType = this.$route.params?.childListType;
      // if (this.childListType === 'add' && this.childListCfg?.data_source_cfg?.select_srv) {
      //   // 初始数据配置
      //   await this.getInitData(this.childListCfg?.data_source_cfg)
      // }
      this.$nextTick(() => {
        broadcastChannel = new BroadcastChannel(
          this.$route.params?.broadCastName
        );
        broadcastChannel.addEventListener("message", this.bcOn);
        this.watchPageHeight();
      });
    }
    this.initPage().then(() => {
      if (this.v2data?.is_tree === true && this.listType !== "treelist") {
        this.listType = "treelist";
        this.initPage();
      }
    });
    this.$nextTick(() => {
      this.unfold();
      this.initDocumentEventListener();
    });
  },
  components: {
    IconFold,
    IconUnfold,
    selectParentNode,
    loginDialog,
    LoadingView,
    ChooseTenant,
    DropMenu,
    OutFormDialog,
    FieldEditor,
    Teleport,
  },
  data() {
    return {
      showGridButton: false,
      bx_auth_ticket: null,
      currentSelection: null,
      currentCell: null,
      fieldEditorParams: null,
      fieldEditorPosition: {},
      showFieldEditor: false,
      autoSaveInterval: null, //用于储存定时保存的定时器
      autoSaveTimeout: 0, //自动保存倒计时
      dialogName: "",
      showDropMenu: false,
      dLeft: 0,
      dTop: 0,
      currentRowIndex: -1,
      currentCell: null,
      onHandler: false,
      disabled: false,
      initData: null,
      mainData: null,
      mainService: "",
      childListCfg: {
        foreign_key: null,
        data_source_cfg: null,
      }, //子表配置
      listMaxHeight: 0,
      initExprCols: [],
      initCond: [],
      // tableMaxHeight: 1000,
      onPopup: false, //弹窗是否打开状态
      calcReqData: null,
      columnWidthMap: {}, //存储改变后的列宽
      changeParentdialogVisible: false,
      pageNo: uniqueId("pageNo"),
      listType: "list",
      childListType: null, //子表类型 addchildlist/updatechildlist/detaillist
      treeList: [],
      page: {
        //分页信息
        total: 0,
        rownumber: 20,
        pageNo: 1,
      },
      sortState: [], // 表头排序
      filterState: {}, //筛选
      listColsMap: {}, //列表字段映射
      addColsMap: {}, //新增字段映射
      updateColsMap: {}, //编辑字段映射
      loading: false,
      isFetched: false, //数据加载完成
      recordManager: new RecordManager(), //编辑记录
      tableData: [],
      oldTableData: [], //源数据
      v2data: {}, //select v2
      allFields: [], //所有字段
      columns: [], //表头字段
      eventCustomOption: {
        bodyRowEvents: ({ row, rowIndex }) => {
          return {
            dblclick: (event) => {
              console.log("dblclick::", row, rowIndex, event);
              return false;
            },
            contextmenu: (event) => {
              console.log("bodyRowEvents::", row, rowIndex, event);
              event.preventDefault();
              return false;
            },
          };
        },
        bodyCellEvents: ({ row, column, rowIndex }) => {
          return {
            click: (event) => {
              if (column.edit) {
                const colType = column?.__field_info?.col_type;
                if (!colType) {
                  return;
                }
                const currentCellSelection =
                  this.$refs.tableRef.cellSelectionData.currentCell;
                console.log("cell click::", colType);

                if (
                  currentCellSelection &&
                  currentCellSelection?.colKey === column.key &&
                  currentCellSelection?.rowKey === row.rowKey
                ) {
                  if (
                    ["Date", "DateTime"].includes(colType) ||
                    ["fks", "fkjson", "fkjsons"].includes(colType) ||
                    ["Enum", "Dict", "Set"].includes(colType) ||
                    isFkAutoComplete(column?.__field_info) ||
                    isFk(column?.__field_info)
                  ) {
                    this.$nextTick(() => {
                      this.clearFieldEditorParams();
                      this.showFieldEditor = false;
                      setTimeout(() => {
                        this.$nextTick(() => {
                          event.stopPropagation();
                          this.buildFieldEditorParams(row, column);
                          this.showFieldEditor = true;
                        });
                      }, 200);
                    });
                  }
                }
              }
            },
            dblclick: (event) => {
              // 双击单元格
              console.log("cell dblclick::", row, column, rowIndex, event);
              const colType = column?.__field_info?.col_type;
              if (!colType) return;
              // const currentCellEl =
              //   this.$refs.tableRef?.$refs?.cellSelectionRef?.currentCellEl;
              // console.log({ ...currentCellEl });

              if (column.edit) {
                if (["Note", "RichText", "snote"].includes(colType)) {
                  // 富文本
                  event.stopPropagation();
                  console.log("弹出富文本编辑器");
                  this.buildFieldEditorParams(row, column);
                  this.showFieldEditor = true;
                  // event.stopPropagation()
                  this.$nextTick(() => {
                    // this.$refs["tableRef"].stopEditingCell();
                    this.clearCellSelection();
                  });
                  return false;

                  // event.preventDefault()
                  // this.$refs.fieldEditorDialog.open();
                } else if (["MultilineText"].includes(colType)) {
                  event.stopPropagation();
                  console.log("弹出多行文本编辑器");
                  this.buildFieldEditorParams(row, column);
                  this.showFieldEditor = true;
                  this.$nextTick(() => {
                    this.clearCellSelection();
                  });
                  return false;
                } else if (["Date", "DateTime"].includes(colType)) {
                  event.stopPropagation();
                  this.$nextTick(() => {
                    this.$refs["tableRef"].stopEditingCell();
                  });
                } else if (["String"].includes(colType)) {
                  if (column?.__field_info?.redundant_options?._target_column) {
                    // fk-autocomplete
                    event.stopPropagation();
                    this.$nextTick(() => {
                      this.$refs["tableRef"].stopEditingCell();
                    });
                  }
                }
              }

              // if (column?.__field_info?.option_list_v3?.length) {
              //   let finalOption = column?.__field_info?.option_list_v3.find(
              //     (item) => {
              //       return item.conds.every(
              //         (cond) =>
              //           row[cond.case_col] &&
              //           cond.case_val.includes(row[cond.case_col])
              //       );
              //     }
              //   );
              //   // fk类型 有满足条件的option_list
              //   if (finalOption?.allow_input === "自行输入") {
              //     console.log("finalOption:", finalOption);
              //     this.$refs.outFormDialog?.doShow({
              //       row,
              //       field: column.__field_info,
              //       optionCfg: finalOption,
              //     });
              //   }
              // }
              return false;
            },
          };
        },
      },
      cellStyleOption: {
        // 单元格自定义class
        bodyCellClass: ({ row, column, rowIndex }) => {
          // if (row?.__flag === "add") {
          if (row?.__flag === "add" && column.field === "index") {
            // 新增行直接显示为绿色背景 不用判断字段有没有值
            return "table-body-cell__add";
          }
          if (
            row &&
            !["__flag", "rowKey", "__id", "__unfold"].includes(column.field)
          ) {
            const oldRow = this.oldTableData.find(
              (item) => item.__id && item.__id === row.__id
            );
            if (oldRow && row[column.field] !== oldRow[column.field]) {
              if (!row.__flag) {
                row.__flag = "update";
              }
              if (column.field === "index") {
                return "table-body-cell__update-index";
              }
              if (row[column.field] === null || row[column.field] === "") {
                return "table-body-cell__update null-value";
              }
              return "table-body-cell__update";
            }
          }
          // if (
          //   row?.__flag === "update" &&
          //   !["__flag", "rowKey", "__id", "__unfold"].includes(column.field)
          // ) {
          //   if (column.field === "index") {
          //     return "table-body-cell__update-index";
          //   }
          //   // 某行某列绑定的值跟备份的数据中此行此列绑定的值不同时  增加class
          //   const oldRowData = this.oldTableData.find(
          //     (item) => item.__id && item.__id === row.__id
          //   );
          //   console.log('bodyCellClass',row[column.field] , oldRowData[column.field]);

          //   if (row[column.field] !== oldRowData[column.field]) {
          //     if (row[column.field] === null || row[column.field] === "") {
          //       return "table-body-cell__update null-value";
          //     }
          //     return "table-body-cell__update";
          //   }
          // }
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
            column: column.__field_info,
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
        afterAutofill: ({
          targetSelectionRangeIndexes,
          sourceSelectionData,
        }) => {
          //targetSelectionRangeIndexes 自动填充目标的行和列索引
          // this.triggerEditCell(targetSelectionRangeIndexes,sourceSelectionData);
        },
        beforeAutofill: ({
          direction,
          sourceSelectionRangeIndexes,
          targetSelectionRangeIndexes,
          sourceSelectionData,
          targetSelectionData,
        }) => {
          if (
            sourceSelectionRangeIndexes.startRowIndex !==
            targetSelectionRangeIndexes.endRowIndex
          ) {
            if (sourceSelectionData?.length > 1) {
              let val = null;
              let key = Object.keys(sourceSelectionData[0]).find(
                (e) => e !== "rowKey"
              );
              let customFill = sourceSelectionData.every((item, index) => {
                if (
                  index <= sourceSelectionData.length - 1 &&
                  index > 0 &&
                  !isNaN(Number(item[key]))
                ) {
                  val = item[key] - sourceSelectionData[index - 1][key];
                  if (val === item[key] - sourceSelectionData[index - 1][key]) {
                    return true;
                  }
                  return false;
                }
                return true;
              });
              if (
                sourceSelectionData.length === 2 &&
                sourceSelectionData[0][key] !== sourceSelectionData[1][key]
              ) {
                if (
                  !isNaN(
                    sourceSelectionData[1][key] - sourceSelectionData[0][key]
                  )
                ) {
                  customFill = true;
                  val =
                    sourceSelectionData[1][key] - sourceSelectionData[0][key];
                }
              }

              if (customFill) {
                let lastVal =
                  sourceSelectionData[sourceSelectionData.length - 1][key];
                let diff = null;
                if (sourceSelectionData.length > 1) {
                  diff = processStrings(
                    sourceSelectionData[0][key],
                    sourceSelectionData[1][key]
                  )?.diff;
                }
                if (diff) {
                  let isProcess = sourceSelectionData.every((item, index) => {
                    if (index === sourceSelectionData.length - 1) {
                      return true;
                    }
                    return (
                      processStrings(
                        item[key],
                        sourceSelectionData[index + 1][key]
                      )?.diff === diff
                    );
                  });
                  if (isProcess) {
                    this.tableData.forEach((item) => {
                      let index = targetSelectionData.findIndex(
                        (e) => e.rowKey && e.rowKey === item.rowKey
                      );
                      if (index > -1) {
                        // 等差递增
                        let curVal = appendNumber(lastVal, diff, index + 1);
                        if (typeof lastVal === "number") {
                          curVal = Number(curVal);
                        }
                        this.$set(item, key, curVal);
                      }
                    });
                    this.triggerEditCell(targetSelectionRangeIndexes);
                    return false;
                  }
                }

                this.tableData.forEach((item) => {
                  let index = targetSelectionData.findIndex(
                    (e) => e.rowKey && e.rowKey === item.rowKey
                  );
                  if (index > -1) {
                    // 等差递增
                    let curVal = Number(lastVal) + val * (index + 1);
                    if (typeof lastVal === "string") {
                      curVal = curVal + "";
                    }
                    this.$set(item, key, curVal);
                  }
                });
                this.triggerEditCell(targetSelectionRangeIndexes);
                return false;
              }
            } else if (sourceSelectionData?.length > 0) {
              // 只是复制 不经过别的计算
              const rowKey = sourceSelectionData[0]?.rowKey;
              if (rowKey) {
                const sourceData = this.tableData.find(
                  (item) => item.rowKey === rowKey
                );
                if (sourceData) {
                  this.$nextTick(() => {
                    this.triggerEditCell(
                      targetSelectionRangeIndexes,
                      sourceData
                    );
                  });
                }
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
              const realIndex = selectionRangeIndexes["startRowIndex"] + index;
              this.columns.forEach((col) => {
                const oldVal = this.oldTableData[realIndex]?.[col.field];
                const colType = col?.__field_info?.col_type;
                if (!colType) return;
                if (colType && this.oldTableData[realIndex]) {
                  const changeValue = element[col.field];
                  if (changeValue) {
                    if (["DateTime", "Date"].includes(colType)) {
                      // 日期时间类型格式化
                      let dateStr =
                        extractAndFormatDatesOrTimestamps(changeValue);
                      if (changeValue && dateStr) {
                        element[col.field] = dateStr;
                      } else {
                        this.$message({
                          message: "非日期类型字符串",
                          type: "warning",
                        });
                      }
                    }
                    if (
                      ["Integer", "Float", "Money", "int", "Int"].includes(
                        colType
                      ) ||
                      colType.includes("decimal")
                    ) {
                      // 校验数字
                      if (!extractConcatNumbersWithSingleDecimal(changeValue)) {
                        // isValid = false;
                        element[col.field] = null;
                        let val = null;
                        if (
                          !Number.isNaN(oldVal) ||
                          extractConcatNumbersWithSingleDecimal(oldVal)
                        ) {
                          val = Number(oldVal);
                        }
                        element[col.field] = val;
                        this.$message({
                          message: "请输入数字",
                          type: "warning",
                        });
                      } else {
                        let valStr =
                          extractConcatNumbersWithSingleDecimal(changeValue);
                        if (["Int", "int", "Integer"].includes(colType)) {
                          element[col.field] = parseInt(valStr);
                        } else {
                          element[col.field] = parseFloat(valStr);
                        }
                      }
                    }
                  }
                }
              });
            }
            if (isValid) {
              if (selectionRangeIndexes && data?.length) {
                const { selectionRangeIndexes: selectionRangeIndexes2 } =
                  this.$refs?.tableRef?.getRangeCellSelection();
                let { startRowIndex, endRowIndex, startColIndex, endColIndex } =
                  selectionRangeIndexes;
                if (
                  startRowIndex === endRowIndex &&
                  startColIndex === endColIndex
                ) {
                  startRowIndex = selectionRangeIndexes2.startRowIndex;
                  endRowIndex = selectionRangeIndexes2.endRowIndex;
                  startColIndex = selectionRangeIndexes2.startColIndex;
                  endColIndex = selectionRangeIndexes2.endColIndex;
                }
                // const {
                //   startRowIndex,
                //   endRowIndex,
                //   startColIndex,
                //   endColIndex,
                // } = selectionRangeIndexes2;
                // 选中区域大于一行或者一列
                if (
                  endRowIndex - startRowIndex >= 0 ||
                  endColIndex - startColIndex >= 0
                ) {
                  const columns = this.columns.filter(
                    (item) =>
                      !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
                        item.field
                      )
                  );
                  const colsMap = columns.reduce((pre, cur) => {
                    if (cur?.__field_info && cur.key) {
                      pre[cur.key] = cur.__field_info;
                    }
                    return pre;
                  }, {});
                  for (let i = startRowIndex; i <= endRowIndex; i++) {
                    const row = this.tableData[i];
                    // for (let j = 0; j < data.length; j++) {
                    let obj = data[i - startRowIndex];
                    if (data?.length === 1) {
                      obj = data[0];
                    }
                    if (typeof obj === "object") {
                      for (const key in obj) {
                        if (Object.hasOwnProperty.call(obj, key)) {
                          const element = obj[key];
                          if (element) {
                            this.$refs["tableRef"].startEditingCell({
                              rowKey: row.rowKey,
                              colKey: key,
                              defaultValue: element,
                            });
                            this.$refs["tableRef"].stopEditingCell();
                            this.clearCellSelection();
                          }
                        }
                      }
                    }
                  }
                  return false;
                }
              }
            }
            return false;
          }
        },
        afterPaste: ({ data, selectionRangeIndexes, selectionRangeKeys }) => {
          //selectionRangeIndexes ：拷贝区域的索引信息
          // this.triggerEditCell(selectionRangeIndexes,'afterPaste');
          // return false
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
              this.clearCellSelection();
            }
          }
        },
      },
      // 单元格编辑配置
      editOption: {
        beforeStartCellEditing: ({ row, column, cellValue, rowIndex }) => {
          const colType = column?.__field_info?.col_type;
          if (!row || !colType) {
            return;
          }
          let oldRowData = this.oldTableData?.find(
            (item) => item.__id === row.__id
          );
          if (row.__flag === "add") {
            // 新增行 处理in_add
            if (!this.addColsMap[column.field]?.in_add) {
              this.$message({
                message: "新增行不支持编辑当前列",
                type: "warning",
              });
              return false;
            }
            if (this.addColsMap[column.field].updatable === 0) {
              this.$message({
                message: "当前列新增时不支持编辑",
                type: "warning",
              });
              return false;
            }
          } else {
            // 编辑行 处理in_update
            if (!this.updateColsMap?.[column.field]?.in_update) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
            if (this.updateColsMap[column.field]?.updatable === 0) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
          }
          if (
            row.__flag !== "add" &&
            !row?.__button_auth?.edit
            //&& oldRowData?.[column.field] !== row[column.field]
          ) {
            console.log("没有当前行的编辑权限！", row, column, oldRowData);
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
              this.clearCellSelection();
            });
            return false;
          }
          if (["FileList", "Image"].includes(colType)) {
            this.$message.warning(`【${colType}】类型字段不支持双击进行编辑`);
            return false;
          }
          console.log("onDBClick", colType);

          if (
            ["RichText", "Note"].includes(colType) &&
            cellValue === oldRowData?.[column.field]
          ) {
            // return false;
          }
        },
        beforeCellValueChange: ({ row, column, changeValue, rowIndex }) => {
          const colType = column?.__field_info?.col_type;
          if (!colType) {
            return;
          }
          // let oldRowData = this.oldTableData?.find(
          //   (item) => item.__id === row.__id
          // );
          let currentRow = this.tableData?.find(
            (item) => item.__id === row.__id
          );
          if (currentRow && changeValue === currentRow[column.field]) {
            // 值没变
            return false;
          }
          if (row.__flag === "add") {
            // 新增行 处理in_add 为0或者add服务没有这个字段
            if (!this.addColsMap[column.field]?.in_add) {
              this.$message({
                message: "新增行不支持编辑当前列",
                type: "warning",
              });
              return false;
            }
            if (this.addColsMap[column.field].updatable === 0) {
              this.$message({
                message: "当前列新增时不支持编辑",
                type: "warning",
              });
              return false;
            }
            // if (isFkAutoComplete(column.__field_info) || isFk(column.__field_info) && this.showFieldEditor !== true) {
            //   this.buildFieldEditorParams(row, column)
            //   this.showFieldEditor = true;
            //   this.$nextTick(() => {
            //     this.$refs.fieldEditor?.triggerAutocomplete?.(changeValue)
            //   })
            //   this.clearCellSelection()
            // }
          } else {
            // 编辑行 处理in_update
            if (!this.updateColsMap[column.field]?.in_update) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
            if (this.updateColsMap[column.field]?.updatable === 0) {
              this.$message({
                message: "当前列不支持编辑",
                type: "warning",
              });
              return false;
            }
          }

          if (["DateTime", "Date"].includes(colType)) {
            // 日期时间类型格式化
            let dateStr = extractAndFormatDatesOrTimestamps(changeValue);
            if (dateStr && dateStr !== changeValue) {
              const index = this.tableData.findIndex(
                (item) => item.__id === row.__id
              );
              let rowData = this.tableData[index];
              this.$set(rowData, column.field, dateStr);
              return false;
            } else if (!dateStr && isNaN(new Date(changeValue).getTime())) {
              this.$message({
                message: "非合法日期字符串",
                type: "warning",
              });
              return false;
            } else {
            }
          }
          if (
            ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
            colType?.includes("decimal")
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
        afterCellValueChange: ({ row, column, changeValue, rowIndex }) => {
          const colType = column?.__field_info?.col_type;
          if (!colType) {
            return;
          }
          let oldRow = this.oldTableData?.find(
            (item) => item.__id === row.__id
          );
          let currentRow = this.tableData?.find(
            (item) => item.__id === row.__id
          );

          if (oldRow?.[column.field] === changeValue) {
            if (row.__flag === "update") {
              row.__flag = null;
            }
            return;
          }

          // 数字类型 如果改变的值对应字段是数字类型 但是值是字符串 将其转为数字
          if (
            ["Integer", "Float", "Money", "int", "Int"].includes(colType) ||
            colType?.includes("decimal")
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
            // row.__flag = "update";
            console.log("update", changeValue, oldRow?.[column.field]);
          } else if (row.__flag === "add") {
            // 新增行已手动编辑
            if (row.__update_col) {
              row.__update_col[column.field] = true;
            } else {
              row.__update_col = {};
              row.__update_col[column.field] = true;
            }
          }

          // if (column?.__field_info?.redundant_options?._target_column) {
          //   // 处理autocomplete对应的fk字段
          //   console.log("changeValue:", changeValue, column.field);
          //   const col = column?.__field_info?.redundant_options?._target_column;

          //   if (!changeValue) {
          //     // 清空值后，对应fk字段的值也要清空
          //     const fkColumnInfo = this.setAllFields.find(
          //       (item) => item.columns === col
          //     );
          //     if (fkColumnInfo && row[col]) {
          //       row[col] = null;
          //       this.$set(this.tableData, rowIndex, row);
          //       // this.$refs["tableRef"].startEditingCell({
          //       //   rowKey: row.rowKey,
          //       //   colKey: col,
          //       //   defaultValue: null,
          //       // });
          //       // this.$refs["tableRef"].stopEditingCell();
          //       this.handlerRedundant({}, col, row.rowKey, rowIndex);
          //     }
          //   } else {
          //     // this.handlerRedundant({}, col, row.rowKey, rowIndex);
          //   }
          // }

          // 表内计算
          let calcDependedCols = null;
          if (row.__flag === "add") {
            calcDependedCols = column.__field_info?.__add_calc_depended_cols;
          } else {
            calcDependedCols = column.__field_info?.__update_calc_depended_cols;
          }
          if (
            Array.isArray(calcDependedCols) &&
            calcDependedCols.length &&
            changeValue !== oldRow?.[column.field]
          ) {
            calcDependedCols.forEach((key) => {
              const calcCol = this.allFields.find(
                (item) => item.columns === key
              );
              if (calcCol?.redundant?.func) {
                console.log(
                  "toCalc::",
                  changeValue,
                  oldRow?.[column.field],
                  row[column.field]
                );

                this.handleRedundantCalc(calcCol, row);
              }
            });
          }
          // fk值改变后进行冗余
          if (isFk(column?.__field_info)) {
            if (changeValue) {
              let fkUtil = new FkUtil(column?.__field_info, this.srvApp);
              fkUtil.getMatchedValue(changeValue, "eq").then((matchedValue) => {
                if (matchedValue) {
                  const item = {
                    value: changeValue,
                    rawData: matchedValue,
                  };
                  this.fkChange(item, row, column);
                }
              });
            }
          }
          // const calcDependedCols = column?.__field_info?.calcDependedCols;
          // if (calcDependedCols?.length) {
          //   if (changeValue !== oldRow?.[column.field]) {
          //     console.log("calcDependedCols:", calcDependedCols);
          //     calcDependedCols.forEach((key) => {
          //       const calcCol = this.allFields.find(
          //         (item) => item.columns === key
          //       );
          //       if (calcCol?.redundant?.func) {
          //         this.handleRedundantCalc(calcCol, row);
          //       }
          //     });
          //   }
          // }
          this.recordManager?.push(cloneDeep(this.tableData));
          if (this.childListType) {
            // 子表数据更新 通知主表
            this.emitListData(this.tableData);
          }
          this.autoSave();
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
      allFieldsMap: {},
    };
  },
  watch: {
    tableData: {
      deep: true,
      handler(newValue, oldValue) {
        const currentSelection = this.$refs?.tableRef?.getRangeCellSelection();
        this.calcReqData = this.buildReqParams();
        // this.buildFieldEditorParams(this.fieldEditorParams?.row, this.fieldEditorParams?.column)
        const startRowIndex =
          currentSelection?.selectionRangeIndexes?.startRowIndex;
        if (typeof startRowIndex === "number" && startRowIndex >= 0) {
          this.triggerEditCell(currentSelection?.selectionRangeIndexes);
        }
      },
    },
    showFieldEditor(newVal, oldVal) {
      if (newVal === true) {
        this.stopAutoSave();
        // this.removeDocumentEventListener();
      } else {
        this.setCellSelection();
        // if (oldVal === true) {
        //   this.initDocumentEventListener();
        // }
        const reqData = this.buildReqParams();
        // 弹窗关闭 继续倒计时保存
        if (reqData?.length) {
          this.autoSave();
        }
      }
    },
  },
  computed: {
    ...mapState(useUserStore, ["userInfo", "tenants"]),
    currentCellValue() {
      if (this.fieldEditorParams?.row && this.fieldEditorParams?.column) {
        const { row, column } = this.fieldEditorParams;
        return row[column.field];
      }
    },
    currentRowData() {
      if (
        typeof this.currentRowIndex === "number" &&
        this.currentRowIndex > -1
      ) {
        return this.tableData[this.currentRowIndex];
      }
    },
    gridButton() {
      return this.v2data?.gridButton?.filter((item) => {
        if (["select", "refresh"].includes(item.button_type)) {
          return false;
        }
        if (["增加弹出"]?.includes(item.operate_type)) {
          return false;
        }
        if (!item.permission) {
          return false;
        }
        return true;
      });
    },
    rowButton() {
      return this.v2data?.rowButton
        ?.filter((item, index) => {
          item._index = index;
          return !["edit"].includes(item.button_type) && item.permission;
        })
        ?.map((item) => {
          return {
            label: item.button_name,
            ...item,
          };
        });
    },
    setAllFields() {
      // 所有字段
      return this.v2data?.srv_cols || [];
    },
    topTreeData() {
      return !!this.$route?.query?.topTreeData;
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
            let serviceName = this.columnWidthMap[key].fieldInfo.service_name;
            const addService = this.addColsMap?.[key]?.service_name;
            const updateService = this.updateColsMap?.[key]?.service_name;
            if (addService && !serviceName.includes(addService)) {
              serviceName += `,${addService}`;
            }
            if (updateService && !serviceName.includes(updateService)) {
              serviceName += `,${updateService}`;
            }
            if (this.serviceName && !serviceName.includes(this.serviceName)) {
              serviceName += `,${this.serviceName}`;
            }
            if (
              this.v2data?.service_name &&
              !serviceName.includes(this.v2data?.service_name)
            ) {
              serviceName += `,${this.v2data?.service_name}`;
            }
            arr.push({
              serviceName: "srvsys_service_columns_query_update",
              data: [{ list_min_width: this.columnWidthMap[key].width }],
              condition: [
                { colName: "columns", value: key, ruleType: "eq" },
                {
                  colName: "service_name",
                  value: serviceName,
                  ruleType: "in",
                },
                // {
                //   colName: "table_name",
                //   value: this.columnWidthMap[key].fieldInfo.table_name,
                //   ruleType: "eq",
                // },
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
          // if(selectionRangeKeys?.startColKey ==='_handler_btn' || selectionRangeKeys?.startColKey ==='_handler_btn'){
          //   return false
          // }
          console.log("---contextmenu body beforeShow--");
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
          if (["SUM", "AVG", "COUNT", "MIN", "MAX"].includes(type)) {
            // 求和计数等
            const startColIndex = selectionRangeIndexes.startColIndex;
            const endColIndex = selectionRangeIndexes.endColIndex;
            const rows = this.tableData.slice(startRowIndex, endRowIndex + 1);
            const cols = this.columns
              .slice(startColIndex, endColIndex + 1)
              .map((item) => item.field);
            console.log(rows, cols, ":::求和计数:::");
            let result = null;
            let valid = 0; // 有效的用来计算的值的数量
            switch (type) {
              case "SUM":
                result = rows.reduce((res, cur) => {
                  cols.forEach((col) => {
                    if (!Number.isNaN(Number(cur[col]))) {
                      valid++;
                      res += Number(cur[col]);
                    }
                  });
                  return res;
                }, 0);
                break;
              case "AVG":
                result =
                  rows.reduce((res, cur) => {
                    cols.forEach((col) => {
                      if (!Number.isNaN(Number(cur[col]))) {
                        valid++;
                        res += Number(cur[col]);
                      }
                    });
                    return res;
                  }, 0) / length;
                break;
              case "COUNT":
                if (cols.length > rows.length) {
                  return this.$message.error("行数跟列数只能有一个大于1");
                } else if (cols.length > rows.length) {
                  result = cols.length;
                  valid++;
                } else {
                  result = rows.length;
                  valid++;
                }
                break;
              case "MIN":
                result = rows.reduce((res, cur) => {
                  cols.forEach((col) => {
                    if (!Number.isNaN(Number(cur[col]))) {
                      res = Math.min(res, Number(cur[col]));
                      valid++;
                    }
                  });
                  return res;
                }, Number.MAX_SAFE_INTEGER);
                break;
              case "MAX":
                result = rows.reduce((res, cur) => {
                  cols.forEach((col) => {
                    if (!Number.isNaN(Number(cur[col]))) {
                      res = Math.max(res, Number(cur[col]));
                      valid++;
                    }
                  });
                  return res;
                }, Number.MIN_SAFE_INTEGER);
                break;
            }

            if (valid === 0) {
              result = null;
            }

            if (
              ![
                null,
                Number.MAX_SAFE_INTEGER,
                Number.MIN_SAFE_INTEGER,
              ].includes(result)
            ) {
              this.$confirm(
                `${type}结果为： ${result} ,是否将结果复制到剪切板？`,
                "提示",
                {
                  type: "success",
                }
              )
                .then(() => {
                  copyTextToClipboard(result).then((res) => {
                    console.log(res);
                    if (res.success) {
                      this.$message.success("复制成功");
                    } else if (res.msg) {
                      this.$message.error(res.msg);
                    } else {
                      this.$message.error("复制失败");
                    }
                  });
                })
                .catch(() => {
                  console.log("取消复制");
                });
            } else {
              this.$message.error("计算异常！请检查数据格式是否正确");
            }
          } else if (type === "addchild") {
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
        {
          type: "SEPARATOR",
        },
        {
          type: "CALCULATE",
          label: "计算",
          children: [
            {
              type: "SUM",
              label: "求和",
            },
            {
              type: "AVG",
              label: "平均值",
            },
            {
              type: "COUNT",
              label: "计数",
            },
            {
              type: "MAX",
              label: "最大值",
            },
            {
              type: "MIN",
              label: "最小值",
            },
          ],
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
          defaultHiddenColumnKeys: this.defaultConditions
            .map((item) => item.colName)
            .filter(
              (item) => !this.setFilterState.find((e) => e.colName === item)
            ),
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
              "disabled",
              "srvApp",
              "menuapp",
              "isTree",
              "topTreeData",
              "fixedCol",
              "initCond",
              "colSrv", // 用来查找显示的列的服务
              "listType",
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
      return this.v2data?.rowButton?.find(
        (item) =>
          item.button_type.includes("addchild") &&
          item.permission &&
          item.service_name
      );
    },
    addButton() {
      return this.v2data?.gridButton?.find(
        (item) =>
          item.button_type.includes("add") &&
          item.permission &&
          item.service_name
      );
    },
    deleteButton() {
      return this.v2data?.rowButton?.find(
        (item) =>
          item.button_type.includes("delete") &&
          item.permission &&
          item.service_name
      );
    },
    updateButton() {
      return this.v2data?.rowButton?.find(
        (item) =>
          item.button_type?.includes("edit") &&
          item.permission &&
          item.service_name
      );
    },
    detailButton() {
      return this.v2data?.rowButton?.find((item) =>
        item.button_type?.includes("detail")
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
    clickPage() {
      const currentCellSelectionType =
        this.$refs?.tableRef?.currentCellSelectionType;
      if (!currentCellSelectionType) {
        this.onFieldEditorBlur();
      } else if (currentCellSelectionType !== "single") {
        this.buildFieldEditorParams();
      }
    },
    onFieldEditorBlur() {
      console.log("onFieldEditorBlur");
      this.clearCellSelection();
      this.buildFieldEditorParams();
    },
    onFieldEditorFocus(row, column) {
      row = row || this.fieldEditorParams.row;
      column = column || this.fieldEditorParams.column;
      if (row.rowKey && column.key) {
        this.setCellSelection(row.rowKey, column.key);
      }
    },
    setCellSelection(rowKey, colKey) {
      rowKey = rowKey || this.fieldEditorParams?.row?.__id;
      colKey = colKey || this.fieldEditorParams?.column?.key;
      if (rowKey && colKey) {
        this.$nextTick(() => {
          this.$refs["tableRef"].setCellSelection({ rowKey, colKey });
        });
      }
    },
    clearCellSelection() {
      this.$refs?.tableRef?.clearCellSelectionCurrentCell?.();
    },
    fksChange(item, row, column) {
      this.setCellSelection();
      let val = item;
      if (typeof item === "object") {
        val = JSON.stringify(item);
      }
      this.$refs["tableRef"].startEditingCell({
        rowKey: row.rowKey,
        colKey: column.field,
        defaultValue: val || null,
      });
      this.$refs["tableRef"].stopEditingCell();
      const rowIndex = this.tableData.findIndex(
        (item) => item.rowKey === row.rowKey
      );
      this.handlerRedundant(
        item.option || item.rawData,
        column.key,
        row.rowKey,
        rowIndex
      );
    },
    fkChange(item, row, column) {
      this.setCellSelection();
      this.$refs["tableRef"].startEditingCell({
        rowKey: row.rowKey,
        colKey: column.field,
        defaultValue: item?.value || null,
      });
      this.$refs["tableRef"].stopEditingCell();
      const rowIndex = this.tableData.findIndex(
        (item) => item.rowKey === row.rowKey
      );
      row["_rawData"] = item?.option || item.rawData;
      this.$set(this.tableData, rowIndex, row);
      this.handlerRedundant(row["_rawData"], column.key, row.rowKey, rowIndex);
    },
    async fkAutocompleteChange(item, row, column) {
      if (!item) {
        item = null;
      }
      this.setCellSelection();
      const defaultValue =
        item?.label ||
        item?.[column?.__field_info?.redundant?.refedCol] ||
        null;
      const obj = {
        rowKey: row.rowKey,
        colKey: column.field,
        defaultValue: defaultValue,
      };
      this.$refs["tableRef"].startEditingCell(obj);
      this.$refs["tableRef"].stopEditingCell();
      this.$set(row, column.field, defaultValue);

      // 对应的fk字段
      const rawData = item?.option || item || null;
      const fkColumn = column?.__field_info?.redundant?.dependField;
      const rowIndex = this.tableData.findIndex(
        (item) => item.rowKey === row.rowKey
      );
      if (fkColumn) {
        const fkColumnInfo = this.setAllFields.find(
          (item) => item.columns === fkColumn
        );
        if (fkColumnInfo) {
          let data = rawData || {};
          row[fkColumn] = item?.value;
          // row[fkColumn] = item.value || item[fkColumnInfo.columns];
          row[`_${fkColumn}_data`] = rawData;
          this.$set(row, fkColumnInfo.columns, row[fkColumn]);

          // this.$set(this.tableData, rowIndex, row);
          if (this.allFields.find((e) => e.columns === fkColumn)) {
            this.$refs["tableRef"].startEditingCell({
              rowKey: row.rowKey,
              colKey: fkColumn,
              defaultValue: row[fkColumn],
            });
            this.$refs["tableRef"].stopEditingCell();
            this.clearCellSelection();
          }
          row["_rawData"] = rawData;
          this.$set(this.tableData, rowIndex, row);
          this.handlerRedundant(data, fkColumn, row.rowKey, rowIndex);
        }
      }
    },
    dialogChange(event, row, column, type) {
      // 将html中的文件地址前缀替换为$bxFileAddress$
      event = this.replaceFileAddressSuffix(event);
      this.$set(row, column.field, event);
      // console.log("data-change:", row, column.field, event);
      this.$refs["tableRef"].startEditingCell({
        rowKey: row.rowKey,
        colKey: column.field,
        defaultValue: event || null,
      });
      this.$refs["tableRef"].stopEditingCell();

      this.clearCellSelection();
      if (type === "save") {
        this.$nextTick(() => {
          this.saveData();
        });
      }
      // this.showFieldEditor = false;
    },
    dialogClose() {
      // this.$parent?.setCellSelection?.();
      // this.fieldEditorParams = null;
      this.clearCellSelection();
      this.buildFieldEditorParams();
    },
    clearFieldEditorParams() {
      this.fieldEditorParams = null;
      this.showFieldEditor = false;
    },
    buildFieldEditorParams(row, column, params) {
      if (!row || !column) {
        this.fieldEditorParams = null;
        this.showFieldEditor = false;
        return;
      }
      let editable = true;
      if (row.__flag === "add") {
        // 新增行 处理in_add
        if (!this.addColsMap[column.field]?.in_add) {
          editable = false;
        }
      } else {
        // 编辑行 处理in_update
        if (!this.updateColsMap[column.field]?.in_update) {
          editable = false;
        }
      }
      if (row.__flag !== "add" && !row?.__button_auth?.edit) {
        editable = false;
      }
      const oldRowData = this.oldTableData?.find(
        (item) => item.__id && item.__id === row.__id
      );
      const position =
        this.$refs?.tableRef?.$refs?.cellSelectionRef?.cellSelectionRect
          ?.currentCellRect;
      this.currentCell = this.$refs?.tableRef?.cellSelectionData?.currentCell;
      this.fieldEditorParams = {
        oldValue: oldRowData?.[column.field],
        editable,
        row,
        column,
        position,
      };
    },
    stopAutoSave() {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
      this.autoSaveInterval = null;
      this.autoSaveTimeout = 0;
    },
    autoSave() {
      this.stopAutoSave();
      if (["add", "addchildlist"].includes(this.childListType)) {
        // add子表不自动保存
        return;
      }
      const reqData = this.buildReqParams();
      if (!reqData?.length) {
        console.log("没有需要保存的内容");
        return;
      }
      this.autoSaveTimeout = 60 * 3;
      this.autoSaveInterval = setInterval(() => {
        const reqData = this.buildReqParams();
        if (!reqData?.length) {
          console.log("没有需要保存的内容");
          return this.stopAutoSave();
        }
        this.autoSaveTimeout--;
        console.log(`自动保存倒计时：${this.autoSaveTimeout}`);
        if (this.autoSaveTimeout <= 0) {
          this.stopAutoSave();
          console.log("即将进行自动保存");
          this.saveData({ isAutoSave: true });
        }
      }, 1000);
    },
    onCtrlS: debounce(
      function () {
        this.saveData();
      },
      1000,
      {
        leading: true, // 函数是否在首次调用时立即执行
        trailing: false, // 函数是否在最后一次调用后的延迟时间结束时执行
      }
    ),
    // 初始化document事件监听
    initDocumentEventListener() {
      this.removeDocumentEventListener();
      document.addEventListener("keydown", this.bindKeydownListener);
    },
    // 移除document事件监听
    removeDocumentEventListener() {
      document.removeEventListener("keydown", this.bindKeydownListener);
    },
    bindKeydownListener(e = {}) {
      // 绑定快捷键
      const keyCode = e.keyCode || e.which;
      keyCode === 116 && e.preventDefault(); // 禁止F5刷新
      if (keyCode === 27 && this.showFieldEditor) {
        this.showFieldEditor = false;
      }
      if (this.showFieldEditor) {
        // 弹出表单字段编辑器时 不触发快捷键

        return;
      }
      if (e.ctrlKey || e.metaKey) {
        if (["z", "Z"].includes(e.key)) {
          if (e.shiftKey) {
            // shift+ctrl+ Z 重做
            this.redo?.();
          } else {
            // ctrl + Z  撤销
            this.undo?.();
          }
        } else if (["Y", "y"].includes(e.key)) {
          // ctrl + Y  重做
          this.redo?.();
        } else if (e.key === "s") {
          // ctrl+s 保存
          e.preventDefault(); // 阻止默认的保存行为
          console.log("CTRL+S");
          this.onCtrlS();
        } else if (e.key === "+" || e.key === "=") {
          // ctrl+ + 新建一行数据
          console.log("CTRL +");
          e.preventDefault();
          const selection = this.$refs?.tableRef?.getRangeCellSelection();
          let index = 0;
          if (selection?.selectionRangeIndexes?.endRowIndex) {
            index = selection?.selectionRangeIndexes?.endRowIndex;
          }
          this.insert2Rows(index);
        }
      } else {
        if (keyCode === 116) {
          // F5键的keyCode为116
          console.log("F5被按下");
          // 刷新页面
          this.$message({
            type: "info",
            message: "刷新数据",
            duration: 500,
          });
          this.refreshData();
        }
      }
    },
    handleRedundantCalc(fieldInfo, row) {
      let func = fieldInfo.redundant.func;
      debugger;
      const field = {
        setSrvVal: (val) => {
          row[fieldInfo.columns] = val;
        },
        getSrvVal: () => {
          return row[fieldInfo.columns];
        },
        isEmpty: () => {
          return [null, "", undefined].includes(row[fieldInfo.columns]);
        },
      };
      if (func) {
        let update = false;
        if (fieldInfo.redundant.trigger == "isnull" && field.isEmpty()) {
          update = true;
        } else if (
          !fieldInfo.redundant.trigger ||
          fieldInfo.redundant.trigger == "always"
        ) {
          update = true;
        }
        if (update) {
          const moment = dayjs;

          // const ret = eval("var zz=" + func + "(row, self, field); zz");
          let ret = undefined;
          try {
            const commonUtil = {
              $http,
              moment,
              dayjs,
            };
            console.log("commonUtil:", commonUtil);

            ret = eval(`(${func})(row,commonUtil,field)`);
            // ret = eval("var zz=" + func + "(row, commonUtilObject, field); zz");
          } catch (error) {
            console.error("Error executing function:", error);
            // 根据需求决定如何处理错误，例如返回默认值或抛出异常
            ret = undefined;
          }
          if (ret === "Invalid date") {
            return;
          }

          if (typeof ret === "function") {
            return;
          }
          if (ret !== undefined) {
            if (typeof ret === "object" && ret instanceof Promise) {
              ret.then((val) => {
                row[fieldInfo.columns] = val;
              });
            } else {
              if (field.getSrvVal() !== ret) {
                field.setSrvVal(ret);
              }
            }
          }
        }
      }
    },
    onGridButton(button) {
      //　列表头部按钮
      console.log("gridButtonClick", button);
      let self = this;
      var type = button.button_type;
      var exeservice = button.service_name;
      var tab_title = button.service_view_name;
      var operate_type = button.operate_type;
      var moreConfig = null;
      if (button.more_config && typeof button.more_config === "string") {
        try {
          moreConfig = JSON.parse(button.more_config);
        } catch (error) {
          console.log(error);
        }
      }

      if (
        button.hasOwnProperty("always_show") &&
        button.always_show &&
        !button.permission
      ) {
        // 无权限的按钮永久显示，操作弹出配置提示信息
        this.$alert(
          button.tip_msg ? button.tip_msg : "您无法进行该操作",
          "提示",
          {
            confirmButtonText: "确定",
          }
        );
        return;
      }
      if (
        button.action_validate &&
        this.evalActionValidator(button.action_validate, this.tableData) !==
          true
      ) {
        return;
      }

      if ("select" == type) {
      } else if ("extjs" === type) {
        button.handlerFunc && button.handlerFunc();
      } else if ("shrink" == type) {
        self.selectFormShow = false;
      } else if ("refresh" == type) {
        self.refreshData();
      } else if ("batch_delete" == type) {
        // self.batchDeleteData(exeservice);
      } else if ("add" == type) {
        self.insert2Rows();
      } else if ("confirmadd" == type) {
        if (this.multipleSelection.length == 0) {
          this.$alert("请选择需要添加的数据", "提示", {
            confirmButtonText: "确定",
          });
        } else {
          var relation_col = "";
          var referenced_column_name = "";
          let map_table = this.mapcondition.map_table;
          var table_col_realtion = button.table_col_realtion;
          for (var item of table_col_realtion) {
            if (item.table_name == map_table) {
              relation_col = item["column_name"];
              referenced_column_name = item["referenced_column_name"];
              break;
            }
          }

          if (relation_col != "") {
            let bxRequests = [];
            let bxRequest = {};
            bxRequests.push(bxRequest);
            bxRequest.serviceName = this.mapcondition.addservice;
            bxRequest.data = [];

            for (var item of this.multipleSelection) {
              var dataMap = {};
              dataMap[this.mapcondition.input_col_name] =
                this.mapcondition.input_col_value;
              dataMap[relation_col] = item[referenced_column_name];
              bxRequest.data.push(dataMap);
            }

            this.operate(bxRequests).then((response) => {
              var state = response.data.state;

              if ("SUCCESS" == state) {
                this.$message({
                  type: "success",
                  message: "添加成功!",
                });

                // this.loadTableData()
                this.$emit("action-complete");
              } else {
                this.$message({
                  type: "error",
                  message: response.data.resultMessage,
                });
              }
            });
          }
        }
      } else if ("batchadd" == type) {
        console.log("batchadd", button);
        // if (button.hasOwnProperty("btn_cfg_json")) {
        //   this.buildBatchConfig(button);
        // } else {
        //   console.error(button);
        // }
      } else if ("batchupdate" == type) {
        //批量添加
        console.log("batchupdate", button);
        // if (this.header_view_model != "normal") {
        //   this.header_view_model = "normal";
        //   this.gridHeader = this.noramlHeaders;
        // }
        // this.onBatchUpdateClick();
        // this.onInplaceEditClicked();
      } else if ("saveall" == type) {
        this.saveData();
        // this.onSaveAllClicked();
      } else if ("apply" == type) {
        // var urlParams = `/${exeservice}?time=${(new Date()).getTime()}`;
        // var urlParams = `/${exeservice}`;
        // this.addTab(
        //   "start-proc",
        //   urlParams,
        //   tab_title,
        //   null,
        //   button,
        //   button.application
        // );
      } else if ("export" == type) {
        // this.onExportClicked();
        // this.activeForm = "export"   // 显示导出配置
      } else if ("import" == type) {
        // this.onImportClicked(button);
      } else if ("customize" == type) {
        var operate_params_cfg = button.operate_params;
        var select_data = button.select_data;
        // if (
        //   (select_data == null ||
        //     select_data == undefined ||
        //     select_data == "是") &&
        //   this.multipleSelection <= 0 &&
        //   operate_params_cfg != undefined &&
        //   operate_params_cfg != "" &&
        //   operate_params_cfg != null
        // ) {
        //   this.$alert("请选择操作数据", "提示", {
        //     confirmButtonText: "确定",
        //   });
        // } else {
        var me = this;

        if (button.operate_type == "修改") {
          this.customize_update(button, this.multipleSelection);
        } else if (button.operate_type == "删除") {
          this.customize_delete(operate_item, this.multipleSelection);
        } else if (button.operate_type == "增加") {
          this.customize_add(button, this.multipleSelection);
        } else if (button.operate_type == "增加弹出") {
          console.log("customize button", button);
          customizeOperate(button, this.multipleSelection, (e) => {
            // dialog操作完成之后的回调 刷新列表
            this.loadTableData();
          });
          // this.customize_add(button, this.multipleSelection);
        } else {
          button.listservice = this.service;
          customizeOperate(
            button,
            this.multipleSelection,
            (e) => {
              // dialog操作完成之后的回调 刷新列表
              // this.loadTableData();
            },
            { vm: this }
          );
        }
        // }
      } else if ("batch_approve" == type) {
        // this.onBatchApprove(this.multipleSelection, button);
      }
    },
    onRowButton(item) {
      const currentRowIndex = this.currentRowIndex;
      console.log("onRowButton", item, this.tableData[currentRowIndex]);
      const row = this.tableData[currentRowIndex];
      if (row) {
        rowButtonClick({
          operate_item: item,
          row,
          mainData: this.mainData,
          vm: this,
        }).then((res) => {
          if (res?.type === "deleteRowData") {
            this.deleteRow([res.row]);
          } else if (res?.type === "onDuplicateClicked") {
            this.insert2Rows(currentRowIndex, null, row);
          } else if (res?.type === "addchild") {
            // 树形表添加下级节点
            if (res?.row?.__id) {
              // this.$set(this.tableData[startRowIndex], "__unfold", true);
              // if(this.tableData[startRowIndex]?._$vue){
              //   this.tableData[startRowIndex]?._$vue?.changeFold()
              // }
              if (row.__unfold === true) {
                this.insert2Rows(currentRowIndex + 1, res.row);
              } else {
                this.loadTree(true, row, currentRowIndex).then((data) => {
                  this.insert2Rows(currentRowIndex + data.length + 1, res.row);
                });
              }
            }
          } else if (!res) {
            this.$message.error("功能待开发");
          }
        });
      }
      this.currentRowIndex = -1;
    },
    // getInitData(cfg = {}) {
    //   const service = cfg.select_srv;
    //   const condition = cfg.condition.map(item => {
    //     if (item.value_main_col && this.mainData) {
    //       item.value = this.mainData[item.value_main_col];
    //     }
    //     return item
    //   })
    //   const url =  `/${cfg.app}/select/${service}`
    //   onSelect(service,cfg.app,condition).then(res=>{
    //     console.log(res)
    //     if(res.data?.length){
    //       // this.initData = res.data
    //       res.data.forEach(item=>{
    //         const obj = {}
    //         Object.keys(cfg.mapping).forEach(key=>{
    //           obj[key] = item[key]
    //         })
    //         this.insert2Rows(this.tableData.length,null,obj)
    //       })
    //     }
    //   })
    //
    // },
    watchPageHeight() {
      const element = document.querySelector(".ve-table-container");
      // 监听可能引起高度变化的事件，例如图片加载完成、DOM变更等
      var observer = new MutationObserver(function (mutationsList) {
        mutationsList.forEach(function (mutation) {
          // 检查是否有高度相关的变更
          sendHeightToParent();
        });
      });

      // 配置观察器选项
      var config = { attributes: true, childList: false, subtree: false };

      // 开始观察整个文档
      observer.observe(element, config);

      const sendHeightToParent = () => {
        var height = element?.scrollHeight;
        if (height) {
          this.bcEmit("heightChange", height + 60);
          this.listMaxHeight = height + 80;
        } else {
          this.bcEmit("heightChange", 80 + 60);
        }
        // window.parent.postMessage({ type: 'iframeHeight', height: height }, '*'); // '*' 表示允许任何源，实际应用中应指定确切的源
      };
    },
    bcOn(event) {
      let data = event.data;
      try {
        if (typeof data === "string") {
          data = JSON.parse(data);
        }
      } catch (e) {}
      console.log("child-listener", data);
      if (data?.childListCfg) {
        console.log("childListCfg", data.childListCfg);
        this.childListCfg = data.childListCfg;
      }
      if (data?.mainData) {
        this.mainData = data?.mainData;
      }
      if (data?.type === "initDataChange") {
        console.log("initDataChange", data);
        this.tableData = [];
        if (data?.data?.length) {
          data.data.forEach((item) => {
            this.insert2Rows(this.tableData.length, null, item);
          });
          if (this.disabled === true) {
            console.log("emitListData::", this.tableData);
            this.emitListData();
          }
        }
      }
      if (data?.type === "colSrvChange" && data.colSrv) {
        this.initPage();
      }
    },
    bcEmit(type, data) {
      // 通过broadcastChannel广播消息
      if (broadcastChannel?.postMessage) {
        const msg = {
          type,
          data,
        };
        broadcastChannel.postMessage(JSON.stringify(msg));
      }
    },
    emitListData() {
      let data = JSON.parse(JSON.stringify(this.tableData));
      if (this.childListType === "add") {
        data = data.filter((item) =>
          Object.keys(item).some(
            (key) => !ignoreKeys.includes(key) && item[key]
          )
        );
        data.forEach((item) => {
          Object.keys(item).forEach((key) => {
            if (ignoreKeys.includes(key) || key?.indexOf("_") === 0) {
              delete item[key];
            }
          });
        });
      }
      const reuslt = [
        {
          serviceName: this.addButton?.service_name,
          data: [...data],
          depend_keys: [
            {
              type: "column",
              depend_key:
                this.childListCfg?.foreign_key?.referenced_column_name,
              add_col: this.childListCfg?.foreign_key?.column_name,
            },
          ],
        },
      ];
      console.log("emitListData", reuslt);
      this.bcEmit("getData", reuslt);
    },
    fold() {
      // 收起
      this.listMaxHeight = 0;
    },
    unfold() {
      // 展开
      this.listMaxHeight =
        document.querySelector(".ve-table-container")?.scrollHeight + 80;
      // document.documentElement.clientHeight - 50;
    },
    isFk(column) {
      if (column?.col_type || column?.bx_col_type) {
        const fkTypes = ["User", "Dept", "bxsys_user", "bxsys_dept", "fk"];
        return (
          fkTypes.includes(column.col_type) ||
          column.bx_col_type === "fk" ||
          column.bx_col_type?.indexOf("bx") === 0
        );
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
      }
      if (value?.includes("userInfo.")) {
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
      } else if (["本人"].includes(value) && column && this.isFk(column)) {
        value = userInfo?.user_no;
      }
      return value;
    },
    buildInitCond() {
      let arr = [];
      let initExprFields = this.initExprCols;
      // || this.allFields.filter(item => !!item.init_expr)
      // 只有init_expr 使用init_expr
      if (initExprFields?.length) {
        initExprFields.forEach((item) => {
          if (
            this.filterState[item.columns] !== null &&
            !this.filterState[item.columns]
          ) {
            let obj = {
              colName: item.columns,
              ruleType: "eq",
            };
            if (item.init_expr?.indexOf("'") === 0) {
              obj.value = item.init_expr.replaceAll("'", "");
            }
            if (obj.value) {
              arr.push(obj);
            }
          }
        });
      }
      if (this.$route?.query?.initCond) {
        let str = this.$route?.query?.initCond;
        try {
          str = JSON.parse(decodeURIComponent(str));
          if (Array.isArray(str) && str?.length) {
            str.forEach((item) => {
              item.value = this.explainValue(item.value);
              // init_expr跟initCond都有 使用initCond
              arr = arr.filter((e) => e.colName !== item.colName);
              arr.push(item);
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
      let query_init_value_lsit = this.v2data.srv_cols.filter(
        (item) => item.query_init_value?.value
      );
      if (query_init_value_lsit?.length) {
        query_init_value_lsit.forEach((item) => {
          let obj = {
            colName: item.columns,
            ruleType: "eq",
            value: item.query_init_value.value,
          };
          obj.value = this.explainValue(obj.value);
          if (Array.isArray(obj.value) && obj.value.length === 2) {
            obj.ruleType = "between";
          } else if (Array.isArray(obj.value)) {
            obj.ruleType = "in";
            obj.value = obj.value.join(",");
          }
          // 优先使用query_init_value配置的初始查询条件
          arr = arr.filter((e) => e.colName !== obj.colName);
          arr.push(obj);
        });
      }
      this.initCond = arr;
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
      this.$refs?.changeParentRef?.open(row);
    },
    startLoading(timeout = 20 * 1000) {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, timeout);
    },
    async initPage(refresh = true) {
      if (this.serviceName) {
        this.startLoading();
        const v2Data = await this.getV2Data();
        this.bx_auth_ticket = sessionStorage.getItem("bx_auth_ticket");
        if (v2Data === false) {
          return;
        }
        if (this.childListType === "add") return (this.loading = false); //新增时不查子表数据
        this.buildInitCond();
        this.loading = false;
        // if (refresh) {
        //   setTimeout(() => {
        //     this.isFetched = false;
        //     this.getList().then(() => {
        //       this.isFetched = true;
        //     });
        //   }, 300);
        // }
        if (refresh) {
          return new Promise((resolve) => {
            setTimeout(() => {
              this.isFetched = false;
              this.getList().then(() => {
                this.isFetched = true;
                resolve();
              });
            }, 300);
          });
        }
      }
    },
    listTypeChange(val) {
      console.log(val);
      this.initPage();
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
    triggerEditCell(
      { startRowIndex, endRowIndex, startColIndex, endColIndex },
      sourceData
    ) {
      // 触发编辑事件
      const columns = this.columns.filter(
        (item) =>
          !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
            item.field
          )
      );
      const changedCols = [];
      for (let i = startRowIndex; i <= endRowIndex; i++) {
        const row = this.tableData[i];
        for (let j = startColIndex; j <= endColIndex; j++) {
          const col = columns[j];
          if (["FileList"].includes(col?.__field_info?.col_type)) {
            // 附件类型 不触发
            return;
          }
          this.$refs["tableRef"]?.startEditingCell?.({
            rowKey: row.rowKey,
            colKey: col.field,
            defaultValue: row[col.field],
          });
          this.$refs["tableRef"]?.stopEditingCell?.();
          changedCols.push({
            rowKey: row.rowKey,
            row: row,
            colKey: col.field,
            fieldInfo: col.__field_info,
            defaultValue: row[col.field],
          });
          // this.clearCellSelection();
        }
      }
      if (changedCols?.length) {
        changedCols.forEach((item) => {
          const { rowKey, row, colKey, fieldInfo } = item;
          const targetCol = item?.fieldInfo?.redundant_options?._target_column;
          if (targetCol && sourceData) {
            // autocomplete字段 由别的行自动填充赋值之后，将对应的fk字段也赋值
            let targetColInfo = this.columns.find((e) => e.field === targetCol);
            if (targetColInfo && sourceData[targetColInfo.field]) {
              const row = this.tableData.find((e) => e.rowKey === rowKey);
              this.$refs["tableRef"]?.startEditingCell?.({
                rowKey: rowKey,
                colKey: targetColInfo.field,
                defaultValue: sourceData[targetColInfo.field],
              });
              this.$refs["tableRef"]?.stopEditingCell?.();
              this.$set(
                row,
                targetColInfo.field,
                sourceData[targetColInfo.field]
              );
            }
          } else if (isFk(fieldInfo) && sourceData) {
            console.log("fkUtil2");
            // fk字段 由别的行自动填充赋值之后，将对应的冗余字段也赋值
            const fkUtil = new FkUtil(fieldInfo, this.srvApp);
            const element = sourceData[colKey];
            fkUtil.getMatchedValue(element, "eq").then((matchedValue) => {
              if (matchedValue) {
                const event = {
                  value: element,
                  rawData: matchedValue,
                };
                const column = {
                  field: colKey,
                  key: colKey,
                  __field_info: fieldInfo,
                };
                this.fkChange(event, row, column);
              }
            });
          }
        });
      }
    },
    undo() {
      // ctrl+z 撤销
      const tableData = this.recordManager?.undo();
      if (Array.isArray(tableData) && tableData?.length) {
        this.tableData = cloneDeep(tableData);
      }
      this.autoSave();
    },
    redo() {
      // ctrl+y 重做
      const tableData = this.recordManager?.redo();
      if (Array.isArray(tableData) && tableData?.length) {
        this.tableData = cloneDeep(tableData);
      }
      this.autoSave();
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
          width: 50,
          fixed: "left",
          renderBodyCell: function ({ rowIndex, row }) {
            return startRowIndex + rowIndex + 1;
          },
        },
      ];
      if (Array.isArray(this.allFields) && this.allFields.length > 0) {
        let minWidth = (window.innerWidth + 50) / this.allFields.length;
        if (this.childListType === "add") {
          minWidth -= 200;
        }
        if (minWidth < 200) {
          minWidth = 200;
        }
        columns = columns.concat(
          this.allFields.map((item, index) => {
            let width = minWidth;
            const length = item?.label?.replace(
              /[^A-Za-z0-9\u4e00-\u9fa5+]/g,
              ""
            )?.length;
            if (length && length > 6) {
              // 去掉符号的字符数长度大于6
              // console.log(`${item.label}:${length}`);
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
              const conditions = [...this.initCond, ...this.defaultConditions];
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
                  childListType: this.childListType,
                },
                on: {
                  "filter-change": (event) => {
                    if (event?.colName) {
                      if (
                        this.initCond?.find(
                          (item) => item.colName === event.colName
                        )
                      ) {
                        // 清空初始查询条件
                        this.initCond = this.initCond.filter(
                          (item) => item.colName !== event.colName
                        );
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
                    const reqData = this.buildReqParams();
                    if (Array.isArray(reqData) && reqData.length) {
                      this.$message.error("请先保存已编辑的数据");
                      return;
                    }
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
                  item.option_list_v2 =
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
                const oldRowData = this.oldTableData?.find(
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
                  setColumn.redundant_options =
                    column.__field_info.redundant_options;
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
                if (setColumn.redundant_options && false) {
                  return h(fkAutocomplete, {
                    attrs: {
                      row,
                      column: setColumn,
                      disabled:
                        this.disabled ||
                        !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                      app: this.srvApp,
                      value: row[column.field],
                      defaultConditionsMap: this.defaultConditionsMap,
                      detailButton: this.detailButton,
                    },
                    on: {
                      onfocus: () => {
                        this.clearCellSelection();
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
                        this.clearCellSelection();
                      },
                      select: (rawData) => {
                        // 对应的fk字段
                        const fkColumn =
                          setColumn.redundant_options._target_column;
                        if (fkColumn) {
                          const fkColumnInfo = this.setAllFields.find(
                            (item) => item.columns === fkColumn
                          );
                          if (fkColumnInfo) {
                            let data = rawData || {};
                            row[fkColumn] =
                              data[setColumn.redundant_options.refed_col];
                            row[`_${fkColumn}_data`] = rawData;
                            this.$set(this.tableData, rowIndex, row);
                            if (
                              this.allFields.find((e) => e.columns === fkColumn)
                            ) {
                              this.$refs["tableRef"].startEditingCell({
                                rowKey: row.rowKey,
                                colKey: fkColumn,
                                defaultValue: row[fkColumn],
                              });
                              this.$refs["tableRef"].stopEditingCell();
                              this.clearCellSelection();
                            }
                            console.log("fkAutocomplete-select", rawData);

                            this.handlerRedundant(
                              data,
                              fkColumn,
                              row.rowKey,
                              rowIndex
                            );
                          }
                        }
                      },
                    },
                  });
                } else if (isFk(item) && false) {
                  const fieldInfo =
                    this.tableData[rowIndex]?.__flag == "add"
                      ? this.addColsMap[column.field]
                      : this.updateColsMap[column.field];
                  return h(fkSelector, {
                    attrs: {
                      value: row[column.field],
                      size: "mini",
                      fieldInfo: fieldInfo,
                      srvInfo:
                        this.updateColsMap[column.field]?.option_list_v2 ||
                        item.option_list_v2,
                      app: this.srvApp,
                      row,
                      column,
                      listType: this.listType,
                      disabled:
                        this.disabled ||
                        !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                    },
                    on: {
                      "multi-tab-option-select-change": (item, cfg) => {
                        console.log(
                          "multi-tab-option-select-change",
                          item,
                          cfg
                        );
                        if (cfg?.case_col && cfg?.case_val) {
                          if (cfg?.case_col in row) {
                            row[cfg.case_col] = cfg?.case_val;
                          }
                          this.$refs["tableRef"].startEditingCell({
                            rowKey: row.rowKey,
                            colKey: cfg.case_col,
                            defaultValue: row[cfg.case_col],
                          });
                          this.$refs["tableRef"].stopEditingCell();
                          this.clearCellSelection();
                          // this.$set(this.tableData, rowIndex, row);
                        }
                      },
                      onfocus: () => {
                        this.clearCellSelection();
                      },
                      modelChange: (event) => {
                        console.log("fkSelector-modelChange", event);
                      },
                      select: (event) => {
                        // fk选项发生变化
                        console.log("fkSelector-select 1", event);
                        const currentRow = this.tableData[rowIndex];
                        if (currentRow[column.field] !== event.value) {
                          // row[column.field] = event.value;
                        } else {
                          return;
                        }
                        console.log("fkSelector-select", event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event.value,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.clearCellSelection();
                        console.log(
                          "fkSelector-select-handlerRedundant",
                          event
                        );
                        // this.$set(this.tableData, rowIndex, row);
                        this.handlerRedundant(
                          event?.rawData,
                          column.field,
                          row.rowKey,
                          rowIndex
                        );
                      },
                      input: (event) => {
                        console.log("fkSelector-input", event);
                        row[column.field] = event;
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.clearCellSelection();
                        // this.$set(this.tableData, rowIndex, row);
                        // this.handlerRedundant(
                        //   {},
                        //   column.field,
                        //   row.rowKey,
                        //   rowIndex
                        // );
                      },
                    },
                  });
                } else if (
                  ["Date", "DateTime"].includes(item.col_type) &&
                  false
                ) {
                  if (this.disabled) {
                    return row[column.field] || "";
                  }
                  function setWidth(type) {
                    let width = 130;
                    switch (type) {
                      case "DateTime":
                        width = 180;
                        break;
                      case "Date":
                        width = 136;
                        break;
                    }
                    return width;
                  }
                  return h("el-date-picker", {
                    attrs: {
                      disabled:
                        this.disabled ||
                        !columnObj.edit ||
                        (row.__flag !== "add" &&
                          row?.__button_auth?.edit === false),
                      value: row[column.field]
                        ? new Date(row[column.field])
                        : "",
                      size: "mini",
                      type: item.col_type.toLowerCase(),
                      style: `width:${setWidth(item.col_type)}px;`,
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
                      // change: (event) => {
                      //   console.log('el-date-picker-change',event);
                      //   // self.$set(row, column.field, event);
                      //   this.$refs["tableRef"].startEditingCell({
                      //     rowKey: row.rowKey,
                      //     colKey: column.field,
                      //     defaultValue: event || null,
                      //   });
                      //   this.$refs["tableRef"].stopEditingCell();
                      //   this.clearCellSelection();
                      // },
                      input: (event) => {
                        console.log("el-date-picker-input", event);
                        self.$set(row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.clearCellSelection();
                      },
                    },
                  });
                } else if (
                  ["Enum", "Dict", "Set"].includes(item.col_type) &&
                  false
                ) {
                  if (!item.option_list_v2) {
                    item.option_list_v2 = [];
                  }
                  if (this.disabled) {
                    return row[column.field]
                      ? item.option_list_v2.find(
                          (e) => e.value === row[column.field]
                        )?.label || ""
                      : "";
                  }
                  return h(
                    "el-select",
                    {
                      attrs: {
                        disabled:
                          this.disabled ||
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
                          this.clearCellSelection();
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
                } else if (["Set"].includes(item.col_type) && false) {
                  let value = [];
                  if (row[column.field]) {
                    value = row[column.field].split(",");
                  }
                  if (!item.option_list_v2) {
                    item.option_list_v2 = [];
                  }
                  return h(
                    "el-select",
                    {
                      attrs: {
                        collapseTags: false,
                        multiple: true,
                        disabled:
                          this.disabled ||
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
                          this.clearCellSelection();
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
                } else if (["FileList", "Image"].includes(item.col_type)) {
                  // 文件
                  let editable = true;
                  if (row.__flag === "add") {
                    // 新增行 处理in_add
                    if (!this.addColsMap[column.field]?.in_add) {
                      editable = false;
                    }
                  } else {
                    // 编辑行 处理in_update
                    if (!this.updateColsMap[column.field]?.in_update) {
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
                      disabled: this.disabled || !editable,
                      value: row[column.field],
                      app: this.srvApp,
                    },
                    on: {
                      change: (event, field) => {
                        if (
                          field?._obj_col &&
                          field._obj_col.col &&
                          field._obj_col.type === "a_save_b_obj"
                        ) {
                          this.$set(
                            row,
                            field._obj_col.col,
                            field._obj_col.val
                          );
                          this.$set(
                            row,
                            "__flag",
                            row.__flag === "add" ? "add" : "update"
                          );
                          // this.$refs["tableRef"].startEditingCell({
                          //   rowKey: row.rowKey,
                          //   colKey: column.field,
                          //   defaultValue: event || null,
                          // });
                          // this.$refs["tableRef"].stopEditingCell();
                          // this.clearCellSelection();
                          return;
                        }
                        this.$set(row, column.field, event);
                        this.$set(
                          row,
                          "__flag",
                          row.__flag === "add" ? "add" : "update"
                        );
                        console.log("data-change:", row, column.field, event);
                        // this.$refs["tableRef"].startEditingCell({
                        //   rowKey: row.rowKey,
                        //   colKey: column.field,
                        //   defaultValue: event || null,
                        // });
                        // this.$refs["tableRef"].stopEditingCell();
                        // this.clearCellSelection();
                        // this.calcReqData = this.buildReqParams()
                      },
                    },
                  });
                } else {
                  let editable = true;
                  if (row.__flag === "add") {
                    // 新增行 处理in_add
                    if (!this.addColsMap[column.field]?.in_add) {
                      editable = false;
                    }
                  } else {
                    // 编辑行 处理in_update
                    if (!this.updateColsMap[column.field]?.in_update) {
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
                      disabled: this.disabled,
                      editable: editable,
                      html: row[column.field],
                      oldValue: oldRowData?.[column.field],
                      listType: this.listType,
                      app: this.srvApp,
                      serviceName: this.serviceName,
                      detailButton: this.detailButton,
                      keyDispCol: this.v2data?.key_disp_col,
                    },
                    on: {
                      needLogin: (callback) => {
                        this.$refs?.loginRef?.open(() => {
                          callback?.(true);
                        });
                      },
                      created: (vm) => {
                        // this.$set(row,'_$vue',vm)
                      },
                      onfocus: () => {
                        this.clearCellSelection();
                      },
                      onpopup: (val) => {
                        this.onPopup = val;
                      },
                      unfold: (event, callback) => {
                        this.loadTree(event, row, rowIndex, callback);
                      },
                      event: (event) => {
                        if (event === "showRichEditor") {
                          this.buildFieldEditorParams(row, column);
                          this.showFieldEditor = true;
                          this.clearCellSelection();
                        }
                      },
                      change: (event) => {
                        // 将html中的文件地址前缀替换为$bxFileAddress$
                        if (isFkAutoComplete(column.__field_info)) {
                          return this.fkAutocompleteChange(event, row, column);
                        } else if (isFk(column.__field_info)) {
                          return this.fkChange(event, row, column);
                        }
                        event = this.replaceFileAddressSuffix(event);
                        // console.log("data-change:", row, column.field, event);
                        this.$refs["tableRef"].startEditingCell({
                          rowKey: row.rowKey,
                          colKey: column.field,
                          defaultValue: event || null,
                        });
                        this.$refs["tableRef"].stopEditingCell();
                        this.$set(row, column.field, event);
                        this.clearCellSelection();
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
          fixedCol = columns
            .filter(
              (item, index) =>
                index !== 0 &&
                !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
                  item.key
                )
            )
            .filter((item, index) => index < this.$route.query?.fixedCol)
            .map((item) => item.key);
        } else {
          fixedCol = columns.find((item, index) => {
            return (
              index !== 0 &&
              !this.columnHiddenOption?.defaultHiddenColumnKeys?.includes(
                item.key
              )
            );
          });
          if (fixedCol?.__field_info?.redundant_options?.serviceName) {
            fixedCol = [];
          } else {
            fixedCol = [fixedCol?.key];
          }
        }
        columns = columns.map((item) => {
          if (fixedCol?.includes(item.key)) {
            item.fixed = "left";
            if (fixedCol?.indexOf(item.key) === 0) {
              item.linkToDetail = true;
            }
          }
          if (
            this.v2data?.key_disp_col &&
            item.key === this.v2data?.key_disp_col &&
            this.v2data?.key_disp_col !== "id"
          ) {
            // key_disp_col
            item.linkToDetail = true;
          }
          return item;
        });
        if (this.childListType === "add" && !this.disabled) {
          columns.push({
            field: "_handler",
            key: "_handler",
            operationColumn: true,
            title: "操作",
            width: 50,
            // fixed: "right",
            renderBodyCell: function ({ row, column, rowIndex }, h) {
              return h("div", {
                domProps: { innerHTML: "x" },
                attrs: {
                  style: "cursor:pointer;",
                  class: "hover:color-red",
                },
                on: {
                  click: () => {
                    console.log(row, "delete");
                    self.tableData = self.tableData.filter(
                      (item, index) => index !== rowIndex
                    );
                    self.emitListData();
                    // self.tableData = self.tableData.splice(rowIndex,1);
                  },
                },
              });
            },
          });
        }
        // return columns;
      }
      // columns = columns.concat(
      //   COLUMN_KEYS.map((keyValue) => {
      //     return {
      //       title: keyValue,
      //       field: keyValue,
      //       key: keyValue,
      //       width: 90,
      //       edit: true,
      //     };
      //   })
      // );
      if (!this.disabled) {
        columns.push({
          field: "_handler_btn",
          key: "_handler_btn",
          // operationColumn: true,
          title: "操作",
          width: 50,
          fixed: "right",
          renderBodyCell: function ({ row, column, rowIndex }, h) {
            return h("div", {
              domProps: { innerHTML: "<i class='i-ic-baseline-settings'></i>" },
              // domProps: { innerHTML: "操作" },
              attrs: {
                style: "cursor:pointer;",
                class: "hover:color-blue",
              },
              on: {
                // mouseenter: (event) => {
                //   event.stopPropagation();
                //   self.showDropMenu = true;
                //   console.log(row, rowIndex, event, "onHandler");
                //   self.dLeft = event.clientX;
                //   self.dTop = event.clientY;
                //   self.currentRowIndex = rowIndex;
                // },
                // mouseleave: (event) => {
                //   self.showDropMenu = false;
                //   self.dLeft = -1000
                //   self.dTop = -1000
                //   self.currentRowIndex = -1;
                // },
                contextmenu: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  console.log(row, "onHandler");
                },
                click: (event) => {
                  self.showDropMenu = true;
                  console.log(row, rowIndex, event, "onHandler");
                  self.dLeft = event.clientX;
                  self.dTop = event.clientY;
                  self.currentRowIndex = rowIndex;
                  // self.tableData = self.tableData.filter(
                  //   (item, index) => index !== rowIndex
                  // );
                  // self.emitListData();
                  // self.tableData = self.tableData.splice(rowIndex,1);
                },
              },
            });
          },
        });
      }
      return columns;
    },
    handlerRedundant(rawData = {}, fkColumn, rowKey, rowIndex) {
      // 处理冗余
      if (this.allFieldsMap[fkColumn]) {
        this.allFieldsMap[fkColumn].oldModel = cloneDeep(
          this.allFieldsMap[fkColumn].newModel
        );
        this.allFieldsMap[fkColumn].newModel = cloneDeep(rawData);
      } else {
        this.allFieldsMap[fkColumn] = {
          oldModel: null,
          newModel: cloneDeep(rawData),
        };
      }

      const row = this.tableData[rowIndex];
      let columns = this.setAllFields.filter((item) => {
        if (fkColumn) {
          let redundant =
            item?.redundant ||
            this.addColsMap[item.columns]?.redundant ||
            this.updateColsMap[item.columns]?.redundant ||
            {};
          if (redundant?.dependField === fkColumn && redundant.refedCol) {
            item.redundant = redundant;
            return true;
          }
        }
      });
      if (columns?.length) {
        columns.forEach((item) => {
          if (item?.redundant?.trigger === "isnull") {
            if (
              row[item.columns] ||
              row[item.columns] === 0 ||
              row[item.columns] === false
            ) {
              return;
            }
          } else if (item?.redundant?.trigger === "unchange") {
            // 未手动改变时才跟随fk字段变化
            const dependField = item?.redundant?.dependField;
            const fieldModelObj = cloneDeep(this.allFieldsMap[dependField]);
            const oldValByFk =
              fieldModelObj?.oldModel?.[item?.redundant?.refedCol];
            console.log(oldValByFk, "oldValByFk");
            if (
              oldValByFk &&
              row[item?.redundant?.refedCol] &&
              row[item?.redundant?.refedCol] !== oldValByFk
            ) {
              // 如果当前行的值跟fk字段的值不一致，则不处理
              console.log(
                "handlerRedundant::unchange",
                item.columns,
                row[item.columns]
              );
              return;
            }
          }
          if (!item?.redundant?.refedCol) return;
          if (
            row[item.columns] !== undefined &&
            row[item.columns] === rawData?.[item.redundant.refedCol]
          ) {
            // 值没变
            return;
          } else if (
            rawData?.[item.redundant.refedCol] === undefined &&
            row[item.columns] === null
          ) {
            // 值都为空
            return;
          }
          // if (
          //   rawData && rawData?.[item.redundant.refedCol] === undefined
          // ) {
          //   return;
          // }
          row[item.columns] = rawData?.[item.redundant.refedCol] || null;
          this.$set(this.tableData, rowIndex, row);
          console.log("handlerRedundant::", item.columns, row[item.columns]);

          // if (this.allFields.find((e) => e.columns === item.columns)) {
          //   this.$refs["tableRef"]?.startEditingCell?.({
          //     rowKey: rowKey,
          //     colKey: item.columns,
          //     defaultValue: rawData?.[item.redundant.refedCol] || null,
          //   });
          //   this.$refs["tableRef"]?.stopEditingCell?.();
          //   this.clearCellSelection();
          // }
        });
      }
    },
    // 提取重复的更新数据处理逻辑
    processUpdateData(item, oldItem, updateColsMap) {
      const updateObj = {};
      const nullVal = [null, undefined, ""];
      Object.keys(item).forEach((key) => {
        if (
          key.indexOf("_") !== 0 &&
          !ignoreKeys.includes(key) &&
          updateColsMap?.[key]?.in_update !== 0
        ) {
          if (oldItem[key] !== item[key]) {
            if (nullVal.includes(item[key]) && nullVal.includes(oldItem[key])) {
              return;
            }
            const colInfo = updateColsMap?.[key];
            if (["Date", "DateTime"].includes(colInfo?.col_type)) {
              if (dayjs(item[key]).isSame(dayjs(oldItem[key]))) {
                return;
              }
            }
            if (item[key] === "" || item[key] == undefined) {
              item[key] = null;
            }
            updateObj[key] = item[key];
          }
        }
      });
      return updateObj;
    },
    buildReqParams() {
      const tableData = this.tableData;
      // const tableData = JSON.parse(JSON.stringify(this.tableData));
      const reqData = [];
      const addDatas = [];

      this.tableData.forEach((item, index) => {
        const oldItem = this.oldTableData?.find(
          (d) => d.__id && d.__id === item.__id
        );
        if (!item.__flag && oldItem) {
          // const updateObj = {};
          // Object.keys(item).forEach((key) => {
          //   if (
          //     key.indexOf("_") !== 0 &&
          //     !ignoreKeys.includes(key) &&
          //     this.updateColsMap?.[key]?.in_update !== 0
          //   ) {
          //     if (oldItem[key] !== item[key]) {
          //       const nullVal = [null, undefined, ""];
          //       if (
          //         nullVal.includes(item[key]) &&
          //         nullVal.includes(oldItem[key])
          //       ) {
          //         return;
          //       }
          //       const colInfo = this.updateColsMap?.[key];
          //       if (["Date", "DateTime"].includes(colInfo?.col_type)) {
          //         if (dayjs(item[key]).isSame(dayjs(oldItem[key]))) {
          //           return;
          //         }
          //       }
          //       item.__flag = "update";
          //       this.$set(item, "__flag", "update");
          //       if (item[key] === "" || item[key] == undefined) {
          //         item[key] = null;
          //       }
          //       updateObj[key] = item[key];
          //     }
          //   }
          // });
          const updateObj = this.processUpdateData(
            item,
            oldItem,
            this.updateColsMap
          );
          if (Object.keys(updateObj)?.length) {
            reqData.push({
              serviceName: this.updateButton.service_name,
              condition: [{ colName: "id", ruleType: "eq", value: item.id }],
              data: [updateObj],
            });
          }
        } else if (
          item.__flag === "update" &&
          item.id &&
          this.updateButton?.service_name
        ) {
          const updateObj = this.processUpdateData(
            item,
            oldItem,
            this.updateColsMap
          );
          if (Object.keys(updateObj)?.length) {
            reqData.push({
              serviceName: this.updateButton.service_name,
              condition: [{ colName: "id", ruleType: "eq", value: item.id }],
              data: [updateObj],
            });
          }
          // const updateObj = {};
          // if (oldItem) {
          //   Object.keys(oldItem).forEach((key) => {
          //     if (
          //       key.indexOf("_") !== 0 &&
          //       !ignoreKeys.includes(key) &&
          //       this.updateColsMap?.[key]?.in_update !== 0
          //     ) {
          //       if (oldItem[key] !== item[key]) {
          //         if (item[key] === "" || item[key] == undefined) {
          //           item[key] = null;
          //         }
          //         updateObj[key] = item[key];
          //       }
          //     }
          //   });
          //   if (Object.keys(updateObj)?.length) {
          //     reqData.push({
          //       serviceName: this.updateButton.service_name,
          //       condition: [{ colName: "id", ruleType: "eq", value: item.id }],
          //       data: [updateObj],
          //     });
          //   }
          // }
        } else if (item.__flag === "add" && this.addButton?.service_name) {
          const addObj = {
            ...item,
          };
          if (item.__update_col && Object.keys(item.__update_col).length) {
            // 有更新字段 且所有更新字段都为空 不继续后面处理
            const keys = Object.keys(item.__update_col);
            if (
              keys.every((key) => [undefined, null, ""].includes(item[key]))
            ) {
              return;
            }
          } else {
            // 没有更新字段 不继续后面处理
            return;
          }
          // Object.keys(addObj).forEach((key) => {
          //   if (addObj[key] === null || this.addColsMap?.[key]?.in_add === 0) {
          //     delete addObj[key];
          //   }
          // });
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
            if (ignoreKeys.includes(key) || key.indexOf("_") === 0) {
              delete addObj[key];
            }
            if (
              addObj[key] === "" ||
              addObj[key] === undefined ||
              addObj[key] === null
            ) {
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
      if (this.onHandler) {
        Message.warning("正在进行其他操作，请稍候重试~");
        return;
      }
      this.sortState = [];
      const reqData = this.buildReqParams();

      if (reqData?.length === 0 || !reqData) {
        // this.page.pageNo = 1;
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
          this.isFetched = false;
          this.getList().then(() => {
            this.isFetched = true;
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
        const { _oldTableData, _tableData, _recordManager } =
          this.optimisticUpdate();
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
            // this.getList();
            // 不刷新列表，直接从本地数据中删掉需要删掉的数据
            this.tableData = this.tableData.filter(
              (item) => !deleIds.includes(item.id)
            );
          } else if (res?.resultMessage) {
            // 删除失败，恢复数据状态
            this.oldTableData = _oldTableData;
            this.tableData = _tableData;
            this.recordManager = _recordManager;
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
      this.startLoading();
      if (this.onHandler) return;
      this.onHandler = true;
      $http
        .post(url, req)
        .then((res) => {
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
        })
        .finally(() => {
          this.onHandler = false;
        });
    },
    // 更新表字段的最小宽度
    updateTableColumn() {
      // if(!this.columnWidthMap[key].fieldInfo.table_name){
      //   return
      // }
      const url = `/${this.srvApp}/operate/srvsys_table_columns_update`;
      const req = this.calcTableColumnWidthReq;
      let validReq = req.filter((item) => {
        if (
          item?.condition?.some(
            (cond) => cond?.ruleType === "eq" && (!cond.value || !cond.colName)
          )
        ) {
          return false;
        }
        return true;
      });
      if (!validReq?.length) {
        return;
      }
      this.startLoading();
      $http.post(url, validReq).then((res) => {
        this.loading = false;
        if (res?.data?.state === "SUCCESS") {
          // this.$message.success(res.data.resultMessage);
        } else {
          console.error(`更新表字段失败：${res.data.resultMessage}`);
          this.$message.error(`更新表字段失败：${res.data.resultMessage}`);
        }
      });
    },
    // 局部刷新
    // async miniUpdate({ updateList, addList }) {
    //   console.log("updateList:", updateList, "addList:", addList);
    //   if (Array.isArray(updateList) && updateList.length > 0) {
    //   }
    //   if (Array.isArray(addList) && addList.length > 0) {
    //     let tableData = cloneDeep(this.tableData);
    //     let oldAddData = tableData.filter((item) => !item.id);
    //     tableData = tableData.filter((item) => !!item.id);
    //     if (oldAddData.length === addList.length) {
    //       tableData.push(
    //         ...addList.map((item, index) => {
    //           item.__button_auth = this.setButtonAuth(
    //             this.v2data?.rowButton,
    //             item
    //           );
    //           item.rowKey = oldAddData[index].rowKey;
    //           item.__id = oldAddData[index].__id;
    //           if (oldAddData[index].__indent) {
    //             item.__indent = oldAddData[index].__indent;
    //           }
    //           if (oldAddData[index].__parent_row) {
    //             item.__parent_row = oldAddData[index].__parent_row;
    //           }
    //           return item;
    //         })
    //       );
    //     } else {
    //       tableData.push(
    //         ...addList.map((item, index) => {
    //           item.__button_auth = this.setButtonAuth(
    //             this.v2data?.rowButton,
    //             item
    //           );
    //           const __id = uniqueId("table_item_");

    //           item.rowKey = __id;
    //           item.__id = __id;
    //           return item;
    //         })
    //       );
    //     }
    //     this.tableData = tableData;
    //     this.oldTableData = cloneDeep(tableData);
    //     this.recordManager = new RecordManager();
    //   }
    // },
    // 乐观更新 保存更新前的状态
    optimisticUpdate() {
      let _oldTableData = cloneDeep(this.oldTableData);
      let _tableData = cloneDeep(this.tableData);
      let _recordManager = cloneDeep(this.recordManager);
      this.tableData = this.tableData.map((item) => {
        if (item.__flag !== "add") {
          delete item.__flag;
        }
        return item;
      });
      this.oldTableData = cloneDeep(this.tableData);
      this.recordManager = new RecordManager();
      this.recordManager?.push(cloneDeep(this.oldTableData));
      return {
        _oldTableData,
        _tableData,
        _recordManager,
      };
    },
    async refreshV2() {
      const v2Res = await getServiceV2(
        this.serviceName,
        this.listType,
        this.srvApp,
        true
      );
      if (v2Res?.state === "SUCCESS") {
        this.v2data = v2Res.data;
      } else {
        this.$message.error("登录信息更新，请重新加载页面");
      }
      return v2Res?.data;
    },
    async saveData(params = {}) {
      // const reqData = this.buildReqParams;
      if (
        sessionStorage.getItem("bx_auth_ticket") &&
        this.bx_auth_ticket !== sessionStorage.getItem("bx_auth_ticket")
      ) {
        // if (confirm('登录信息更新，即将刷新页面')) {
        //   await this.initPage(false);
        // }
        await this.refreshV2();
      }
      this.stopAutoSave();

      const reqData = this.buildReqParams();
      if (!reqData?.length) {
        this.$message.error("没有需要保存的操作！");
        return;
      }
      if (
        (!this.updateButton?.service_name && !this.addButton?.service_name) ||
        !Array.isArray(reqData) ||
        !reqData.length
      ) {
        return;
      }
      let onlyAdd = reqData.every(
        (item) => item.serviceName === this.addButton?.service_name
      );
      let service = "";
      if (onlyAdd) {
        service = this.addButton?.service_name;
      } else {
        service = this.updateButton?.service_name;
      }
      if (this.onHandler) {
        return;
      }
      this.onHandler = true;
      console.log(reqData, ":::onBatchOperate");
      //乐观更新
      const { _oldTableData, _tableData, _recordManager } =
        this.optimisticUpdate();
      onBatchOperate(reqData, service, this.srvApp)
        .then((res) => {
          this.onHandler = false;
          if (res?.state === "SUCCESS") {
            let msg = res.resultMessage || "操作成功";
            if (params?.isAutoSave) {
              msg = "自动保存成功!";
            } else {
              msg = "保存成功!";
            }
            Message({
              showClose: true,
              message: msg,
              type: "success",
              duration: 800,
            });
            console.log(res);
            // 局部更新
            if (res.response?.length) {
              const updateList = [];
              const addList = [];
              res.response.forEach((item) => {
                if (
                  item.serviceName?.lastIndexOf("_update") ===
                  item.serviceName.length - 7
                ) {
                  if (item.response.effect_data?.length) {
                    updateList.push(...item.response.effect_data);
                  }
                } else if (
                  item.serviceName?.lastIndexOf("_add") ===
                  item.serviceName.length - 4
                ) {
                  if (item.response.effect_data?.length) {
                    addList.push(...item.response.effect_data);
                  }
                }
              });
              console.log("updateList:", updateList, "addList:", addList);
              if (addList.length) {
                let currentAddList = this.tableData.filter(
                  (item) => item.__flag === "add"
                );
                if (currentAddList.length === addList.length) {
                  let index = 0;
                  const localKeys = [
                    "__id",
                    // "__flag",
                    "__parent_row",
                    "rowKey",
                    "_buttons",
                    "__unfold",
                    "__indent",
                    "__update_col",
                  ];
                  this.tableData = this.tableData.map((item) => {
                    if (item.__flag === "add") {
                      localKeys.forEach((key) => {
                        addList[index][key] = item[key];
                      });
                      item = addList[index];
                      index++;
                    }
                    item.__button_auth = this.setButtonAuth(
                      this.v2data?.rowButton,
                      item
                    );
                    return item;
                  });
                }
                // // 有新增的数据 直接全局刷新
                // if (this.listType === "treelist" && this.treeInfo.idCol) {
                //   let unfoldIds = this.tableData
                //     .filter((item) => !!item?.__unfold)
                //     .map((item) => item[this.treeInfo.idCol]);
                //   if (unfoldIds?.length) {
                //     this.getList(true, unfoldIds);
                //     return;
                //   }
                // }
                // this.getList();
              }
              // this.miniUpdate({ updateList, addList });
            }
            // if (res.response?.length) {
            //   let updateIds = res.response.reduce((pre, cur) => {
            //     if (cur?.response?.effect_data?.length) {
            //       const effect_data = cur?.response?.effect_data?.[0]
            //       if (effect_data?.id) {
            //         pre.push(effect_data?.id)
            //       }
            //     }
            //     return pre
            //   }, [])
            //   console.log('updateIds:', updateIds);
            //   return this.miniUpdate(updateIds)
            // }
            this.optimisticUpdate();
            if (this.fieldEditorParams?.row && this.fieldEditorParams?.column) {
              this.buildFieldEditorParams(
                this.fieldEditorParams?.row,
                this.fieldEditorParams?.column
              );
            }
            return;
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
          } else {
            this.oldTableData = _oldTableData;
            this.tableData = _tableData;
            this.recordManager = _recordManager;
            Message({
              showClose: true,
              message: res.resultMessage || "保存失败!",
              type: "error",
            });
            if (res.resultCode === "0011") {
              this.bx_auth_ticket = "";
              this.$refs?.loginRef?.open(() => {
                this.initPage(false).then(() => {
                  if (!this.tableData.length) {
                    this.getList();
                  }
                });
              });
            }
          }
        })
        .catch((err) => {
          console.log("err:", err);
          this.oldTableData = _oldTableData;
          this.tableData = _tableData;
          this.recordManager = _recordManager;
          this.onHandler = false;
        })
        .finally(() => {
          setTimeout(() => {
            this.onHandler = false;
          }, 200);
        });
    },
    /**
     *
     * @param {*} index 插入到第几条数据
     * @param {*} parentRow 父节点数据
     * @param {*} itemData 新增数据
     */
    insert2Rows(index = 0, parentRow, itemData) {
      // 插入到第几行
      if (this.childListType && !parentRow) {
        // 作为子表 只插到最后一行
        index = this.tableData.length;
      }
      if (index >= 0) {
        const __id = uniqueId("table_item_");
        let dataItem = {
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
              init_expr:
                cur.init_expr || this.addColsMap?.[cur.columns]?.init_expr,
            };
          }
          return res;
        }, {});

        this.allFields.forEach((field) => {
          if (field.editable || field.canAdd) {
            dataItem[field.columns] = null;
            if (itemData && itemData[field.columns]) {
              dataItem[field.columns] = itemData[field.columns];
            }
            let init_expr = null;
            let fk_init_expr = null;
            let fk_column = null;
            if (field.subtype === "autocomplete") {
            }
            if (this.addColsMap[field.columns]?.init_expr) {
              init_expr = this.addColsMap[field.columns]?.init_expr;
            } else if (
              field.subtype === "autocomplete" &&
              field.redundant?.dependField &&
              fkCols[field.redundant?.dependField]?.init_expr
            ) {
              fk_init_expr = fkCols[field.redundant?.dependField]?.init_expr;
              init_expr = fk_init_expr;
              fk_column = fkCols[field.redundant?.dependField]?._target_column;
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
                  if (colType === "Date") {
                    val = dayjs(val).format("YYYY-MM-DD");
                  }
                }
                if (
                  ["Integer", "Float", "Money", "int", "Int"].includes(
                    colType
                  ) ||
                  colType?.includes("decimal")
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
                field[`_${fk_column}_init_val`] = val;
              } else {
                dataItem[field.columns] = val;
              }
            }
          }
          if (
            this.defaultConditionsMap &&
            this.defaultConditionsMap[field.columns]
          ) {
            if (!["Date", "DateTime"].includes(field.col_type)) {
              dataItem[field.columns] =
                this.defaultConditionsMap[field.columns];
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
        // let autocompleteKeys = Object.keys(dataItem).filter(key => key && key.includes('_init_val'))
        // if (Array.isArray(autocompleteKeys) && autocompleteKeys.length) {
        //   // 给autocomplete字段设置初始值

        // }
      }
    },
    initFkOption() {},
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
      // tableData = cloneDeep(tableData);
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
            this.isTree && this.listType === "treelist"
              ? "treelist"
              : this.listType
              ? this.listType
              : "list",
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
            // this.oldTableData.splice(index + 1, 0, ...cloneDeep(children));
          }
        }
      }
      return tableData;
    },
    async loadTree(load, row, rowIndex, callback) {
      // 将展开状态存储到行数据
      this.$set(this.tableData[rowIndex], "__unfold", load);
      if (load) {
        // 加载当前数据的子数据
        let loadingInstance = Loading.service({ fullscreen: true });
        console.time("渲染时长：");
        console.time("请求时长：");
        const res = await onSelect(
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
            rownumber: 500,
            pageNo: this.page.pageNo,
            vpage_no: this.v2data?.vpage_no,
            order: this.sortState,
            use_type:
              this.isTree && this.listType === "treelist"
                ? "treelist"
                : this.listType || "list",
          }
        );
        console.timeEnd("请求时长：");
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
          tableData[rowIndex].__children = cloneDeep(resData);
          // this.$set(row, "__children", cloneDeep(resData));
          tableData.splice(rowIndex + 1, 0, ...cloneDeep(resData));
          this.tableData = cloneDeep(tableData);
          let oldTableData = this.oldTableData;

          const oldRowDataIndex = oldTableData.findIndex(
            (item) => item.__id && item.__id === row.__id
          );
          oldTableData.splice(oldRowDataIndex + 1, 0, ...cloneDeep(resData));
          this.oldTableData = cloneDeep(oldTableData);

          this.$set(this.tableData[rowIndex], "__unfold", load);
          loadingInstance.close();
          this.$nextTick(() => {
            console.timeEnd("渲染时长：");
            callback?.(true);
          });
          return resData;
        } else {
          // this.$set(this.tableData[rowIndex], "__unfold", load);
          loadingInstance.close();
          callback?.(false);
        }
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
      if (
        sessionStorage.getItem("bx_auth_ticket") &&
        this.bx_auth_ticket !== sessionStorage.getItem("bx_auth_ticket")
      ) {
        await this.refreshV2();
      }
      if (!unfoldIds && this.listType === "treelist" && this.treeInfo.idCol) {
        unfoldIds = this.tableData
          .filter((item) => !!item?.__unfold)
          .map((item) => item[this.treeInfo.idCol]);
      }
      if (this.serviceName) {
        this.startLoading(30 * 1000);
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
          if (res.page) {
            this.page = res.page;
          }
          res.data = res.data.map((item) => {
            item.__button_auth = this.setButtonAuth(
              this.v2data?.rowButton,
              item
            );
            return item;
          });
        } else if (res?.resultCode === "0011") {
          // this.$message.error('登录超时请重新登录')
          this.$refs?.loginRef?.open(() => {
            this.initPage(false);
          });
          return;
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
        // this.recordManager?.push(cloneDeep(this.oldTableData));

        if (this.tableData?.length === 0 && insertNewRows) {
          this.insert2Rows(0);
        }
      }
    },
    async getColsV2() {
      if (this.colSrv) {
        const use_type = this.colSrv?.includes("_add")
          ? "add"
          : this.colSrv?.includes("_update")
          ? "update"
          : "list";
        const res = await getServiceV2(
          this.colSrv,
          use_type,
          this.srvApp,
          true
        );
        if (res?.state === "SUCCESS") {
          return res?.data?.srv_cols?.map((item) => {
            // 列表字段显示隐藏默认用的in_list控制 在使用自定义的服务来显示列时使用对应的use_type控制
            item.in_list =
              item[`in_${use_type}`] === 1 ? 1 : item[`in_${use_type}`];
            return item;
          });
        }
      }
    },
    async getV2Data(force = false) {
      let useType = this.listType;
      if (useType !== "treelist" && this.childListType?.includes("list")) {
        useType = this.childListType;
      }
      const res = await getServiceV2(
        this.serviceName,
        useType,
        this.srvApp,
        force
      );
      if (res?.state === "SUCCESS") {
        const listColsMap = res?.data?.srv_cols?.reduce((pre, cur) => {
          pre[cur.columns] = cur;
          return pre;
        }, {});
        this.v2data = res.data;
        this.initExprCols = res.data.srv_cols.reduce((pre, cur) => {
          if (cur.init_expr) {
            pre.push(cur);
          }
          return pre;
        }, []);

        const editBtn = res.data?.rowButton?.find(
          (item) => item.button_type === "edit"
        );
        if (editBtn?.service_name) {
          const ress = await getServiceV2(
            editBtn.service_name,
            "update",
            this.srvApp,
            false,
            this.childListCfg?.foreign_key?.adapt_main_srv || this.mainService
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
            false,
            this.childListCfg?.foreign_key?.adapt_main_srv || this.mainService
          );
          this.addColsMap = ress?.data?.srv_cols?.reduce((pre, cur) => {
            pre[cur.columns] = cur;
            return pre;
          }, {});
        }
        if (this.colSrv) {
          const srv_cols = await this.getColsV2();
          if (srv_cols?.length) {
            this.v2data.srv_cols = srv_cols;
          }
        }
        if (Array.isArray(this.v2data.srv_cols)) {
          this.v2data.srv_cols = this.v2data.srv_cols.map((item) => {
            if (item.more_config) {
              try {
                const moreConfig = JSON.parse(item.more_config);
                if (moreConfig?.query_init_value) {
                  item.query_init_value = moreConfig.query_init_value;
                  if (item.col_type === "fk") {
                    item.option_list_v2.query_init_value =
                      moreConfig.query_init_value;
                  }
                }
              } catch (error) {}
            }
            return item;
          });
        }

        const allColsMap = {
          updateColsMap: this.updateColsMap,
          listColsMap: listColsMap,
          addColsMap: this.addColsMap,
          childListType: this.childListType,
        };
        this.v2data.allFields = buildSrvCols(
          this.v2data.srv_cols,
          allColsMap,
          this.childListType,
          this.colSrv
        );
        this.allFields = this.v2data.allFields;
        this.listColsMap = this.allFields?.reduce((pre, cur) => {
          pre[cur.columns] = cur;
          return pre;
        }, {});
        document.title = res.data.service_view_name;
        this.columns = this.buildColumns();
        return res.data;
      }
    },
    scrolling({ startRowIndex }) {
      this.startRowIndex = startRowIndex;
    },
  },
};
</script>
<style lang="scss">
.el-button {
  & + & {
    margin-left: 5px;
  }

  &.icon-button {
    padding: 4px;

    .icon {
      transform: rotate(180deg);
      transition: all 0.3s ease-in-out;

      &.show {
        transform: rotate(0);
      }
    }
  }

  [class*="i-ic-"] {
    font-size: 16px;
  }
}

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

.list-container {
  overflow: hidden;
  transition: max-height 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.custom-style {
  .ve-table-container {
    min-height: 80px;
    height: calc(100vh - 80px) !important;
    overflow: auto;
  }

  .table-body-cell__add {
    background-color: #2ea269 !important;
    color: #fff !important;

    // border-top: 1px solid #a4da89;
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

  .table-body-cell__update-index {
    background-color: rgba($color: #e83d4b, $alpha: 0.9) !important;
    color: #fff !important;
  }

  .table-body-cell__update {
    // color: #2087cc !important;
    color: #e83d4b !important;

    .el-input {
      .el-input__inner {
        // color: #2087cc !important;
        color: #e83d4b !important;
      }
    }

    .el-tag {
      color: #e83d4b !important;
    }

    // background-color: #2087CC !important;
  }

  // .table-body-cell__update_border {
  //   border: 1px solid #2087cc !important;
  // }
  .ve-table-body-td {
    padding: 2px 8px !important;
  }

  .ve-table-body-tr {
    height: unset !important;
  }

  .ve-table-header-th {
    padding: 4px 0 !important;
    background-color: #f0f3f9 !important;
  }
}

.spreadsheet {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  &.child-list {
    height: unset;

    .ve-table-container {
      height: auto !important;
    }
  }

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

.grid-button-box {
  overflow: hidden;
  transition: all 0.3s ease;
  position: absolute;
  right: 40px;
  transform: translateX(100%);
  background-color: #fff;
  opacity: 0;
  width: 0;
  padding: 0 5px;

  &.show {
    display: flex;
    transform: translateX(0);
    opacity: 1;
    width: unset;
    z-index: 9;
  }

  // display: grid;
  // grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  // gap: 10px;

  // .el-button+.el-button {
  //   margin-left: unset;
  // }

  .button {
  }
}
</style>
