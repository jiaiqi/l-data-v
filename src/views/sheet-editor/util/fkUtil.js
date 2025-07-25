import { isFk, isFkAutoComplete } from '@/utils/sheetUtils'
import cloneDeep from 'lodash/cloneDeep'
import { $http } from '@/common/http';

/**
 * 外键工具类，用于处理表格编辑器中的外键相关操作
 * @class FkUtil
 */
export class FkUtil {
  /**
   * 构造函数
   * @param {Object} column - 列配置对象
   * @param {string} app - 应用名称
   * @param {Object} rawDataMap - 原始数据映射对象
   */
  constructor(column,app,rawDataMap) {
    this.column = column;
    this.app = app;
    this.rawDataMap = rawDataMap;
  }

  /**
   * 获取编辑器类型
   * @returns {string} 编辑器类型，可能的值：'autocomplete'、'fk' 或其他字段类型
   */
  getEditorType() {
    if (isFkAutoComplete(this.column)) {
      return "autocomplete";
    } else if (isFk(this.column)) {
      return "fk";
    }
    return getFieldType(this.column);
  }

  /**
   * 获取选项列表V3版本
   * 根据列类型和操作类型返回相应的选项列表
   * @returns {Array|undefined} 选项列表数组或undefined
   */
  getOptionListV3() {
    const operateType = this.row?.__flag || "update";
    const editorType = this.getEditorType();
    if (isFk(this.column)) {
      return this.column?.option_list_v3;
    } else if (editorType === "autocomplete") {
      return this.column?.[`_${operateType}_option_list`];
    }
  }

  /**
   * 获取最终的选项列表
   * 根据条件筛选出符合当前行数据的选项配置
   * @returns {Object|null} 符合条件的选项配置对象或null
   */
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

  /**
   * 构建外键查询请求对象
   * 根据输入值和规则类型构建用于查询外键数据的请求参数
   * @param {string} inputVal - 输入值，用于查询匹配的数据
   * @param {string} [ruleType="[like]"] - 查询规则类型，默认为模糊查询
   * @returns {Object|undefined} 查询请求对象或undefined（当不是外键列时）
   */
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
  
  /**
   * 异步获取匹配的值
   * 根据查询字符串从服务器获取匹配的外键数据
   * @param {string} queryString - 查询字符串
   * @param {string} [ruleType="[like]"] - 查询规则类型，默认为模糊查询
   * @returns {Promise<Object|undefined>} 返回匹配的数据对象，包含label和value属性，如果没有匹配则返回undefined
   */
  async getMatchedValue(queryString, ruleType = "[like]") {
    const optionListFinal = this.getOptionListFinal();
    let req = cloneDeep(this.getOptionReq(queryString, ruleType));
    if (optionListFinal?.serviceName && req) {
      // 从缓存中获取
      if(this.rawDataMap?.[`${optionListFinal.serviceName}-${queryString}`]){
        debugger
        return this.rawDataMap[`${optionListFinal.serviceName}-${queryString}`];
      }
      const url = `/${this.app}/select/${req.serviceName}`;
      const response = await $http.post(url, req);
      if (response && response.data && response.data.data?.length) {
        const data = response.data.data[0];
        const valueCol = optionListFinal.refed_col;
        const labelCol = optionListFinal.key_disp_col;
        data.label = data[labelCol];
        data.value = data[valueCol];
        this.rawDataMap[`${optionListFinal.serviceName}-${data.value}`] = data;
        return data;
      }
    }
  }
}