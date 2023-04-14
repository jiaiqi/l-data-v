<template>
  <!-- 定义地图显示容器 -->
  <div :id="mapId" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";

// import { $http, getImagePath } from "../../common/http";
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
// const iconJson = ref([]); //地图图例
// const title = ref("");
// const longitude = ref("");
// const latitude = ref("");
// const scale = ref(18); //地图缩放级别

onMounted(() => {
  // 实例化地图
  mapId.value = generateMapID(props.pageItem?.com_no, "map-container");
  nextTick(() => {
    mapInstance.value = initMap(mapId.value,props.pageItem);
    initMapData(mapInstance.value, props.pageItem).then(markerData=>{
      // if(markerData?.center&&markerData?.markers){

      // }
    })
  });
});
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
