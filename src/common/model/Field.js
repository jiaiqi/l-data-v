import * as DataUtil from "@/utils/DataUtil.js";
import { formatMoney } from "@/utils/DataUtil.js";
import isFunction from "lodash/isFunction";
import isBoolean from "lodash/isBoolean";
import isString from "lodash/isString";
import isObject from "lodash/isObject";
import isUndefined from "lodash/isUndefined";
import isNull from "lodash/isNull";
import _isEmpty from "lodash/isEmpty";
import split from "lodash/split";
import join from "lodash/join";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

export const hotTableMetadata = {
  User: {
    srvApp: "sso",
    selectService: "srvsso_user_select",
    table: "bxsso_user",
    valueCol: "user_no",
    dispCol: "user_disp",
  },

  Dept: {
    srvApp: "auth",
    selectService: "srvauth_dept_select",
    table: "bxsys_dept",
    valueCol: "dept_no",
    dispCol: "dept_name",
  },
};

export function getHotTableName(type) {
  return hotTableMetadata[type] && hotTableMetadata[type].table;
}

let guid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
};

export class Field {
  constructor(fieldInfo, form) {
    this.guid = guid();
    this.info = fieldInfo;
    this.model = null;
    this.modelOld = null;
    this.vif = true;
    this.moreInfo = null;

    if (fieldInfo.moreConfig?.fileType) {
      this.fileType = fieldInfo.moreConfig?.fileType;
    }

    if (fieldInfo.moreConfig?.fileDesc) {
      this.fileDesc = fieldInfo.moreConfig?.fileDesc;
    }

    if (fieldInfo.moreConfig?.fileSize) {
      this.fileSize = fieldInfo.moreConfig?.fileSize;
    }

    if (this.info.editor == "multiselect") {
      // multiselect need default value as []
      this.model = this.model || [];
    }

    if (this.info.editor == "finder") {
      this.finderSelected = "";
    }

    this.options =
      (this.info.srvCol &&
        this.info.srvCol.option_list_v2 &&
        this.info.srvCol.option_list_v2.options) ||
      [];
    this.optionsFunc = (_) => {
      return this.options;
    };

    // vm instance of field-editor
    this.editor = null;
    this.form = form;

    // cache value for upstream fmoreConfigield.model
    // if field has upstream field, add it as an condition

    if (this.info.upstream) {
      let field = this;
      let upstreamCondition = {
        colName: this.info.upstream.refCol,
        ruleType: "eq",
        valueFunc: (_) => {
          return field.form.fields[field.info.upstream.field].getSrvVal();
        },
      };

      if (this.info.dispLoader) {
        this.info.dispLoader.conditions = this.info.dispLoader.conditions || [];
        this.info.dispLoader.conditions.push(upstreamCondition);
        this.info._upstreamCondition = cloneDeep(upstreamCondition);
      }
    }

    // true 代表无权限查看的敏感数据
    this.noPerm4Sensi = false;

    // validate error msg map, key is rule name, value is err msg
    this.errMsg = {};
    // validate error prompt map, key is rule name, value is prompt msg
    this.promptMsg = {};
    // array item is object, keys: value, remark
    this.historyData = [];

    this.autocompleteInput = false;
    if (this.info.editor == null && this.info.redundant) {
      let dependField = this.info.redundant.dependField;
      let field = this;
      this.autocompleteInput = true;

      this.autocompleteFunc = (_) => {
        let dependField = field.form.fields[this.info.redundant.dependField];
        if (Array.isArray(field.form.fields)) {
          for (let f of field.form.fields) {
            if (f.info.name == this.info.redundant.dependField) {
              dependField = f;
            }
          }
        }
        if (dependField) {
          let result = dependField?.info?.srvCol?.option_list_v2;
          const option_list_v3 = dependField?.info?.srvCol?.optionListV3;
          if (option_list_v3?.length) {
            const formModel = this.field.form.srvValFormModel();
            result = option_list_v3.find((item) => {
              if (item.conds?.length) {
                // 条件外键
                return item.conds.every((cond) =>
                  cond.case_val?.includes?.(formModel[cond.case_col])
                );
              } else {
                return true;
              }
            });
          }
          return result;
          // return (
          //   (dependField.info.srvCol &&
          //     dependField.info.srvCol.option_list_v2) ||
          //   []
          // );
        } else {
          return [];
        }
      };
      this.isAutocomplete = () => {
        //*如果引用的字段是fk字段的显示字段 则自动使用autocomplete特性,并且隐藏掉fk字段
        //?目前先默认不隐藏fk字段，sessionStorage中hide_fk_field为true时再隐藏，后续没啥问题了放开这个限制
        let optionsV2 = this.autocompleteFunc();
        let redundant = this.info.redundant;
        if (
          optionsV2?.key_disp_col &&
          optionsV2?.key_disp_col === redundant?.refedCol
        ) {
          // 引用的字段是fk字段的显示字段
          if (sessionStorage.getItem("hide_fk_field") === "true") {
            let dependField =
              field.form.fields[this.info.redundant.dependField];
            const addSrvCfg = optionsV2?.add_srv_cfg;
            function hasPermission() {
              // 有新增的权限
              return addSrvCfg?.permission && addSrvCfg.srv && true;
            }
            function allowEditAndSelect() {
              // 编辑选择
              return hasPermission() && optionsV2.allow_input === "编辑选择";
            }
            function onlyEdit() {
              // 自行输入
              return hasPermission() && optionsV2.allow_input === "自行输入";
            }
            if (!allowEditAndSelect() && !onlyEdit()) {
              // 编辑选择跟自行输入的 不隐藏fk字段
              dependField.info.visible = false;
            }
          }
          return true;
        }
        return false;
      };
      // let dependFieldOptionsListV2 = field.form.fields
    } else if (
      this.info.srvCol?.subtype==='autocomplete' &&
      this.info?.srvCol?.option_list_v2?.serviceName
    ) {
      // 普通字符串 autocomplete特性 既可以输入也可以选择
      this.stringAutocompleteInput = true;
      let field = this;
      this.isAutocomplete = () => false;
      this.autocompleteFunc = (_) => {
        let result = field?.info?.srvCol?.option_list_v2;
        const option_list_v3 = field?.info?.srvCol?.optionListV3;
        if (option_list_v3?.length) {
          const formModel = field.form.srvValFormModel();
          result = option_list_v3.find((item) => {
            if (item.conds?.length) {
              // 条件外键
              return item.conds.every((cond) =>
                cond.case_val?.includes?.(formModel[cond.case_col])
              );
            } else {
              return true;
            }
          });
        }
        return result;
      };
    }
    this.fieldActionOptionsJson = null;
    if (this.info.srvCol.col_cfg_json) {
      try {
        this.fieldActionOptionsJson = JSON.parse(this.info.srvCol.col_cfg_json);
      } catch (error) {
        console.error(
          `字段${this.info.label}col_cfg_json配置错误,无效的json字符串`
        );
      }
    }
  }
  getSrvVal() {
    // 获取字段值
    if (this.info.type == "Note" && this.editor) {
      return this.editor.getSrvVal();
    } else if (this.info.type == "Boolean") {
      return !!this.model ? 1 : 0;
    } else if (this.info.editor == "userlist" && this.editor) {
      return this.editor.getSrvVal();
    }
    let ret = this.model;
    if (ret == null || ret == undefined) {
      return null;
    }

    if (this.info.isTemporal() && ret !== "******") {
      let temporalType = this.info.subtype || this.info.type.toLowerCase();
      if (Array.isArray(ret)) {
        for (let key in ret) {
          ret[key] = DataUtil.formatDate(
            ret[key],
            temporalType,
            this.info.format
          );
        }
      } else {
        ret = DataUtil.formatDate(ret, temporalType, this.info.format);
      }
    } else if (this.info.isFinder()) {
      // 自行输入且为add表单时，直接提交对象
      // if(this.info.allowInput==='自行输入'){
      if (
        this.info.allowInput === "自行输入" &&
        this.info?.srvCol?.service_name?.includes("add")
      ) {
        ret = typeof ret === "object" ? ret : null;
      } else if (typeof ret === "object") {
        ret = ret[this.info.valueCol];
      }
    } else if (this.info.editor == "multiselect") {
      // both filter  ruletype == in, and sql set:   "a,b,c"
      if (ret && ret.length && ret.join) {
        ret = ret.join(",");
      } else {
        ret = null;
      }
    }
    // console.log("获取到的字段值",ret,this.info.format)
    return ret;
  }

