export const useBuildOption = (type, pageItem, cellData) => {
  let chartJson = pageItem?.chart_json || {
    chart_no: "CT2212240005",
    chart_type: "折线图",
    legend_disp: "下",
    series_value: "列数据",
    series_value_cols: "index1,index2,index3",
    series_name_cfg: "收入,订单数,费用",
    sort_axis: "某列数据值",
    sort_axis_col: "sort1",
  };
  let ecOptions = {
    color: ["#9E87FF", "#73DDFF", "#F56948", "#fe9a8b", "#86a8ff"],
    grid: {
      // 这里可以防止Y轴显示不全
      top: "15%",
      left: "8%",
      right: "8%",
      bottom: "8%",
      containLabel: true,
    },
    legend: {
      data: [],
      itemStyle:{
        color:pageItem?.style_json?.color || "#848EAC"
      },
      textStyle:{
        color:pageItem?.style_json?.color || "#848EAC"

      }
    }, //展示的折线图标题
    xAxis: {
      type: "category", // 还有其他的type，可以去官网喵两眼哦
      data: [], // x轴数据
      axisTick: {
        show: true, //是否显示刻度
        // alignWithLabel: true, //对齐文字
        // interval: '0',
        // length: 5, //标度标尺的长度
        inside: false, //刻度尺 标记 朝内 朝外
      },
      axisLabel: {
        show: true,
        // interval: 0, //刻度显示间隔 0代表 全部显示 1代表这个 隔一个显示一个
        rotate: chartJson.sort_label_ccw_rotation, //对刻度进行角度旋转 竖着显示
        textStyle: {
          fontWeight: 400,
          fontSize: 10,
          color: pageItem?.style_json?.color || "#848EAC",
        },
      },
      axisLine: {
        lineStyle: {
          color: pageItem?.style_json?.color || "#848EAC",
        },
      },
    },
    yAxis: [
      {
        type: "value",
        min: pageItem.min,
        max: pageItem.max,
        // min: chartJson.index_min,
        // max: chartJson.index_max,
        name: chartJson.y1_unit,
        //坐标轴最大值、最小值、强制设置数据的步长间隔
        // interval: chartJson.interval,

        axisLabel: {
          textStyle: {
            fontWeight: 400,
            fontSize: 10,
            color: pageItem?.style_json?.color || "#848EAC",
          },
          formatter: "{value}",
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: pageItem?.style_json?.color || "#848EAC",
          },
        },
        splitLine: {
          //修改背景线条样式
          show: false, //是否展示
          lineStyle: {
            color: "#E8E8E8", //线条颜色
            type: "dashed", //线条样式，默认是实现，dashed是虚线
          },
        },
      },
    ],
    tooltip: {
      trigger: "item", // axis 代表着同列的所有项的值  item  单个项的值  none 什么都不展示 三个值
    }, //点击折点 展示的样式
    series: [], //y轴展示的数据
  };

  if (
    chartJson?.more_option &&
    chartJson.more_option.indexOf("副坐标轴") > -1
  ) {
    ecOptions.yAxis.push({
      type: "value",
      name: chartJson.y2_unit,
      axisLabel: {
        formatter: "{value}",
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#848EAC",
        },
      },
      splitLine: {
        //修改背景线条样式
        show: false, //是否展示
        lineStyle: {
          color: "#E8E8E8", //线条颜色
          type: "dashed", //线条样式，默认是实现，dashed是虚线
        },
      },
    });
  }
  let datas = cellData;
  let seriesName = chartJson?.series_name_cfg || "";
  seriesName = seriesName.split(",");

  let seriesValueCols = chartJson?.series_value_cols || "";
  seriesValueCols = seriesValueCols.split(",");

  const mapJson = pageItem.cols_map_json?.cols_map_json || pageItem?.page_com_cols_map_json?.cols_map_json;
  let arr = [];
  seriesValueCols.forEach((item) => {
    for (let k in mapJson) {
      if (k === item) {
        arr.push(mapJson[k]);
      }
    }
  });
  seriesValueCols = arr;

  let sortAxisCol = chartJson?.sort_axis_col || "";
  let lineVal1 = chartJson?.refer_line1 || "none";
  let lineVal2 = chartJson?.refer_line2 || "none";

  switch (type) {
    case "line":
    case "bar":
    case "lineBar":
      for (let sIndex in seriesName) {
        let dataColName = seriesValueCols[sIndex];
        let series = {
          name: seriesName[sIndex],
          data: [],
          // color: this.color,
          // type: type,
          markLine: {
            symbol: "none",
            label: {
              show: true,
              position: "middle",
              // formatter: '{b}'      // 注释掉显示值，放开不显示值
            },
            data: [
              {
                // name: '阈值',
                yAxis: lineVal1,
                // lineStyle: {
                // 	color: '#FF7A42'
                // }
              },
              {
                yAxis: lineVal2,
                // lineStyle: {
                // 	color: '#FF7A42'
                // },
              },
            ],
            lineStyle: {
              color: "#FF7A42",
              type: "solid",
            },
          },
        };

        if (seriesName.length <= 2) {
          series.yAxisIndex = sIndex;
        }

        // 处理x轴变量映射
        for (let k in mapJson) {
          if (k === sortAxisCol) {
            sortAxisCol = mapJson[k];
          }
        }

        for (let data of datas) {
          if (chartJson.more_option && chartJson.more_option === "x轴反序") {
            series["data"].unshift(data[dataColName]);
            ecOptions["xAxis"]["data"].unshift(data[sortAxisCol]);
          } else {
            series["data"].push(data[dataColName]);
            ecOptions["xAxis"]["data"].push(data[sortAxisCol]);
          }
        }
        series["smooth"] = true;
        if (chartJson.data_label === "值") {
          series.itemStyle = {
            normal: {
              label: {
                show: true,
              },
            },
          };
        }

        ecOptions["legend"]["data"].push(seriesName[sIndex]);

        if (type === "lineBar") {
          let barCols = chartJson?.bar_cols || "";
          barCols = barCols.split(",");
          let lineCols = chartJson?.line_cols || "";
          lineCols = lineCols.split(",");

          if (barCols.includes(series.name)) {
            series["type"] = "bar";
          } else if (lineCols.includes(series.name)) {
            series["type"] = "line";
          }
        } else {
          series["type"] = type;
        }
        ecOptions["series"].push(series);
        if (chartJson?.series_value === "单列多行分组") {
          const nOption = buildMultiColSeries(pageItem,cellData);
          ecOptions["series"] = nOption.series;
          if (nOption.series.length > 5) {
            ecOptions.grid = {
              // 这里可以防止Y轴显示不全
              top: "35%",
              // top: '15%',
              left: "5%",
              // right: '30%',
              right: "8%",
              bottom: "8%",
              containLabel: true,
            };
          }
          ecOptions.legend.data = nOption.legend;

          const val =
            Math.abs(nOption.max - nOption.min) / nOption.legend.length;

          ecOptions.yAxis[0].min = (
            pageItem.min ||
            nOption.min - val ||
            0
          ).toFixed(2);

          ecOptions.yAxis[0].max = (pageItem.max || nOption.max + val).toFixed(
            2
          );

          // option.yAxis = [{

          // }]
        }
      }
      ecOptions["xAxis"]["data"] = [...new Set(ecOptions["xAxis"]["data"])];
      break;
    case "pie":
      for (let sIndex in seriesName) {
        let dataColName = seriesValueCols[sIndex];
        let series = {
          name: seriesName[sIndex], // 名称
          type: "pie", // 类型 饼图
          //   color: color,
          radius: ["45%", "65%"], // 饼图的半径 `50, 250 => 内半径 外半径`
          center: ["35%", "50%"], // 饼图的中心（圆心）坐标，数组的第一项是横坐标，第二项是纵坐标。
          // roseType: "area", // 是否展示成南丁格尔图，通过半径区分数据大小
          itemStyle: {
            normal: {
              label: {
                position: "outer",
                alignTo: "labelLine",
                show: false,
                formatter: "{b} : {c} ({d}%)",
                bleedMargin: 5,
              },
              labelLine: {
                show: false,
              },
            },
          },
          data: [],
        };
        for (let data of datas) {
          // option['xAxis']['data'].push(data[sortAxisCol])
          let dataItem = {
            value: data[dataColName],
            name: data[sortAxisCol],
          };
          series["data"].push(dataItem);
          let legendItem = {
            name: data[sortAxisCol],
            icon: "circle",
          };
          ecOptions["legend"]["data"].push(legendItem);
        }
        ecOptions["series"].push(series);
      }
      ecOptions["legend"]["orient"] = "vertical";
      ecOptions["legend"]["y"] = "center";
      ecOptions["legend"]["x"] = "65%";
      ecOptions["legend"]["align"] = "left";

      ecOptions["text"] = "总数";
      let pieDatas = ecOptions["series"][0]["data"];
      ecOptions["legend"]["formatter"] = function (name) {
        let v;
        for (var i = 0, n = pieDatas.length; i < n; i++) {
          if (name == pieDatas[i].name) {
            v = pieDatas[i].value;
          }
        }
        return `${name}(${v})`;
      };
      ecOptions["title"] = {
        // 主标题样式
        textAlign: "center", //整体水平对齐（包括text和subtext）
        textStyle: {
          color: "#666",
          fontSize: 12,
          align: "center",
        },
        itemGap: 10,
        text: "总数",
        subtext: pieDatas.reduce(function (prev, cur) {
          return cur.value + prev;
        }, 0),
        // 副标题样式
        subtextStyle: {
          color: "#0055ff",
          fontSize: 18,
          align: "center", //文字水平对齐方式（left/right）
        },
        left: "33.3%",
        top: "40%",
      };
      delete ecOptions.xAxis;
      delete ecOptions.yAxis;
      break;
    case "radar":
      ecOptions = {
        tooltip: {},
        legend: {
          data: ["预算分配", "实际开销"],
        },
        radar: {
          indicator: [
            {
              name: "销售",
              max: 6500,
            },
            {
              name: "管理",
              max: 16000,
            },
            {
              name: "信息技术",
              max: 30000,
            },
            {
              name: "客服",
              max: 38000,
            },
            {
              name: "研发",
              max: 52000,
            },
            {
              name: "市场",
              max: 25000,
            },
          ],
        },
        series: [
          {
            type: "radar",
            // areaStyle: {},
            data: [
              {
                value: [4300, 10000, 28000, 35000, 50000, 19000],
                name: "预算分配",
              },
              {
                value: [5000, 14000, 28000, 31000, 42000, 21000],
                name: "实际开销",
              },
            ],
          },
        ],
      };
      // for (let sIndex in seriesName) {
      // 	let dataColName = seriesValueCols[sIndex]
      // 	let series = {
      // 		name: seriesName[sIndex],
      // 		data: [],
      // 		type: this.chartType,
      // 	}
      // 	option['legend']['data'].push(seriesName[sIndex])
      // 	option['series'].push(series)
      // }
      // option['xAxis']['data'].push('')
      // option['xAxis']['data'] = [...new Set(option['xAxis']['data'])]
      break;
    default:
      break;
  }
  return ecOptions;
};


