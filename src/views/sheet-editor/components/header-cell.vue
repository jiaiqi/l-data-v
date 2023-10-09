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
      v-if="column.editable"
    >
      <i class="el-icon-edit-outline"></i>
      <!-- <img src="@/assets/img/edit.png" alt="" class="right-icon" /> -->
    </el-tooltip>
    <div class="filter-icon cursor-pointer">
      <header-filter :column="column" @filter-change="filterChange"></header-filter>
      <!-- <el-popover
        placement="bottom"
        width="200"
        trigger="click"
        v-model="filterVisible"
      >
        <div class="filter-box">
          <div class="option-list">
            <el-checkbox-group
              v-model="checkedOption"
              @change="handleCheckedChange"
            >
              <el-checkbox
                v-for="item in optionList"
                :label="item.value"
                :key="item.value"
                >{{ item.label }}</el-checkbox
              >
            </el-checkbox-group>
          </div>
          <div class="handler-bar flex justify-end m-t-2">
            <el-button
              class="text-gray"
              size="mini"
              @click="filterVisible = false"
              >取消</el-button
            >
            <el-button size="mini" @click="toFilter">确定</el-button>
          </div>
        </div>

        <svg
          slot="reference"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 16 16"
        >
          <path
            :fill="onFilter?'#409eff':'currentColor'"
            d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"
          />
        </svg>
      </el-popover> -->
    </div>
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
import headerFilter from "./header-filter.vue";
export default {
  components: {
    headerFilter,
  },
  props: {
    column: Object,
    sortState: Object,
  },
  data() {
    return {
      checkedOption: [],
      oldCheckedOption: [],
      onFilter: false,
      filterVisible: false,
    };
  },
  methods: {
    filterChange(val){
      console.log(val);
      this.$emit('filter-change',val)
    },
    toFilter() {
      this.filterVisible = false;
      this.$emit("filter-change", {
        colName: this.column.columns,
        ruleType: "in",
        value: this.checkedOption.toString(),
        remove: !this.checkedOption?.length,
      });
      this.onFilter = !!this.checkedOption?.length;
    },
    handleCheckedChange(e) {
      console.log(e);
    },
    onSrotChange() {
      this.$emit("sort-change", this.column.columns);
    },
  },
  computed: {
    optionList() {
      return this.column.col_type === "Enum" &&
        this.column?.option_list_v2?.length
        ? this.column?.option_list_v2
        : null;
    },
    curSort() {
      if (this.column?.columns) {
        // return this.sortState?.get(this.column.columns);
        return this.sortState?.[this.column.columns];
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
  .filter-icon {
    position: absolute;
    right: 20px;
    display: inline-block;
    position: absolute;
    right: 0;
  }
  .filter-box {
    .handler-bar {
      text-align: center;
      .el-button {
      }
    }
  }
  .sort-icon {
    width: 20px;
    height: 20px;

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
