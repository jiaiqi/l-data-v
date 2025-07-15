<template>
  <table-picker
    v-bind="$props"
    :srvApp="app"
    :formModel="row"
    :field="field"
    :selectedGridData="multiSelected"
    :finder-selected="value"
    :defaultValues="defaultValues"
    :mainformDatas="mainformDatas"
    :disabled="false"
    @on-selected="onPickerSelected"
    v-if="field && ['fks', 'fkjson', 'fkjsons'].includes(colType)"
  ></table-picker>
  <fk-autocomplete
    :app="app"
    :field="field"
    :row="row"
    :column="column"
    :value="row[column.columns]"
    :defaultConditionsMap="{}"
    :detailButton="detailButton"
    @select="onPickerSelected"
    @input="onInput"
    v-else-if="isFkAutoComplete"
  >
  </fk-autocomplete>
  <fk-selector
    :app="app"
    :field="field"
    :row="row"
    :column="column"
    :fieldInfo="column"
    :srvInfo="column._update_option_list_v2 || column._add_option_list_v2"
    v-model="row[column.columns]"
    @select="onFkSelect"
    @multi-tab-option-select-change="onMultiTabOptionSelectChange"
    v-else-if="isFk"
  >
  </fk-selector>
  <el-autocomplete
    class="inline-input"
    ref="inputRef"
    v-model="inputVal"
    clearable
    :trigger-on-focus="true"
    :fetch-suggestions="querySearch"
    :placeholder="placeholder"
    value-key="label"
    :clearable="false"
    @focus="onFocus"
    @blur="$emit('blur')"
    @select="handleSelect"
    v-else-if="['autocomplete', 'fk'].includes(editorType)"
  >
    <template slot-scope="{ item }">
      <el-tooltip placement="right">
        <div>{{ item.label }}</div>
        <div slot="content">{{ item.label }}</div>
      </el-tooltip>
    </template>
  </el-autocomplete>
</template>

