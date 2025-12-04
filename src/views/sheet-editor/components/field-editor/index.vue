<template>
  <div
    class="editor-wrap"
    :class="{ focus: onfocus === true }"
    :style="setPosition"
    @click.stop=""
    v-if="
      setPosition && !['RichText', 'MultilineText'].includes(editorType) && show
    "
  >
    <el-date-picker
      v-model="modelValue"
      align="right"
      :type="editorType.toLowerCase()"
      placeholder="选择日期"
      :value-format="dateFormat"
      :clearable="false"
      @change="$emit('change', modelValue, row, column)"
      @blur="handleClose"
      v-if="['Date', 'DateTime'].includes(editorType)"
    >
    </el-date-picker>
    <option-select
      v-else-if="['Enum', 'Dict', 'Set'].includes(editorType)"
      v-model="modelValue"
      :options="fieldInfo.option_list_v2"
      :disabled="setDisabled"
      :multiple="['Set'].includes(editorType)"
      @change="handleEnumChange"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    >
    </option-select>
    <finder
      class="finder"
      ref="finder"
      :row="row"
      :column="fieldInfo"
      :app="app"
      :operate-type="operateType"
      :field-info="fieldInfo"
      :detailButton="detailButton"
      v-model="modelValue"
      @change="onFinderChange"
      @focus="onfocus = true"
      @blur="onfocus = false"
      v-else-if="
        ['autocomplete', 'fk', 'fks', 'fkjsons', 'fkjson'].includes(editorType)
      "
    >
    </finder>
  </div>

  <el-dialog
    :visible="editorVisible"
    @close="handleClose"
    :before-close="handleClose"
    :close-on-click-modal="false"
    width="90vw"
    v-else-if="
      editorVisible && ['MultilineText', 'RichText'].includes(editorType)
    "
  >
    <div
      class="remark"
      v-if="fieldInfo && fieldInfo.remark"
    >
      <el-popover
        placement="right bottom"
        width="800"
        v-model="visible"
      >
        <div class="p-2 m-2 b-gray b-1px b-dashed rounded-sm">
          <div v-html="recoverFileAddress(fieldInfo.remark)"></div>
        </div>
        <div
          slot="reference"
          class="text-orange cursor-pointer inline-block"
        >
          <i class="el-icon-warning"></i> 提示
        </div>
      </el-popover>
    </div>
    <div :style="setStyle">
      <rich-text-editor
        v-if="editorType === 'RichText'"
        v-model="modelValue"
        :mode="mode"
        :editable="editable"
        :dialogFullscreen="dialogFullscreen"
      ></rich-text-editor>
      <!-- <div
        v-else-if="editorType === 'MultilineText'"
        contenteditable="true"
        :class="{ 'bg-gray-100': hasChange }"
        @input="changeModelValue"
        @keydown.ctrl.s="onlySaveValue"
      >
        {{ modelValue }}
      </div> -->
      <el-input
        type="textarea"
        :rows="10"
        :disabled="!editable"
        :placeholder="(column && column.__field_info && column.__field_info.placeholder) ||
          '请输入内容'
          "
        v-model="modelValue"
        @input="changeModelValue"
        v-else-if="editorType === 'MultilineText'"
      >
      </el-input>
      <div
        class="text-orange text-center"
        v-if="!disabled && !editable"
      >
        <span class="mr-20px"> 当前字段不可编辑 </span>
        <el-button
          type="text"
          @click="dialogFullscreen = !dialogFullscreen"
        >
          <i
            class="el-icon-full-screen"
            v-if="!dialogFullscreen"
          ></i>
          <i
            class="el-icon-switch-button"
            v-else
          ></i>
          <span v-if="!dialogFullscreen">全屏</span>
          <span v-else>退出全屏</span>
        </el-button>
      </div>
      <div
        class="text-center m-t-5 flex justify-between"
        v-if="!disabled && editable"
      >
        <div></div>
        <div class="flex-1 text-center">
          <el-button
            type="primary"
            plain
            @click="
              confirmValue
            "
          >确认</el-button>
          <el-button
            type="primary"
            :disabled="!hasChange"
            @click="onlySaveValue

            "
          >
            仅保存
            <span
              v-if="autoSaveTimeout && autoSaveTimeout > 0"
              class="text-xs"
              title="自动保存倒计时"
            >
              {{ autoSaveTimeout }}
            </span>
          </el-button>
        </div>
        <div></div>
      </div>
    </div>

    <el-image
      style="width: 0; height: 0; overflow: hidden"
      :src="url"
      :preview-src-list="srcList"
      :initial-index="initialIndex"
      id="imgPreview"
    >
    </el-image>
  </el-dialog>
