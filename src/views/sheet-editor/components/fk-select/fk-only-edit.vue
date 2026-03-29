<template>
  <div class="fk-only-edit-wrapper">
    <input
      ref="inputRef"
      type="text"
      v-model="inputValue"
      :placeholder="placeholder"
      :disabled="setDisabled"
      class="native-input"
      @focus.stop="handleFocus"
      @input.stop="handleInput"
      @blur="handleBlur"
      @keydown.down.prevent="handleKeyDown"
      @keydown.up.prevent="handleKeyUp"
      @keydown.enter.prevent="handleKeyEnter"
      @keydown.esc="handleKeyEsc"
    />
    <div
      v-if="showDropdown && filteredOptions.length > 0"
      class="dropdown-list"
    >
      <div
        v-for="(item, index) in filteredOptions"
        :key="index"
        class="dropdown-item"
        :class="{ 'is-selected': selectedIndex === index }"
        @click="handleSelect(item)"
        @mouseenter="selectedIndex = index"
      >
        {{ item[labelKey] }}
      </div>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { getFkOptions } from "@/service/api";

export default {
  name: "FkOnlyEdit",
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
      showDropdown: false,
      selectedIndex: -1,
      loading: false,
      pendingSearchPromise: null,
      selectedOption: null,
    };
  },
  computed: {
    placeholder() {
      return this.fieldInfo?.placeholder || "请输入或选择";
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
    filteredOptions() {
      if (!this.inputValue) {
        return this.options.slice(0, 20);
      }
      const query = String(this.inputValue).toLowerCase();
      return this.options
        .filter((item) => {
          const label = String(item[this.labelKey] || "").toLowerCase();
          const value = String(item[this.valueKey] || "").toLowerCase();
          return label.includes(query) || value.includes(query);
        })
        .slice(0, 20);
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
          this.selectedOption = null;
        }
      },
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeDestroy() {
    document.removeEventListener("click", this.handleClickOutside);
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
      } else if (this.fieldInfo?.redundant_options?.autocompleteInput) {
        result = this.fieldInfo.redundant_options;
      }

      return cloneDeep(result);
    },
    async loadLabelByValue(val) {
      if (!val || !this.srvInfo) {
        return;
      }
      const option = cloneDeep(this.srvInfo);

      try {
        let req = {
          serviceName: option.serviceName,
          colNames: ["*"],
          condition: [
            {
              colName: option.refed_col,
              value: val,
              ruleType: "eq",
            },
          ],
          page: {
            pageNo: 1,
            rownumber: 1,
          },
        };

        const res = await this.$http.post(
          `/${option.srv_app || this.app}/select/${option.serviceName}`,
          req
        );

        if (res?.data?.state === "SUCCESS" && res?.data?.data?.length) {
          const item = res.data.data[0];
          this.inputValue = item[option.key_disp_col] || val;
          this.selectedOption = {
            label: item[option.key_disp_col],
            value: item[option.refed_col],
            ...item,
          };
          this.allOptions.push(this.selectedOption);
        }
      } catch (e) {
        console.error("loadLabelByValue error:", e);
      }
    },
    handleInput(event) {
      event.stopPropagation();
      event.preventDefault();
      const inputValue = event.target.value;

      this.showDropdown = true;
      this.selectedIndex = -1;
      if (this.shouldClearSelectedOption(inputValue)) {
        this.selectedOption = null;
      }

      this.remoteSearch(inputValue || null);
    },
    handleFocus() {
      this.showDropdown = true;
      if (this.options.length === 0) {
        this.remoteSearch("");
      }
      this.$emit("focus");
    },
    handleClickOutside(e) {
      if (this.$el && !this.$el.contains(e.target)) {
        this.handleBlur();
      }
    },
    handleKeyDown() {
      if (this.selectedIndex < this.filteredOptions.length - 1) {
        this.selectedIndex++;
      }
    },
    handleKeyUp() {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
    },
    handleKeyEnter() {
      if (this.selectedIndex >= 0 && this.filteredOptions[this.selectedIndex]) {
        this.handleSelect(this.filteredOptions[this.selectedIndex]);
      } else {
        this.handleBlur();
      }
    },
    handleKeyEsc() {
      this.showDropdown = false;
      this.selectedIndex = -1;
    },
    handleSelect(item, extra = {}) {
      if (item) {
        this.inputValue = item[this.labelKey];
        this.showDropdown = false;
        this.selectedOption = item;
        this.$emit("input", item[this.valueKey]);
        this.$emit("select", {
          value: item[this.valueKey],
          rawData: item,
          matched: true,
          inputType: extra.inputType || "select",
          displayValue: item[this.labelKey],
        });
      }
    },
    async handleBlur() {
      if (!this.showDropdown) return;

      const queryString = this.inputValue;
      this.showDropdown = false;

      if (this.pendingSearchPromise) {
        try {
          await this.pendingSearchPromise;
        } catch (e) {
          console.error("handleBlur remoteSearch error:", e);
        }
      }

      if (!queryString) {
        this.emitPlainInput(null, "clear");
        return;
      }

      const matchedOption = this.resolveMatchedOption(queryString);
      if (matchedOption) {
        this.handleSelect(matchedOption, { inputType: "manual-match" });
      } else {
        this.emitPlainInput(queryString, "manual-input");
      }
    },
    remoteSearch(queryString) {
      if (!this.srvInfo) {
        return Promise.resolve([]);
      }

      this.loading = true;
      const option = cloneDeep(this.srvInfo);

      const req = this.buildQueryRequest(option, queryString);

      const request = this.$http
        .post(
          `/${option.srv_app || this.app}/select/${option.serviceName}`,
          req
        )
        .then((res) => {
          if (res?.data?.state === "SUCCESS" && res?.data?.data?.length) {
            this.options = res.data.data.map((item) => {
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
        })
        .catch(() => {
          this.loading = false;
          return [];
        })
        .finally(() => {
          if (this.pendingSearchPromise === request) {
            this.pendingSearchPromise = null;
          }
        });

      this.pendingSearchPromise = request;
      return request;
    },
    normalizeOptionValue(val) {
      return String(val ?? "")
        .trim()
        .toLowerCase();
    },
    getUniqueOption(matches = []) {
      const seen = new Set();
      const uniqueMatches = matches.filter((item) => {
        const key = `${item?.[this.valueKey] ?? ""}::${item?.[this.labelKey] ?? ""}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      return uniqueMatches.length === 1 ? uniqueMatches[0] : null;
    },
    resolveMatchedOption(queryString) {
      const query = this.normalizeOptionValue(queryString);
      if (!query) {
        return null;
      }

      const exactMatches = this.options.filter((item) => {
        const value = this.normalizeOptionValue(item?.[this.valueKey]);
        const label = this.normalizeOptionValue(item?.[this.labelKey]);
        return value === query || label === query;
      });
      const exactMatch = this.getUniqueOption(exactMatches);
      return exactMatch;
    },
    emitPlainInput(value, inputType = "manual-input") {
      this.selectedOption = null;
      this.$emit("input", value);
      this.$emit("select", {
        value,
        rawData: null,
        matched: false,
        inputType,
        displayValue: value,
      });
    },
    shouldClearSelectedOption(inputValue) {
      if (!this.selectedOption) {
        return false;
      }
      const normalizedInput = this.normalizeOptionValue(inputValue);
      const normalizedLabel = this.normalizeOptionValue(
        this.selectedOption?.[this.labelKey]
      );
      const normalizedValue = this.normalizeOptionValue(
        this.selectedOption?.[this.valueKey]
      );
      return (
        normalizedInput !== normalizedLabel &&
        normalizedInput !== normalizedValue
      );
    },
    buildQueryRequest(option, queryString) {
      const app =
        option.srv_app || this.app || sessionStorage.getItem("current_app");
      let req = {
        serviceName: option.serviceName,
        colNames: ["*"],
        condition: [],
        page: {
          pageNo: 1,
          rownumber: 20,
        },
      };

      if (queryString) {
        req.relation_condition = {
          relation: "OR",
          data: [],
        };
        if (option.key_disp_col) {
          req.relation_condition.data.push({
            colName: option.key_disp_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
        if (option.refed_col) {
          req.relation_condition.data.push({
            colName: option.refed_col,
            value: queryString,
            ruleType: "[like]",
          });
        }
      }

      if (option.condition?.length) {
        const conditions = JSON.parse(JSON.stringify(option.condition));
        const processedConditions = this.processConditions(conditions);
        req.condition = [...processedConditions];
      }

      return req;
    },
    processConditions(conditions) {
      const row = this.row;
      return conditions.map((item) => {
        if (typeof item.value === "string" && item.value) {
          if (item.value.indexOf("data.") !== -1) {
            let colName = item.value.slice(item.value.indexOf("data.") + 5);
            if (row && row[colName]) {
              item.value = row[colName];
            } else {
              item.value = undefined;
              item.ruleType = "like";
            }
          } else if (item.value.indexOf("top.user") !== -1) {
            let key = item.value.split("top.user.");
            key = key.length > 1 ? key[1] : "";
            if (key) {
              let userInfo = sessionStorage.getItem("current_login_user");
              if (userInfo) {
                userInfo = JSON.parse(userInfo);
              }
              item.value = userInfo?.[key];
            }
          } else if (item.value?.value_type) {
            if (item.value?.value_type === "constant") {
              item.value = item.value?.value;
            } else if (
              item.value.value_type === "mainData" &&
              item.value.value_key
            ) {
              item.value = (this.$route?.query || {})[item.value.value_key];
            } else if (item.value?.value_key && row) {
              item.value = row[item.value?.value_key];
            }
          } else if (
            item.value.indexOf("'") === 0 &&
            item.value.lastIndexOf("'") === item.value.length - 1
          ) {
            item.value = item.value.replace(/\'/gi, "");
          }
        } else if (typeof item.value === "object" && item.value?.value_type) {
          if (item.value?.value_type === "constant") {
            item.value = item.value?.value;
          } else if (item.value?.value_key && row) {
            item.value = row[item.value?.value_key];
          }
        }
        if (item.value_exp) {
          delete item.value_exp;
        }
        return item;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-only-edit-wrapper {
  width: 100%;
  height: 100%;
  position: relative;

  .native-input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    padding: 0 8px;
    font-size: inherit;
    font-family: inherit;

    &::placeholder {
      color: #c0c4cc;
    }

    &:disabled {
      background-color: #f5f7fa;
      cursor: not-allowed;
    }
  }

  .dropdown-list {
    position: absolute;
    top: 100%;
    width: 200px;
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-top: none;
    z-index: 1000;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .dropdown-item {
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1.5;

      &:hover {
        background-color: #f5f7fa;
      }

      &.is-selected {
        background-color: #ecf5ff;
        color: #409eff;
      }
    }
  }
}
</style>