<script>
import { cloneDeep } from "lodash-es";
import { isFk, isFkAutoComplete, getFieldType } from "@/utils/sheetUtils.js";
import { FieldInfo } from "@/common/model/FieldInfo.js";
import { Field } from "@/common/model/Field.js";
import TablePicker from "./table-picker.vue";
import fkAutocomplete from "../fk-autocomplete.vue";
import fkSelector from "../fk-selector.vue";
export default {
  name: "Finder",
  components: {
    TablePicker,
    fkAutocomplete,
    fkSelector,
  },
  props: {
    app: {
      type: String,
      default: "",
    },
    column: {
      type: Object,
      default: () => {
        return {};
      },
    },
    operateType: {
      type: String,
      default: "add",
    },
    value: {
      type: String,
      default: "",
    },
    row: {
      type: Object,
      default: () => {
        return {};
      },
    },
    defaultValues: {
      type: Object,
      default: () => {
        return {};
      },
    },
    mainformDatas: {
      type: Object,
      default: () => {
        return {};
      },
    },
    detailButton: {
      type: Object,
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.inputVal = newValue;
        } else if (newValue !== this.inputVal) {
          this.inputVal = newValue;
        }
        // if (!oldValue && newValue) {
        //   if (this.isFk) {
        //     this.getMatchedValue(newValue).then((data) => {
        //       if (data?.value) {
        //         this.onFkSelect(data);
        //       }
        //     });
        //   }
        // }
      },
    },
    column: {
      immediate: true,
      deep: true,
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.initField();
          if (["fks", "fkjson", "fkjsons"].includes(this.editorType)) {
            // this.onFocus()
          }
        }
      },
    },
  },
  data() {
    return {
      field: null,
      inputVal: "",
      oldValue: null,
      focus: false,
      options: [],
      loading: false,
      selected: "",
      multiSelected: [],
    };
  },
  beforeDestroy() {
    this.options = [];
    this.inputVal = "";
  },
  computed: {
    isFk() {
      return isFk(this.column);
    },
    isFkAutoComplete() {
      return isFkAutoComplete(this.column);
    },
    placeholder() {
      return this.column?.placeholder || `请输入关键词`;
    },
    colType() {
      return this.column?.col_type;
    },
    editorType() {
      if (isFkAutoComplete(this.column)) {
        return "autocomplete";
      } else if (isFk(this.column)) {
        return "fk";
      }
      return getFieldType(this.column);
    },
    isFk() {
      return isFk(this.column);
    },
    modelValue() {
      let value = this.value;
      return value;
    },
    optionListV3() {
      if (isFk(this.column)) {
        return this.column?.option_list_v3;
      } else if (this.editorType === "autocomplete")
        return this.column?.[`_${this.operateType}_option_list`];
    },
    optionListFinal() {
      let result = null;
      if (Array.isArray(this.optionListV3) && this.optionListV3.length) {
        const option_list_v3 = this.optionListV3;
        const data = this.row || {};
        result = option_list_v3.find(
          (item) =>
            !item.conds?.length ||
            item.conds?.every(
              (cond) =>
                data?.[cond.case_col] &&
                cond.case_val?.includes?.(data?.[cond.case_col])
            )
        );
      }
      return result;
    },
    setOptionsReq() {
      let optionsV2 = this.optionListFinal;
      let refedCol = optionsV2?.refed_col || optionsV2?.key_disp_col;
      let req = {
        serviceName: optionsV2.serviceName,
        srvApp: optionsV2.srv_app || null,
        colNames: ["*"],
        condition: [],
        page: {
          pageNo: 1,
          rownumber: 50,
        },
        relation_condition: {},
      };
      if (optionsV2?.key_disp_col) {
        req.relation_condition = {
          relation: "OR",
          data: [
            {
              colName: optionsV2.key_disp_col,
              ruleType: "[like]",
              value: this.inputVal || "",
            },
            {
              colName: refedCol,
              ruleType: "[like]",
              value: this.inputVal || "",
            },
          ],
        };
      } else {
        req.condition.push({
          colName: refedCol,
          ruleType: "[like]",
          value: this.inputVal,
        });
      }
      const conditions = optionsV2?.conditions || optionsV2?.condition || [];
      if (conditions?.length) {
        const formModel = this.row;
        conditions.forEach((item) => {
          const obj = {
            colName: item.colName,
            ruleType: item.ruleType,
          };
          if (item.value?.indexOf("data.") === 0) {
            obj.value = formModel[item.value.replace("data.", "")];
          } else if (
            item.value &&
            item.value.startsWith("'") &&
            item.value.endsWith("'")
          ) {
            obj.value = item.value.replace(/'/g, "");
          } else {
            obj.ruleType = "like";
            obj.value = item.value;
          }
          if (obj.value) {
            req.condition.push(obj);
          }
        });
      }
      return req;
    },
  },

  methods: {
    async getMatchedValue(queryString) {
      if (this.optionListFinal?.serviceName) {
        const valueCol = this.optionListFinal.refed_col;
        const labelCol = this.optionListFinal.key_disp_col;
        let req = cloneDeep(this.setOptionsReq);
        req["relation_condition"] = {
          relation: "OR",
          data: [
            {
              colName: labelCol,
              ruleType: "eq",
              value: queryString,
            },
            {
              colName: valueCol,
              ruleType: "eq",
              value: queryString,
            },
          ],
        };
        const url = `/${this.app}/select/${req.serviceName}`;
        const response = await this.$http.post(url, req);
        if (response && response.data && response.data.data?.length) {
          const data = response.data.data[0];
          data.label = data[labelCol];
          data.value = data[valueCol];
          return data;
        }
      }
    },
    onMultiTabOptionSelectChange(item, cfg) {
      this.$emit("multi-tab-option-select-change", item, cfg);
    },
    onInput(val) {
      this.inputVal = val;
      this.$emit("input", val);
    },
    onFkSelect(selected = null) {
      this.field.model = selected?.value || null;
      this.selected = selected || null;
      this.$emit("change", selected);
    },
    onPickerSelected(selected) {
      this.field.model = selected;
      this.selected = selected;
      this.$emit("change", selected);
    },
    initField() {
      let filter = (srvCol) => srvCol[`in_${this.operateType}`] != 0;
      let srvCol = this.column;
      let fi = new FieldInfo(srvCol, this.formType);
      let f = new Field(fi, this);
      f.vif = !(filter && !filter(srvCol));
      if (fi.editor == "multiselect") {
        f.model = [];
      }
      this.field = f;
    },
    triggerAutocomplete(val) {
      this.querySearch(val).then((res) => {
        this.$parent.$parent.clearCellSelection();
        if (res?.length > 1) {
          // 模糊匹配结果数量大于1 显示下拉框
          // this.$nextTick(() => {
          //   this.$refs.inputRef.activated = true
          //   this.$refs?.inputRef?.focus();
          // })
          let key = isFk(this.column) ? "value" : "label";
          let option = res.find((item) => item[key] && item[key] === val);
          if (option) {
            this.inputVal = val;
            this.$emit("change", cloneDeep(res[0]));
          }
        } else if (res?.length) {
          // 模糊匹配结果数量为1 直接选中
          this.$emit("change", cloneDeep(res[0]));
          if (this.$refs?.inputRef?.activated) {
            this.$refs.inputRef.activated = false;
          }
        }
      });
    },
    onFocus() {
      this.$emit("focus");
      this.$parent.$parent.$parent.clearCellSelection();
      if (this.isFk) {
        this.querySearch("");
      }
    },
    handleSelect(val) {
      // if (this.isFk) {
      //   const option = this.options.find((item) => {
      //     return item.value === val;
      //   });
      //   this.$emit("change", option);
      // } else {
      this.$emit("change", val);
      // }
    },
    querySearch(queryString = "", cb) {
      let req = cloneDeep(this.setOptionsReq);
      if (req["relation_condition"]) {
        req.relation_condition.data[0].value = queryString ?? "";
        req.relation_condition.data[1].value = queryString ?? "";
      } else if (req["condition"]) {
        req["condition"][0].value = queryString ?? "";
      }
      const valColumn = this.optionListFinal.refed_col;
      const labelCol = this.optionListFinal.key_disp_col;
      let results = [];
      const url = `/${this.app}/select/${req.serviceName}`;
      return this.$http.post(url, req).then((response) => {
        if (response && response.data && response.data.data) {
          let options = response.data.data;
          results = options.map((item) => {
            let result = {
              option: item,
              value: item[valColumn],
              label: item[labelCol],
            };
            return result;
          });
        }
        this.options = results;
        // 调用 callback 返回建议列表的数据
        cb?.(results);
        return results;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.fk-autocomplete {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}

.input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  min-width: 0;
  background: transparent;
}
</style>
