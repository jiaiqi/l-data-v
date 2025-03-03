<template>
  <el-dialog
    title="提示"
    :visible.sync="show"
    width="50%"
    :before-close="handleClose"
  >
    <!-- <add
      name="add-popup"
      ref="add-form"
      :service="addService"
      :$srvApp="addApp"
      :navAfterSubmit="false"
      :submit2Db="submit2Db"
      :defaultCondition="evalOptionConditions"
      :defaultValues="submit2Db ? setPopupDefaultValue : null"
      @submitted2mem="submitted2mem"
      @executor-complete="onExecutorComplete"
      @form-loaded="onPopupFormLoaded"
      v-if="formType == 'add'"
    >
    </add>
    <update
      name="add-popup"
      ref="update-form"
      :pk="field.getSrvVal()"
      :pkCol="optionCfg.refed_col"
      :service="updateService"
      :$srvApp="updateApp"
      :navAfterSubmit="false"
      :submit2Db="true"
      :defaultConditions="[
        {
          colName: optionCfg.refed_col,
          ruleType: 'eq',
          value: field.getSrvVal(),
        },
      ]"
      :defaultCondition="evalOptionConditions"
      :defaultValues="field.model || setPopupDefaultValue"
      @submitted2mem="submitted2mem"
      @executor-complete="onExecutorComplete"
      @form-loaded="onPopupFormLoaded"
      v-if="formType == 'update'"
    /> -->
    <!--<iframe :src="iframeSrc" frameborder="0" v-if="show"></iframe>-->
  </el-dialog>
</template>

<script>
import Add from "./add.vue";
import isBoolean from "lodash/isBoolean";
import isUndefined from "lodash/isUndefined";
import isString from "lodash/isString";
import isFunction from "lodash/isFunction";
import isEmpty from "lodash/isEmpty";
import { webBaseUrl } from "@/common/http";
export default {
  props: {},
  components: {
    Add,
    // BxForm
  },
  data() {
    return {
      show: false,
      defaultConditions: [],
      row: {},
      field: {},
      defaultValues: {},
      optionCfg: {},
    };
  },
  computed: {
    service() {
      return this.formType === "add" ? this.addService : this.updateService;
    },
    iframeSrc() {
      return `/vpages/#/frameForm?formType=${this.formType}&optionCfg=${encodeURIComponent(JSON.stringify(this.optionCfg))}&fkCol=${this.optionCfg.refed_col}&fkVal=${this.row[this.field?.columns]}`;
    },
    formType() {
      return this.row?.[this.field?.columns] ? "update" : "add";
    },
    submit2Db() {
      if (
        this.optionCfg?.allow_input === "自行输入" &&
        this.formType === "add"
      ) {
        return false;
      } else {
        return true;
      }
    },
    addSrvCfg() {
      return this.optionCfg?.add_srv_cfg;
    },
    addService() {
      return this.optionCfg?.add_srv_cfg?.srv;
    },
    addApp() {
      return (
        this.addSrvCfg?.app || this.optionCfg?.srv_app || this.appNo || null
      );
    },
    updateSrvCfg() {
      return this.optionCfg?.update_srv_cfg;
    },
    updateService() {
      return (
        this.optionCfg?.update_srv_cfg?.srv ||
        this.optionCfg?.serviceName?.replace("_select", "_update")
      );
    },
    updateApp() {
      return (
        this.updateSrvCfg?.app || this.optionCfg?.srv_app || this.appNo || null
      );
    },
    evalOptionConditions() {
      const conditions = this.buildConditions(this.optionCfg?.conditions);
      return conditions;
    },
    setPopupDefaultValue() {
      if (
        Array.isArray(this.evalOptionConditions) &&
        this.evalOptionConditions.length
      ) {
        return this.evalOptionConditions.reduce((res, cur) => {
          res[cur.colName] = cur.value;
          return res;
        }, {});
      }
    },
  },
  methods: {
    submitted2mem(event) {
      console.log("submitted2mem:", event);
      if (
        typeof event === "object" &&
        Object.keys(event).length &&
        Object.keys(event).some((key) => event[key] && true)
      ) {
        // 值是一个对象且对象中含有有值的key
        const result = Object.keys(event).reduce((res, key) => {
          if (
            event[key] !== undefined &&
            event[key] !== null &&
            event[key] !== ""
          ) {
            res[key] = event[key];
          }
          return res;
        }, {});
        this.field.model = result;
      } else {
        this.field.model = null;
      }
    },
    onExecutorComplete(event) {
      console.log("onExecutorComplete:", event);
      const data = event.data?.response[0]?.response?.effect_data?.[0];
      if (data) {
        this.handleSelect(data);
      }
    },
    onPopupFormLoaded: function (form) {
      if (form?.actions?.submit) {
        // 去掉提交后跳转事件
        form.actions.submit.nav2Location = null;
      }
    },
    handleSelect(item) {},
    doShow({ optionCfg, row, defaultValues, field }) {
      this.field = { ...field, getSrvVal: () => row[field.columns] };
      this.optionCfg = optionCfg;
      this.row = row;
      this.defaultValues = defaultValues;
      this.show = true;
    },
    doHide() {
      this.show = false;
      this.row = {};
      this.field = {};
      this.optionCfg = {};
      this.defaultValues = {};
    },
    handleClose() {
      this.doHide();
    },
    onActionComplete(event) {
      console.log("onActionComplete:", event);
    },
    buildConditions(conditions = []) {
      if (!Array.isArray(conditions)) {
        return [];
      }
      let ret = [];
      const rowData = this.row;
      const mainData = {};
      for (let cond of conditions) {
        let condition = {};
        try {
          condition.colName = cond.colName;
          condition.ruleType = cond.ruleType;
          if (cond.disableExpr && eval(cond.disableExpr)) {
            continue;
          }
          let valueExpr = cond.valueExpr || cond.value;
          if (valueExpr?.value_type && valueExpr?.value_key) {
            if (valueExpr?.value_type === "rowData") {
              condition.value = rowData[valueExpr.value_key];
            } else if (valueExpr?.value_type === "mainData") {
              condition.value = mainData[valueExpr.value_key];
            } else if (
              valueExpr?.value_type === "constant" &&
              valueExpr.value
            ) {
              condition.value = valueExpr.value;
            }
          } else if (valueExpr) {
            // literal value or js expr
            if (cond.literalValue) {
              condition.value = valueExpr;
            } else {
              condition.value = this.evalExprOrFunc(
                valueExpr,
                row,
                null,
                mainData
              );
            }
          } else if (cond.valueFunc) {
            condition.value = cond.valueFunc();
          }
        } catch (e) {
          console.log("buildConditions error:", e);
        }
        if (condition.ruleType === "isnull") {
          /**
           * 增加支持 ruleType === isnull
           */
          ret.push(condition);
        } else {
          if (condition.value != null && condition.value != "") {
            if (Array.isArray(condition.value)) {
              if (condition.value.length == 0) {
                continue;
              }
            }
            ret.push(condition);
          } else {
            condition.value = "";
            ret.push(condition);
          }
        }
      }
      return ret;
    },
    evalExprOrFunc(value, data, defaultValue, mainData = {}) {
      try {
        if (isString(value)) {
          let vm = this;
          return eval(value);
        } else if (isFunction(value)) {
          return value(data, mainData);
        } else {
        }
      } catch (e) {
        if (isUndefined(defaultValue)) {
          throw e;
        } else {
          return defaultValue;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
