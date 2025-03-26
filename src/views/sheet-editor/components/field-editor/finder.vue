<template>
  <!-- <el-select
    v-model="inputVal"
    ref="inputRef"
    filterable
    remote
    :placeholder="placeholder"
    :remote-method="querySearch"
    :loading="loading"
    @focus="onFocus"
    @blur="$emit('blur')"
    @change="handleSelect"
    v-if="isFk"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
    </el-option>
  </el-select> -->
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
    @clear="handleClear"
    @change="handleChange"
  >
  </el-autocomplete>
</template>

<script>
import { cloneDeep } from 'lodash-es';
import { isFk } from "@/utils/sheetUtils";

export default {
  name: "Finder",
  props: {
    app: {
      type: String,
      default: ""
    },
    fieldInfo: {
      type: Object,
      default: () => {
        return {};
      }
    },
    operateType: {
      type: String,
      default: "add"
    },
    value: {
      type: String,
      default: ""
    },
    row: {
      type: Object,
      default: () => {
        return {};
      }
    },
  },
  watch: {
    value: {
      immediate: true,
      handler(newValue, oldValue) {
        // if ([null, undefined, ''].includes(newValue) && [null, undefined, ''].includes(oldValue)) {
        //   return
        // }
        if (newValue !== oldValue) {
          this.inputVal = newValue;
        }else if(newValue!==this.inputVal){
          this.inputVal = newValue;
        }
      }
    }
  },
  data() {
    return {
      inputVal: "",
      selected: null,
      oldValue: null,
      focus: false,
      options: [],
      loading: false
    }
  },
  beforeDestroy() {
    this.options = [];
    this.inputVal = ''
  },
  computed: {
    placeholder() {
      return this.fieldInfo?.placeholder || `请输入关键词`
    },
    isFk() {
      return isFk(this.fieldInfo);
    },
    modelValue() {
      let value = this.value;
      return value;
    },
    optionListV3() {
      if (isFk(this.fieldInfo)) {
        return this.fieldInfo?.option_list_v3
      }
      return this.fieldInfo?.[`_${this.operateType}_option_list`]
    },
    optionListFinal() {
      let result = null
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
    optionsReq() {
      let optionsV2 = this.optionListFinal;
      let refedCol = optionsV2?.refed_col || optionsV2?.key_disp_col;
      let req = {
        serviceName: optionsV2.serviceName,
        srvApp: optionsV2.srv_app || null,
        colNames: ["*"],
        condition: [

        ],
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
              value: this.inputVal || '',
            },
            {
              colName: refedCol,
              ruleType: "[like]",
              value: this.inputVal || '',
            },
          ]
        }
      } else {
        req.condition.push(
          {
            colName: refedCol,
            ruleType: "[like]",
            value: this.inputVal,
          },
        )
      }

      if (optionsV2?.conditions?.length) {
        const formModel = this.row
        optionsV2.conditions.forEach((item) => {
          const obj = {
            colName: item.colName,
            ruleType: item.ruleType,
          };
          if (item.value?.indexOf("data.") === 0) {
            obj.value = formModel[item.value.replace("data.", "")];
          } else if (item.value && item.value.startsWith("'") && item.value.endsWith("'")) {
            obj.value = item.value.replace(/'/g, "");
          } else {
            obj.ruleType = "like";
            obj.value = item.value
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
    triggerAutocomplete(val) {
      // this.$refs.autocomplete.activated = true
      // this.searchKey = val
      // this.$refs.autocomplete.getData(val)
      this.querySearch(val).then((res) => {
        this.$parent.$parent.clearCellSelection()
        if (res?.length > 1) {
          // 模糊匹配结果数量大于1
          // let matchedVal = res.find(
          //   (item) => item.value === val
          // );
          // if (matchedVal) {
          //   this.$emit("change", cloneDeep(matchedVal));
          // }
          this.inputVal = val
          this.$nextTick(() => {
            this.$refs.inputRef.activated = true
            this.$refs?.inputRef?.focus();
          })
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
      this.$emit('focus')
      this.$parent.$parent.$refs.tableRef.clearCellSelectionCurrentCell()
      if (this.isFk) {
        this.querySearch('')
      }
    },

    getDependField() {
      let dependField; //fk字段
      if (this.field.form.fields && Array.isArray(this.field.form.fields)) {
        for (let f of this.field.form.fields) {
          if (f.info.name == this.field.info.redundant.dependField) {
            dependField = f;
          }
        }
      } else {
        dependField =
          this.field.form.fields[this.field.info.redundant.dependField];
      }
      return dependField;
    },
    handleClear() {
      // 清空autocomplete字段时候，是否清空fk字段的值的逻辑
      const dependField = this.getDependField();
      const redundant = this.field.info?.redundant;
      if (redundant?.trigger) {
        if (redundant?.trigger === "isnull") {
          // 为空的时候才进行冗余 配置了isnull的字段清空时不改变fk字段的值
          return;
        }
      }
      const refedCol = redundant?.refedCol;
      const refedColVal = dependField.model[refedCol];
      if (refedCol && refedColVal) {
        this.$nextTick(() => {
          if (this.oldValue && this.oldValue === refedColVal) {
            // 当前字段的值跟fk字段中冗余到当前字段的值一致时，才清空fk字段的值
            dependField.model = null;
            dependField.finderSelected = null;
            this.$set(dependField, "model", null);
            this.$emit("change", dependField);
          }
        });
      }
    },
    handleChange(val){
      console.log(val);
    },
    handleSelect(val) {
      console.log(val);
      this.selected = val;
      if (this.isFk) {
        const option = this.options.find((item) => {
          return item.value === val;
        });
        this.$emit("change", option);
      } else {
        this.$emit("change", val);
      }
    },
    querySearch(queryString = "", cb) {
      this.loading = false
      let req = cloneDeep(this.optionsReq);
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
      return this.$http.post(url, req).then(((response) => {
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
        this.loading = false
        // 调用 callback 返回建议列表的数据
        cb?.(results);
        return results
      }))
    },
  },
}
</script>

<style lang="scss" scoped>
.fk-autocomplete {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}


.icon {
  // position: absolute;
  // right: 0;
  // transform: translateX(100%);
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