<template>
  <el-autocomplete
    class="inline-input"
    v-model="inputVal"
    clearable
    :trigger-on-focus="true"
    :fetch-suggestions="querySearch"
    placeholder="请输入内容"
    value-key="label"
    suffix-icon="el-icon-edit"
    :clearable="false"
    @focus="onFocus"
    @select="handleSelect"
    @clear="handleClear"
  >
  </el-autocomplete>
  <!-- <div class="fk-autocomplete">
    <input
      v-model="inputVal"
      class="input"
    ></input>
    <i class="el-icon-edit icon"></i>
  </div> -->
</template>

<script>
import { cloneDeep } from 'lodash-es';


export default {
  name: "FkAutocomplete",
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
        if (newValue !== oldValue) {
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
    }
  },

  computed: {
    isFkAutoComplete() {
      return this.fieldInfo?.col_type === 'String' && this.optionListFinal && !this.fieldInfo?.option_list_v2
    },
    modelValue() {
      let value = this.value;
      return value;
    },
    optionsV2List() {
      let optionsV2 = this.fieldInfo;
      return optionsV2;
    },
    optionListV3() {
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
              value: this.inputVal,
            },
            {
              colName: refedCol,
              ruleType: "[like]",
              value: this.inputVal,
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
    onFocus() {
      this.$parent.$parent.$refs.tableRef.clearCellSelectionCurrentCell()
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
    handleSelect(item) {
      console.log(item);
      this.selected = item;
      this.$emit("change", item);
      return
      if (this.field.stringAutocompleteInput) {
        return;
      }
      let dependField = this.getDependField();
      // let dependField; //fk字段
      // if (this.field.form.fields && Array.isArray(this.field.form.fields)) {
      //   for (let f of this.field.form.fields) {
      //     if (f.info.name == this.field.info.redundant.dependField) {
      //       dependField = f;
      //     }
      //   }
      // } else {
      //   dependField =
      //     this.field.form.fields[this.field.info.redundant.dependField];
      // }

      let dependType = dependField?.info?.editor;
      switch (dependType) {
        case "finder":
        case "tree-finder":
          if (item) {
            dependField.model = item.option;
            dependField.finderSelected = item.value;
            this.$set(dependField, "model", item.option);
            this.$emit("change", dependField);
          } else {
            dependField.model = null;
            dependField.finderSelected = null;
            this.$set(dependField, "model", null);
            this.$emit("change", dependField);
          }
          break;

        default:
          break;
      }
    },
    querySearch(queryString, cb) {
      let req = cloneDeep(this.optionsReq);
      if (req["relation_condition"]) {
        req.relation_condition.data[0].value = queryString;
        req.relation_condition.data[1].value = queryString;
      } else if (req["condition"]) {
        req["condition"][0].value = queryString;
      }
      const valColumn = this.optionListFinal.refed_col;
      const labelCol = this.optionListFinal.key_disp_col;
      let results = [];
      const url = `/${this.app}/select/${req.serviceName}`;
      this.$http.post(url, req).then(((response) => {
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
        // 调用 callback 返回建议列表的数据
        cb(results);
      }));
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