</template>

<script setup>
/**
 * @fileoverview 字段编辑器组件 - 支持多种字段类型的编辑功能
 * @description 提供日期、枚举、外键、富文本、多行文本等字段类型的编辑界面
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  isRichText,
  isFk,
  isFkAutoComplete,
  getFieldType,
} from "@/utils/sheetUtils.js";
import Finder from "./finder.vue";
import RichTextEditor from "./rich-text.vue";
import OptionSelect from "./option-select.vue";

/**
 * 组件 Props 定义
 * @typedef {Object} FieldEditorProps
 * @property {string|number} value - 字段值，用于 v-model 绑定
 * @property {boolean} show - 控制编辑器显示隐藏
 * @property {string|number} oldValue - 原始值，用于比较变化
 * @property {boolean} editable - 是否可编辑
 * @property {boolean} disabled - 是否禁用
 * @property {Object} row - 行数据对象
 * @property {Object} column - 列配置对象，包含字段信息
 * @property {string} listType - 列表类型
 * @property {string} app - 应用标识
 * @property {string} serviceName - 服务名称
 * @property {Object} detailButton - 详情按钮配置
 * @property {string} keyDispCol - 关键显示列
 * @property {Object} position - 编辑器位置信息 {left, top, width, height}
 */
const props = defineProps({
  value: {
    type: [String, Number],
    default: "",
    validator: (value) => value !== undefined
  },
  show: {
    type: Boolean,
    default: false
  },
  oldValue: {
    type: [String, Number],
    default: undefined
  },
  editable: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  row: {
    type: Object,
    default: () => ({})
  },
  column: {
    type: Object,
    default: () => ({}),
    validator: (value) => value && typeof value === 'object'
  },
  listType: {
    type: String,
    default: ''
  },
  app: {
    type: String,
    default: ''
  },
  serviceName: {
    type: String,
    default: ''
  },
  detailButton: {
    type: Object,
    default: () => ({})
  },
  keyDispCol: {
    type: String,
    default: ''
  },
  position: {
    type: Object,
    default: () => ({}),
    validator: (value) => !value || (typeof value === 'object' && value.width && value.height)
  }
})

/**
 * 组件事件定义
 * @typedef {Object} FieldEditorEmits
 * @property {Function} change - 值变化事件 (value, row, column)
 * @property {Function} save - 保存事件 (value, row, column, type)
 * @property {Function} close - 关闭事件
 * @property {Function} focus - 获得焦点事件
 * @property {Function} blur - 失去焦点事件
 * @property {Function} update:show - 显示状态更新事件
 * @property {Function} fk-change - 外键变化事件 (item, row, column)
 * @property {Function} fk-autocomplete-change - 外键自动完成变化事件 (item, row, column)
 * @property {Function} fks-change - 多外键变化事件 (item, row, column)
 */
const emit = defineEmits([
  'change',
  'save',
  'close',
  'focus',
  'blur',
  'update:show',
  'fk-change',
  'fk-autocomplete-change',
  'fks-change'
])

// ==================== 响应式数据定义 ====================

/** @type {import('vue').Ref<string>} 图片预览URL */
const url = ref("")

/** @type {import('vue').Ref<string[]>} 图片预览列表 */
const srcList = ref([])

/** @type {import('vue').Ref<number>} 图片预览初始索引 */
const initialIndex = ref(0)

/** @type {import('vue').Ref<any>} 票据信息 */
const ticket = ref(null)

/** @type {import('vue').Ref<any>} 编辑器实例 */
const editor = ref(null)

/** @type {import('vue').Ref<string>} 编辑器模式：default 或 simple */
const mode = ref("default")

/** @type {import('vue').Ref<string>} 当前编辑值 */
const modelValue = ref("")

/** @type {import('vue').Ref<boolean>} 是否展开（默认收起） */
const unfold = ref(false)

/** @type {import('vue').Ref<boolean>} 折叠加载状态 */
const loadingFold = ref(false)

/** @type {import('vue').Ref<boolean>} 对话框是否全屏 */
const dialogFullscreen = ref(false)