const buildMultiColSeries = (pageItem,cellData) => {
  let chartJson = pageItem?.chart_json || {};
  let datas = cellData;
  let seriesName = chartJson?.series_name_cfg || "";

  let lineVal1 = chartJson?.refer_line1 || "none";
  let lineVal2 = chartJson?.refer_line2 || "none";
  if (seriesName && Array.isArray(datas) && datas.length > 0) {
    let seriesNames = datas.reduce((pre, cur) => {
      if (!pre.includes(cur[seriesName])) {
        pre.push(cur[seriesName]);
      }
      return pre;
    }, []);
    let series = seriesNames.map((name) => {
      let obj = {
        name: name,
        type: "line",
        data: datas
          .filter((e) => e[seriesName] === name)
          .map((item) => item[chartJson.series_value_cols]),
        symbol: "circle",
        smooth: true,
        // yAxisIndex: 0,
        showSymbol: true,
        // tooltip: {
        //   trigger: 'item' // axis 代表着同列的所有项的值  item  单个项的值  none 什么都不展示 三个值
        // }, //点击折点 展示的样式
        markLine: {
          symbol: "none",
          label: {
            show: true,
            // position: 'right',
            // formatter: '{b}'      // 注释掉显示值，放开不显示值
          },
          data: [
            {
              // name: '阈值',
              yAxis: lineVal1,
            },
            {
              yAxis: lineVal2,
            },
          ],
          lineStyle: {
            color: "#FF7A42",
            type: "solid",
          },
        },
      };

      if (
        chartJson.more_option &&
        chartJson.more_option.indexOf("x轴反序") > -1
      ) {
        obj["data"] = obj["data"].reverse();
      }
      return obj;
    });
    let sortData = datas.sort(
      (a, b) => a[chartJson.series_value_cols] - b[chartJson.series_value_cols]
    );
    return {
      series: series,
      legend: seriesNames,
      min: sortData[0][chartJson.series_value_cols],
      max: sortData[sortData.length - 1][chartJson.series_value_cols],
    };
  }
};
