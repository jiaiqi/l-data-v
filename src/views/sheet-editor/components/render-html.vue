<template>
  <div v-html="html" class="render-html"></div>
</template>

<script>
// 展示富文本 Note RichText类型
export default {
  props: {
    html: String,
    editable: Boolean,
    row: Object,
    column: Object,
  },
};
</script>

<style lang="scss" scoped>
.render-html {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
}
</style>
