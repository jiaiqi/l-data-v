<script>
export default {
  name: "icon-fold",
  props: {
    size: {
      type: Number,
      default: 12
    },
    color: {
      type: String,
      default: "currentColor"
    }
  },
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L42 9" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 19L42 19" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 26L24 40L42 26" :stroke="color" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<style scoped lang="scss">

</style>