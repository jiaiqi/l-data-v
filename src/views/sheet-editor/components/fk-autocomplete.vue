<template>
  <div class="flex items-center autocomplete-box">
    <fk-detail-link
      v-if="showDetailLink"
      :app="app"
      :srv-info="srvInfo"
      :row="row"
      :detail-button="detailButton"
      :value="modelValue"
    ></fk-detail-link>
    <fk-only-edit
      v-else-if="isOnlyEdit && !setDisabled"
      :app="app"
      :field-info="column"
      :value="value"
      :column="column"
      :row="row"
      :default-options="defaultOptions"
      :disabled="disabled"
      @input="onInput"
      @select="onSelect"
      @focus="onFocus"
    ></fk-only-edit>
<!-- 
    <fk-edit-select
      v-else-if="isEditSelect && !setDisabled"
      :app="app"
      :field-info="column"
      :value="value"
      :column="column"
      :row="row"
      :default-options="defaultOptions"
      :disabled="disabled"
      @input="onInput"
      @select="onSelect"
      @focus="onFocus"
      @open-add-dialog="onOpenAddDialog"
      @open-edit-dialog="onOpenEditDialog"
      @add-success="onAddSuccess"
      @edit-success="onEditSuccess"
    ></fk-edit-select> -->

    <fk-select
      v-else-if="srvInfo && srvInfo.refed_col && isFk && !setDisabled"
      :app="app"
      :field-info="column"
      :value="value"
      :column="column"
      :row="row"
      :default-options="defaultOptions"
      :disabled="disabled"
      @input="onInput"
      @select="onSelect"
      @focus="onFocus"
    ></fk-select>

    <fk-tree-picker
      v-else-if="isTree && !setDisabled"
      :app="app"
      :column="column"
      :row="row"
      :srv-info="srvInfo"
      :value="modelValue"
      :disabled="setDisabled"
      @focus="onFocus"
      @input="onTreeInput"
      @select="onTreeSelect"
    ></fk-tree-picker>
    <div
      v-else-if="hasActionSrvCfg && !setDisabled"
      class="flex items-center w-full h-full autocomplete-with-action"
    >
      <fk-option-picker
        class="flex-1"
        :app="app"
        :column="column"
        :row="row"
        :srv-info="srvInfo"
        :input-value="modelValue"
        :disabled="setDisabled"
        :ui-mode="pickerUiMode"
        :allow-free-input="true"
        :placeholder="pickerPlaceholder"
        @focus="onFocus"
        @input-change="onPickerInputChange"
        @select="onPickerSelect"
        @clear="onPickerClear"
        @dropdown-visible-change="onPickerDropdownVisibleChange"
      />
      <action-button-group
        v-if="actionButtons.length > 0"
        :visible="showActionButtonGroup"
        :buttons="actionButtons"
      />
    </div>
    <div
      v-else-if="!setDisabled"
      class="flex items-center justify-between w-full"
    >
      <fk-option-picker
        class="flex-1"
        :app="app"
        :column="column"
        :row="row"
        :srv-info="srvInfo"
        :input-value="modelValue"
        :disabled="setDisabled"
        :ui-mode="pickerUiMode"
        :allow-free-input="true"
        :placeholder="pickerPlaceholder"
        @focus="onFocus"
        @input-change="onPickerInputChange"
        @select="onPickerSelect"
        @clear="onPickerClear"
        @dropdown-visible-change="onPickerDropdownVisibleChange"
      />
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
            :fixed="column.columns === srvInfo.key_disp_col ? 'left' : false"
            width="180"
            show-overflow-tooltip
            border
            v-for="column in tableDisplayColumns"
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

    <fk-action-dialog
      :title="addDialogTitle"
      :visible.sync="addDialogVisible"
      custom-class="fk-action-dialog"
      :url="addIframeUrl"
      :iframe-key="addIframeKey"
      @add-success="handleActionAddSuccess"
      @update-success="handleActionUpdateSuccess"
      @close-dialog="handleActionCloseDialog"
    />

    <fk-action-dialog
      :title="editDialogTitle"
      :visible.sync="editDialogVisible"
      custom-class="fk-action-dialog"
      :url="editIframeUrl"
      :iframe-key="editIframeKey"
      @add-success="handleActionAddSuccess"
      @update-success="handleActionUpdateSuccess"
      @close-dialog="handleActionCloseDialog"
    />
  </div>
</template>

