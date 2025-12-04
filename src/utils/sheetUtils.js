import { getFkOptions } from "@/service/api";
import cloneDeep from "lodash/cloneDeep";

/**
 * 解析子表类型字符串，提取操作类型
 * @param {string} childListType - 子表类型字符串，如 "addchildlist", "updatechildlist", "detaillist" 等
 * @returns {string|null} 返回操作类型，如 'add', 'update', 'detail' 等，如果解析失败返回 null
 */
function resolveChildListType(childListType) {
  if (!childListType || typeof childListType !== 'string') return null;
  let type = 'add'; // 默认类型为 add

  if (childListType.includes('childlist')) {
    // 如果包含 childlist，提取前面的类型
    type = childListType.split('childlist')[0];
  } else if (childListType.includes('list')) {
    // 如果包含 list，提取前面的类型
    type = childListType.split('list')[0];
  }
  return type;
}

/**
 * 为列附加冗余选项引用配置
 * 用于处理级联选择器或关联字段的选项数据
 * @param {Object} col - 列配置对象
 * @param {string} dependField - 依赖字段名
 * @param {Object} addColsMap - 新增列映射表
 * @param {Object} updateColsMap - 更新列映射表  
 * @param {Object} fkCols - 外键列映射表
 * @param {Object} extraOptions - 额外选项配置
 */
function attachRedundantOptionRefs(col, dependField, addColsMap = {}, updateColsMap = {}, fkCols = {}, extraOptions = {}) {
  const cfg = fkCols?.[dependField];
  if (!cfg) return;

  // 合并配置信息，包括基础配置和额外选项
  col.redundant_options = { ...cfg, ...extraOptions };

  // 存储各操作的选项列表数据
  col._add_option_list_v2 = addColsMap?.[dependField]?.option_list_v2;
  col._update_option_list_v2 = updateColsMap?.[dependField]?.option_list_v2;
  col._add_option_list = addColsMap?.[dependField]?.option_list_v3;
  col._update_option_list = updateColsMap?.[dependField]?.option_list_v3;
}

/**
 * 组装srvCols数据 - 这是核心的列配置处理函数
 * 根据不同的服务类型和优先级，合并和处理列配置
 * @param {Array} cols - 原始列配置数组
 * @param {Object} allColsMap - 所有列映射表对象
 * @param {string} childListType - 子表类型
 * @param {string} colSrv - 列服务名
 * @param {string} serviceName - 服务名
 * @param {string} preferType - 优先类型：'list' | 'add' | 'update' | 'mix'
 * @returns {Array} 处理后的列配置数组
 * 
 * 详细说明：
 * - preferType为'mix'时：混合使用list、add、update列
 *   新增行使用add服务列，更新行使用update服务列，展示使用三个服务的交集
 * - 即展示list服务列中in_list不为0或者add服务列中in_add不为0或者update服务列中in_update不为0的列
 */
