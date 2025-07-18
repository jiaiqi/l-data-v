<template>
  <div class="drop-menu">
    <div class="drop-menu-mask" ref="maskRef" @click="closeMenu"></div>
    <ul class="drop-menu-content" ref="menuRef" :style="menuStyle">
      <li
        v-for="(item, index) in setItems"
        :key="index"
        @click="selectItem(item)"
        class="drop-menu-item"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'

// Props 定义
const props = defineProps({
  value: {
    type: Boolean,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  row: {
    type: Object,
    default: () => ({})
  },
  position: {
    type: Object,
    required: true,
    default: () => ({ top: 0, left: 0 }),
  },
})

// Emits 定义
const emit = defineEmits(['input', 'select'])

// 模板引用
const maskRef = ref(null)
const menuRef = ref(null)

// 计算属性
const setItems = computed(() => {
  if (Array.isArray(props.row?._buttons) && props.row?._buttons.length) {
    const buttonsPermission = props.row._buttons
    return props.items.filter(item => 
      typeof item._index === 'number' 
        ? buttonsPermission[item._index] === 1 
        : true
    )
  } else {
    return props.items
  }
})

const menuStyle = computed(() => ({
  position: "fixed",
}))

// 方法定义
const closeMenu = () => {
  emit("input", false)
}

const selectItem = (item) => {
  emit("select", item)
  closeMenu()
}

const positionMenu = () => {
  if (!maskRef.value || !menuRef.value) return
  
  const { offsetWidth, offsetHeight } = maskRef.value
  const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuRef.value
  
  // 计算菜单位置，避免超出视窗
  const left = menuWidth + props.position.left > offsetWidth
    ? props.position.left - menuWidth
    : props.position.left
    
  const top = menuHeight + props.position.top > offsetHeight
    ? props.position.top - menuHeight
    : props.position.top
  
  menuRef.value.style.left = `${left}px`
  menuRef.value.style.top = `${top}px`
}

// 生命周期
onMounted(() => {
  console.log('Drop menu items:', props.items)
  nextTick(() => {
    positionMenu()
  })
})
</script>

<style scoped>
.drop-menu-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 999;
}

.drop-menu-content {
  width: 200px;
  border: 1px solid #ccc;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  list-style: none;
  margin: 0;
  padding: 0;
}

.drop-menu-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.drop-menu-item:hover {
  background-color: #f0f0f0;
  color: var(--primary-color);
}
</style>
