<template>
  <div class="flex flex-items-center flex-1 justify-end p-x-2">
    <!-- 状态颜色映射 -->
    <toolbar-color-map v-if="shouldShowColorMap" />

    <!-- 网格按钮组 -->
    <toolbar-grid-buttons
      v-if="config.gridButton && config.gridButton.length"
      :buttons="config.gridButton"
      :show="uiState.showGridButton"
      @toggle="uiState.showGridButton = !uiState.showGridButton"
      @button-click="$emit('grid-button-click', $event)"
    />

    <!-- 操作按钮组 -->
    <div class="flex items-center gap-1">
      <!-- 刷新按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="$emit('refresh')"
        v-if="shouldShowRefresh"
        title="刷新（F5）"
      >
        <i class="i-ic-baseline-refresh"></i>
      </el-button>

      <!-- 保存按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="$emit('save')"
        :disabled="!config.hasChanges"
        v-if="shouldShowSave"
        v-loading="config.onHandler"
        title="保存（Ctrl+S）"
      >
        <i class="i-ic-baseline-save"></i>
        <span
          v-if="config.autoSaveTimeout && config.autoSaveTimeout > 0"
          class="text-xs"
          title="自动保存倒计时"
        >
          {{ config.autoSaveTimeout }}
        </span>
      </el-button>

      <!-- 保存列宽按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="$emit('save-column-width')"
        v-loading="config.onHandler"
        :disabled="!config.hasColumnWidthChanges"
        v-if="shouldShowSaveColumnWidth"
        title="保存列宽"
      >
        <i class="i-ic-baseline-view-column"></i>
      </el-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import ToolbarColorMap from './toolbar-color-map.vue'
import ToolbarGridButtons from './toolbar-grid-buttons.vue'

export default {
  name: 'ToolbarActions',
  components: {
    ToolbarColorMap,
    ToolbarGridButtons
  },
  props: {
    uiState: {
      type: Object,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['refresh', 'save', 'save-column-width', 'grid-button-click'],
  setup(props) {
    const shouldShowColorMap = computed(() => {
      return !['add', 'addchildlist'].includes(props.config.childListType)
    })

    const shouldShowRefresh = computed(() => {
      return !['add', 'addchildlist'].includes(props.config.childListType)
    })

    const shouldShowSave = computed(() => {
      return !['add', 'addchildlist'].includes(props.config.childListType)
    })

    const shouldShowSaveColumnWidth = computed(() => {
      return !props.config.childListType && 
             props.config.hasColumnWidthChanges
    })

    return {
      shouldShowColorMap,
      shouldShowRefresh,
      shouldShowSave,
      shouldShowSaveColumnWidth
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

.gap-1 > * + * {
  margin-left: 5px;
}
</style>