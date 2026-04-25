<template>
  <div class="fk-tree-picker">
    <el-popover
      placement="bottom-center"
      ref="treePopover"
      trigger="click"
      @show="onPopoverShow"
      :popper-options="popperOptions"
    >
      <div
        slot="reference"
        v-if="innerValue && !disabled"
        class="cursor-pointer"
      >
        <span>{{ modelLabel || innerValue || "" }}</span>
      </div>
      <div
        slot="reference"
        class="text-gray cursor-pointer"
        v-else-if="!disabled"
      >
        请选择
      </div>
      <el-input
        placeholder="输入关键字进行过滤"
        clearable
        v-model="innerValue"
        @focus="$emit('focus')"
        @input="onFilterInput"
        @clear="onFilterClear"
        style="max-width: 300px; margin-bottom: 5px; height: 30px"
      >
      </el-input>
      <el-cascader-panel
        :props="cascaderProps"
        :is-border="false"
        :options="options"
        :emitPath="false"
        checkStrictly
        style="max-width: 1200px; overflow-x: auto"
        @change="onSelectChange"
      >
        <template
          slot-scope="{ node, data }"
          v-if="cascaderProps.checkStrictly !== false"
        >
          <span :title="node.label" @click.stop="clickNode(node, data)">
            {{ node.label }}
          </span>
        </template>
      </el-cascader-panel>
    </el-popover>
  </div>
</template>

<script>
import { getFkOptions, onSelect } from "@/service/api";

export default {
  name: "FkTreePicker",
  props: {
    app: {
      type: String,
      default: "",
    },
    column: {
      type: Object,
      default: () => ({}),
    },
    row: {
      type: Object,
      default: () => ({}),
    },
    srvInfo: {
      type: Object,
      default: () => ({}),
    },
    value: {
      type: [Number, String],
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      allOptions: [],
      options: [],
      innerValue: "",
      loading: false,
      popperOptions: null,
      cascaderProps: {
        emitPath: false,
        checkStrictly: true,
        value: "value",
        label: "label",
        lazy: true,
        leaf: "leaf",
        lazyLoad: (node, resolve) => {
          this.loadTree(node).then((res) => {
            resolve(res);
          });
        },
      },
    };
  },
  computed: {
    srvApp() {
      return this.srvInfo?.srv_app || this.app;
    },
    currentModel() {
      if (!this.innerValue) {
        return null;
      }
      return this.allOptions.find((item) => item.value === this.innerValue);
    },
    modelLabel() {
      return this.currentModel?.label;
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        this.innerValue = value || "";
      },
    },
  },
  mounted() {
    this.popperOptions = {
      boundariesElement: document.querySelector("body"),
      gpuAcceleration: true,
      positionFixed: true,
      preventOverflow: true,
    };
  },
  methods: {
    formatOption(item = {}) {
      return {
        ...item,
        label: item[this.srvInfo.key_disp_col],
        value: item[this.srvInfo.refed_col],
        leaf: item.is_leaf === "是",
      };
    },
    findOptionByValue(value) {
      return this.allOptions.find(
        (item) =>
          item[this.srvInfo.refed_col] === value ||
          item.value === value ||
          String(item[this.srvInfo.refed_col]) === String(value) ||
          String(item.value) === String(value)
      );
    },
    selectOption(option) {
      if (!option) {
        return;
      }
      this.innerValue = option.label || option.value || "";
      this.$emit("select", option);
      this.$emit("input", this.innerValue);
      this.$nextTick(() => {
        this.$refs.treePopover?.doClose?.();
      });
    },
    clickNode(node, data) {
      if (this.cascaderProps.checkStrictly === false && data.is_leaf !== "是") {
        return;
      }
      this.selectOption(this.findOptionByValue(node.value));
    },
    onFilterInput(value) {
      this.innerValue = value;
      this.remoteMethod(value);
    },
    onFilterClear() {
      this.innerValue = "";
      this.$emit("input", "");
      this.$emit("select", null);
      this.remoteMethod();
    },
    onPopoverShow() {
      this.innerValue = this.value || "";
      this.remoteMethod(this.innerValue);
    },
    async loadTree(node) {
      if (!node?.value) {
        return [];
      }
      const condition = [
        {
          colName: this.srvInfo.parent_col,
          ruleType: "eq",
          value: node.value,
        },
      ];
      const res = await onSelect(
        this.srvInfo.serviceName,
        this.srvApp,
        condition,
        {
          rownumber: 100,
          pageNo: 1,
        }
      );
      if (!res?.data) {
        return [];
      }
      const result = res.data.map((item) => this.formatOption(item));
      this.allOptions.push(...result);
      return result;
    },
    remoteMethod(query) {
      const queryString = typeof query === "string" ? query : this.innerValue;
      if (!this.options?.length) {
        this.loading = true;
        setTimeout(() => {
          this.loading = false;
        }, 5000);
      }
      const option = JSON.parse(JSON.stringify(this.srvInfo || {}));
      const relationCondition = {
        relation: "OR",
        data: [],
      };
      if (!option.key_disp_col && !option.refed_col) {
        return Promise.resolve([]);
      }
      if (option.key_disp_col && queryString) {
        relationCondition.data.push({
          colName: option.key_disp_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      if (option.refed_col && queryString) {
        relationCondition.data.push({
          colName: option.refed_col,
          value: queryString,
          ruleType: "[like]",
        });
      }
      option.relation_condition = relationCondition;

      return getFkOptions(
        { ...this.column, option_list_v2: option },
        this.row,
        this.app
      ).then((res) => {
        if (res?.data?.length) {
          this.options = res.data.map((item) => this.formatOption(item));
          this.allOptions.push(...this.options);
        } else {
          this.options = [];
        }
        this.loading = false;
        return this.options;
      });
    },
    onSelectChange(value) {
      const selectedValue = Array.isArray(value) && value.length ? value[0] : value;
      this.selectOption(this.findOptionByValue(selectedValue));
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-tree-picker {
  width: 100%;
}
</style>
