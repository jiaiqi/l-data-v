import { getFkOptions } from "@/service/api";

// 组装srvCols数据
const buildSrvCols = (
  cols,
  allColsMap = {},
  //   updateColsMap = {},
  //   addColsMap = {},
  childListType,
  colSrv
) => {
  let { updateColsMap, addColsMap, listColsMap } = allColsMap || {};
  // updateColsMap = updateColsMap || {};
  // addColsMap = addColsMap || {};
  // listColsMap = listColsMap || {};
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
        if(res[cur.columns].init_expr==='$firstRowData'){
          // 默认选中首行数据
          res[cur.columns].init_expr = null
          res[cur.columns]._selected_first_row = true
        }
      }
      return res;
    }, {});
    if (colSrv) {
      // 使用了自定义服务控制列表的列
      const srvType = colSrv.slice(colSrv.lastIndexOf("_") + 1);
      cols = cols.map((item) => {
        item.in_list = item.in_list === 1 ? 1 : item[`in_${srvType}`];
        if (item.in_list !== 1 && listColsMap?.[item.columns]?.in_list === 1) {
          item.in_list = 1;
        }
        return item;
      });
    } else if (childListType === "add") {
      // 新增页面子表 使用add服务的column
      cols = cols.map((item) => {
        if (addColsMap[item.columns]) {
          item = { ...addColsMap[item.columns] };
          item.in_list = addColsMap[item.columns].in_add;
        }
        return item;
      });
    } else {
      // 合并列表字段跟编辑字段
      let listUpdateMixCols = [...cols];
      if (Object.keys(updateColsMap).length > 0) {
        Object.keys(updateColsMap).forEach((key, keyIndex) => {
          const index = cols.findIndex((col) => col.columns === key);
          if (index > -1) {
            // list跟update都有的字段 使用update字段的配置
            if (
              cols[index]?.in_list === 1 &&
              updateColsMap[key]?.in_list !== 1
            ) {
              updateColsMap[key].in_list = 1;
            }
            listUpdateMixCols.splice(index, 1, updateColsMap[key]);
          } else {
            // list没有update有 将update字段插入到字段数组中
            listUpdateMixCols.splice(keyIndex, 0, updateColsMap[key]);
          }
        });
      }
      cols = listUpdateMixCols;
    }
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      col.editable =
        updateColsMap?.[col.columns]?.updatable === 1 &&
        updateColsMap?.[col.columns]?.in_update === 1;
      col.canAdd = addColsMap?.[col.columns]?.in_add === 1;
      col.isRequired =
        col.required === "是" ||
        updateColsMap?.[col.columns]?.required === "是" ||
        addColsMap?.[col.columns]?.required === "是" ||
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
        col.redundant_options = {
          ...fkCols[dependField],
        };
        col._add_option_list_v2 = addColsMap?.[dependField]?.option_list_v2
        col._update_option_list_v2 = updateColsMap?.[dependField]?.option_list_v2
        col._add_option_list = addColsMap?.[dependField]?.option_list_v3
        col._update_option_list = updateColsMap?.[dependField]?.option_list_v3
      }
      if (col?.col_type === "String" && col?.redundant?.dependField) {
        // 只让冗余的disp col 字段具备fk字段的效果
        const key_disp_col = fkCols[col.redundant.dependField]?.key_disp_col;
        if (key_disp_col && col.columns === key_disp_col) {
          col.redundant_options = {
            ...fkCols[dependField],
            autocompleteInput: true,
          };
          col._add_option_list_v2 = addColsMap?.[dependField]?.option_list_v2
          col._update_option_list_v2 = updateColsMap?.[dependField]?.option_list_v2
          col._add_option_list = addColsMap?.[dependField]?.option_list_v3
          col._update_option_list = updateColsMap?.[dependField]?.option_list_v3
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
            if(col === item.columns) continue;
            if (!updateDepMap.has(col)) {
              updateDepMap.set(col, []);
            }
            updateDepMap.get(col).push(item.columns);
          }
        }
        if (item.__add_calc_trigger_col) {
          for (const col of item.__add_calc_trigger_col) {
            if(col === item.columns) continue;
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

    // let calcCols = []
    // for (let index = 0; index < cols.length; index++) {
    //   const item = cols[index];
    //   if(updateColsMap[item.columns]?.calc_trigger_col){
    //     item.__update_calc_trigger_col = updateColsMap[item.columns]?.calc_trigger_col
    //   }
    //   if(addColsMap[item.columns]?.calc_trigger_col){
    //     item.__add_calc_trigger_col = addColsMap[item.columns]?.calc_trigger_col
    //   }
    //   if(item.__update_calc_trigger_col || item.__add_calc_trigger_col){
    //     calcCols.push(item)
    //   }
    // }
    // if(calcCols?.length){
    //   cols.forEach(col=>{
    //     const updateCalcDependedCols = calcCols.filter(item=>item.__update_calc_trigger_col?.includes(col.columns)).map(item=>item.columns)
    //     if(updateCalcDependedCols?.length){
    //       col.__update_calc_depended_cols = updateCalcDependedCols
    //     }
    //     const addCalcDependedCols = calcCols.filter(item=>item.__add_calc_trigger_col?.includes(col.columns)).map(item=>item.columns)
    //     if(addCalcDependedCols?.length){
    //       col.__add_calc_depended_cols = addCalcDependedCols
    //     }
    //   })
    // }
    // cols.filter(item => item?.calc_trigger_col?.length || updateColsMap[item.columns]?.calc_trigger_col?.length || addColsMap[item.columns]?.calc_trigger_col?.length)

    // if (calcCols.length > 0) {
    //   cols.forEach(col => {
    //     const calcDependedCols = calcCols.filter(item => item.calc_trigger_col.includes(col.columns)).map(item => item.columns)
    //     if (calcDependedCols?.length) {
    //       col.calcDependedCols = calcDependedCols
    //     }
    //   })
    // }


    cols = cols.filter(
      (item) => item.in_list === 1 || item.in_update === 1 || item.in_add === 1
    );
    if (allColsMap?.childListType) {
      // 如果是作为子表使用 则只显示子表类型对应的in的字段，比如add表单中的子表就只显示in_add的，update表单中子表只显示in_update
      cols = cols.filter(
        (item) => item[`in_${allColsMap.childListType}`] === 1
      );
    }
  }
  return cols;
};
// 构建luckysheet的dataVerification
const buildDataVerification = (data, cols) => {
  let datas = data.filter((item) => item?.v?.isTitle !== true);
  let res = {};
  if (Array.isArray(datas) && datas.length > 0) {
    datas.forEach((item) => {
      let key = `${item.r}_${item.c}`;
      let obj = {
        // "type": "dropdown",
        type2: null,
        // "value1": "Develop,Fix,Done",
        value2: "",
        checked: false,
        remote: false,
        prohibitInput: false,
        hintShow: false,
        hintText: "",
      };
      if (item.v.editType === "dropdownFk") {
        obj.type = "dropdown";
        if (Array.isArray(item.v.optionsList) && item.v.optionListV2) {
          let { refed_col, key_disp_col } = item.v.optionListV2;
          let options = item.v.optionsList.map((item) => {
            return {
              value: item[refed_col],
              text: item[key_disp_col],
            };
          });
          obj.prohibitInput = true;
          obj.value1 = options.map((item) => item.text).toString();
          obj.valueMap = options.map((item) => item.value).toString();
        }
      } else if (item.v.editType === "dropdownEnum") {
        obj.prohibitInput = true;
        obj.type = "dropdown";
        obj.value1 = item.v.optionsList.map((item) => item.value).toString();
      }
      res[key] = obj;
    });
  }
  return res;
};
// json格式的列表数据转换为luckysheet的数据格式
const json2sheet = async (data, cols) => {
  let showCols = cols.map((item) => item.columns);
  const defaultData = {
    name: "Cell", //工作表名称
    color: "", //工作表颜色
    index: 0, //工作表索引
    status: 1, //激活状态
    order: 0, //工作表的下标
    hide: 0, //是否隐藏
    row: 10, //行数
    column: 10, //列数
    defaultRowHeight: 19, //自定义行高
    defaultColWidth: 73, //自定义列宽
    pager: {
      pageIndex: 1, //当前的页码
      pageSize: 10, //每页显示多少行数据
      total: data.length, //数据总行数
    },
    celldata: [], //初始化使用的单元格数据
    config: {
      merge: {}, //合并单元格
      rowlen: {}, //表格行高
      columnlen: {}, //表格列宽
      rowhidden: {}, //隐藏行
      colhidden: {}, //隐藏列
      borderInfo: {}, //边框
      authority: {}, //工作表保护
    },
    scrollLeft: 0, //左右滚动条位置
    // "scrollTop": 315, //上下滚动条位置
    luckysheet_select_save: [], //选中的区域
    calcChain: [], //公式链
    isPivotTable: false, //是否数据透视表
    pivotTable: {}, //数据透视表设置
    filter_select: {}, //筛选范围
    filter: null, //筛选配置
    luckysheet_alternateformat_save: [], //交替颜色
    luckysheet_alternateformat_save_modelCustom: [], //自定义交替颜色
    luckysheet_conditionformat_save: {}, //条件格式
    frozen: {}, //冻结行列配置
    chart: [], //图表配置
    zoomRatio: 1, // 缩放比例
    image: [], //图片
    showGridLines: 1, //是否显示网格线
    dataVerification: {}, //数据验证配置
  };

  if (Array.isArray(cols) && cols.length > 0) {
    let arr = [];
    defaultData.row = data.length || 2;
    defaultData.column = 0;
    for (let index = 0; index < cols.length; index++) {
      const col = cols[index];
      let obj = {
        r: 0,
        c: index,
        v: {
          ct: { fa: "@", t: "s" },
          m: col["label"],
          v: col["label"],
          label: col.label,
          columns: col.columns,
          bg: "#999",
          fc: "#fff",
          isTitle: true, //是否是标题
          // fs:12
        },
      };
      arr.push(obj);
    }
    // cols.forEach(async (col, index) => {
    //   debugger

    // })
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((item, rIndex) => {
        let keys = showCols;
        // let keys = Object.keys(item).filter(key => showCols.includes(key))
        // let keys = Object.keys(item).filter(key => cols.includes(item => item.columns === key))
        keys.forEach((key, cIndex) => {
          let colItem = cols.find((col) => col.columns === key);
          if (colItem) {
            let obj = {
              r: rIndex + 1,
              c: cIndex,
              v: {
                ct: { fa: "@", t: "s" },
                label: colItem.label,
                columns: colItem.columns,
                old_val: item[key],
                m: item[key],
                v: item[key],
                id: item.id,
                editType: colItem.editType,
                optionsList: colItem.optionsList,
                optionListV2: colItem.option_list_v2,
              },
            };
            if (colItem.editType === "dropdownFk") {
              if (
                obj.value &&
                Array.isArray(obj.optionsList) &&
                obj.optionsList.length > 0
              ) {
                let val = obj.optionsList.find(
                  (item) => item.value === obj.value
                );
                if (val.value) {
                  obj.v = val.value;
                }
              }
            }
            if (colItem.col_type === "Date") {
              obj.v.ct.fa = "yyyy-MM-dd";
              obj.v.ct.t = "d";
            }
            if (colItem.col_type === "DateTime") {
              obj.v.ct.fa = "yyyy-MM-dd hh:mm";
              obj.v.ct.t = "d";
            }
            if (colItem.col_type === "Time") {
              obj.v.ct.fa = "hh:mm:ss";
              obj.v.ct.t = "d";
            }

            arr.push(obj);
            if (rIndex === 0) {
              defaultData.column = cIndex;
            }
          }
        });
      });
    }
    defaultData.celldata = arr;
  }

  defaultData.dataVerification = buildDataVerification(
    defaultData.celldata,
    cols
  );
  return defaultData;
};

