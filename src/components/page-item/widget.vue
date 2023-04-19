<template>
  <div v-if="widgetType === '文本'" :style="[textWidgetJson]">
    <span v-if="pageItem && pageItem.widget_json">{{
      pageItem.widget_json.init_val || ""
    }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { formatStyleData } from "@/common/common.js";

const props = defineProps({
  pageItem: Object,
});

const textWidgetJson = computed(() => {
  if (props.pageItem.widget_json.col_text_pub_style_json) {
    return formatStyleData(props.pageItem.widget_json.col_text_pub_style_json);
  }
});
const widgetType = computed(() => {
  return props.pageItem?.widget_json?.widget_type;
});
</script>

<style lang="scss" scoped></style>
