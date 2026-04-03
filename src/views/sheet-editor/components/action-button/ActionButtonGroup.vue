<template>
  <div class="action-button-group" v-if="buttons && buttons.length > 0">
    <ActionButton
      v-for="(button, index) in buttons"
      :key="button.key || index"
      :icon="button.icon"
      :icon-class="button.iconClass"
      :text="button.text"
      :title="button.title"
      :disabled="button.disabled"
      :button-class="button.className"
      @click="handleButtonClick(button)"
    />
  </div>
</template>

<script>
import ActionButton from './ActionButton.vue'

export default {
  name: 'ActionButtonGroup',
  components: {
    ActionButton
  },
  props: {
    buttons: {
      type: Array,
      default: () => []
    }
  },
  emits: ['button-click'],
  methods: {
    handleButtonClick(button) {
      if (button.handler) {
        button.handler()
      }
      this.$emit('button-click', button)
    }
  }
}
</script>

<style lang="scss" scoped>
.action-button-group {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateX(calc(100% + 8px)) translateY(-50%);
  z-index: 9;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 6px 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
