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

<script>
export default {
  name: "DropMenu",
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    row:{
      type: Object,
      default: () => {
        return {}
      }
    },
    position: {
      type: Object,
      required: true,
      default: () => ({ top: 0, left: 0 }),
    },
  },
  computed: {
    setItems(){
      if(Array.isArray(this.row?._buttons)&&this.row?._buttons.length){
        const buttonsPermission = this.row?._buttons
        return this.items.filter(item=>typeof item._index==='number'?buttonsPermission[item._index]===1:true)
      }else{
        return this.items
      }
    },
    menuStyle() {
      return {
        // top: this.position.top + "px",
        // left: this.position.left - 200 + "px",
        position: "fixed",
      };
    },
  },
  created() {
    console.log(this.items);
    this.$nextTick(() => {
      const { offsetWidth, offsetHeight } = this.$refs.maskRef;
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } =
        this.$refs.menuRef;
      this.$refs.menuRef.style.left =
        menuWidth + this.position.left > offsetWidth
          ? this.position.left - menuWidth + "px"
          : this.position.left + "px";
      this.$refs.menuRef.style.top =
        menuHeight + this.position.top > offsetHeight
          ? this.position.top - menuHeight + "px"
          : this.position.top + "px";
    });
  },
  methods: {
    closeMenu() {
      this.$emit("input", false);
    },
    selectItem(item) {
      this.$emit("select", item);
      this.closeMenu();
    },
  },
};
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
}

.drop-menu-content {
  list-style: none;
  margin: 0;
  padding: 0;
}

.drop-menu-content li {
  padding: 8px 16px;
  cursor: pointer;
}

.drop-menu-content li:hover {
  background-color: #f0f0f0;
  color: var(--primary-color);
}
</style>
