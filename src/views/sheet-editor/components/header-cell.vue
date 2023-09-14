<template>
  <div class="header-cell">
    <span>{{ column.label }}</span>
    <img src="@/assets/img/edit.png" alt="" class="right-icon" v-if="editable" />
  </div>
</template>

<script>
export default {
  props: {
    column: Object,
  },
  computed: {
    editable() {
      if (this.column?.col_type) {
        return (
          [
            "String",
            "MultilineText",
            "Integer",
            "Float",
            "Money",
            "Enum",
            "Date",
          ].includes(this.column.col_type) ||
          this.column.col_type.includes("decimal")
        );
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.header-cell {
  text-align: center;
  position: relative;
  .right-icon {
    position: absolute;
    right: 10px;
    width: 20px;
    height: 20px;
  }
}
</style>
