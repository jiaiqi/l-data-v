<template>
  <fk-option-picker
    :app="app"
    :column="column"
    :row="row"
    :srv-info="srvInfo"
    :input-value="inputValue"
    :allow-free-input="false"
    :disabled="setDisabled"
    :ui-mode="pickerUiMode"
    :placeholder="pickerPlaceholder"
    @focus="handleFocus"
    @blur="handleBlur"
    @input-change="handleInputChange"
    @dropdown-visible-change="handleDropdownVisibleChange"
    @select="handlePickerSelect"
  />
</template>

<script>
import FkOptionPicker from "./fk-option-picker.vue";
import { loadFkOptions, resolveFkOptionConfig } from "../../utils/fkOption";

export default {
  name: "FkSelect",
  components: {
    FkOptionPicker,
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
      validator: (value) => ["table", "autocomplete"].includes(value),
    },
  },
  data() {
    return {
      inputValue: "",
      selectItem: null,
      dropdownVisible: false,
    };
  },
  computed: {
    srvInfo() {
      return this.getOptionListV2();
    },
    pickerUiMode() {
      return (
        this.uiMode ||
        this.srvInfo?.ui_mode ||
        this.srvInfo?.picker_ui_mode ||
        "table"
      );
    },
    pickerPlaceholder() {
      if (this.fieldInfo?.placeholder) {
        return this.fieldInfo.placeholder;
      }
      return this.pickerUiMode === "table"
        ? "输入关键词搜索，双击选择已有数据"
        : "输入关键词搜索，请从结果中选择";
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
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (newValue !== undefined && newValue !== null && newValue !== "") {
          this.inputValue = this.selectItem?.label || newValue;
          this.loadLabelByValue(newValue);
        } else {
          this.inputValue = "";
          this.selectItem = null;
        }
      },
    },
  },
  created() {
    this.initDefaultSelected();
  },
  methods: {
    getOptionListV2() {
      return resolveFkOptionConfig(this.fieldInfo, this.row);
    },
    initDefaultSelected() {
      if (
        !this.defaultOptions?.length ||
        this.value === undefined ||
        this.value === null ||
        this.value === ""
      ) {
        return;
      }
      const matched = this.defaultOptions.find(
        (item) =>
          item?.value === this.value ||
          item?.[this.srvInfo?.refed_col] === this.value
      );
      if (matched) {
        this.selectItem = this.formatSelectedItem(matched);
        this.inputValue = this.selectItem.label || this.value;
      }
    },
    formatSelectedItem(item) {
      if (!item) {
        return null;
      }
      const label =
        item.label !== undefined && item.label !== null
          ? item.label
          : item[this.srvInfo?.key_disp_col] ||
            item[this.srvInfo?.disp_col] ||
            item.value;
      const value =
        item.value !== undefined && item.value !== null
          ? item.value
          : item[this.srvInfo?.refed_col];
      return {
        ...item,
        label,
        value,
        rawData: {
          ...(item.rawData || item),
          label,
          value,
        },
      };
    },
    async loadLabelByValue(val) {
      if (val === undefined || val === null || val === "" || !this.srvInfo) {
        return Promise.resolve();
      }
      try {
        const res = await loadFkOptions({
          column: this.column,
          row: this.row,
          app: this.app,
          srvInfo: this.srvInfo,
          keyword: val,
          searchRuleType: "eq",
          pageNo: 1,
          rownumber: 1,
          mainData: this.$route?.query || {},
        });
        const optionItem = res?.data?.[0];
        if (optionItem) {
          // 只按当前值做精确回显，避免把模糊搜索的第一条结果当成已选值。
          this.selectItem = this.formatSelectedItem(optionItem);
          this.inputValue = this.selectItem?.label || val;
        } else {
          this.selectItem = null;
          this.inputValue = val;
        }
      } catch (e) {
        console.error("loadLabelByValue error:", e);
        this.inputValue = val;
      }
    },
    handleFocus() {
      this.$emit("focus");
    },
    handleBlur() {
      const confirmedLabel = this.selectItem?.label || "";
      if (this.inputValue && this.inputValue !== confirmedLabel) {
        this.$message?.warning?.(
          "请从搜索结果中选择一条数据，输入内容仅用于搜索"
        );
      }
      // fk-select 只能选择已有数据，失焦后需要恢复成上一次确认的显示值。
      this.inputValue = confirmedLabel;
    },
    handleInputChange(value) {
      this.inputValue = value !== undefined && value !== null ? value : "";
    },
    handleDropdownVisibleChange(value) {
      this.dropdownVisible = value;
      if (!value) {
        // 关闭下拉但没有完成选择时，搜索词不能覆盖单元格的真实 FK 值。
        this.inputValue = this.selectItem?.label || "";
      }
    },
    handlePickerSelect(item) {
      if (!item) {
        this.handleClear();
        return;
      }
      this.selectItem = this.formatSelectedItem(item);
      this.inputValue = this.selectItem?.label || "";
      const selectedValue = this.selectItem?.value;
      this.$emit(
        "input",
        selectedValue !== undefined && selectedValue !== null
          ? selectedValue
          : null
      );
      this.$emit("select", {
        value:
          selectedValue !== undefined && selectedValue !== null
            ? selectedValue
            : null,
        rawData: this.selectItem || null,
      });
    },
    handleClear() {
      this.inputValue = "";
      this.selectItem = null;
      this.$emit("input", null);
      this.$emit("select", { value: null, rawData: null });
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
