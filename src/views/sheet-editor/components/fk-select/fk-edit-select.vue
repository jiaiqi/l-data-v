<template>
  <div class="fk-edit-select-wrapper">
    <fk-option-picker
      :app="app"
      :column="column"
      :row="row"
      :srv-info="srvInfo"
      :input-value="inputValue"
      :placeholder="placeholder"
      :disabled="setDisabled"
      :ui-mode="pickerUiMode"
      :allow-free-input="false"
      class="fk-edit-select-picker"
      @input-change="handleInputChange"
      @select="handlePickerSelect"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
      @dropdown-visible-change="handleDropdownVisibleChange"
    />
    <action-button-group
      v-if="actionButtons.length > 0"
      :visible="showActionButtonGroup"
      :buttons="actionButtons"
      @button-click="handleButtonClick"
    />

    <fk-action-dialog
      :title="addDialogTitle"
      :visible.sync="addDialogVisible"
      custom-class="fk-edit-dialog"
      :url="addIframeUrl"
      @iframe-load="handleIframeLoad"
      @form-ready="handleFormReady"
      @add-success="handleAddSuccess"
      @update-success="handleUpdateSuccess"
      @close-dialog="handleDialogClose"
      @unknown-message="handleUnknownMessage"
    />

    <fk-action-dialog
      :title="editDialogTitle"
      :visible.sync="editDialogVisible"
      custom-class="fk-edit-dialog"
      :url="editIframeUrl"
      @iframe-load="handleIframeLoad"
      @form-ready="handleFormReady"
      @add-success="handleAddSuccess"
      @update-success="handleUpdateSuccess"
      @close-dialog="handleDialogClose"
      @unknown-message="handleUnknownMessage"
    />
  </div>
</template>

<script>
import addIcon from "@/assets/img/add.png";
import editIcon from "@/assets/img/edit.png";
import { ActionButtonGroup } from "../action-button";
import FkOptionPicker from "./fk-option-picker.vue";
import FkActionDialog from "./fk-action-dialog.vue";
import {
  hasFkValue,
  loadFkOptionByValue,
  loadFkOptions,
  resolveFkOptionConfig,
} from "../../utils/fkOption";

