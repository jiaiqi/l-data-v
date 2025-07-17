<template>
  <div class="flex flex-1 items-center text-sm p-x-2">
    <template v-if="hasAddPermission">
      <div class="m-r-2">添加</div>
      <el-input-number
        size="mini"
        :value="insertRowNumber"
        @input="$emit('update:insert-row-number', $event)"
        style="width: 100px"
      />
      <div class="m-x-2">行</div>
      <el-button
        class="icon-button"
        title="添加(ctrl + 加号键)"
        size="mini"
        type="primary"
        @click="$emit('add-rows')"
        :disabled="insertRowNumber === 0"
      >
        <i class="i-ic-baseline-add"></i>
      </el-button>
    </template>
    <div v-else class="text-sm text-gray cursor-not-allowed">
      <!-- 没有添加权限 -->
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ToolbarAddSection',
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    insertRowNumber: {
      type: Number,
      default: 1
    }
  },
  emits: ['add-rows', 'update:insert-row-number'],
  setup(props) {
    const hasAddPermission = computed(() => {
      return props.config && props.config.service_name
    })

    return {
      hasAddPermission
    }
  }
}
</script>

<style lang="scss" scoped>
.icon-button {
  padding: 4px;
  
  [class*="i-ic-"] {
    font-size: 16px;
  }
}
</style>