<script>
import { $http } from "../../../common/http.js";
import { cloneDeep } from "lodash-es";
import { renderStr } from "../../../common/common";
import fkSelect from "./fk-select/fk-select.vue";
import fkOnlyEdit from "./fk-select/fk-only-edit.vue";
import fkEditSelect from "./fk-select/fk-edit-select.vue";
import FkOptionPicker from "./fk-select/fk-option-picker.vue";
import FkActionDialog from "./fk-select/fk-action-dialog.vue";
import FkTreePicker from "./fk-select/fk-tree-picker.vue";
import FkDetailLink from "./fk-select/fk-detail-link.vue";
import { isFk } from "@/utils/sheetUtils";
import addIcon from "@/assets/img/add.png";
import editIcon from "@/assets/img/edit.png";
import { ActionButtonGroup } from "./action-button";
import {
  buildFkOptionConfig,
  loadFkOptions,
  loadServiceColumns,
  normalizeFkOption,
} from "../utils/fkOption";

export default {
  components: {
    fkSelect,
    fkOnlyEdit,
    fkEditSelect,
    FkOptionPicker,
    FkActionDialog,
    FkTreePicker,
    FkDetailLink,
    ActionButtonGroup,
  },
  data() {
    return {
      options: [],
      dialogVisible: false,
      tableDropdownVisible: false,
      tableColumns: [],
      tableData: [],
      pageNo: 1,
      rownumber: 10,
      total: 0,
      tableloading: false,
      filterText: "",
      tableSearchTimer: null,
      modelValue: "",
      addDialogVisible: false,
      editDialogVisible: false,
      addIframeKey: 0,
      editIframeKey: 0,
      editRecordId: null,
    };
  },
  props: {
    value: {
      type: [Number, String, Array, Object],
      default: null,
    },
    column: Object,
    row: {
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
    defaultOptions: Array,
    uiMode: {
      type: String,
      default: "table",
    },
  },
  computed: {
    isFk() {
      return isFk(this.column);
    },
    linkToDetail() {
      return (
        this?.column?.linkToDetail === true && this.detailButton?.permission
      );
    },
    showDetailLink() {
      return (
        this.column &&
        this.linkToDetail &&
        this.column.redundant_options &&
        (this.column.redundant_options.autocompleteInput === true ||
          this.column.subtype === "autocomplete")
      );
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
    addSrvCfg() {
      return this.srvInfo?.add_srv_cfg;
    },
    updateSrvCfg() {
      return this.srvInfo?.update_srv_cfg;
    },
    showActionAddBtn() {
      return !this.modelValue && this.addSrvCfg?.srv && this.addSrvCfg?.permission !== false;
    },
    showActionEditBtn() {
      return !!this.modelValue && this.updateSrvCfg?.srv && this.updateSrvCfg?.permission !== false;
    },
    hasActionSrvCfg() {
      return this.showActionAddBtn || this.showActionEditBtn;
    },
    pickerUiMode() {
      return this.uiMode || this.srvInfo?.ui_mode || this.srvInfo?.picker_ui_mode || "table";
    },
    pickerPlaceholder() {
      if (this.column?.placeholder) {
        return this.column.placeholder;
      }
      // return this.pickerUiMode === "table"
      //   ? "可直接输入，或搜索后双击选择"
      //   : "可直接输入，或搜索后选择";
    },
    showActionButtonGroup() {
      return this.actionButtons.length > 0 && !this.tableDropdownVisible;
    },
    tableDisplayColumns() {
      const columns = Array.isArray(this.tableColumns) ? [...this.tableColumns] : [];
      const keyDispCol = this.srvInfo?.key_disp_col;
      if (!keyDispCol) {
        return columns;
      }
      const index = columns.findIndex((item) => item.columns === keyDispCol);
      if (index <= 0) {
        return columns;
      }
      const [keyColumn] = columns.splice(index, 1);
      return [keyColumn, ...columns];
    },
    addDialogTitle() {
      return this.addSrvCfg?.title || "新增";
    },
    editDialogTitle() {
      return this.updateSrvCfg?.title || "编辑";
    },
    actionButtons() {
      const buttons = [];
      if (this.showActionAddBtn) {
        buttons.push({
          key: 'add',
          icon: addIcon,
          text: '新增',
          title: '新增',
          className: 'btn-add',
          handler: this.handleAddDialog
        });
      }
      if (this.showActionEditBtn) {
        buttons.push({
          key: 'edit',
          icon: editIcon,
          text: '编辑',
          title: '编辑',
          className: 'btn-edit',
          handler: this.handleEditDialog
        });
      }
      return buttons;
    },
    addIframeUrl() {
      if (!this.addSrvCfg?.srv) {
        return "";
      }
      const serviceName = this.addSrvCfg.srv;
      let url = `/vpages/#/add/${serviceName}`;
      const params = [];
      if (this.srvInfo?.refed_col && this.row && this.row[this.srvInfo.refed_col]) {
        const operate_params = {
          data: [
            {
              [this.srvInfo.refed_col]: this.row[this.srvInfo.refed_col],
            },
          ],
        };
        params.push(`operate_params=${JSON.stringify(operate_params)}`);
      }
      if (this.addSrvCfg?.app || this.app) {
        params.push(`srvApp=${encodeURIComponent(this.addSrvCfg?.app || this.app)}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      return url;
    },
    editIframeUrl() {
      if (!this.updateSrvCfg?.srv || !this.modelValue) {
        return "";
      }
      let url = `/vpages/#/update/${this.updateSrvCfg.srv}/${this.editRecordId}`;
      const params = [];
      if (this.updateSrvCfg?.app || this.app) {
        params.push(`srvApp=${encodeURIComponent(this.updateSrvCfg?.app || this.app)}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      return url;
    },
    isEditSelect() {
      if (this.row?.__inFilterForm === true) {
        return false;
      }
      const addSrvCfg = this.addSrvCfg;
      return (
        addSrvCfg?.permission &&
        addSrvCfg.srv &&
        this.srvInfo?.allow_input === "编辑选择"
      );
    },
    isOnlyEdit() {
      const addSrvCfg = this.addSrvCfg;
      return (
        addSrvCfg?.permission &&
        addSrvCfg.srv &&
        this.srvInfo?.allow_input === "自行输入"
      );
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== this.modelValue) {
          this.modelValue = newValue;
          this.editRecordId = null;
          if (
            (this.row?.__flag === "add" || this.row?.__flag === "update") &&
            newValue &&
            !this.isOnlyEdit &&
            !this.isEditSelect
          ) {
            this.$nextTick(() => {
              this.loadOptions(newValue).then((res) => {
                if (res?.length > 1) {
                  let matchedVal = res.find(
                    (item) => item.value === this.value
                  );
                  if (matchedVal) {
                    this.$emit("select", cloneDeep(matchedVal));
                  }
                  this.$refs?.inputRef?.focus();
                } else if (res?.length) {
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
  beforeDestroy() {
    if (this.tableSearchTimer) {
      clearTimeout(this.tableSearchTimer);
    }
  },
  methods: {
    onInput(val) {
      this.$emit("input", val, this.row, this.column);
    },
    onSelect(data) {
      this.$emit("select", data, this.row, this.column);
    },
    onFocus() {
      this.$emit("onfocus");
    },
    onOpenAddDialog(data) {
      this.$emit("open-add-dialog", data);
    },
    onOpenEditDialog(data) {
      this.$emit("open-edit-dialog", data);
    },
    onAddSuccess(data) {
      console.log("fk-autocomplete 收到 add-success:", data);
      this.$emit("add-success", data);
    },
    onEditSuccess(data) {
      console.log("fk-autocomplete 收到 edit-success:", data);
      this.$emit("edit-success", data);
    },
    handleAddDialog() {
      if (this.setDisabled) {
        return;
      }
      if (this.addSrvCfg?.srv) {
        this.addIframeKey += 1;
        this.addDialogVisible = true;
      }
    },
    handleEditDialog() {
      if (this.setDisabled) {
        return;
      }
      if (this.updateSrvCfg?.srv && this.modelValue) {
        if (!this.editRecordId) {
          this.fetchEditRecordId().then(() => {
            if (this.editRecordId) {
              this.editIframeKey += 1;
              this.editDialogVisible = true;
            }
          });
        } else {
          this.editIframeKey += 1;
          this.editDialogVisible = true;
        }
      }
    },
    async fetchEditRecordId() {
      const fkValue = this.row?.[this.column?.redundant?.dependField];
      if (!fkValue || !this.srvInfo?.refed_col) {
        return;
      }
      const req = {
        serviceName: this.srvInfo.serviceName,
        colNames: ["*"],
        condition: [
          {
            colName: this.srvInfo.refed_col,
            ruleType: "eq",
            value: fkValue,
          },
        ],
        page: {
          pageNo: 1,
          rownumber: 1,
        },
      };
      let appName =
        this.srvInfo?.srv_app || this.app || sessionStorage.getItem("current_app");
      if (!req.serviceName || !appName) {
        return;
      }
      const url = `/${appName}/select/${this.srvInfo.serviceName}`;
      const res = await $http.post(url, req);
      if (res.data.state === "SUCCESS" && res.data.data?.length) {
        this.editRecordId = res.data.data[0].id;
      }
    },
    handleActionAddSuccess(data) {
      this.$message.success("添加成功");
      this.addDialogVisible = false;
      if (data) {
        const addedId = data.id || data.effectData?.id;
        const addedData = data.effectData || data;
        if (addedId) {
          this.handleAddResult(addedData, addedId);
        } else {
          this.$emit("add-success", data);
        }
      }
    },
    handleActionUpdateSuccess(data) {
      this.$message.success("更新成功");
      this.editDialogVisible = false;
      if (data) {
        const updatedData = data.effectData || data;
        const updatedId = updatedData.id || data.id || this.editRecordId;
        if (updatedId) {
          this.handleEditResult(updatedData, updatedId);
        } else {
          this.$emit("edit-success", data);
        }
      }
    },
    handleActionCloseDialog() {
      this.addDialogVisible = false;
      this.editDialogVisible = false;
    },
    handleAddResult(addedData, addedId) {
      const dependField = this.column?.redundant?.dependField;
      const refedCol = this.srvInfo?.refed_col;
      const keyDispCol = this.srvInfo?.key_disp_col;
      if (!dependField || !refedCol) {
        this.$emit("add-success", { ...addedData, addedId });
        return;
      }
      const fkValue = addedData[refedCol] || addedData.id;
      const resultItem = {
        label: addedData[keyDispCol] || addedData[refedCol] || addedId,
        value: fkValue,
        option: addedData,
        rawData: addedData,
        ...addedData,
      };
      this.modelValue = resultItem.label;
      this.$emit("input", resultItem.label, this.row, this.column);
      this.$emit("select", cloneDeep(resultItem));
      this.$emit("add-success", { ...addedData, addedId });
    },
    handleEditResult(updatedData, updatedId) {
      const dependField = this.column?.redundant?.dependField;
      const refedCol = this.srvInfo?.refed_col;
      const keyDispCol = this.srvInfo?.key_disp_col;
      if (!dependField || !refedCol) {
        this.$emit("edit-success", { ...updatedData, updatedId });
        return;
      }
      if (this.row) {
        const oldFkData = this.row[`_${dependField}_data`] || {};
        const fkFieldValue = oldFkData[refedCol] || this.row[dependField];
        if (updatedData[refedCol] === fkFieldValue || String(updatedData[refedCol]) === String(fkFieldValue)) {
          this.$set(this.row, `_${dependField}_data`, cloneDeep(updatedData));
          const displayValue = updatedData[keyDispCol] || updatedData[refedCol] || this.modelValue;
          this.modelValue = displayValue;
          this.$emit("input", displayValue, this.row, this.column);
          const resultItem = {
            label: displayValue,
            value: fkFieldValue,
            option: updatedData,
            rawData: updatedData,
            ...updatedData,
          };
          this.$emit("select", cloneDeep(resultItem));
        }
      }
      this.editRecordId = null;
      this.$emit("edit-success", { ...updatedData, updatedId });
    },
    showFinder() {
      this.$refs.inputRef?.focus();
    },
    onTreeInput(value) {
      this.modelValue = value || "";
      this.$emit("input", this.modelValue);
    },
    onTreeSelect(item) {
      if (!item) {
        this.modelValue = "";
        this.$emit("select", null);
        return;
      }
      this.modelValue = item.label || item.value || "";
      this.$emit("select", item);
    },
    onPickerInputChange(value, meta = {}) {
      this.modelValue = value || "";
      if (meta.source === "input") {
        this.$emit("input", this.modelValue);
      }
    },
    onPickerSelect(item) {
      if (!item) {
        this.onPickerClear();
        return;
      }
      const selected = cloneDeep(item);
      this.modelValue = selected?.label || selected?.value || "";
      this.$emit("input", this.modelValue);
      this.$emit("select", selected);
    },
    onPickerClear() {
      this.modelValue = "";
      this.$emit("input", "");
      this.$emit("select", null);
    },
    onPickerDropdownVisibleChange(value) {
      this.tableDropdownVisible = value;
    },
    openTableDropdown() {
      if (this.setDisabled) {
        return;
      }
      this.onFocus();
      this.tableDropdownVisible = true;
      this.pageNo = 1;
      this.rownumber = this.rownumber || 5;
      this.filterText = this.modelValue || "";
      if (!this.tableColumns?.length) {
        this.getFkColumns();
      }
      this.getTableData();
      this.syncDropdownTableLayout();
    },
    onDropdownInput(value) {
      this.filterText = value || "";
      this.tableDropdownVisible = true;
      this.pageNo = 1;
      if (this.tableSearchTimer) {
        clearTimeout(this.tableSearchTimer);
      }
      this.tableSearchTimer = setTimeout(() => {
        this.getTableData();
      }, 250);
    },
    onDropdownClear() {
      this.modelValue = "";
      this.filterText = "";
      this.pageNo = 1;
      this.tableDropdownVisible = true;
      this.$emit("input", "");
      this.$emit("select", null);
      this.getTableData();
    },
    syncDropdownTableLayout() {
      this.$nextTick(() => {
        this.$refs.dropdownTable?.doLayout?.();
        setTimeout(() => {
          this.$refs.dropdownTable?.doLayout?.();
        }, 80);
      });
    },
    formatFkOption(item) {
      return normalizeFkOption(item, this.srvInfo || {});
    },
    buildTableOption(queryString = "") {
      return buildFkOptionConfig(this.srvInfo || {}, queryString);
    },
    toFilter(query) {
      this.pageNo = 1;
      this.total = 0;
      this.filterText = typeof query === "string" ? query : "";
      this.getTableData();
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
      const selected = this.formatFkOption(cloneDeep(row));
      this.modelValue = selected?.label || selected?.value || "";
      this.$emit("input", this.modelValue);
      this.$emit("select", selected);
      this.options = JSON.parse(JSON.stringify(this.tableData));
      this.dialogVisible = false;
      this.tableDropdownVisible = false;
      this.filterText = "";
      if (this.$refs?.inputRef?.activated) {
        this.$nextTick(() => {
          this.$refs.inputRef.activated = false;
        });
      }
    },
    async getFkColumns(useType = "selectlist") {
      const app =
        this.srvInfo.srv_app ||
        this.app ||
        sessionStorage.getItem("current_app");
      if (app) {
        this.tableColumns = await loadServiceColumns({
          app,
          serviceName: this.srvInfo.serviceName,
          useType,
        });
        this.syncDropdownTableLayout();
        if (!this.tableColumns.length && useType === "selectlist") {
          await this.getFkColumns("list");
        }
      }
    },
    getTableData() {
      this.tableloading = true;
      setTimeout(() => {
        this.tableloading = false;
      }, 5000);
      loadFkOptions({
        column: this.column,
        row: this.row,
        app: this.app,
        srvInfo: this.srvInfo,
        keyword: this.filterText,
        pageNo: this.pageNo,
        rownumber: this.rownumber,
      }).then((res) => {
        if (res?.data?.length) {
          this.tableData = res.data;
          this.total = res?.page?.total;
        } else {
          this.tableData = [];
        }
        this.tableloading = false;
        this.syncDropdownTableLayout();
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
      this.loadOptions(queryString).then((res) => {
        callback(res);
      });
    },
    async loadOptions(queryString, initValue) {
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
            obj.value = obj.value.replace(/\'/gi, "");
          }
          req.condition.push(obj);
        }
      }
      if (queryString) {
        req.condition = [...req.condition];
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
.fk-action-dialog {
  .el-dialog__body {
    padding: 0 20px 20px;
    iframe {
      width: 100%;
      height: 100%;
    }
  }
}

.cursor-pointer {
  font-size: 14px;
}

.el-popover {
}

.el-autocomplete-suggestion.el-popper {
  min-width: 200px !important;
}

.fk-table-dropdown-popper {
  padding: 8px;
}

.fk-table-dropdown {
  width: 100%;

  .el-table {
    font-size: 12px;
  }

  .el-table__row {
    cursor: pointer;
  }
}

.fk-table-dropdown__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.fk-table-dropdown__tip {
  flex-shrink: 0;
  color: #909399;
  font-size: 12px;
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
  height: 100%;
 .autocomplete-with-action{
    &> span{
      height: 100%;
      .el-input__inner{
        border: none;
        padding-left: 5px;
      }
    }
 }
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
