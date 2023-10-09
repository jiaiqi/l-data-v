<template>
  <div v-html="html"></div>
</template>

<script>
// 展示富文本 Note RichText类型
export default {
  props: {
    html: String,
    editable:Boolean,
    row:Object,
    column:Object
  },
};
</script>

<style lang="scss" scoped></style>
