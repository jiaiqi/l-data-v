<template>
  <div v-if="widgetType === '文本'" :style="[textWidgetJson]">
    <span v-if="pageItem && pageItem.widget_json">{{
      pageItem.widget_json.init_val || ""
    }}</span>
  </div>
  <date-time
    v-else-if="widgetType === '时间日期'"
    :show-seconds="showSeconds"
    :parts-set="timeWidgetJson['parts-set']"
    :color="widgetColor"
  ></date-time>
</template>

<script setup>
import { computed } from "vue";
import { formatStyleData } from "@/common/common.js";
import dateTime from "../widgets/date-time.vue";
const props = defineProps({
  pageItem: Object,
});

const textWidgetJson = computed(() => {
  if (props.pageItem.widget_json.col_text_pub_style_json) {
    return formatStyleData(props.pageItem.widget_json.col_text_pub_style_json);
  }
});

const timeWidgetJson = computed(() => {
  if (props.pageItem.widget_json.col_type_time_json) {
    return formatStyleData(props.pageItem.widget_json.col_type_time_json);
  }
});
const showSeconds = computed(() => {
  return (
    timeWidgetJson.value &&
    timeWidgetJson.value['parts-set'] &&
    timeWidgetJson.value['parts-set'].indexOf("秒")
  );
});

const widgetType = computed(() => {
  return props.pageItem?.widget_json?.widget_type;
});
const widgetColor = computed(() => {
  return props.pageItem?.widget_json?.col_text_pub_style_json?.color;
});
</script>

<style lang="scss" scoped></style>
