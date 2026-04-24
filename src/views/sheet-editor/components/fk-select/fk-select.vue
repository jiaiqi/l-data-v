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
import {
  loadFkOptions,
  resolveFkOptionConfig,
} from "../../utils/fkOption";

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
      return resolveFkOptionConfig(this.fieldInfo, this.row);
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

      const queryString = query === "$firstRowData" ? "" : query || "";
      if (!this.options?.length) {
        this.loading = true;
      }

      if (!this.srvInfo?.key_disp_col && !this.srvInfo?.refed_col) {
        this.loading = false;
        return Promise.resolve([]);
      }

      return loadFkOptions({
        column: this.column,
        row: this.row,
        app: this.app,
        srvInfo: this.srvInfo,
        keyword: queryString,
        mainData: this.$route?.query || {},
      }).then((res) => {
        if (res?.data?.length && this.srvInfo?.refed_col) {
          this.options = res.data;
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
