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

    <el-dialog
      :title="addDialogTitle"
      :visible.sync="addDialogVisible"
      width="90%"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
      @close="handleAddDialogClose"
      custom-class="fk-edit-dialog"
    >
      <iframe
        v-if="addDialogVisible"
        ref="addIframe"
        :src="addIframeUrl"
        frameborder="0"
        style="width: 100%; height: 70vh; border: none"
        @load="handleIframeLoad"
      ></iframe>
    </el-dialog>

    <el-dialog
      :title="editDialogTitle"
      :visible.sync="editDialogVisible"
      width="90%"
      top="5vh"
      append-to-body
      :close-on-click-modal="false"
      @close="handleEditDialogClose"
      custom-class="fk-edit-dialog"
    >
      <iframe
        v-if="editDialogVisible"
        ref="editIframe"
        :src="editIframeUrl"
        frameborder="0"
        style="width: 100%; height: 70vh; border: none"
        @load="handleIframeLoad"
      ></iframe>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { getFkOptions } from "@/service/api";
import addIcon from "@/assets/img/add.png";
import editIcon from "@/assets/img/edit.png";
import { ActionButtonGroup } from "../action-button";
import FkOptionPicker from "./fk-option-picker.vue";

export default {
  name: "FkEditSelect",
  components: {
    ActionButtonGroup,
    FkOptionPicker
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
  mounted() {
    window.addEventListener("message", this.handleIframeMessage);
  },
  beforeDestroy() {
    window.removeEventListener("message", this.handleIframeMessage);
  },
  methods: {
    getOptionListV2() {
      const optionListV3 = this.fieldInfo?.option_list_v3;
      const data = this.row;
      let result = null;

      if (optionListV3?.length) {
        if (optionListV3.find((item) => !item.conds)) {
          result = optionListV3.find((item) => !item.conds);
        } else {
          result = optionListV3.find(
            (item) =>
              !item.conds?.length ||
              item.conds?.every(
                (cond) =>
                  data?.[cond.case_col] &&
                  cond.case_val?.includes?.(data?.[cond.case_col])
              )
          );
        }
      } else if (this.fieldInfo?.option_list_v2) {
        result = this.fieldInfo.option_list_v2;
      }

      return cloneDeep(result);
    },
    async loadLabelByValue(val) {
      if (!val || !this.srvInfo) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        getFkOptions(
          { ...this.column, option_list_v2: this.srvInfo },
          this.row,
          this.app,
          1,
          1,
          {
            mainData: this.$route?.query || {},
          }
        ).then((res) => {
          if (res?.data?.length) {
            const item = res.data[0];
            
            const labelValue = item[this.labelKey] || 
                             item[this.srvInfo?.key_disp_col] || 
                             item.label || 
                             val;
            
            const idValue = item[this.valueKey] || 
                           item[this.srvInfo?.refed_col] || 
                           item.value || 
                           val;
            
            this.inputValue = labelValue;
            
            const optionItem = {
              label: labelValue,
              value: idValue,
              ...item,
            };
            
            // 检查是否已存在相同的选项
            const existingIndex = this.allOptions.findIndex(opt => opt.value === idValue);
            if (existingIndex >= 0) {
              this.allOptions.splice(existingIndex, 1, optionItem);
            } else {
              this.allOptions.push(optionItem);
            }
            
            this.selectItem = optionItem;
            resolve(optionItem);
          } else {
            // 如果API没有返回数据，尝试使用传入的值作为显示值
            this.inputValue = val;
            resolve();
          }
        }).catch((e) => {
          console.error("loadLabelByValue error:", e);
          // 失败时使用传入的值作为显示值
          this.inputValue = val;
          reject(e);
        });
      });
    },
    querySearch(queryString, cb) {
      if (!this.srvInfo) {
        cb([]);
        return;
      }

      const option = cloneDeep(this.srvInfo);
      let relation_condition = {
        relation: "OR",
        data: [],
      };

      if (queryString) {
        if (option.key_disp_col) {
          relation_condition.data.push({
            colName: option.key_disp_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
        if (option.refed_col) {
          relation_condition.data.push({
            colName: option.refed_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
      }

      option.relation_condition = relation_condition;

      getFkOptions(
        { ...this.column, option_list_v2: option },
        this.row,
        this.app,
        null,
        null,
        {
          mainData: this.$route?.query || {},
        }
      ).then((res) => {
        if (res?.data?.length && option?.refed_col) {
          const results = res.data.map((item) => {
            return {
              label: item[option.key_disp_col],
              value: item[option.refed_col],
              ...item,
            };
          });
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
      console.log("iframe loaded");
      
      const target = event.target;
      let iframe = null;
      if (target === this.$refs.addIframe) {
        iframe = this.$refs.addIframe;
      } else if (target === this.$refs.editIframe) {
        iframe = this.$refs.editIframe;
      }
      
      if (iframe && iframe.contentDocument) {
        const style = iframe.contentDocument.createElement('style');
        style.textContent = '.el-card { overflow-y: auto; }';
        iframe.contentDocument.head.appendChild(style);
      }
    },
    handleIframeMessage(event) {
      console.info("收到 iframe 消息:", event.data);

      const addIframeWindow = this.$refs.addIframe?.contentWindow;
      const editIframeWindow = this.$refs.editIframe?.contentWindow;

      if (event.source !== addIframeWindow && event.source !== editIframeWindow) {
        return;
      }

      if (!event.data || typeof event.data !== "object") {
        return;
      }

      const { type, data } = event.data;

      switch (type) {
        case "FORM_READY":
          console.log("表单已准备好", data);
          this.$emit("form-ready", data);
          break;
          
        case "ADD_SUCCESS":
          this.$message.success("添加成功");
          this.addDialogVisible = false;

          if (data) {
            // 获取新增记录的ID
            const addedId = data.id || data.effectData?.id;

            if (addedId) {
              // 1. 触发 add-success 事件
              this.$emit("add-success", {
                ...data,
                addedId: addedId
              });

              // 2. 重新加载完整的记录信息（包括显示标签等）
              this.loadLabelByValue(addedId).then(() => {
                // 加载完成后
                if (this.selectItem) {
                  // 触发 select 事件，传递完整的选项数据
                  this.$emit("select", this.selectItem);
                  // 触发 input 事件，确保父组件更新值
                  this.$emit("input", addedId);
                }
              });
            }
          }
          break;
          
        case "UPDATE_SUCCESS":
          this.$message.success("更新成功");
          this.editDialogVisible = false;

          if (data) {
            // 获取更新记录的ID（通常和外键值相同）
            const updatedId = data.id || data.effectData?.id || this.modelValue;

            // 1. 触发 edit-success 事件，传递完整的更新数据
            this.$emit("edit-success", {
              ...data,
              updatedId: updatedId
            });

            // 2. 重新加载完整的记录信息以确保数据一致性
            this.reloadLabelByValue(updatedId).then(() => {
              // 加载完成后
              if (this.selectItem) {
                // 触发 select 事件，传递更新后的数据
                this.$emit("select", this.selectItem);
                // 触发 input 事件，确保父组件更新值
                this.$emit("input", updatedId);
              }
            });
          }
          break;
          
        case "CLOSE_DIALOG":
          this.addDialogVisible = false;
          this.editDialogVisible = false;
          break;
          
        default:
          console.log("收到未知消息类型:", type, data);
          break;
      }
    },
    handleAddDialogClose() {
      console.log("添加弹窗关闭");
    },
    handleEditDialogClose() {
      console.log("编辑弹窗关闭");
    },
    async reloadLabelByValue(val) {
      if (!val || !this.srvInfo) {
        return Promise.resolve();
      }
      
      return new Promise((resolve, reject) => {
        getFkOptions(
          { ...this.column, option_list_v2: this.srvInfo },
          this.row,
          this.app,
          1,
          1,
          {
            mainData: this.$route?.query || {},
          }
        ).then((res) => {
          if (res?.data?.length) {
            const item = res.data[0];
            
            const labelValue = item[this.labelKey] || 
                             item[this.srvInfo?.key_disp_col] || 
                             item.label || 
                             val;
            
            const idValue = item[this.valueKey] || 
                           item[this.srvInfo?.refed_col] || 
                           item.value || 
                           val;
            
            // 更新 selectItem（保留原有数据，只更新标签）
            const optionItem = {
              ...(this.selectItem || {}),
              label: labelValue,
              value: idValue,
              ...item
            };
            
            this.selectItem = optionItem;
            
            // 检查是否已存在相同的选项
            const existingIndex = this.allOptions.findIndex(opt => opt.value === idValue);
            if (existingIndex >= 0) {
              this.allOptions.splice(existingIndex, 1, optionItem);
            } else {
              this.allOptions.push(optionItem);
            }
            
            resolve(optionItem);
          } else {
            resolve();
          }
        }).catch((e) => {
          console.error("reloadLabelByValue error:", e);
          reject(e);
        });
      });
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
