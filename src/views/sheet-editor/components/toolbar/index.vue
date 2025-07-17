<template>
  <div class="sheet-toolbar flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 w-full">
    <!-- 左侧：添加行功能 -->
    <toolbar-add-section
      :config="config.addButton"
      :insert-row-number="insertRowNumber"
      @add-rows="$emit('add-rows', insertRowNumber)"
      @update:insert-row-number="insertRowNumber = $event"
    />

    <!-- 中间：列表类型切换 -->
    <toolbar-list-type
      v-if="config.isTree"
      :list-type="config.listType"
      @change="$emit('list-type-change', $event)"
    />

    <!-- 右侧：操作按钮组 -->
    <toolbar-actions
      :ui-state="uiState"
      :config="config"
      @refresh="$emit('refresh')"
      @save="$emit('save')"
      @save-column-width="$emit('save-column-width')"
      @grid-button-click="$emit('grid-button-click', $event)"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import ToolbarAddSection from './toolbar-add-section.vue'
import ToolbarListType from './toolbar-list-type.vue'
import ToolbarActions from './toolbar-actions.vue'

export default {
  name: 'SheetToolbar',
  components: {
    ToolbarAddSection,
    ToolbarListType,
    ToolbarActions
  },
  props: {
    uiState: {
      type: Object,
      required: true
    },
    tableState: {
      type: Object,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  emits: [
    'add-rows',
    'refresh',
    'save',
    'save-column-width',
    'list-type-change',
    'grid-button-click'
  ],
  setup() {
    const insertRowNumber = ref(1)

    return {
      insertRowNumber
    }
  }
}
</script>

<style lang="scss" scoped>
.sheet-toolbar {
  border-bottom: 1px solid #eee;
}
</style>