const buildSrvCols = (cols, allColsMap = {}, childListType, colSrv, serviceName, preferType = 'list') => {
  allColsMap = cloneDeep(allColsMap); // 深拷贝避免修改原始数据
  let { updateColsMap, addColsMap, listColsMap } = allColsMap || {};
  let newCols = allColsMap?.[preferType + 'Cols'] || [];

  // 如果指定了优先类型的列存在，则使用该类型的列配置
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
    // 处理冗余字段的auto complete特性
    const fkCols = cols.reduce((res, cur) => {
      if (cur?.option_list_v2?.serviceName) {
        // 外键优先使用add服务的option_list_v2
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
          // 设置初始查询条件
          optionListV2.query_init_value = query_init_value;
        }

        res[cur.columns] = {
          ...optionListV2,
          _target_column: cur.columns,
          init_expr: addColsMap[cur.columns]?.init_expr || cur.init_expr,
          // redundant:cur.redundant||updateColsMap?.[cur.columns]?.redundant||addColsMap?.[cur.columns]?.redundant,
        };

        if (res[cur.columns].init_expr === '$firstRowData') {
          // 如果初始化表达式为选中首行数据，则重置并标记
          res[cur.columns].init_expr = null
          res[cur.columns]._selected_first_row = true
        }
      }
      return res;
    }, {});

    // 处理自定义服务控制列表的列
    if (colSrv && colSrv !== serviceName) {
      const srvType = colSrv.slice(colSrv.lastIndexOf("_") + 1);
      cols = cols.map((item) => {
        item = { ...item }
        item.list_min_width = item.list_min_width || listColsMap?.[item.columns]?.list_min_width || addColsMap?.[item.columns]?.list_min_width || updateColsMap?.[item.columns]?.list_min_width || null
        item.in_list = item.in_list === 1 ? 1 : item[`in_${srvType}`];
        if (item.in_list !== 1 && listColsMap?.[item.columns]?.in_list === 1) {
          item.in_list = 1;
        }
        return item;
      });
    } else if (childListType) {
      // 处理子表类型，使用对应服务的列配置
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
    }
    else {
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

      // 处理列表和更新的混合列
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

    // 为每个列设置编辑性、必填性等属性
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];

      // 设置编辑属性
      col.editable = updateColsMap?.[col.columns]?.updatable !== 0 && updateColsMap?.[col.columns]?.in_update === 1;
      col.canAdd = addColsMap?.[col.columns]?.in_add === 1;

      // 如果使用了自定义服务，进一步控制编辑属性
      if (colSrv && colSrv !== serviceName) {
        col.editable = col.editable && col?.in_update === 1;
        col.canAdd = col?.in_add === 1;
      }


      // 设置显示列：显示列是列表列、可编辑列、可新增列的并集
      col._union_display = listColsMap?.[col.columns]?.in_list === 1 || col.editable || col.canAdd;
      if (preferType === 'list') {
        col._display = listColsMap?.[col.columns]?.in_list === 1
      } else if (preferType === 'update') {
        col._display = col.editable
      } else if (preferType === 'add') {
        col._display = col.canAdd;
      } else {
        col._display = col._union_display;
      }

      // 设置必填属性
      col.isRequired = col.required === "是" || updateColsMap?.[col.columns]?.required === "是" || addColsMap?.[col.columns]?.required === "是" ||
        col?.validators?.includes("required") ||
        updateColsMap?.[col.columns]?.validators?.includes("required") ||
        addColsMap?.[col.columns]?.validators?.includes("required");

      // 处理冗余字段
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

      // 处理级联选择器的冗余字段auto complete特性
      if (
        col.subtype === "autocomplete" &&
        dependField &&
        fkCols[dependField]
      ) {
        attachRedundantOptionRefs(col, dependField, addColsMap, updateColsMap, fkCols);
      }

      // 处理字符串类型的冗余显示列，让其具备fk字段效果
      if (col?.col_type === "String" && col?.redundant?.dependField) {
        const key_disp_col = fkCols[col.redundant.dependField]?.key_disp_col;
        if (key_disp_col && col.columns && col.redundant?.refedCol === key_disp_col) {
          attachRedundantOptionRefs(col, dependField, addColsMap, updateColsMap, fkCols, { autocompleteInput: true });
        }
      }

      // 设置字段的编辑类型
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

    // 处理计算列的依赖关系
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

    // 过滤出需要显示的列：in_list=1 或 in_update=1 或 in_add=1
    cols = cols.filter((item) => item.in_list === 1 || item.in_update === 1 || item.in_add === 1);

    // 如果是作为子表使用，则只显示子表类型对应的in的字段
    if (allColsMap?.childListType) {
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

/**
 * 判断列是否为富文本类型
 * @param {Object} column - 列配置对象
 * @returns {boolean} 如果是富文本类型返回true，否则返回false
 */
function isRichText(column) {
  return column?.col_type && ["Note", "RichText", "snote"].includes(column.col_type)
}

/**
 * 判断列是否为FkAutoComplete类型
 * @param {Object} column - 列配置对象
 * @returns {boolean} 如果是FkAutoComplete类型返回true，否则返回false
 */
function isFkAutoComplete(column) {
  return column?.col_type === 'String' && column?.redundant_options?._target_column && true
}

/**
 * 判断列是否为外键类型
 * @param {Object} column - 列配置对象
 * @returns {boolean} 如果是外键类型返回true，否则返回false
 */
function isFk(column) {
  // 排除某些特殊类型
  if (['fks', 'fkjson', 'fkjsons'].includes(column?.col_type)) {
    return false
  }

  // 检查是否为外键类型
  if (column?.col_type && column?.bx_col_type) {
    const fkTypes = ["User", "Dept", "bxsys_user", "bxsys_dept", "fk"];
    return fkTypes.includes(column.col_type) ||
      column.bx_col_type === "fk" ||
      column.col_type === 'fk' ||
      (typeof column.col_type === 'string' && column.col_type.indexOf('bx') === 0)
  }
  return false
}

/**
 * 获取字段类型
 * @param {Object} column - 列配置对象
 * @returns {string} 返回字段类型字符串
 */
export function getFieldType(column) {
  let result = 'Text'

  // 特殊处理某些复合类型
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

// 导出所有函数
export { buildSrvCols, isRichText, isFkAutoComplete, isFk };