  setSrvVal(srvVal) {
    if (srvVal && srvVal === this.getSrvVal()) {
      let isFinderValScalar = this.info.isFinder() && !isObject(this.model);
      if (!isFinderValScalar) {
        return;
      }
    }

    let handledByEditor = false;
    if (this.editor && this.editor.isSpecial()) {
      this.editor.setSrvVal(srvVal);
      handledByEditor = true;
    } else if (this.info.editor == "multiselect") {
      if (srvVal && srvVal.trim()) {
        this.model = srvVal.trim().split(",");
      } else {
        this.model = [];
      }
    } else if (this.info.isNumeric()) {
      if (
        Number.parseFloat(srvVal) !== NaN &&
        srvVal !== null &&
        srvVal !== "******"
      ) {
        this.model = Number.parseFloat(srvVal);
      } else {
        this.model = srvVal;
      }
    } else {
      this.model = srvVal;
      // 如果原始值为 “” || null 时 调用默认值配置表达式，有的话则复制
      if (
        (srvVal === "" || srvVal === null || srvVal === undefined) &&
        this.hasInitValueExpr() &&
        !["", null, undefined].includes(this.evalInitValueExpr())
      ) {
        this.model = this.setSrvVal(this.evalInitValueExpr());
        console.log(
          "默认值",
          this.info.label,
          srvVal,
          this.model,
          this.setSrvVal(this.evalInitValueExpr())
        );
      }
    }

    if (!handledByEditor && this.editor) {
      this.editor.$emit("field-value-changed", this.info.name);
    }
  }

