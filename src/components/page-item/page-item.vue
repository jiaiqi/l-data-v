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
    <basic-chart
      v-if="pageItem.com_type === 'chart'"
      :ref="pageItem.com_type"
      :pageItem="pageItem"
    ></basic-chart>
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
export default {
  components: {
    videoCard,
    currentInfo,
    slideList,
    userList,
    noticeBar,
    mapCard,
    basicChart,
  },
  props: {
    pageItem: {
      type: Object,
    },
  },
  mounted() {
    // console.log(this.pageItem)
  },
  methods: {
    onResize(i) {
      if (i && i === this.pageItem.timestamp) {
        this.$refs[this.pageItem.com_type].onResize?.()
      }
    },
    stylefn(style) {
      if (style) {
        return formatStyleData(style);
      }
    },
  },
};
</script>
