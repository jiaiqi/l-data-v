import { getFkOptions } from "@/service/api";
import cloneDeep from "lodash/cloneDeep";

function resolveChildListType(childListType) {
  if (!childListType || typeof childListType !== 'string') return null;
  let type = 'add';
  if (childListType.includes('childlist')) {
    type = childListType.split('childlist')[0];
  } else if (childListType.includes('list')) {
    type = childListType.split('list')[0];
  }
  return type;
}

function attachRedundantOptionRefs(col, dependField, addColsMap = {}, updateColsMap = {}, fkCols = {}, extraOptions = {}) {
  const cfg = fkCols?.[dependField];
  if (!cfg) return;
  col.redundant_options = { ...cfg, ...extraOptions };
  col._add_option_list_v2 = addColsMap?.[dependField]?.option_list_v2;
  col._update_option_list_v2 = updateColsMap?.[dependField]?.option_list_v2;
  col._add_option_list = addColsMap?.[dependField]?.option_list_v3;
  col._update_option_list = updateColsMap?.[dependField]?.option_list_v3;
}

// 组装srvCols数据
// preferType: 可选 'list' | 'add' | 'update'，在 colSrv 未指定或与 serviceName 相同时优先使用指定来源的列
const buildSrvCols = (cols, allColsMap = {}, childListType, colSrv, serviceName, preferType = 'list') => {
  allColsMap = cloneDeep(allColsMap);
  let { updateColsMap, addColsMap, listColsMap } = allColsMap || {};
  let newCols = allColsMap?.[preferType + 'Cols'] || [];
  if (Array.isArray(newCols) && newCols.length) {
    console.log(`newCols：${preferType}`, newCols.filter(item => item[`in_${preferType}`] === 1).map(item => {
      return {
        label: item.label,
        columns: item.columns,
        [`in_${preferType}`]: item[`in_${preferType}`],
      }
    }));
    console.log('cols', cols.map(item => {
      return {
        label: item.label,
        columns: item.columns,
      }
    }));
    cols = newCols
  }
  if (Array.isArray(cols) && cols.length > 0) {
    // 冗余字段auto complete特性
    const fkCols = cols.reduce((res, cur) => {
      if (cur?.option_list_v2?.serviceName) {
        // fk优先使用add服务的option_list_v2
        const optionListV2 =
          addColsMap?.[cur.columns]?.option_list_v2 ||
          updateColsMap?.[cur.columns]?.option_list_v2 ||
          cur.option_list_v2 ||
          {};
        const query_init_value =
          cur.option_list_v2?.query_init_value ||
          addColsMap?.[cur.columns]?.option_list_v2?.query_init_value ||
          updateColsMap?.[cur.columns]?.option_list_v2?.query_init_value;
        if (query_init_value) {
          // 初始查询条件
          optionListV2.query_init_value = query_init_value;
        }
        res[cur.columns] = {
          ...optionListV2,
          _target_column: cur.columns,
          init_expr: addColsMap[cur.columns]?.init_expr || cur.init_expr,
          // redundant:cur.redundant||updateColsMap?.[cur.columns]?.redundant||addColsMap?.[cur.columns]?.redundant,
        };
        if (res[cur.columns].init_expr === '$firstRowData') {
          // 默认选中首行数据
          res[cur.columns].init_expr = null
          res[cur.columns]._selected_first_row = true
        }
      }
      return res;
    }, {});
    if (colSrv && colSrv !== serviceName) {
      // 使用了自定义服务控制列表的列
      const srvType = colSrv.slice(colSrv.lastIndexOf("_") + 1);
      cols = cols.map((item) => {
        item.in_list = item.in_list === 1 ? 1 : item[`in_${srvType}`];
        if (item.in_list !== 1 && listColsMap?.[item.columns]?.in_list === 1) {
          item.in_list = 1;
        }
        return item;
      });
    } else if (childListType) {
      // 新增页面子表 使用add服务的column
      let type = resolveChildListType(childListType) || 'add'
      if (type === 'detail') {
        allColsMap.detailColsMap = allColsMap.listColsMap
      }
      cols = cols.map(item => {
        if (allColsMap[`${type}ColsMap`][item.columns]) {
          item = { ...allColsMap[`${type}ColsMap`][item.columns] };
          item.in_list = allColsMap[`${type}ColsMap`][item.columns][`in_${type}`];
        }
        return item
      })
    } else {
      // 合并列表字段跟编辑字段
      // 当 preferType 指定为 'add' 或 'update' 时，优先使用对应来源的列定义，并以对应 in_* 控制显示
      if (preferType && preferType !== 'list') {
        const type = preferType;
        const fromMap = allColsMap?.[`${type}ColsMap`] || {};
        // 1) 用目标来源的列定义替换现有同名列
        cols = cols.map(item => {
          if (fromMap[item.columns]) {
            const next = { ...fromMap[item.columns] };
            next.in_list = fromMap[item.columns][`in_${type}`];
            return next;
          }
          return item;
        });
        // 2) 将目标来源中存在但列表中不存在的列插入，保持与原有插入策略一致
        const mixed = [...cols];
        Object.keys(fromMap).forEach((key, keyIndex) => {
          const exists = cols.findIndex((col) => col.columns === key) > -1;
          if (!exists) {
            const candidate = { ...fromMap[key] };
            candidate.in_list = fromMap[key][`in_${type}`];
            mixed.splice(keyIndex, 0, candidate);
          }
        });
        cols = mixed;
      }

      let listUpdateMixCols = [...cols];
      if (Object.keys(updateColsMap).length > 0) {
        Object.keys(updateColsMap).forEach((key, keyIndex) => {
          const index = listUpdateMixCols.findIndex((col) => col.columns === key);
          if (index > -1) {
            // list跟update都有的字段 使用update字段的配置
            const candidate = { ...updateColsMap[key] };
            if (cols[index]?.in_list === 1 && candidate?.in_list !== 1) {
              candidate.in_list = 1;
            }
            // listUpdateMixCols[index] = candidate
            listUpdateMixCols.splice(index, 1, candidate);
          } else {
            // list没有update有 将update字段插入到字段数组中
            const candidate = { ...updateColsMap[key] };
            listUpdateMixCols.splice(keyIndex, 0, candidate);
          }
        });
      }
      cols = listUpdateMixCols;
    }
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      col.editable = updateColsMap?.[col.columns]?.updatable === 1 && updateColsMap?.[col.columns]?.in_update === 1;
      col.canAdd = addColsMap?.[col.columns]?.in_add === 1;
      if(colSrv && colSrv !== serviceName){
        col.editable = col.editable && col?.in_update === 1;
        col.canAdd = col?.in_add === 1;
      }
      col._display = listColsMap?.[col.columns]?.in_list === 1 || col.editable || col.canAdd; // 显示列是列表列、可编辑列、可新增列的并集
      col.isRequired = col.required === "是" || updateColsMap?.[col.columns]?.required === "是" || addColsMap?.[col.columns]?.required === "是" ||
        col?.validators?.includes("required") ||
        updateColsMap?.[col.columns]?.validators?.includes("required") ||
        addColsMap?.[col.columns]?.validators?.includes("required");
      if (!col.redundant) {
        col.redundant =
          addColsMap[col.columns]?.redundant ||
          updateColsMap[col.columns]?.redundant ||
          null;
      }
      const dependField =
        col.redundant?.dependField ||
        updateColsMap?.[col.columns]?.redundant?.dependField ||
        addColsMap?.[col.columns]?.redundant?.dependField;
      if (
        col.subtype === "autocomplete" &&
        dependField &&
        fkCols[dependField]
      ) {
        // 冗余字段auto complete特性
        attachRedundantOptionRefs(col, dependField, addColsMap, updateColsMap, fkCols);
      }
      if (col?.col_type === "String" && col?.redundant?.dependField) {
        // 只让冗余的disp col 字段具备fk字段的效果
        const key_disp_col = fkCols[col.redundant.dependField]?.key_disp_col;
        // if (key_disp_col && col.columns && (col.columns === key_disp_col || col.redundant?.refedCol === key_disp_col)) {
        if (key_disp_col && col.columns && col.redundant?.refedCol === key_disp_col) {
          attachRedundantOptionRefs(col, dependField, addColsMap, updateColsMap, fkCols, { autocompleteInput: true });
        }
      }
      switch (col.bx_col_type) {
        case "fk":
          col.editType = "dropdownFk";
          // col.optionsList = await getFkOptions(col);
          break;
        case "enum":
          col.editType = "dropdownEnum";
          col.optionsList = col.option_list_v2;
          break;
        default:
          break;
      }
    }

    let calcCols = [];

    // 第一步：筛选并标记需要计算的列
    for (const item of cols) {
      if (Array.isArray(updateColsMap[item.columns]?.calc_trigger_col)) {
        item.__update_calc_trigger_col = updateColsMap[item.columns].calc_trigger_col;
      }
      if (Array.isArray(addColsMap[item.columns]?.calc_trigger_col)) {
        item.__add_calc_trigger_col = addColsMap[item.columns].calc_trigger_col;
      }
      if (item.__update_calc_trigger_col || item.__add_calc_trigger_col) {
        calcCols.push(item);
      }
    }

    if (calcCols.length > 0) {
      // 第二步：构建依赖关系
      const updateDepMap = new Map();
      const addDepMap = new Map();

      for (const item of calcCols) {
        if (item.__update_calc_trigger_col) {
          for (const col of item.__update_calc_trigger_col) {
            if (col === item.columns) continue;
            if (!updateDepMap.has(col)) {
              updateDepMap.set(col, []);
            }
            updateDepMap.get(col).push(item.columns);
          }
        }
        if (item.__add_calc_trigger_col) {
          for (const col of item.__add_calc_trigger_col) {
            if (col === item.columns) continue;
            if (!addDepMap.has(col)) {
              addDepMap.set(col, []);
            }
            addDepMap.get(col).push(item.columns);
          }
        }
      }

      // 第三步：更新每个列的依赖关系
      for (const col of cols) {
        if (updateDepMap.has(col.columns)) {
          col.__update_calc_depended_cols = updateDepMap.get(col.columns);
        }
        if (addDepMap.has(col.columns)) {
          col.__add_calc_depended_cols = addDepMap.get(col.columns);
        }
      }
    }

    cols = cols.filter((item) => item.in_list === 1 || item.in_update === 1 || item.in_add === 1);

    if (allColsMap?.childListType) {
      // 如果是作为子表使用 则只显示子表类型对应的in的字段，比如add表单中的子表就只显示in_add的，update表单中子表只显示in_update
      let type = 'add'
      if (childListType.includes('list')) {
        if (childListType.includes('childlist')) {
          type = childListType.split('childlist')[0]
        } else if (childListType.includes('list')) {
          type = childListType.split('list')[0]
        }
      }
      cols = cols.filter(
        (item) => item[`in_${type}`] === 1
      );
    }
  }
  return cols;
};

