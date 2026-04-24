import { cloneDeep } from "lodash-es";
import { $http } from "@/common/http";
import { getFkOptions } from "@/service/api";

const serviceColumnsCache = new Map();

export function resolveFkOptionConfig(fieldInfo = {}, row = {}) {
  const optionListV3 = fieldInfo?.option_list_v3;
  let result = null;

  if (Array.isArray(optionListV3) && optionListV3.length) {
    if (optionListV3.find((item) => !item.conds)) {
      result = optionListV3.find((item) => !item.conds);
    } else {
      result = optionListV3.find(
        (item) =>
          !item.conds?.length ||
          item.conds?.every(
            (cond) =>
              row?.[cond.case_col] &&
              cond.case_val?.includes?.(row?.[cond.case_col])
          )
      );
    }
  } else if (fieldInfo?.option_list_v2) {
    result = fieldInfo.option_list_v2;
  }

  return cloneDeep(result);
}

export function buildFkSearchRelation(
  srvInfo = {},
  keyword = "",
  ruleType = "[like]"
) {
  const relationCondition = {
    relation: "OR",
    data: [],
  };
  if (keyword && srvInfo.key_disp_col) {
    relationCondition.data.push({
      colName: srvInfo.key_disp_col,
      value: keyword,
      ruleType,
    });
  }
  if (keyword && srvInfo.refed_col) {
    relationCondition.data.push({
      colName: srvInfo.refed_col,
      value: keyword,
      ruleType,
    });
  }
  return relationCondition.data.length ? relationCondition : null;
}

export function buildFkOptionConfig(
  srvInfo = {},
  keyword = "",
  searchRuleType = "[like]"
) {
  const option = cloneDeep(srvInfo || {});
  const relationCondition = buildFkSearchRelation(
    option,
    keyword,
    searchRuleType
  );
  if (relationCondition) {
    option.relation_condition = relationCondition;
  }
  return option;
}

export function normalizeFkOption(row = {}, srvInfo = {}) {
  if (!row) {
    return row;
  }
  const rawData = cloneDeep(row);
  const label = rawData[srvInfo.key_disp_col] || rawData.label || rawData[srvInfo.refed_col];
  const value = rawData[srvInfo.refed_col] || rawData.value;
  return {
    ...rawData,
    label,
    value,
    rawData,
  };
}

export async function loadFkOptions({
  column,
  row,
  app,
  srvInfo,
  keyword = "",
  searchRuleType = "[like]",
  pageNo,
  rownumber,
  mainData = {},
}) {
  const option = buildFkOptionConfig(srvInfo, keyword, searchRuleType);
  const res = await getFkOptions(
    { ...column, option_list_v2: option },
    row,
    app,
    pageNo,
    rownumber,
    { mainData }
  );
  return {
    data: Array.isArray(res?.data)
      ? res.data.map((item) => normalizeFkOption(item, option))
      : [],
    page: res?.page,
  };
}

export async function loadServiceColumns({
  app,
  serviceName,
  useType = "selectlist",
}) {
  if (!app || !serviceName) {
    return [];
  }
  const cacheKey = `${app}:${serviceName}:${useType}`;
  if (serviceColumnsCache.has(cacheKey)) {
    return cloneDeep(serviceColumnsCache.get(cacheKey));
  }
  // Column metadata is stable for the same app/service/useType during one editor session.
  // Cache it to avoid refetching srvsys_service_columnex_v2_select on every focus.
  const req = {
    serviceName: "srvsys_service_columnex_v2_select",
    colNames: ["*"],
    condition: [
      {
        colName: "service_name",
        value: serviceName,
        ruleType: "eq",
      },
      { colName: "use_type", value: useType, ruleType: "eq" },
    ],
    order: [{ colName: "seq", orderType: "asc" }],
  };
  const url = `/${app}/select/srvsys_service_columnex_v2_select?colsel_v2=${serviceName}`;
  const res = await $http.post(url, req);
  const cols = (res?.data?.data?.srv_cols || []).filter(
    (item) => item.columns && item.in_list === 1
  );
  serviceColumnsCache.set(cacheKey, cloneDeep(cols));
  return cols;
}
