<template>
  <div class="selection-stats-container">
    <!-- 统计信息显示条 -->
    <div 
      class="stats-bar"
      @click="toggleMenu"
      title="设置统计选项"
    >
      <i class="el-icon-arrow-up"  :class="{ 'rotate': showMenu }"></i>
      <div class="stats-info" v-if="visible === true">
        <span 
          v-for="item in displayStats" 
          :key="item.key"
          class="stats-item"
        >
          {{ item.label }}={{ item.value }}
        </span>
      </div>
    </div>
    
    <!-- 统计选项菜单 -->
    <div 
      v-if="showMenu"
      class="stats-menu"
    >
      <el-checkbox-group v-model="selectedStats" @change="onStatsChange">
        <el-checkbox 
          v-for="stat in availableStats" 
          :key="stat.key"
          :label="stat.key"
        >
          {{ stat.label }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectionStats',
  props: {
    // 统计数据
    stats: {
      type: Object,
      default: () => ({
        sum: 0,
        count: 0,
        numericCount: 0,
        avg: 0,
        min: 0,
        max: 0
      })
    },
    // 是否显示
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 显示的菜单
      showMenu: false,
      // 可用的统计项
      availableStats: [
        { key: 'avg', label: '平均值' },
        { key: 'count', label: '计数' },
        { key: 'numericCount', label: '数值计数' },
        { key: 'min', label: '最小值' },
        { key: 'max', label: '最大值' },
        { key: 'sum', label: '求和' }
      ],
      // 默认选中的统计项
      selectedStats: ['avg', 'count', 'sum']
    }
  },
  computed: {
    // 显示的统计项
    displayStats() {
      return this.selectedStats.map(key => {
        const stat = this.availableStats.find(s => s.key === key)
        if (stat) {
          return {
            ...stat,
            value: this.formatValue(this.stats[key])
          }
        }
        return null
      }).filter(Boolean)
    }
  },
  methods: {
    // 切换菜单显示
    toggleMenu() {
      this.showMenu = !this.showMenu
    },
    // 统计项选择变化
    onStatsChange() {
      // 如果没有选中任何统计项，默认选中三个
      if (this.selectedStats.length === 0) {
        this.selectedStats = ['avg', 'count', 'sum']
      }
    },
    // 格式化数值
    formatValue(value) {
      if (value === null || value === undefined) return '0'
      if (typeof value === 'number') {
        // 保留两位小数
        return value.toFixed(2)
      }
      return value
    }
  }
}
</script>

<style scoped>
.selection-stats-container {
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.stats-bar {
  display: flex;
  align-items: center;
  padding: 2px 12px;
  gap: 10px;
  transition: all 0.2s;
}

.stats-info {
  display: flex;
  gap: 15px;
}

.stats-item {
  display: flex;
  align-items: center;
}

/* .stats-item::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4fc3f7;
  border-radius: 50%;
  margin-right: 5px;
} */

.el-icon-arrow-up {
  font-size: 10px;
  transition: transform 0.2s;
}

.el-icon-arrow-up.rotate {
  transform: rotate(180deg);
}

.stats-menu {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-radius: 0 0 4px 4px;
  position: absolute;
  transform: translateY(-100%);
  top: 0;
  left: 0;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 8px;
}

.el-checkbox {
  font-size: 12px;
}

.el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #4fc3f7;
  border-color: #4fc3f7;
}

.el-checkbox__input.is-checked+.el-checkbox__label {
  color: #4fc3f7;
}
</style>