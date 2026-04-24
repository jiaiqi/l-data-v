<template>
  <div v-loading="loading" class="fk-selector-container">
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
import { cloneDeep } from "lodash-es";
import fkSelect from "./fk-select/fk-select.vue";
import fkOnlyEdit from "./fk-select/fk-only-edit.vue";
import fkEditSelect from "./fk-select/fk-edit-select.vue";

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
        if (newValue && !this.isOnlyEdit && !this.isEditSelect) {
          this.loadLabelByValue(newValue);
        }
      },
    },
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
        return;
      }
      const option = cloneDeep(this.srvInfo);
      const condition = [
        {
          colName: option.refed_col,
          value: val,
          ruleType: "eq",
        },
      ];

      try {
        const { onSelect } = await import("../../../service/api");
        const res = await onSelect(
          option.serviceName,
          option.srv_app || this.app,
          condition,
          {
            rownumber: 1,
            pageNo: 1,
          }
        );

        if (res?.data?.length) {
          const item = res.data[0];
          this.displayLabel = item[option.key_disp_col] || val;
        }
      } catch (e) {
        console.error("loadLabelByValue error:", e);
      }
    },
    onInput(val) {
      this.$emit("input", val);
    },
    onSelect(data) {
      this.displayLabel = data?.rawData?.label || data?.value;
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
