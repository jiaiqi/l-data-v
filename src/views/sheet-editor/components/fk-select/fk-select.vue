<template>
  <div class="fk-select-wrapper">
    <el-select
      ref="selectRef"
      v-model="modelValue"
      remote
      filterable
      reserve-keyword
      placeholder="请输入关键词"
      :remote-method="remoteMethod"
      :loading="loading"
      :label-key="labelKey"
      :value-key="valueKey"
      :clearable="true"
      :disabled="setDisabled"
      @click.native="handleClick"
      @change="handleChange"
      @focus="handleFocus"
      @clear="handleClear"
      style="width: 100%"
    >
      <el-option
        v-for="(item, index) in options"
        :key="index"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { getFkOptions } from "@/service/api";

export default {
  name: "FkSelect",
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
      options: [],
      allOptions: [],
      loading: false,
    };
  },
  computed: {
    modelValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
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
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue) {
        if (newValue && !this.modelValue) {
          this.remoteMethod(newValue);
        }
      },
    },
  },
  created() {
    if (this.defaultOptions?.length) {
      this.options = [...this.defaultOptions];
    }
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
    handleClick() {
      if (!this.setDisabled) {
        this.remoteMethod();
      }
    },
    handleChange(val) {
      const selected = this.options.find(
        (item) => item[this.valueKey] === val
      );
      this.$emit("select", {
        value: val,
        rawData: selected || null,
      });
    },
    handleFocus() {
      this.$emit("focus");
    },
    handleClear() {
      this.$emit("input", null);
      this.$emit("select", { value: null, rawData: null });
    },
    remoteMethod(query) {
      if (!this.srvInfo) {
        return Promise.resolve([]);
      }

      let queryString = query || "";
      if (!this.options?.length) {
        this.loading = true;
      }

      const option = cloneDeep(this.srvInfo);
      let relation_condition = {
        relation: "OR",
        data: [],
      };

      if (!option?.key_disp_col && !option?.refed_col) {
        this.loading = false;
        return Promise.resolve([]);
      }

      if (queryString && queryString !== "$firstRowData") {
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

      return getFkOptions(
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
          this.options = res.data.map((item) => {
            return {
              label: item[option.key_disp_col],
              value: item[option.refed_col],
              ...item,
            };
          });
          this.allOptions.push(...this.options);
        } else {
          this.options = [];
        }
        this.loading = false;
        return this.options;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-select-wrapper {
  width: 100%;
}
</style>