/** @type {import('vue').Ref<boolean>} 编辑器对话框显示状态 */
const editorVisible = ref(props.show)

/** @type {import('vue').Ref<NodeJS.Timeout|null>} 自动保存定时器 */
const autoSaveInterval = ref(null)

/** @type {import('vue').Ref<number>} 自动保存倒计时（秒） */
const autoSaveTimeout = ref(0)

/** @type {import('vue').Ref<boolean>} 提示框显示状态 */
const visible = ref(false)

/** @type {import('vue').Ref<boolean>} 编辑器是否获得焦点 */
const onfocus = ref(false)

// ==================== 模板引用 ====================

/** @type {import('vue').Ref<any>} Finder 组件引用 */
const finder = ref(null)

// ==================== 计算属性 ====================

/**
 * 计算是否禁用编辑器
 * @returns {boolean} 当disabled为true或editable为false时返回true
 */
const setDisabled = computed(() => {
  return props.disabled || props.editable === false
})

/**
 * 计算当前字段的编辑器类型
 * @returns {string|undefined} 编辑器类型：RichText、autocomplete、fk、Date、DateTime等
 */
const editorType = computed(() => {
  if (props.show) {
    // 富文本类型判断
    if (isRichText(fieldInfo.value)) {
      return "RichText"
    }
    // 外键自动完成类型判断
    if (isFkAutoComplete(fieldInfo.value)) {
      return "autocomplete"
    }
    // 外键类型判断
    else if (isFk(fieldInfo.value)) {
      return "fk"
    }
    // 获取通用字段类型
    return getFieldType(fieldInfo.value)
  }
})

/**
 * 获取字段信息配置
 * @returns {Object|undefined} 字段配置信息对象
 */
const fieldInfo = computed(() => {
  return props.column?.__field_info
})

/**
 * 获取操作类型
 * @returns {string} 操作类型，默认为 'update'
 */
const operateType = computed(() => {
  return props.row?.__flag || "update"
})

/**
 * 计算编辑器的绝对定位样式
 * @returns {string} CSS样式字符串，包含left、top、width、height
 */
