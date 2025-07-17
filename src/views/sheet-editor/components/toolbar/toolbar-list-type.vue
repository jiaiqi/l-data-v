<template>
  <div class="p-x-2 flex-1 flex justify-center">
    <el-radio-group
      :value="listType"
      @input="$emit('change', $event)"
      size="mini"
    >
      <el-radio-button label="list">普通列表</el-radio-button>
      <el-radio-button label="treelist">树型列表</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
export default {
  name: 'ToolbarListType',
  props: {
    listType: {
      type: String,
      default: 'list'
    }
  },
  emits: ['change']
}
</script>