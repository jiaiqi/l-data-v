<template>
  <div
    class="action-button"
    :class="[buttonClass, { disabled: disabled }]"
    :title="title"
    @click="handleClick"
  >
    <img v-if="icon" :src="icon" class="btn-icon" :alt="text" />
    <i v-else-if="iconClass" :class="iconClass" class="btn-icon"></i>
    <span v-if="text" class="btn-text">{{ text }}</span>
  </div>
</template>

<script>
export default {
  name: 'ActionButton',
  props: {
    icon: {
      type: String,
      default: ''
    },
    iconClass: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    buttonClass: {
      type: String,
      default: ''
    }
  },
  emits: ['click'],
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click');
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 50px;

  .btn-icon {
    width: 18px;
    height: 18px;
    margin-bottom: 2px;
    transition: transform 0.2s ease, opacity 0.2s ease;
    font-size: 18px;
    color: #409eff;
  }

  .btn-text {
    font-size: 12px;
    color: #606266;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  &:hover:not(.disabled) {
    background: #f5f7fa;

    .btn-icon {
      transform: scale(1.1);
    }

    .btn-text {
      color: #409eff;
    }
  }

  &:active:not(.disabled) {
    background: #ecf5ff;

    .btn-icon {
      transform: scale(0.95);
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;

    .btn-icon {
      opacity: 0.5;
    }

    .btn-text {
      color: #c0c4cc;
    }
  }
}
</style>