// lucksheet的数据格式转换为json格式的列表数据
const sheet2json = (data, oldData) => {
  if (Array.isArray(data) && data.length > 0) {
    let titleRow = data[0];
    let cols = titleRow.map((item) => {
      let obj = {
        columns: item.columns,
        label: item.label,
      };
      return obj;
    });
    data = data.slice(1);
    data.forEach((row, index) => {
      if (oldData && oldData.length > 0 && oldData[index]) {
        row.id = oldData[index].id;
        row.isNew = false;
      } else {
        row.isNew = true;
      }
    });
    let arr = [];
    let res = {
      update: [],
      add: [],
      del: [],
    };

    // let cols = data.find(row => {
    //   if (Array.isArray(row) && row.length > 0) {
    //     return true
    //   }
    // }).map(item => {
    //   let obj = {
    //     columns: item.columns,
    //     label: item.label,
    //   }
    //   return obj
    // })

    data.forEach((rowData) => {
      let obj = {};

      if (rowData.id) {
        obj.id = rowData.id;
      }

      if (Array.isArray(rowData) && rowData.length > 0) {
        rowData.forEach((row, rIndex) => {
          let col = cols[rIndex];
          if (!obj.id && col?.columns && row?.m) {
            // 新增的行数据中的单元格
            obj[col.columns] = row.m;
          } else if (row?.old_val !== row?.m && col?.columns) {
            // 修改的单元格
            obj[col.columns] = row.m || null;
          } else if (col && col.columns && row && row.m) {
            // 没有改动的单元格
            // obj[ col.columns ] = row.m
          }
        });
      }
      if (obj && typeof obj === "object") {
        // let isDel = Object.keys(obj).filter(key => key!=='id').every(key => obj[ key ] === null)
        // let isDel = obj.isDel
        if (!obj?.id && Object.keys(obj).length > 0) {
          // 新增的行数据
          res.add.push(obj);
        } else if (obj.id && Object.keys(obj).length > 1) {
          // 修改的行数据
          if (
            Object.keys(obj)
              .filter((key) => key !== "id")
              .every((key) => obj[key] === null)
          ) {
            // 删除整行
            res.del.push(obj.id);
          } else {
            res.update.push(obj);
          }
        }
        arr.push(obj);
      }
    });
    return res;
  }
};
function isFkAutoComplete(column) {
  return column && column.col_type==='String' && column?.redundant_options?._target_column && true
}
export { json2sheet, sheet2json, buildSrvCols, buildDataVerification,isFkAutoComplete };