  getDispVal() {
    let self = this;
    if (this.info.isFinder()) {
      if (!this.model) {
        return null;
      }

      let dispCol = this.info.dispCol;
      if (this.model.hasOwnProperty(dispCol)) {
        return this.model[dispCol];
      } else {
        return this.getSrvVal();
      }
    } else if (this.info.isDict()) {
      if (this.options) {
        let target = this.options.filter((pair) => pair.value == this.model);
        return target.length > 0 ? target[0].label : this.getSrvVal();
      } else {
        return this.getSrvVal();
      }
    } else if (this.info.type == "Boolean") {
      return !!this.model ? "是" : "否";
    } else if (this.info.type == "UserList") {
      // function
      try {
        if (this.model) {
          let items = JSON.parse(this.model);
          if (items && items.length) {
            items = items.map((item) => {
              return item.disp;
            });
            // return join(items.map(item => item.disp), ",")
            let valKeys = join(
              items.map((item) => item),
              ","
            );

            return valKeys;
          }
        }
      } catch (e) {}

      return "";
    } else {
      return this.getSrvVal();
    }
  }

  getDispVal4Read() {
    if (this.noPerm4Sensi === true) {
      return "******";
    }

    let value = this.getDispVal();
    let isSensitive = value === "******";
    if (isNull(value) || isUndefined(value) || "" === value || isSensitive) {
      return value;
    }

    let fieldType = this.info.type ? this.info.type : "";
    let dispCol = this.info.dispCol;
    let separator = "-";
    if ("year" === fieldType.toLowerCase()) {
      return split(value, separator)[0];
    } else if ("month" === fieldType.toLowerCase()) {
      let parts = split(value, separator).slice(0, 2);
      return join(parts, separator);
    } else if (fieldType === "Boolean") {
      return !!value ? "是" : "否";
    } else if (fieldType === "Money") {
      if (value !== null && value !== "") {
        return formatMoney(value + "");
      } else {
        return "";
      }
    } else if (fieldType === "fk" && isObject(this.model)) {
      // fk 详情页显示 option list配置的 拼接值
      let fieldInfo = this.info;
      let loader = fieldInfo.dispLoader;
      let item = this.model;
      console.log("1", value, this.model);
      value =
        loader.showAsPair !== true
          ? item[fieldInfo.dispCol]
          : `${item[fieldInfo.dispCol]}/${item[fieldInfo.valueCol]}`;

      console.log("2", value, this.model);
      return value;
    } else if (this.shouldConvertDispValue4HotTable() && this.form.$store) {
      let table = getHotTableName(this.info.type);
      let noVal = this.getSrvVal();
      let tableData = this.form.$store.getters.getTableData(table);
      if (tableData && tableData.length > 0) {
        let target = tableData.filter(
          (item) => item[this.info.valueCol] === noVal
        );
        return target && target.length && target[0][dispCol];
      } else {
        return noVal;
      }
    } else if (fieldType === "fkjsons" && value) {
      const fmt = this.info.fmt;
      if (fmt && fmt.disp_col) {
        const arr = JSON.parse(value);
        return arr.map((item) => item[fmt.disp_col] || "");
      }
      return value;
    } else {
      return value;
    }
  }

  shouldConvertDispValue4HotTable() {
    let type = this.info.type;
    return (
      hotTableMetadata[type] && this.form && this.form.formType === "detail"
    );
  }

  reset() {
    this.model = this.info.getDefaultValue();
    if (this.editor && this.editor.isSpecial()) {
      this.editor.setSrvVal(null);
    }
  }

  reset2Init() {
    if (this.hasInitValueExpr()) {
      this.setSrvVal(this.evalInitValueExpr());
    } else {
      this.reset();
    }
  }

