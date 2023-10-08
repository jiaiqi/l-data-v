<template>
  <div class="header-cell">
    <el-tooltip
      class="item"
      effect="dark"
      content="必填"
      placement="bottom-center"
      v-if="column.isRequired"
    >
      <span class="required color-red m-r-2 font-bold">*</span>
    </el-tooltip>
    <el-tooltip effect="dark" :content="column.label">
      <div class="label">{{ column.label }}</div>
    </el-tooltip>
    <el-tooltip
      class="item"
      effect="dark"
      content="当前列可编辑"
      placement="bottom-end"
      v-if="column.edit"
    >
      <i class="el-icon-edit-outline"></i>
      <!-- <img src="@/assets/img/edit.png" alt="" class="right-icon" /> -->
    </el-tooltip>
    <div
      class="sort-icon"
      @click="onSrotChange"
      v-if="
        !['MultilineText', 'File', 'Image', 'RichText'].includes(
          column.col_type
        )
      "
    >
      <i
        class="el-icon-caret-top cursor-pointer"
        :class="{ active: curSort === 'ASC' }"
      ></i>
      <i
        class="el-icon-caret-bottom"
        :class="{ active: curSort === 'DESC' }"
      ></i>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    column: Object,
    sortState: Object,
  },
  methods: {
    onSrotChange() {
      this.$emit("sort-change", this.column.columns);
    },
  },
  computed: {
    curSort() {
      if (this.column?.columns) {
        // return this.sortState?.get(this.column.columns);
        return this.sortState?.[this.column.columns];
      }
    },
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
  display: flex;
  align-items: center;
  justify-content: center;
  .label {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .right-icon {
    // position: absolute;
    // right: 10px;
    width: 20px;
    height: 20px;
  }
  .sort-icon {
    width: 20px;
    height: 20px;
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: column;
    cursor: pointer;

    .el-icon-caret-bottom {
      margin: -6px;
    }
    .active {
      color: #409eff;
    }
  }
}
</style>
