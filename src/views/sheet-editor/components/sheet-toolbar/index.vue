<template>
  <div
    class="flex flex-items-center flex-justify-between m-l-a m-r-a p-y-2 w-full"
    v-if="!disabled"
  >
    <!-- 左侧：添加行区域 -->
    <div
      class="flex items-center text-sm p-x-2"
      v-if="addButton && addButton.service_name"
    >
      <div class="m-r-2">添加</div>
      <el-input-number
        size="mini"
        :value="insertRowNumber"
        style="width: 100px"
        @input="emit('update:insertRowNumber', $event)"
      />
      <div class="m-x-2">行</div>
      <el-button
        class="icon-button"
        title="添加(ctrl + 加号键)"
        size="mini"
        type="primary"
        @click="emit('batch-insert-rows')"
        :disabled="insertRowNumber === 0"
      >
        <i class="i-ic-baseline-add"></i>
      </el-button>
    </div>
    <div
      class="text-sm text-gray cursor-not-allowed"
      v-else
    >
      <!-- 没有添加权限 -->
    </div>

    <!-- 中间：列表类型切换 -->
    <div class="p-x-2 flex-1 flex justify-center">
      <el-radio-group
        :value="listType"
        @input="emit('list-type-change', $event)"
        size="mini"
        v-if="isTree"
      >
        <el-radio-button label="list">普通列表</el-radio-button>
        <el-radio-button label="treelist">树型列表</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 右侧：操作按钮区域 -->
    <div class="flex flex-items-center  justify-end p-x-2">
      <!-- 列来源选择 -->
      <div class="flex flex-items-center m-r-10">
        <div class="m-r-2">列来源</div>
        <el-radio-group
          size="mini"
          :value="colSourceType"
          @input="emit('column-source-change', $event)"
        >
          <el-radio-button label="list">列表字段</el-radio-button>
          <el-radio-button
            label="add"
            :disabled="!canSwitchAdd"
          >新增字段</el-radio-button>
          <el-radio-button
            label="update"
            :disabled="!canSwitchUpdate"
          >编辑字段</el-radio-button>
        </el-radio-group>
      </div>
      <!-- 颜色图例 -->
      <div
        class="color-map flex flex-items-center m-r-20"
        v-if="!['add', 'addchildlist'].includes(childListType)"
      >
        <div class="color-map-item flex flex-items-center">
          <div class="color bg-[#2EA269] w-4 h-4 m-r-2 rounded"></div>
          <div class="text">新增</div>
        </div>
        <div class="color-map-item flex flex-items-center m-l-5">
          <div class="color bg-[#E83D4B] w-4 h-4 m-r-2 rounded"></div>
          <div class="text">更新</div>
        </div>
      </div>

      <!-- 网格按钮组 -->
      <div
        class="relative"
        v-if="gridButton && gridButton.length"
      >
        <div
          class="grid-button-box"
          :class="{ show: showGridButton }"
        >
          <el-button
            size="mini"
            type="primary"
            :title="item.button_name"
            v-for="item in gridButton"
            class="button"
            @click="emit('grid-button-click', item)"
          >
            {{ item.button_name }}
          </el-button>
        </div>
        <el-button
          class="icon-button mr-1"
          size="mini"
          type="primary"
          @click="toggleGridButton"
        >
          <i
            class="i-ic-sharp-keyboard-double-arrow-right icon"
            :class="{ show: showGridButton }"
            :title="showGridButton ? '收起操作按钮' : '展开操作按钮'"
          ></i>
        </el-button>
      </div>

      <!-- 刷新按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="emit('refresh-data')"
        v-if="!['add', 'addchildlist'].includes(childListType)"
        title="刷新（F5）"
      >
        <i class="i-ic-baseline-refresh"></i>
      </el-button>

      <!-- 保存按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="emit('save-data')"
        :disabled="!calcReqData || calcReqData.length == 0"
        v-if="!['add', 'addchildlist'].includes(childListType)"
        v-loading="onHandler"
        title="保存（Ctrl+S）"
      >
        <i class="i-ic-baseline-save"></i>
        <span
          v-if="autoSaveTimeout && autoSaveTimeout > 0"
          class="text-xs"
          title="自动保存倒计时"
        >
          {{ autoSaveTimeout }}
        </span>
      </el-button>

      <!-- 保存列宽按钮 -->
      <el-button
        class="icon-button"
        size="mini"
        type="primary"
        @click="emit('save-column-width')"
        v-loading="onHandler"
        :disabled="!calcColumnWidthReq || calcColumnWidthReq.length == 0"
        v-if="
          !childListType &&
          calcColumnWidthReq &&
          calcColumnWidthReq.length > 0
        "
        title="保存列宽"
      >
        <i class="i-ic-baseline-view-column"></i>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 定义组件名称
defineOptions({
  name: 'SheetToolbar'
})

// 定义 props
const props = defineProps({
  // 基础配置
  disabled: {
    type: Boolean,
    default: false
  },
  // 列来源选择
  colSourceType: {
    type: String,
    default: 'list'
  },
  canSwitchAdd: {
    type: Boolean,
    default: false
  },
  canSwitchUpdate: {
    type: Boolean,
    default: false
  },
  // 添加按钮配置
  addButton: {
    type: Object,
    default: null
  },
  insertRowNumber: {
    type: Number,
    default: 1
  },
  // 列表类型配置
  listType: {
    type: String,
    default: 'list'
  },
  isTree: {
    type: Boolean,
    default: false
  },
  childListType: {
    type: String,
    default: ''
  },
  // 网格按钮配置
  gridButton: {
    type: Array,
    default: () => []
  },
  // 状态数据
  calcReqData: {
    type: Array,
    default: () => []
  },
  calcColumnWidthReq: {
    type: Array,
    default: () => []
  },
  autoSaveTimeout: {
    type: Number,
    default: 0
  },
  onHandler: {
    type: Boolean,
    default: false
  }
})

// 定义 emits
const emit = defineEmits([
  'update:insertRowNumber',
  'batch-insert-rows',
  'list-type-change',
  'column-source-change',
  'grid-button-click',
  'refresh-data',
  'save-data',
  'save-column-width'
])

// 响应式数据
const showGridButton = ref(false)

// 方法
const toggleGridButton = () => {
  showGridButton.value = !showGridButton.value
}
</script>

<style scoped>
.icon-button {
  padding: 7px;
  min-width: 32px;
}

.grid-button-box {
  position: absolute;
  right: 100%;
  top: 0;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 10;
}

.grid-button-box.show {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.grid-button-box .button {
  white-space: nowrap;
  font-size: 12px;
  padding: 7px 12px;
}

.icon {
  transition: transform 0.3s ease;
}

.icon.show {
  transform: rotate(180deg);
}

.color-map-item .text {
  font-size: 12px;
  color: #666;
}
</style>