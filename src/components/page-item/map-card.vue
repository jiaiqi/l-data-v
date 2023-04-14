<template>
  <div class="map-view">
    <!-- 定义地图显示容器 -->

    <div :id="mapId" class="map-container"></div>

    <div class="map-legend">
      <div v-for="item in iconJson" class="legend-wrap">
        <img :src="getImagePath(item.icon)" class="legend-icon" />
        <span class="legend-text">{{ item.legend_label || "" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";

import { getImagePath } from "../../common/http";
import {
  initMapData,
  generateMapID,
  initMap,
} from "../../common/functions/mapUtils";

const props = defineProps({
  pageItem: Object,
});

const mapInstance = ref(null); // 地图实例
const mapId = ref(""); // 地图编号
const iconJson = ref([]); //地图图例
// const title = ref("");
// const longitude = ref("");
// const latitude = ref("");
// const scale = ref(18); //地图缩放级别

onMounted(() => {
  // 实例化地图
  mapId.value = generateMapID(props.pageItem?.com_no, "map-container");
  nextTick(() => {
    mapInstance.value = initMap(mapId.value, props.pageItem);
    initMapData(mapInstance.value, props.pageItem).then((markerData) => {
      if (markerData.iconJson) {
        iconJson.value = markerData.iconJson;
      }
      // if(markerData?.center&&markerData?.markers){
      // }
    });
  });
});
</script>

<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  position: relative;
}
.map-container {
  width: 100%;
  height: 100%;
}

.map-legend {
  position: absolute;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 5px;
  z-index: 10;
  .legend-wrap {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .legend-icon {
    width: 30px;
    height: 30px;
    vertical-align: text-top;
  }

  .legend-text {
    color: #202e64;
    font-size: 14px;
    line-height: 30px;
    margin: 0 5px;
  }
}
</style>
