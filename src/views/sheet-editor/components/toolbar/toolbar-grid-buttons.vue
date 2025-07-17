<template>
  <div class="relative">
    <div
      class="grid-button-box"
      :class="{ show: show }"
    >
      <el-button
        size="mini"
        type="primary"
        :title="item.button_name"
        v-for="item in buttons"
        :key="item.button_name"
        class="button"
        @click="$emit('button-click', item)"
      >
        {{ item.button_name }}
      </el-button>
    </div>
    <el-button
      class="icon-button mr-1"
      size="mini"
      type="primary"
      @click="$emit('toggle')"
    >
      <i
        class="i-ic-sharp-keyboard-double-arrow-right icon"
        :class="{ show: show }"
        :title="show ? '收起操作按钮' : '展开操作按钮'"
      ></i>
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'ToolbarGridButtons',
  props: {
    buttons: {
      type: Array,
      default: () => []
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['button-click', 'toggle']
}
</script>

<style lang="scss" scoped>
.grid-button-box {
  overflow: hidden;
  transition: all 0.3s ease;
  position: absolute;
  right: 40px;
  transform: translateX(100%);
  background-color: #fff;
  opacity: 0;
  width: 0;
  padding: 0 5px;

  &.show {
    display: flex;
    transform: translateX(0);
    opacity: 1;
    width: unset;
    z-index: 9;
  }

  .button {
    margin-left: 5px;
  }
}

.icon-button {
  padding: 4px;

  .icon {
    transform: rotate(180deg);
    transition: all 0.3s ease-in-out;

    &.show {
      transform: rotate(0);
    }
  }

  [class*="i-ic-"] {
    font-size: 16px;
  }
}
</style>