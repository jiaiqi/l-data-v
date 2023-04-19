<template>
  <div class="date-time" :style="{ color: color }">
    <div class="time">{{ time }}</div>
    <div class="date">
      <div class="ymd">{{ date }}</div>
      <div class="week">{{ week }}</div>
    </div>
  </div>
</template>

<script>
import dayjs from "dayjs";

let timer = "";
export default {
  data() {
    return {
      time: "",
    };
  },
  props: {
    showSeconds: {
      type: Boolean, //是否显示秒数
      default: false,
    },
    color: {
      type: String,
      default: "#fff",
    },
  },
  computed: {
    date() {
      return dayjs(new Date()).format("YYYY-MM-DD");
    },
    week() {
      let arr = [
        "星期天",
        "星期一",
        "星期二",
        "星期三",
        "星期四",
        "星期五",
        "星期六",
      ];
      return arr[new Date().getDay()];
    },
  },
  mounted() {
    if (this.showSeconds) {
      this.time = dayjs(new Date()).format("HH:mm:ss");
      timer = setInterval(() => {
        this.time = dayjs(new Date()).format("HH:mm:ss");
      }, 1000);
    } else {
      this.time = dayjs(new Date()).format("HH:mm");
      timer = setInterval(() => {
        this.time = dayjs(new Date()).format("HH:mm");
      }, 1000);
    }
  },
  beforeDestroy() {
    clearInterval(timer);
  },
};
</script>

<style lang="scss" scoped>
.date-time {
  display: flex;
  width: auto;
  flex-wrap: nowrap;
}
.time {
  font-size: 40px;
}
.date {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 5px;
  .ymd,
  .week {
    line-height: 1;
    text-align: left;
  }
  .ymd {
    margin-bottom: 5px;
  }
}
</style>
