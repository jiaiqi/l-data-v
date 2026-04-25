<template>
  <div v-loading="loading" class="fk-selector-container">
    <!-- 自行输入 -->
    <fk-only-edit
      v-if="isOnlyEdit && !setDisabled"
      :app="app"
      :field-info="fieldInfo"
      :value="value"
      :column="column"
      :row="row"
      :default-options="defaultOptions"
      :disabled="disabled"
      @input="onInput"
      @select="onSelect"
      @focus="onFocus"
    ></fk-only-edit>
    <!-- 编辑选择 -->
    <fk-edit-select
      v-else-if="isEditSelect && !setDisabled"
      :app="app"
      :field-info="fieldInfo"
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
    ></fk-edit-select>
    <!-- 普通FK -->
    <fk-select
      v-else-if="srvInfo && srvInfo.refed_col && !setDisabled"
      :app="app"
      :field-info="fieldInfo"
      :value="value"
      :column="column"
      :row="row"
      :default-options="defaultOptions"
      :disabled="disabled"
      @input="onInput"
      @select="onSelect"
      @focus="onFocus"
    ></fk-select>

    <div v-else-if="setDisabled" class="fk-text disabled">
      {{ displayValue }}
    </div>

    <div v-else class="fk-text">
      {{ displayValue || "请选择" }}
    </div>
  </div>
</template>

<script>
import fkSelect from "./fk-select/fk-select.vue";
import fkOnlyEdit from "./fk-select/fk-only-edit.vue";
import fkEditSelect from "./fk-select/fk-edit-select.vue";
import {
  hasFkValue,
  loadFkOptionByValue,
  resolveFkOptionConfig,
} from "../utils/fkOption";

export default {
  name: "FkSelector",
  components: {
    fkSelect,
    fkOnlyEdit,
    fkEditSelect,
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
  },
  data() {
    return {
      loading: false,
      displayLabel: null,
    };
  },
  computed: {
    srvInfo() {
      return this.getOptionListV2();
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
    addSrvCfg() {
      return this.srvInfo?.add_srv_cfg;
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
    formType() {
      const service = this.fieldInfo?.srvCol?.service_name;
      return service?.includes("add")
        ? "add"
        : service?.includes("update")
          ? "update"
          : "detail";
    },
    displayValue() {
      return this.displayLabel || this.value;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (!hasFkValue(newValue)) {
          this.displayLabel = null;
          return;
        }
        if (this.setDisabled && this.srvInfo?.refed_col) {
          this.loadDisabledDisplayLabel(newValue);
        } else {
          // 编辑态的回显由具体子选择器负责，避免父子组件重复请求同一条 FK 数据。
          this.displayLabel = null;
        }
      },
    },
  },
  methods: {
    getOptionListV2() {
      return resolveFkOptionConfig(this.fieldInfo, this.row);
    },
    async loadDisabledDisplayLabel(val) {
      if (!hasFkValue(val) || !this.srvInfo) {
        return;
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
        this.displayLabel = optionItem?.label || val;
      } catch (e) {
        console.error("loadDisabledDisplayLabel error:", e);
        this.displayLabel = val;
      }
    },
    onInput(val) {
      this.$emit("input", val);
    },
    onSelect(data) {
      this.displayLabel =
        data?.rawData?.label ||
        data?.label ||
        data?.displayValue ||
        data?.value;
      this.$emit("select", data);
    },
    onFocus() {
      this.$emit("focus");
    },
    onOpenAddDialog(data) {
      this.$emit("open-add-dialog", data);
    },
    onOpenEditDialog(data) {
      this.$emit("open-edit-dialog", data);
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-selector-container {
  width: 100%;
  height: 100%;
  .fk-text {
    width: 100%;
    min-height: 32px;
    padding: 0 10px;
    display: flex;
    align-items: center;

    &.disabled {
      background-color: #f5f7fa;
      color: #c0c4cc;
      cursor: not-allowed;
    }
  }
}
</style>
