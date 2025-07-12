<template>
  <div class="columns-box">
    <div class="content-box">
      <div class="column-box">
        <column-box
          :singList="allColum"
          :allow-check="true"
          :checkedColumns.sync="checkedColumns"
          :endData="endData"
        ></column-box>
      </div>
      <div class="condition-box">
        <div
          class="sing_hual"
          v-for="(item, index) in listData"
          :key="index"
          v-show="item.show"
        >
          <column-box
            ref="child"
            @save="requestData"
            :singList="item"
            :endData="endData"
          ></column-box>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import columnBox from '@/components/column-box.vue'

export default {
  name: 'ColumnsConfig',
  components: {
    columnBox
  },
  props: {
    allColum: {
      type: Object,
      default: () => ({
        type: 'all',
        name: '字段',
        list: [],
        isClone: true,
        show: true,
      })
    },
    listData: {
      type: Array,
      default: () => [
        {
          type: 'condition',
          name: '过滤条件',
          list: [],
          isClone: false,
          show: false,
        },
        {
          type: 'group',
          name: '分组配置',
          list: [],
          isClone: false,
          show: true,
        },
        {
          type: 'aggregation',
          name: '聚合配置',
          list: [],
          isClone: false,
          show: true,
        },
        {
          type: 'order',
          name: '排序配置',
          list: [],
          isClone: false,
          show: false,
        },
      ]
    },
    checkedColumns: {
      type: Array,
      default: () => []
    },
    endData: {
      type: Object,
      default: () => ({
        condition: [],
        group: [],
        order: [],
        aggregation: [],
      })
    }
  },
  methods: {
    requestData(endList, endData) {
      this.$emit('data-change', endList, endData)
    }
  }
}
</script>

<style scoped lang="scss">
.columns-box {
  border-radius: 8px;
}

.content-box {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;

  .column-box {
    min-width: 20%;
    height: 500px;
    font-size: 14px;
    font-weight: 400;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
  }

  .condition-box {
    min-height: 500px;
    flex: 1;
    gap: 16px;
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));

    .sing_hual {
      height: 100%;
      min-height: 200px;
      max-height: 500px;
      width: 100%;
      display: flex;
      box-sizing: border-box;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
    }
  }
}
</style>