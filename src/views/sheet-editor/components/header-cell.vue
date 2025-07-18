<template>
  <div class="header-cell">
    <div class="flex items-center justify-between w-full flex-row-reverse truncate " v-if="!childListType">
      <div class="flex items-center header-util-box">
        <div class="icon filter-icon cursor-pointer">
          <header-filter 
            :column="column" 
            :condition="condition" 
            :app="app" 
            :list="list" 
            :service="service"
            @filter-change="handleFilterChange"
          />
        </div>
        <div 
          class="icon sort-icon" 
          @click="handleSortChange" 
          v-if="!nonSortableTypes.includes(column.col_type)"
        >
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
        <el-tooltip class="item" effect="dark" content="autocomplete" placement="bottom-end" v-if="isAutoCompleteField">
          <i class="el-icon-edit"></i>
        </el-tooltip>
        <el-tooltip class="item" effect="dark" content="fk" placement="bottom-end" v-if="isForeignKeyField">
          <i class="el-icon-search"></i>
        </el-tooltip>
      </div>
    </div>
    <div 
      class="flex items-center w-full"
      :class="{
        'justify-center': !childListType,
        'justify-start p-x-2': !!childListType
      }"
    >
      <el-tooltip class="item" effect="dark" content="必填" placement="bottom-center" v-if="childListType && column.isRequired">
        <span class="required color-red m-r-2 font-bold">*</span>
      </el-tooltip>
      <el-tooltip effect="dark" :content="column.label">
        <div class="label truncate">{{ column.label }}</div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import headerFilter from "./header-filter.vue"
import { isFkAutoComplete, isFk } from '@/utils/sheetUtils.js'

// Props 定义
const props = defineProps({
  column: {
    type: Object,
    required: true,
    default: () => ({})
  },
  sortState: {
    type: Object,
    default: () => ({})
  },
  app: {
    type: String,
    default: ''
  },
  service: {
    type: String,
    default: ''
  },
  list: {
    type: Array,
    default: () => []
  },
  condition: {
    type: Array,
    default: () => []
  },
  childListType: {
    type: String,
    default: ''
  }
})

// Emits 定义
const emit = defineEmits(['filter-change', 'sort-change'])

// 响应式数据
const checkedOption = ref([])
const oldCheckedOption = ref([])
const onFilter = ref(false)
const filterVisible = ref(false)

// 常量定义
const nonSortableTypes = ['MultilineText', 'File', 'Image', 'RichText', 'snote']

// 计算属性
const optionList = computed(() => {
  return props.column.col_type === "Enum" &&
    props.column?.option_list_v2?.length
    ? props.column?.option_list_v2
    : null
})

const curSort = computed(() => {
  if (props.column?.columns) {
    return props.sortState?.[props.column.columns]
  }
  return undefined
})

const isAutoCompleteField = computed(() => {
  return isFkAutoComplete(props.column)
})

const isForeignKeyField = computed(() => {
  return isFk(props.column)
})

// 方法定义
const handleFilterChange = (val) => {
  console.log('Filter change:', val)
  emit("filter-change", val)
}

const handleSortChange = () => {
  emit("sort-change", props.column.columns)
}

const toFilter = () => {
  filterVisible.value = false
  emit("filter-change", {
    colName: props.column.columns,
    ruleType: "in",
    value: checkedOption.value.toString(),
    remove: !checkedOption.value?.length,
  })
  onFilter.value = !!checkedOption.value?.length
}

const handleCheckedChange = (e) => {
  console.log('Checked change:', e)
}
</script>

<style lang="scss" scoped>
.header-cell {
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  // .header-util-box .icon{
  //   display: none;
  // }
  // &:hover{
  //   .header-util-box .icon{
  //     display: flex;
  //   }
  // }
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
