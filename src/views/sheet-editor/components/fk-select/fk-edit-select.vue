<template>
  <div class="fk-edit-select-wrapper">
    <el-autocomplete
      ref="autocompleteRef"
      v-model="inputValue"
      :fetch-suggestions="querySearch"
      :placeholder="placeholder"
      :disabled="setDisabled"
      clearable
      @select="handleSelect"
      @blur="handleBlur"
      @focus="handleFocus"
      @clear="handleClear"
      style="width: 100%"
    >
      <template slot-scope="{ item }">
        <div class="fk-option-item">
          {{ item.label }}
        </div>
      </template>
    </el-autocomplete>
    <el-button
      v-if="!modelValue"
      class="add-btn"
      icon="el-icon-plus"
      :disabled="setDisabled"
      @click.stop="handleAdd"
    ></el-button>
    <el-button
      v-else
      class="edit-btn"
      icon="el-icon-edit"
      :disabled="setDisabled"
      @click.stop="handleEdit"
    ></el-button>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { getFkOptions } from "@/service/api";

export default {
  name: "FkEditSelect",
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
      inputValue: "",
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
      return this.fieldInfo?.placeholder || "请输入或选择";
    },
    srvInfo() {
      return this.getOptionListV2();
    },
    addSrvCfg() {
      return this.srvInfo?.add_srv_cfg;
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
        const res = await getFkOptions(
          { ...this.column, option_list_v2: option },
          this.row,
          this.app,
          1,
          1,
          {
            mainData: this.$route?.query || {},
          }
        );

        if (res?.data?.length) {
          const item = res.data[0];
          this.inputValue = item[option.key_disp_col] || val;
          this.allOptions.push({
            label: item[option.key_disp_col],
            value: item[option.refed_col],
            ...item,
          });
        }
      } catch (e) {
        console.error("loadLabelByValue error:", e);
      }
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
    handleSelect(item) {
      this.inputValue = item[this.labelKey] || item.label;
      this.$emit("input", item[this.valueKey]);
      this.$emit("select", {
        value: item[this.valueKey],
        rawData: item,
      });
    },
    handleBlur() {
      const queryString = this.inputValue;
      if (!queryString) {
        return;
      }

      const matchedOption = this.options.find(
        (item) =>
          item[this.valueKey] == queryString ||
          item[this.labelKey] == queryString
      );

      if (matchedOption) {
        this.inputValue = matchedOption[this.labelKey];
        this.$emit("input", matchedOption[this.valueKey]);
        this.$emit("select", {
          value: matchedOption[this.valueKey],
          rawData: matchedOption,
        });
      } else {
        this.$message.warning("请选择已有选项或点击右侧按钮添加新选项");
        this.inputValue = "";
      }
    },
    handleFocus() {
      this.$emit("focus");
    },
    handleClear() {
      this.inputValue = "";
      this.$emit("input", null);
      this.$emit("select", { value: null, rawData: null });
    },
    handleAdd() {
      if (this.setDisabled) {
        return;
      }
      this.$emit("open-add-dialog", {
        field: this.fieldInfo,
        row: this.row,
        optionCfg: this.srvInfo,
      });
    },
    handleEdit() {
      if (this.setDisabled) {
        return;
      }
      this.$emit("open-edit-dialog", {
        field: this.fieldInfo,
        row: this.row,
        optionCfg: this.srvInfo,
        selectedValue: this.modelValue,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-edit-select-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;

  .add-btn,
  .edit-btn {
    flex-shrink: 0;
  }

  .fk-option-item {
    padding: 4px 0;
  }
}
</style>