  evalXIf() {
    let self = this;
    if (self.info.xIf == null || self.info.xIf == undefined) {
      return true;
    } else if (typeof variable == typeof true) {
      return self.info.xIf;
    } else if (self.form && self.form) {
      // should be an string of test_func
      // noinspection JSUnusedLocalSymbols
      let mainData = self.form.getParentFormModel();
      let approval = self.form.approvalFormMode;

      // console.log('表单',approval,"var zz=" + self.info.xIf + "(row,mainData,approval); zz")
      let row = self.form.srvValFormModel();
      let ret = eval("var zz=" + self.info.xIf + "(row,mainData,approval); zz");
      return !!ret;
    }
  }

  evalVisibleExpr() {
    return this.evalVersatileFlagVar(this.info.visible);
  }

  evalEditable() {
    let vm = this.form;
    if (
      vm?.defaultCondition?.find(
        (item) =>
          item.value &&
          ["eq"].includes(item.ruleType) &&
          item.colName &&
          item.colName === this.info.name
      )
    ) {
      return false;
    }
    return this.evalVersatileFlagVar(this.info.editable);
  }

  evalInitValueExpr() {
    return this.evalVersatileFlagVar(this.info.initValueExpr);
  }

  evalVersatileFlagVar(flagVar) {
    let vm = this.form;
    let formModel = vm.srvValFormModel && vm.srvValFormModel();
    if (isBoolean(flagVar)) {
      return flagVar;
    } else if (isString(flagVar)) {
      return vm.evalBxExpr(flagVar, formModel, vm);
      // 运行字符串表达式
    } else if (isFunction(flagVar)) {
      return flagVar(formModel);
    } else {
      return !!flagVar;
    }
  }

  evalFormExpr(expr, defaultValue) {
    let vm = this.form;
    if (isBoolean(expr)) {
      return expr;
    } else {
      let formModel = vm.srvValFormModel && vm.srvValFormModel();
      if (isFunction(expr)) {
        return expr(formModel);
      } else if (isString(expr)) {
        if (expr.trim().startsWith("${") && expr.trim().endsWith("}")) {
          let readExpr = expr.trim().substring(2, expr.trim().length - 1);
          return vm.evalBxExpr(readExpr, formModel, vm, defaultValue);
        } else {
          return expr;
        }
      } else {
        return expr;
      }
    }
  }

  evalVisible() {
    return this.evalXIf() && this.evalVisibleExpr();
  }

  isEmpty() {
    let srvval = this.getSrvVal();
    return (
      srvval === null ||
      srvval === undefined ||
      srvval === "" ||
      srvval === "Invalid date"
    );
  }

  setVisible(visible) {
    this.info.visible = visible;
  }

  setEditable(editable) {
    this.info.editable = editable;
  }

  setInitValueExpr(initValueExpr) {
    this.info.initValueExpr = initValueExpr;
  }

  hasInitValueExpr() {
    return (
      !!this.info.initValueExpr && this.info.initValueExpr !== "$firstRowData"
    );
  }

  putValidateError(rule, errMsg) {
    console.log("put Validate Error:", rule, errMsg);
    this.errMsg[rule] = errMsg;
    this.errMsg = clone(this.errMsg);
  }

  putValidatePrompt(rule, promptMsg) {
    this.promptMsg[rule] = promptMsg;
    this.promptMsg = clone(this.promptMsg);
  }

  clearValidateError(ruleName) {
    delete this.errMsg[ruleName];
    this.errMsg = clone(this.errMsg);
  }

  clearValidatePrompt(ruleName) {
    delete this.promptMsg[ruleName];
    this.promptMsg = clone(this.promptMsg);
  }

  hasValidateError() {
    return !_isEmpty(this.errMsg);
  }

  hasValidatePrompt() {
    return !_isEmpty(this.promptMsg);
  }

  getAnyValidateError() {
    for (let key in this.errMsg) {
      return this.errMsg[key];
    }
    return "";
  }
  getAnyValidatePrompt() {
    for (let key in this.promptMsg) {
      return this.promptMsg[key];
    }
    return "";
  }
  hasHistoryData() {
    return !_isEmpty(this.historyData) && this.historyData.length > 1;
  }
  getUniqueCheck() {
    let isUnique = this.info.moreConfig;
    if (isUnique && isUnique.hasOwnProperty("uniqueCheck")) {
      return true;
    } else {
      return false;
    }
  }
  getUniqueCheckMsg() {
    let isUnique = this.info.isUniqueCheck;

    return isUnique;
  }
  setNoPerm4Sensi(value) {
    this.noPerm4Sensi = value;
    value && this.setEditable(false);
  }
}
