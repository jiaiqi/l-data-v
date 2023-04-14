<template>
  <!-- 定义地图显示容器 -->
  <div :id="mapId" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";
import { generateMapID, initMap } from "@/common/useFunctions.js";

const props = defineProps({
  pageItem: Object,
});

const mapInstance = ref(null);
const mapId = ref("");

onMounted(() => {
  mapId.value = generateMapID(props.pageItem?.com_no, "map-container");
  nextTick(() => {
    mapInstance.value = initMap(mapId.value);
  });
});



</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
}
</style>
