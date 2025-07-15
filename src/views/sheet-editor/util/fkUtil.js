import { isFk, isFkAutoComplete } from '@/utils/sheetUtils'
import cloneDeep from 'lodash/cloneDeep'
import { $http } from '@/common/http';
export class FkUtil {
  constructor(column,app) {
    this.column = column;
    this.app = app;
  }

  getEditorType() {
    if (isFkAutoComplete(this.column)) {
      return "autocomplete";
    } else if (isFk(this.column)) {
      return "fk";
    }
    return getFieldType(this.column);
  }

  getOptionListV3() {
    const operateType = this.row?.__flag || "update";
    const editorType = this.getEditorType();
    if (isFk(this.column)) {
      return this.column?.option_list_v3;
    } else if (editorType === "autocomplete") {
      return this.column?.[`_${operateType}_option_list`];
    }
  }

  getOptionListFinal() {
    let result = null;
    const option_list_v3 = this.getOptionListV3();
    if (Array.isArray(option_list_v3) && option_list_v3.length) {
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
  }

  getOptionReq(inputVal, ruleType = "[like]") {
    if (!isFk(this.column)) {
      return
    }
    let optionsV2 = this.getOptionListFinal();
    if (!optionsV2?.refed_col) {
      return
    }
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
            ruleType: ruleType,
            value: inputVal,
          },
          {
            colName: refedCol,
            ruleType: ruleType,
            value: inputVal,
          },
        ],
      };
    } else {
      req.condition.push({
        colName: refedCol,
        ruleType: ruleType,
        value: inputVal,
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
  }
  async getMatchedValue(queryString, ruleType = "[like]") {
    const optionListFinal = this.getOptionListFinal();
    let req = cloneDeep(this.getOptionReq(queryString, ruleType));
    if (optionListFinal?.serviceName && req) {
      // if (req["relation_condition"]) {
      //   req.relation_condition.data[0].value = queryString;
      //   req.relation_condition.data[1].value = queryString;
      // } else if (req["condition"]) {
      //   req["condition"][0].value = queryString;
      // }
      const url = `/${this.app}/select/${req.serviceName}`;
      const response = await $http.post(url, req);
      if (response && response.data && response.data.data?.length) {
        const data = response.data.data[0];
        const valueCol = optionListFinal.refed_col;
        const labelCol = optionListFinal.key_disp_col;
        data.label = data[labelCol];
        data.value = data[valueCol];
        return data;
      }
    }
  }
}