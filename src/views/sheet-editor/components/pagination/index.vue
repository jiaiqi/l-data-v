<template>
  <div class="text-center flex justify-between">
    <div class="position-relative">
      <choose-tenant />
    </div>
    <el-pagination
      @size-change="$emit('size-change', $event)"
      @current-change="$emit('current-change', $event)"
      :current-page="page.pageNo"
      :page-sizes="PAGE_SIZES"
      :page-size="page.rownumber"
      layout="total, sizes, pager, jumper"
      :total="page.total"
    />
    <div class="flex items-center"></div>
  </div>
</template>

<script>
import ChooseTenant from '../choose-tenant/index.vue'

const PAGE_SIZES = [10, 20, 50, 100, 200, 500]

export default {
  name: 'SheetPagination',
  components: {
    ChooseTenant
  },
  props: {
    page: {
      type: Object,
      required: true
    }
  },
  emits: ['size-change', 'current-change'],
  setup() {
    return {
      PAGE_SIZES
    }
  }
}
</script>

<style lang="scss" scoped>
.position-relative {
  position: relative;
}
</style>