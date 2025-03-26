<template>
  <div class="header-cell">
    <div class="flex items-center justify-between w-full flex-row-reverse truncate" v-if="!childListType">
      <div class="flex items-center">
        <div class="filter-icon cursor-pointer">
          <header-filter :column="column" :condition="condition" :app="app" :list="list" :service="service"
            @filter-change="filterChange"></header-filter>
        </div>
        <div class="sort-icon" @click="onSrotChange" v-if="!['MultilineText', 'File', 'Image', 'RichText','snote'].includes(
          column.col_type
        )
          ">
          <i class="el-icon-caret-top cursor-pointer" :class="{ active: curSort === 'ASC' }"></i>
          <i class="el-icon-caret-bottom" :class="{ active: curSort === 'DESC' }"></i>
        </div>
      </div>
      <div class="flex items-center ">
        <el-tooltip class="item" effect="dark" content="必填" placement="bottom-center" v-if="column.isRequired">
          <span class="required color-red m-r-2 font-bold">*</span>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="可编辑列" placement="bottom-end" v-if="column.editable">
          <i class="el-icon-edit-outline"></i>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="autocomplete" placement="bottom-end" v-if="isFkAutoComplete(column)">
          <i class="el-icon-edit"></i>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="fk" placement="bottom-end" v-if="isFk(column)">
          <i class="el-icon-search"></i>
        </el-tooltip>
      </div>

    </div>
    <div class="flex items-center w-full"
    :class="{
      'justify-center':!childListType,
      'justify-start p-x-2':!!childListType
    }"
    >
      <el-tooltip class="item" effect="dark" content="必填" placement="bottom-center" v-if="childListType&&column.isRequired">
        <span class="required color-red m-r-2 font-bold">*</span>
      </el-tooltip>
      <el-tooltip effect="dark" :content="column.label">
        <div class="label truncate">{{ column.label }}</div>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
import headerFilter from "./header-filter.vue";
import { isFkAutoComplete ,isFk} from '@/utils/sheetUtils.js'

export default {
  components: {
    headerFilter,
  },
  props: {
    column: Object,
    sortState: Object,
    app: String,
    service: String,
    list: Array,
    condition: Array,
    childListType:String
  },
  data() {
    return {
      checkedOption: [],
      oldCheckedOption: [],
      onFilter: false,
      filterVisible: false,
      isFkAutoComplete,
      isFk
    };
  },
  methods: {
    filterChange(val) {
      console.log(val);
      this.$emit("filter-change", val);
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
  flex-direction: column;

  // color: #fff;
  .label {
    // max-width: 150px;
    font-size: 16px;
  }

  .right-icon {
    // position: absolute;
    // right: 10px;
    width: 20px;
    height: 20px;
  }

  .filter-icon {
    // position: absolute;
    // right: 20px;
    display: inline-block;
    // right: 0;
  }

  .filter-box {
    .handler-bar {
      text-align: center;

      .el-button {}
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