const setPosition = computed(() => {
  if (props.position && props.position.width && props.show) {
    // 根据焦点状态调整位置和尺寸，焦点时无偏移，非焦点时有3px偏移
    let left = onfocus.value ? props.position.left : props.position.left + 3
    let top = onfocus.value ? props.position.top : props.position.top + 3
    let width = onfocus.value
      ? props.position.width
      : props.position.width - 8  // 减去左右各3px偏移 + 2px边框
    let height = onfocus.value
      ? props.position.height
      : props.position.height - 8  // 减去上下各3px偏移 + 2px边框

    return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`
  } else {
    return ""
  }
})

/**
 * 检查当前值是否有变化
 * @returns {boolean} 当前值与原始值不同时返回true
 */
const hasChange = computed(() => {
  return modelValue.value !== props.value
})

/**
 * 计算行样式，主要用于缩进处理
 * @returns {string} CSS变量字符串
 */
const setStyle = computed(() => {
  let str = ""
  // 如果是第一列且有缩进信息，设置缩进CSS变量
  if (props.row?.__indent && props.column.isFirstCol) {
    str += `--row_indent:${props.row?.__indent}px;`
  }
  return str
})

/**
 * 根据编辑器类型返回对应的日期格式
 * @returns {string|undefined} 日期格式字符串
 */
const dateFormat = computed(() => {
  if (editorType.value === "Date") {
    return "yyyy-MM-dd"
  } else if (editorType.value === "DateTime") {
    return "yyyy-MM-dd HH:mm:ss"
  }
})

// ==================== 方法定义 ====================

/**
 * 处理枚举类型字段值变化
 * @param {any} val - 新的枚举值
 */
const handleEnumChange = (val) => {
  modelValue.value = val
  emit("change", val, props.row, props.column)
}

/**
 * 触发自动完成功能
 * @param {string} val - 触发自动完成的值
 */
const triggerAutocomplete = (val) => {
  finder.value?.triggerAutocomplete?.(val)
}

/**
 * 处理Finder组件的值变化
 * @param {Object|null} item - 选中的项目对象
 * @param {string} item.value - 项目值
 * @param {string} item.label - 项目标签
 * @param {boolean} item.option - 是否为选项
 */
const onFinderChange = (item = null) => {
  // 处理外键类型
  if (isFk(fieldInfo.value)) {
    modelValue.value = item?.value || null
    emit("fk-change", item, props.row, props.column)
    return
  }

  // 处理选项类型
  if (item && item?.option) {
    modelValue.value = item?.label || null
  }

  // 处理外键自动完成类型
  if (isFkAutoComplete(fieldInfo.value)) {
    modelValue.value = item?.value || null
    emit("fk-autocomplete-change", item, props.row, props.column)
  }

  // 处理多外键类型
  const colType = fieldInfo.value.col_type
  if (["fks", "fkjson", "fkjsons"].includes(colType)) {
    emit("fks-change", item, props.row, props.column)
  }
}

/**
 * 处理模型值变化事件
 * @param {any} val - 新值
 */
const changeModelValue = (val) => {
  if(val?.target?.innerHTML){
    // modelValue.value = val.target.innerHTML
  }else {
    modelValue.value = val
  }
  console.log("changeModelValue", val);
  // emit("change", val, props.row, props.column)
}

const confirmValue = () => {
  editorVisible.value = false
  emit("change", modelValue.value, props.row, props.column)
}
const onlySaveValue = () => {
  emit("save", modelValue.value, props.row, props.column, "save")
  stopAutoSave()
}


/**
 * 处理键盘事件，主要监听Ctrl+S保存快捷键
 * @param {KeyboardEvent} e - 键盘事件对象
 */
const onKeyDown = (e) => {
  // 监听 Ctrl+S 或 Cmd+S 保存快捷键
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault()  // 阻止浏览器默认保存行为

    // 只有在编辑器可见、可编辑且有变化时才触发保存
    if (editorVisible.value && props.editable && hasChange.value) {
      emit("save", modelValue.value, props.row, props.column, "save")
      stopAutoSave()  // 停止自动保存计时器
    }
  }
}

/**
 * 停止自动保存功能
 * 清除定时器并重置倒计时
 */
const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value)
  }
  autoSaveInterval.value = null
  autoSaveTimeout.value = 0
}

/**
 * 启动自动保存功能
 * 设置3分钟倒计时，到时自动保存
 */
const autoSave = () => {
  stopAutoSave()  // 先停止之前的自动保存

  // 如果当前值与原始值相同，无需保存
  if (modelValue.value === props.value) {
    console.log("没有需要保存的内容")
    return
  }

  // 设置3分钟（180秒）倒计时
  autoSaveTimeout.value = 60 * 3
  autoSaveInterval.value = setInterval(() => {
    autoSaveTimeout.value--
    console.log(`自动保存倒计时：${autoSaveTimeout.value}`)

    // 倒计时结束，执行自动保存
    if (autoSaveTimeout.value <= 0) {
      autoSaveTimeout.value = 0
      clearInterval(autoSaveInterval.value)
      console.log("即将进行自动保存")
      emit("save", modelValue.value, props.row, props.column, "save")
    }
  }, 1000)  // 每秒更新一次倒计时
}

/**
 * 处理编辑器打开事件
 * @param {Object} params - 打开参数配置
 */
const handleOpen = (params = {}) => {
  // 处理打开逻辑，预留扩展
}

/**
 * 处理编辑器关闭事件
 * 关闭对话框并触发关闭事件
 */
const handleClose = () => {
  editorVisible.value = false
  emit("close")
  console.log("关闭")
}

/**
 * 处理富文本编辑器中图片的双击事件
 * 实现图片预览功能
 * @param {MouseEvent} eve - 鼠标事件对象
 */
const dblListener = (eve) => {
  console.log(eve)

  // 检查是否点击的是富文本编辑器中的图片
  if (
    eve.target?.offsetParent?.className.indexOf("w-e-image-container") > -1 &&
    eve.target.currentSrc
  ) {
    url.value = eve.target.currentSrc
    const arr = []
    let imgIndex = 0

    // 收集页面中所有富文本编辑器的图片
    document
      .querySelectorAll(".w-e-image-container")
      .forEach((item, index) => {
        item.children.forEach((iItem) => {
          if (iItem.tagName === "IMG" && iItem.src) {
            arr.push(iItem.src)
            // 记录当前点击图片的索引
            if (iItem.src === eve.target.currentSrc) {
              imgIndex = index
            }
          }
        })
      })

    srcList.value = arr
    initialIndex.value = imgIndex

    // 延迟触发图片预览组件
    setTimeout(() => {
      document.getElementById("imgPreview")?.click()
    }, 200)

    eve.stopPropagation()
    eve.preventDefault()
  }
}

// ==================== 监听器 ====================

/**
 * 监听props.value变化，同步到modelValue
 * 当外部传入的value发生变化时，更新内部的modelValue
 */
watch(
  () => props.value,
  (newVal = "") => {
    if (modelValue.value !== newVal) {
      modelValue.value = newVal
    }
  },
  { immediate: true }  // 立即执行一次
)

/**
 * 监听props.show变化，控制编辑器显示状态
 * 当外部控制的show状态变化时，同步更新editorVisible并停止自动保存
 */
watch(
  () => props.show,
  (newVal) => {
    // 监听外部值变化
    if (editorVisible.value !== newVal) {
      editorVisible.value = newVal
      stopAutoSave()  // 隐藏时停止自动保存
    }
  },
  { immediate: true }  // 立即执行一次
)

/**
 * 监听editorVisible变化，处理编辑器显示/隐藏的副作用
 * 包括事件监听器的添加/移除、状态重置等
 */
watch(editorVisible, (newVal) => {
  console.log("editorVisible:", newVal)

  // 同步外部show状态
  if (newVal !== props.show) {
    emit("update:show", newVal)
  }

  if (newVal) {
    // 编辑器显示时，添加图片双击事件监听
    window.addEventListener("dblclick", dblListener)
  } else {
    // 编辑器隐藏时，移除事件监听并重置状态
    window.removeEventListener("dblclick", dblListener)
    srcList.value = []
    url.value = ""
    initialIndex.value = 0
    modelValue.value = ""
  }
})

/**
 * 监听modelValue变化，触发自动保存
 * 当编辑内容发生变化时，启动自动保存倒计时
 */
watch(modelValue, (newVal) => {
  if (newVal !== props.value) {
    autoSave()  // 启动自动保存
  }
})

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载后的初始化操作
 * 添加全局键盘事件监听器
 */
onMounted(() => {
  // 添加全局键盘事件监听，主要用于Ctrl+S保存快捷键
  document.addEventListener("keydown", onKeyDown)
})

/**
 * 组件卸载前的清理操作
 * 移除事件监听器，清理定时器，重置状态
 */
onBeforeUnmount(() => {
  // 移除键盘事件监听器
  document.removeEventListener("keydown", onKeyDown)
  // 停止自动保存定时器
  stopAutoSave()
  // 重置编辑值
  modelValue.value = ""
})

// ==================== 暴露给父组件的方法 ====================

/**
 * 暴露给父组件的方法和属性
 * 使用defineExpose让父组件可以调用这些方法
 */
defineExpose({
  /**
   * 触发自动完成功能
   * @param {string} val - 触发值
   */
  triggerAutocomplete,

  /**
   * 打开编辑器
   * @param {Object} params - 打开参数
   */
  handleOpen,

  /**
   * 关闭编辑器
   */
  handleClose,

  /**
   * 停止自动保存
   */
  stopAutoSave
})
</script>

<style
  lang="scss"
  scoped
>
.editor-wrap {
  position: absolute;
  // overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  ::v-deep .el-input {
    display: flex;
    align-items: center;
    height: 100%;

    .el-input__inner,
    .el-input__icon {
      display: flex;
      align-items: center;
      height: 100%;

    }

    .el-input__prefix {
      display: flex;
      align-items: center;
      left: 0;
    }

    .el-input__suffix {
      display: flex;
      align-items: center;
      right: 0;
    }
  }

  &.focus {
    border: 2px solid #4b89ff;
  }

  .finder {
    width: 100%;
  }

  ::v-deep .el-date-editor {
    height: 100%;
    line-height: 100%;
    background: transparent;

    .el-input__prefix {
      .el-icon-date {
        display: none;
      }
    }

    .el-input__inner {
      height: 100%;
      line-height: 100%;
      background: transparent;
      padding-right: 0;
      padding-left: 6px;
      border: none;
    }
  }
}

// .fk-autocomplete {
//   z-index: 9;
//   position: fixed;
//   overflow: hidden;
// }

.remark {
  margin-top: -50px;
  line-height: 40px;
}
</style>