<template>
  <div
    class="sheet-toolbar flex items-center justify-between px-4 py-2 w-full bg-white border-b border-gray-200 shadow-sm"
    v-if="!disabled"
  >
    <!-- 左侧：添加行区域 -->
    <div
      class="toolbar-left flex items-center gap-2 flex-shrink-0 min-w-[250px]"
      v-if="addButton && addButton.service_name"
    >
      <div class="text-sm text-gray-700 whitespace-nowrap">添加</div>
      <el-input-number
        size="mini"
        :value="insertRowNumber"
        style="width: 70px"
        @input="emit('update:insertRowNumber', $event)"
        controls-position="right"
      />
      <div class="text-sm text-gray-700 whitespace-nowrap">行</div>
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
    <div class="toolbar-left flex-shrink-0 min-w-[250px] h-8" v-else>
      <!-- 没有添加权限时的占位，保持布局稳定 -->
    </div>

    <!-- 中间：列表类型切换 -->
    <div class="toolbar-center flex-1 flex justify-center items-center px-4">
      <el-radio-group
        :value="listType"
        @input="emit('list-type-change', $event)"
        size="mini"
        v-if="isTree"
        class="flex items-center gap-1"
      >
        <el-radio-button label="list" size="mini">普通列表</el-radio-button>
        <el-radio-button label="treelist" size="mini">树型列表</el-radio-button>
      </el-radio-group>
      <!-- 普通列表时显示占位，保持布局对称 -->
      <div v-else class="h-8 w-[180px]"></div>
    </div>

    <!-- 右侧：操作按钮区域 -->
    <div
      class="toolbar-right flex items-center justify-end gap-2 flex-shrink-0"
      v-if="showRightSection"
    >
      <!-- 字段来源选择组 -->
      <div
        class="button-group flex items-center gap-3 p-1 rounded-lg bg-gray-50 mr-2 hidden md:flex"
      >
        <div class="text-xs text-gray-600 whitespace-nowrap">字段来源：</div>
        <el-radio-group
          size="mini"
          :value="colSourceType"
          @input="emit('column-source-change', $event)"
        >
          <el-radio-button
            label="custom"
            v-if="colSrv && !normalService.includes(colSrv)"
            size="mini"
            >自定义</el-radio-button
          >
          <el-radio-button label="list" size="mini">列表</el-radio-button>
          <el-radio-button label="add" :disabled="!canSwitchAdd" size="mini"
            >新增</el-radio-button
          >
          <el-radio-button
            label="update"
            :disabled="!canSwitchUpdate"
            size="mini"
            >编辑</el-radio-button
          >
        </el-radio-group>
      </div>

      <!-- 颜色图例 - 只在中等以上屏幕显示 -->
      <div
        class="color-map flex items-center gap-4 m-r-2 hidden lg:flex"
        v-if="!['add', 'addchildlist'].includes(childListType)"
      >
        <div class="color-map-item flex items-center gap-1">
          <div class="color bg-[#2EA269] w-3 h-3 rounded"></div>
          <div class="text-xs text-gray-600">新增</div>
        </div>
        <div class="color-map-item flex items-center gap-1">
          <div class="color bg-[#E83D4B] w-3 h-3 rounded"></div>
          <div class="text-xs text-gray-600">更新</div>
        </div>
      </div>

      <!-- 网格按钮组 -->
      <div class="relative" v-if="gridButton && gridButton.length">
        <div
          class="grid-button-box absolute right-full top-0 flex gap-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
          :class="{
            'opacity-100 translate-x-0': showGridButton,
            'opacity-0 -translate-x-2 pointer-events-none': !showGridButton,
          }"
          style="transition: all 0.2s ease"
        >
          <el-button
            size="mini"
            type="primary"
            :title="item.button_name"
            v-for="item in gridButton"
            :key="item.button_name"
            class="button"
            @click="emit('grid-button-click', item)"
          >
            {{ item.button_name }}
          </el-button>
        </div>
        <el-button
          class="icon-button"
          size="mini"
          type="primary"
          @click="toggleGridButton"
          title="操作按钮"
        >
          <i
            class="i-ic-sharp-keyboard-double-arrow-right icon"
            :class="{ 'rotate-180': showGridButton }"
            :title="showGridButton ? '收起操作按钮' : '展开操作按钮'"
          ></i>
        </el-button>
      </div>

      <!-- 功能按钮组 -->
      <div class="button-group flex items-center gap-1">
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
            class="text-xs ml-1"
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

        <!-- 超级管理员模式切换 -->
        <el-button
          size="mini"
          :type="isSuperAdmin ? 'warning' : 'primary'"
          @click="emit('toggle-super-admin')"
          v-if="isAdmin"
          :title="
            isSuperAdmin ? '点击退出超级管理员模式' : '点击切换到超级管理员模式'
          "
          class="admin-button icon-button flex items-center gap-1"
        >
          <i class="i-ic-baseline-admin-panel-settings"></i>
          <span class="text-xs hidden sm:inline">{{
            isSuperAdmin ? "超管" : "正常"
          }}</span>
        </el-button>

        <!-- 显示所有字段按钮 -->
        <el-button
          size="mini"
          :type="showAllFields ? 'success' : 'primary'"
          @click="emit('toggle-show-all-fields')"
          v-if="isSuperAdmin"
          :title="
            showAllFields
              ? '点击退出显示全部字段模式'
              : '点击切换为显示所有字段'
          "
          class="icon-button flex items-center gap-1"
        >
          <i class="i-ri:table-view"></i>
          <span class="text-xs hidden sm:inline">{{
            showAllFields ? "全部" : "默认"
          }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { env, baseURL } from "@/common/http";
// 定义组件名称
defineOptions({
  name: "SheetToolbar",
});

// 定义 props
const props = defineProps({
  // 基础配置
  disabled: {
    type: Boolean,
    default: false,
  },
  // 列来源选择
  colSourceType: {
    type: String,
    default: "list",
  },
  serviceName: {
    type: String,
    default: "",
  },
  normalService: {
    type: Array,
    default: () => [],
  },
  colSrv: {
    type: String,
    default: "",
  },
  canSwitchAdd: {
    type: Boolean,
    default: false,
  },
  canSwitchUpdate: {
    type: Boolean,
    default: false,
  },
  // 添加按钮配置
  addButton: {
    type: Object,
    default: null,
  },
  insertRowNumber: {
    type: Number,
    default: 1,
  },
  // 列表类型配置
  listType: {
    type: String,
    default: "list",
  },
  isTree: {
    type: Boolean,
    default: false,
  },
  childListType: {
    type: String,
    default: "",
  },
  // 网格按钮配置
  gridButton: {
    type: Array,
    default: () => [],
  },
  // 状态数据
  calcReqData: {
    type: Array,
    default: () => [],
  },
  calcColumnWidthReq: {
    type: Array,
    default: () => [],
  },
  autoSaveTimeout: {
    type: Number,
    default: 0,
  },
  onHandler: {
    type: Boolean,
    default: false,
  },
  // 超级管理员模式
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  showAllFields: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// 定义 emits
const emit = defineEmits([
  "update:insertRowNumber",
  "batch-insert-rows",
  "list-type-change",
  "column-source-change",
  "grid-button-click",
  "refresh-data",
  "save-data",
  "save-column-width",
  "toggle-super-admin",
  "toggle-show-all-fields",
]);

// 响应式数据
const showGridButton = ref(false);
const showRightSection = computed(() => {
  return env !== "yanxue";
});

// 方法
const toggleGridButton = () => {
  showGridButton.value = !showGridButton.value;
};
</script>

<style scoped>
/* 主工具栏样式 */
.sheet-toolbar {
  box-sizing: border-box;
  font-size: 12px;
}

/* 统一按钮样式 */
.icon-button {
  padding: 5px 8px;
  min-width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-button ::v-deep span {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 左侧添加区域 */
.toolbar-left {
  box-sizing: border-box;
}

::v-deep .el-input .el-input__inner {
  padding-right: 30px;
  padding-left: 0;
}
::v-deep .el-input--mini .el-input__inner {
  height: 30px;
  line-height: 30px;
}
/* 中间区域 */
.toolbar-center {
  box-sizing: border-box;
}

/* 右侧区域 */
.toolbar-right {
  box-sizing: border-box;
}

/* 按钮组样式 */
.button-group {
  box-sizing: border-box;
}

/* 网格按钮下拉菜单 */
.grid-button-box {
  box-sizing: border-box;
}

.grid-button-box .button {
  white-space: nowrap;
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  line-height: 1;
}

/* 颜色图例 */
.color-map {
  box-sizing: border-box;
}

.color-map-item {
  box-sizing: border-box;
}

/* 图标旋转动画 */
.icon {
  transition: transform 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sheet-toolbar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 6px;
  }

  .toolbar-left {
    min-width: auto;
    order: 2;
  }

  .toolbar-center {
    order: 1;
    flex: 1 1 100%;
    padding: 0;
    margin-bottom: 8px;
  }

  .toolbar-right {
    order: 3;
    min-width: auto;
  }

  .color-map {
    display: none;
  }

  .admin-button span,
  .toolbar-right .el-button span {
    display: none;
  }
}

@media (max-width: 576px) {
  .toolbar-left {
    flex: 1 1 100%;
    justify-content: center;
  }

  .toolbar-right {
    flex: 1 1 100%;
    justify-content: center;
  }

  .icon-button {
    padding: 4px 6px;
    min-width: 28px;
    height: 24px;
  }
}

/* 按钮悬停效果优化 */
.el-button:hover {
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

/* 列表类型切换按钮样式 */
.el-radio-button__inner {
  font-size: 12px;
  padding: 4px 12px;
}
</style>