function isRichText(column) {
  return column?.col_type && ["Note", "RichText", "snote"].includes(column.col_type)
}
function isFkAutoComplete(column) {
  return column?.col_type === 'String' && column?.redundant_options?._target_column && true
}
function isFk(column) {
  if (['fks', 'fkjson', 'fkjsons'].includes(column?.col_type)) {
    return false
  }
  // if(column?.redundant_options?._target_column){
  //   return true
  // }
  if (column?.col_type && column?.bx_col_type) {
    const fkTypes = ["User", "Dept", "bxsys_user", "bxsys_dept", "fk"];
    return fkTypes.includes(column.col_type) ||
      column.bx_col_type === "fk" ||
      column.col_type === 'fk' ||
      (typeof column.col_type === 'string' && column.col_type.indexOf('bx') === 0)
  }
  return false
}


export function getFieldType(column) {
  let result = 'Text'
  if (["fks", "fkjson", "fkjsons"].includes(column?.col_type)) {
    result = column.col_type
  } else if (isFk(column)) {
    result = 'fk'
  } else if (isFkAutoComplete(column)) {
    result = 'autocomplete'
  } else if (isRichText(column)) {
    result = 'RichText'
  } else if (column?.col_type) {
    result = column.col_type
  }
  return result
}

export { buildSrvCols, isRichText, isFkAutoComplete, isFk };
