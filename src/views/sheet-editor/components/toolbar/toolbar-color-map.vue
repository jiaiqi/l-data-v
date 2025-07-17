<template>
  <div class="color-map flex flex-items-center m-r-20">
    <div class="color-map-item flex flex-items-center">
      <div class="color bg-[#2EA269] w-4 h-4 m-r-2 rounded"></div>
      <div class="text">新增</div>
    </div>
    <div class="color-map-item flex flex-items-center m-l-5">
      <div class="color bg-[#E83D4B] w-4 h-4 m-r-2 rounded"></div>
      <div class="text">更新</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToolbarColorMap'
}
</script>

<style lang="scss" scoped>
.color-map-item {
  .text {
    font-size: 12px;
    color: #666;
  }
}
</style>