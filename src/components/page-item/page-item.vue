<template>
  <div
    class="page-item"
    v-if="pageItem && pageItem.com_type"
    :style="stylefn(pageItem.style_json)"
  >
    <video-card
      v-if="pageItem.com_type === 'videoCard'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></video-card>
    <current-info
      v-if="pageItem.com_type === 'currentInfo'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></current-info>
    <slide-list
      v-if="pageItem.com_type === 'swiper'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></slide-list>
    <user-list
      v-if="pageItem.com_type === 'userList'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></user-list>
    <notice-bar
      v-if="pageItem.com_type === 'noticeBar'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></notice-bar>
    <map-card
      v-if="pageItem.com_type === 'map'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></map-card>
    <!-- <basic-chart
      v-if="pageItem.com_type === 'chart'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
      :index="layout.i"
    ></basic-chart> -->
    <page-item-chart
      v-if="pageItem.com_type === 'chart'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
      :index="layout.i"
    ></page-item-chart>
  </div>
</template>

<script>
import { formatStyleData } from "@/common/common.js";
import videoCard from "./video-card.vue";
import currentInfo from "./current-info.vue";
import slideList from "./slide-list.vue";
import userList from "./user-list.vue";
import noticeBar from "./notice-bar.vue";
import mapCard from "./map-card.vue";
import basicChart from "./chart-basic.vue";
import pageItemChart from "./chart/page-item-chart.vue";
export default {
  components: {
    videoCard,
    currentInfo,
    slideList,
    userList,
    noticeBar,
    mapCard,
    basicChart,
    pageItemChart,
  },
  props: {
    pageItem: {
      type: Object,
    },
    layout: {
      type: Object,
    },
  },
  mounted() {
    // console.log(this.pageItem)
  },
  methods: {
    onResize(i) {
      console.log(this.$refs);
      this.$refs[this.pageItem.com_type].onResize?.();
    },
    stylefn(style) {
      if (style) {
        let res = formatStyleData(style);
        if (this.layout?.h && this.layout?.w) {
          res.height = "100%";
          res.width = "100%";
        }
        return res;
      }
    },
  },
};
</script>

<style lang="scss">
.page-item {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