export default {
  name: "FkEditSelect",
  components: {
    ActionButtonGroup,
    FkOptionPicker,
    FkActionDialog
  },
  props: {
    app: {
      type: String,
      default: "",
    },
    fieldInfo: {
      type: Object,
    },
    value: {
      type: [String, Number],
      default: null,
    },
    column: Object,
    row: Object,
    defaultOptions: Array,
    disabled: Boolean,
    uiMode: {
      type: String,
      default: "table",
    },
  },
  data() {
    return {
      options: [],
      selectItem: null,
      allOptions: [],
      inputValue: "",
      addDialogVisible: false,
      editDialogVisible: false,
      dropdownVisible: false,
      addIcon,
      editIcon,
    };
  },
  computed: {
    modelValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      }
    },
    placeholder() {
      if (this.fieldInfo?.placeholder) {
        return this.fieldInfo.placeholder;
      }
      return this.pickerUiMode === "table"
        ? "输入关键词搜索，双击选择已有数据"
        : "输入关键词搜索，请从结果中选择";
    },
    pickerUiMode() {
      return this.uiMode || this.srvInfo?.ui_mode || this.srvInfo?.picker_ui_mode || "table";
    },
    srvInfo() {
      return this.getOptionListV2();
    },
    valueKey() {
      return this.srvInfo?.refed_col || "value";
    },
    labelKey() {
      return this.srvInfo?.key_disp_col || this.srvInfo?.disp_col || "label";
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
    showAddBtn() {
      return !this.modelValue && this.addSrvCfg?.srv && this.addSrvCfg?.permission !== false;
    },
    showEditBtn() {
      return !!this.modelValue && this.updateSrvCfg?.srv && this.updateSrvCfg?.permission !== false;
    },
    actionButtons() {
      const buttons = [];
      
      if (this.showAddBtn) {
        buttons.push({
          key: 'add',
          icon: addIcon,
          text: '新增',
          title: '新增',
          className: 'btn-add',
          handler: this.handleAdd
        });
      }
      
      if (this.showEditBtn) {
        buttons.push({
          key: 'edit',
          icon: editIcon,
          text: '编辑',
          title: '编辑',
          className: 'btn-edit',
          handler: this.handleEdit
        });
      }
      
      return buttons;
    },
    showActionButtonGroup() {
      return this.actionButtons.length > 0 && !this.dropdownVisible;
    },
    addSrvCfg() {
      return this.srvInfo?.add_srv_cfg;
    },
    updateSrvCfg() {
      return this.srvInfo?.update_srv_cfg;
    },
    addDialogTitle() {
      return this.addSrvCfg?.title || "新增";
    },
    editDialogTitle() {
      return this.updateSrvCfg?.title || "编辑";
    },
    addIframeUrl() {
      if (!this.addSrvCfg?.srv) {
        return "";
      }
      const serviceName = this.addSrvCfg.srv;
      let url = `/vpages/#/add/${serviceName}`;
      const params = [];
      
      if (this.srvInfo?.refed_col && this.row) {
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
      if(!this.selectItem?.id) return ""; // 未选择数据，不生成编辑路由
      // 正确的 update 路由格式：/update/{service_name}/{id}
      let url = `/vpages/#/update/${this.updateSrvCfg.srv}/${this.selectItem.id}`;
      const params = [];
      
      if (this.updateSrvCfg?.app || this.app) {
        params.push(`srvApp=${encodeURIComponent(this.updateSrvCfg?.app || this.app)}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      
      return url;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (newValue !== undefined && newValue !== null) {
          this.inputValue = newValue;
          this.loadLabelByValue(newValue);
        } else {
          this.inputValue = "";
        }
      },
    },
  },
  methods: {
    getOptionListV2() {
      return resolveFkOptionConfig(this.fieldInfo, this.row);
    },
    async loadLabelByValue(val) {
      if (!hasFkValue(val) || !this.srvInfo) {
        return Promise.resolve();
      }
      try {
        const optionItem = await loadFkOptionByValue({
          column: this.column,
          row: this.row,
          app: this.app,
          srvInfo: this.srvInfo,
          value: val,
          mainData: this.$route?.query || {},
        });
        if (optionItem) {
          this.inputValue = optionItem.label || val;
          this.upsertOption(optionItem);
          this.selectItem = optionItem;
          return optionItem;
        }
        this.inputValue = val;
      } catch (e) {
        console.error("loadLabelByValue error:", e);
        this.inputValue = val;
        throw e;
      }
    },
    querySearch(queryString, cb) {
      if (!this.srvInfo) {
        cb([]);
        return;
      }
      loadFkOptions({
        column: this.column,
        row: this.row,
        app: this.app,
        srvInfo: this.srvInfo,
        keyword: queryString,
        mainData: this.$route?.query || {},
      }).then((res) => {
        if (res?.data?.length && this.srvInfo?.refed_col) {
          const results = res.data;
          this.allOptions.push(...results);
          cb(results);
        } else {
          cb([]);
        }
      });
    },
    handleInputChange(value) {
      this.inputValue = value || "";
    },
    handleDropdownVisibleChange(value) {
      this.dropdownVisible = value;
      if (!value) {
        // 必须选择的 FK 字段中，输入内容只作为搜索词。
        // 下拉关闭但没有选择时，恢复为上一次确认的显示值。
        this.inputValue = this.selectItem?.label || "";
      }
    },
    handlePickerSelect(item) {
      if (!item) {
        this.handleClear();
        return;
      }
      this.handleSelect(item);
    },
    handleSelect(item) {
      this.inputValue = item[this.labelKey] || item.label;
      this.$emit("input", item[this.valueKey]);
      this.$emit("select", {
        value: item[this.valueKey],
        rawData: item,
      });
      this.selectItem = item;
    },
    upsertOption(optionItem) {
      const existingIndex = this.allOptions.findIndex(
        (opt) => opt.value === optionItem.value
      );
      if (existingIndex >= 0) {
        this.allOptions.splice(existingIndex, 1, optionItem);
      } else {
        this.allOptions.push(optionItem);
      }
    },
    handleBlur() {
      const selectedLabel = this.selectItem?.label || "";
      if (!this.inputValue || this.inputValue === selectedLabel) {
        return;
      }
      this.$message.warning("请从搜索结果中选择一条数据，输入内容仅用于搜索");
      this.inputValue = selectedLabel;
    },
    handleFocus() {
      this.$emit("focus");
    },
    handleClear() {
      this.inputValue = "";
      this.selectItem = null;
      this.$emit("input", null);
      this.$emit("select", { value: null, rawData: null });
    },
    handleButtonClick(button) {
      if (button.handler) {
        button.handler();
      }
    },
    handleAdd() {
      if (this.setDisabled) {
        return;
      }
      if (this.addSrvCfg?.srv) {
        this.addDialogVisible = true;
      } else {
        this.$emit("open-add-dialog", {
          field: this.fieldInfo,
          row: this.row,
          optionCfg: this.srvInfo,
        });
      }
    },
    handleEdit() {
      if (this.setDisabled) {
        return;
      }
      if (this.updateSrvCfg?.srv && this.modelValue) {
        this.editDialogVisible = true;
      } else {
        this.$emit("open-edit-dialog", {
          field: this.fieldInfo,
          row: this.row,
          optionCfg: this.srvInfo,
          selectedValue: this.modelValue,
        });
      }
    },
    handleIframeLoad(event) {
      const target = event.target;
      const iframe = target;
      try {
        if (iframe && iframe.contentDocument) {
          const style = iframe.contentDocument.createElement('style');
          style.textContent = '.el-card { overflow-y: auto; }';
          iframe.contentDocument.head.appendChild(style);
        }
      } catch (error) {
        // iframe 跨域或未完全加载时无法访问 contentDocument，不影响表单主流程。
      }
    },
    handleFormReady(data) {
      this.$emit("form-ready", data);
    },
    handleAddSuccess(data) {
      this.$message.success("添加成功");
      this.addDialogVisible = false;
      if (!data) {
        return;
      }
      const addedId = data.id || data.effectData?.id;
      if (addedId) {
        this.$emit("add-success", {
          ...data,
          addedId: addedId
        });
        // 新增表单只返回关键数据时，需要重新按 id 拉取完整选项用于回填显示值。
        this.loadLabelByValue(addedId).then(() => {
          if (this.selectItem) {
            this.$emit("select", this.selectItem);
            this.$emit("input", addedId);
          }
        });
      }
    },
    handleUpdateSuccess(data) {
      this.$message.success("更新成功");
      this.editDialogVisible = false;
      if (!data) {
        return;
      }
      const updatedId = data.id || data.effectData?.id || this.modelValue;
      this.$emit("edit-success", {
        ...data,
        updatedId: updatedId
      });
      // 编辑成功后重新读取选项，确保显示值与服务端最新数据一致。
      this.reloadLabelByValue(updatedId).then(() => {
        if (this.selectItem) {
          this.$emit("select", this.selectItem);
          this.$emit("input", updatedId);
        }
      });
    },
    handleDialogClose() {
      this.addDialogVisible = false;
      this.editDialogVisible = false;
    },
    handleUnknownMessage(data) {
      console.log("收到未知消息类型:", data);
    },
    async reloadLabelByValue(val) {
      if (!hasFkValue(val) || !this.srvInfo) {
        return Promise.resolve();
      }
      try {
        const optionItem = await loadFkOptionByValue({
          column: this.column,
          row: this.row,
          app: this.app,
          srvInfo: this.srvInfo,
          value: val,
          mainData: this.$route?.query || {},
        });
        if (optionItem) {
          const mergedOption = {
            ...(this.selectItem || {}),
            ...optionItem,
          };
          this.selectItem = mergedOption;
          this.upsertOption(mergedOption);
          return mergedOption;
        }
      } catch (e) {
        console.error("reloadLabelByValue error:", e);
        throw e;
      }
    },
  },
};
</script>

<style lang="scss">
  .fk-edit-dialog{
    .el-dialog__body{
      padding: 0 20px 20px;
      iframe{
        width: 100%;
        height: 100%;
      }
    }
  }
</style>
<style lang="scss" scoped>
.fk-edit-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  .fk-option-item {
    padding: 4px 0;
  }
}
</style>
