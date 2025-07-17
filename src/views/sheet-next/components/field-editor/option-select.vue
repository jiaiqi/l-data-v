<template>
  <div
    class="option-select"
    ref="selectorRef"
    v-clickoutside="handleClickOutside"
  >
    <el-select
      ref="selectRef"
      :value="setValue"
      placeholder="请选择"
      :disabled="disabled"
      :multiple="multiple"
      :collapse-tags="true"
      :loading="loading"
      :remote="remote"
      :filterable="filterable"
      :clearable="clearable"
      :remote-method="remoteMethod"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleSelectBlur"
    >
      <el-option
        v-for="item in options"
        :key="item[props.valueColumn]"
        :label="item[props.labelColumn]"
        :value="item[props.valueColumn]"
      >
      </el-option>
    </el-select>
    <!-- 自定义下拉箭头 -->
    <div class="custom-arrow" v-if="!disabled" @click.stop="handleArrowClick">
      <div class="arrow-triangle"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  value: {
    type: [String, Number],
    default: "",
  },
  options: {
    type: Array,
    default: () => [],
  },
  labelColumn: {
    type: String,
    default: "label",
  },
  valueColumn: {
    type: String,
    default: "value",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "请选择",
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  remoteMethod: {
    type: Function,
    default: null,
  },
  filterable: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:value", "change", "focus", "blur"]);

const selectorRef = ref(null);
const selectRef = ref(null);
const isFocused = ref(false);
const setValue = ref(null);
watch(
  () => props.value,
  (val) => {
    if (val) {
      if (props.multiple && typeof val === "string") {
        setValue.value = val.split(",");
      } else {
        setValue.value = val;
      }
    } else {
      setValue.value = null;
    }
  },
  {
    immediate: true,
  }
);
// 处理值变化
const handleChange = (val) => {
  if (props.multiple && val) {
    let newVal = val.join(",");
    emit("update:value", newVal);
    emit("change", newVal);
  } else {
    emit("update:value", val);
    emit("change", val);
  }
  nextTick(() => {
    emit("blur");
  });
};

// 处理获得焦点
const handleFocus = () => {
  isFocused.value = true;
  if (props.remoteMethod && typeof props.remoteMethod === "function") {
    props.remoteMethod();
  }
  emit("focus", selectorRef.value);
};

// 处理 select 失去焦点
const handleSelectBlur = () => {
  // 延迟处理，避免与点击箭头冲突
  setTimeout(() => {
    if (!isFocused.value) {
      console.log("blur");

      emit("blur", null);
    }
  }, 100);
};

// 处理箭头点击事件
const handleArrowClick = () => {
  if (selectRef.value && !props.disabled) {
    // 触发 el-select 的下拉显示/隐藏
    isFocused.value = true;
    selectRef.value.toggleMenu();
    emit("focus", selectorRef.value);
  }
};

// 处理外部点击事件
const handleClickOutside = () => {
  isFocused.value = false;
  emit("blur", null);
  // 关闭下拉菜单
  if (selectRef.value) {
    selectRef.value.blur();
  }
};
</script>

<style lang="scss" scoped>
.option-select {
  position: relative;
  width: 100%;
  ::v-deep .el-select {
    width: 100%;
    .el-input {
      width: 100%;
      .el-input__suffix {
        // display: none;
        .el-input__icon {
          display: none;
          &.el-icon-circle-close {
            display: inline-block;
          }
        }
      }
      .el-input__inner {
        width: 100%;
        padding: 0;
        text-indent: 5px;
      }
    }
  }

  .custom-arrow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateX(calc(100% + 5px)) translateY(-50%);
    z-index: 9;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid #333;
    cursor: pointer;

    &:hover {
      background: rgba($color: #f0f0f0, $alpha: 0.8);
    }

    .arrow-triangle {
      width: 0;
      height: 0;
      border: 6px solid transparent;
      border-top-color: #333;
      background: #fff;
      transform: translateY(2px);
      pointer-events: none;
    }
  }
}
</style>
