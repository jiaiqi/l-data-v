<template>
  <div class="header-cell">
    <span>{{ column.label }}</span>
    <el-tooltip
      class="item"
      effect="dark"
      content="当前列可编辑"
      placement="bottom-end"
      v-if="column.edit"
    >
      <img src="@/assets/img/edit.png" alt="" class="right-icon" />
    </el-tooltip>
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
          this.column.edit !== false &&
          ([
            "String",
            "MultilineText",
            "Integer",
            "Float",
            "Money",
            "Enum",
            "Date",
            "DateTime",
          ].includes(this.column.col_type) ||
            this.column.col_type.includes("decimal"))
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
