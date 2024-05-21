<script>
export default {
  name: "icon-fold",
  props: {
    size: {
      type: Number,
      default: 12
    },
    color:{
      type: String,
      default: "currentColor"
    }
  },
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10L42 10" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 20L42 20" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 40L24 26L42 40" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<style scoped lang="scss">

</style>