<template>
  <Chart
    ref="chartRef"
    class="uni-ec-canvas"
    :chart-option="option"
    :canvasId="canvasId"
    v-if="option"
    @click-chart="clickChart"
  ></Chart>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import Chart from "./chart.vue";
import { $select } from "@/common/http.js";
import { useBuildOption } from "../use-functions/buildOption";
const props = defineProps({
  pageItem: Object,
  index: [String, Number],
  canvasId: {
    type: String,
    default: () => {
      return "ec-canvas" + new Date().getTime();
    },
  },
});
const { pageItem } = props;
const timer = null;
const emit = defineEmits(["clickChart"]);
const clickChart = () => {
  emit("clickChart");
};

onMounted(() => {
  onSrvReq();
  // if (pageItem?.srv_req_json?.cycle_req_timer) {
  //   // 定时刷新
  //   // autoRefreshData();
  // }
});
const option = ref({});
const ecRun = computed(() => {
  return option.value;
});
const showLoading = ref(true);
const chartType = computed(() => {
  let type =
    pageItem?.com_type == "chart" ? pageItem?.chart_json?.chart_type : "";
  let chartType = "";
  switch (type) {
    case "折线图":
      chartType = "line";
      break;
    case "柱状图":
      chartType = "bar";
      break;
    case "饼图":
      chartType = "pie";
      break;
    case "雷达图":
      chartType = "radar";
      break;
    case "组合图":
      chartType = "lineBar";
      break;
    default:
      break;
  }
  return chartType;
});

const cellData = ref([]);
const autoRefreshData = () => {
  const interval = pageItem?.srv_req_json?.cycle_req_timer;
  timer = setInterval(() => {
    onSrvReq();
  }, interval * 1000);
};
const onSrvReq = async () => {
  let req = pageItem?.srv_req_json;
  if (req) {
    let res = await $select(req, req.mapp);
    console.log(res);
    if (res.ok && res.data.length > 0) {
      cellData.value = res.data;
    }
    console.log(pageItem);

    option.value = useBuildOption(chartType.value, pageItem, res.data);
  }
};

const chartRef = ref(null);
const onResize = () => {
  chartRef?.value?.onResize();
};
defineExpose({
  onResize,
});
</script>

<style lang="scss" scoped></style>
