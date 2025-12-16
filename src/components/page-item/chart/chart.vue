<script setup>
import echarts from "@/utils/echarts.js";
import { onMounted, ref, watch } from "vue";
const props = defineProps({
  pageItem: {
    type: Object,
  },
  chartOption: {
    type: Object,
  },
  index: {
    type: [Number, String],
  },
  canvasId: {
    type: String,
    default: () => {
      return "ec-canvas" + new Date().getTime();
    },
  },
});
const chartOption = props.chartOption;

let myChart = null;

const setChartOption = (chartOption, chart) => {
  // 指定图表的配置项和数据
  const option = {
    // title: {
    //   text: "ECharts 入门示例",
    // },
    tooltip: {},
    legend: {
      data: ["销量"],
    },
    xAxis: {
      data: ["衬衫", "羊毛衫", "雪纺衫", "裤子", "高跟鞋", "袜子"],
    },
    yAxis: {},
    series: [
      {
        name: "销量",
        type: "bar",
        data: [5, 20, 36, 10, 10, 20],
      },
    ],
    ...chartOption,
  };
  // 使用刚指定的配置项和数据显示图表。
  chart.setOption(option);
};

onMounted(() => {
  // 基于准备好的dom，初始化echarts实例
  myChart = echarts.init(document.getElementById(props.canvasId));
  setChartOption(props.chartOption, myChart);
  setTimeout(() => {
    myChart.resize();
  }, 100);
});

watch(
  () => props.chartOption,
  () => {
    if (props.chartOption) {
      setChartOption(props.chartOption, myChart);
    }
  }
);

const onResize = () => {
  myChart.resize();
};

defineExpose({
  onResize,
});
</script>

<template>
  <!-- 为 ECharts 准备一个定义了宽高的 DOM -->
  <div :id="canvasId" style="width: 100%; height: 100%"></div>
</template>

<style lang="scss" scoped></style>
