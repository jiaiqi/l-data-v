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

      <!-- 开发者按钮下拉菜单 -->
      <el-dropdown v-if="isDeveloper" trigger="hover" size="mini">
        <el-button type="primary" size="mini">
          <i class="el-icon-setting"></i>
          <span>开发</span>
          <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item>
            <el-button
              type="text"
              @click="handleDeveloperRefresh"
              title="刷新列表"
              size="mini"
            >
              <i class="el-icon-refresh"></i>
              刷新V2及列表
            </el-button>
          </el-dropdown-item>
          <el-dropdown-item v-if="serviceName">
            <el-button
              type="text"
              @click="handleToTableDefineDetail"
              title="跳转到表定义详情"
              size="mini"
            >
              <i class="el-icon-setting"></i>
              表定义详情
            </el-button>
          </el-dropdown-item>
          <el-dropdown-item>
            <el-button
              type="text"
              @click="copyServiceName"
              title="复制service"
              size="mini"
            >
              <i class="el-icon-document-copy"></i>
              复制service
            </el-button>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

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

        <!-- 保存所选按钮 -->
        <el-button
          class="icon-button"
          size="mini"
          type="success"
          @click="emit('save-checked-data')"
          :disabled="!checkedReqData || checkedReqData.length == 0"
          v-if="!['add', 'addchildlist'].includes(childListType)"
          v-loading="onHandler"
          title="保存勾选的行"
        >
          <i class="i-ic-baseline-save-alt"></i>
          <span class="text-xs ml-1">保存所选</span>
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
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-ui";
import { env, baseURL } from "@/common/http";

// 定义 props
const props = defineProps({
  // V2数据
  v2data: {
    type: Object,
    default: null,
  },
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
  srvApp: {
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
  checkedReqData: {
    type: Array,
    default: () => [],
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
  "save-checked-data",
  "save-column-width",
  "toggle-super-admin",
  "toggle-show-all-fields",
]);

// 响应式数据
const showGridButton = ref(false);

const showRightSection = computed(() => {
  return env !== "yanxue";
});

// 开发者相关计算属性
const isDeveloper = computed(() => {
  // 是否 开发角色 是的话才会显示表定义详情按钮
  let userInfo = top.user 
  if(sessionStorage.current_login_user){
    try{
      userInfo = JSON.parse(sessionStorage.current_login_user)
    }catch(e){
      userInfo = {}
    }
  }
  const user_type = userInfo?.user_type;
  return user_type === "KF" || props.isSuperAdmin || false;
  return props.isSuperAdmin || props.isAdmin || false;
});

// 开发者菜单方法
const copyServiceName = () => {
  if (props.serviceName) {
    const input = document.createElement("input");
    input.value = props.serviceName;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    ElMessage({
      message: "service已复制",
      type: "success",
    });
  }
};

const handleDeveloperRefresh = () => {
  emit("refresh-v2-data");
};

const handleToTableDefineDetail = () => {
  if (props.serviceName) {
        // 跳转到表定义详情页
      const table_name = props.v2data.main_table
      const table_name_cn = props.v2data.service_view_name?.replace(/列表|查询/g, "") + '(表定义详情)';
      const service = 'srvsys_table_defined_select';
      const srvApp = props.srvApp || "";
      const url = `/vpages/#/detail/${service}/table_name/${table_name}?srvApp=${srvApp}`;
      addTabByUrl(url, table_name_cn);
  }
};
const addTabByUrl = function (url, tab_title, urlParams, type) {
  url = url || common_page_path[type] + "?data=" + urlParams;
  let page = {
    title: tab_title || "新标页签",
    url,
  };

  if (window.top.tab && window.top.tab.addTab) {
    window.top.tab.addTab(page);
  } else {
    let strWindowFeatures =
      "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
    let newWindow = window.open(url, "CNN_WindowName", strWindowFeatures);
    newWindow.document.title = tab_title;
  }
};

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
