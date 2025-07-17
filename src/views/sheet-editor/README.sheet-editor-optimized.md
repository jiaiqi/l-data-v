# Sheet Editor 优化版组件

这是对原始 `sheet-editor/index.vue` 组件的优化重构版本，采用了模块化设计和 Vue 3 Composition API，提高了代码的可维护性和可扩展性。

## 📁 目录结构

```
sheet-editor/
├── components/                    # 子组件目录
│   ├── dialogs/                  # 弹窗组件
│   │   └── index.vue            # 弹窗管理组件
│   ├── pagination/              # 分页组件
│   │   └── index.vue            # 分页组件
│   ├── table-container/         # 表格容器组件
│   │   └── index.vue            # 表格组件
│   └── toolbar/                 # 工具栏组件
│       ├── index.vue            # 工具栏主组件
│       ├── toolbar-actions.vue  # 工具栏操作按钮
│       ├── toolbar-add-section.vue # 添加行区域
│       ├── toolbar-color-map.vue    # 颜色图例
│       ├── toolbar-grid-buttons.vue # 网格按钮
│       └── toolbar-list-type.vue    # 列表类型切换
├── composables/                 # 组合式函数
│   ├── useBroadcastChannel.js  # 广播通道管理
│   ├── useEditorState.js       # 编辑器状态管理
│   ├── useTableConfig.js       # 表格配置管理
│   ├── useTableData.js         # 表格数据管理
│   └── useTableEvents.js       # 表格事件管理
├── utils/                       # 工具函数
│   ├── cellStyleHandler.js     # 单元格样式处理
│   └── tableEventHandlers.js   # 表格事件处理
├── index.vue                   # 原始组件
└── sheet-editor-optimized.vue  # 优化版主组件
```

## 🚀 主要优化点

### 1. 组件拆分
- **工具栏组件**: 将工具栏功能拆分为多个子组件，每个组件负责特定功能
- **表格组件**: 独立的表格容器组件，专注于表格渲染和交互
- **弹窗组件**: 统一管理各种弹窗和对话框
- **分页组件**: 独立的分页功能组件

### 2. 状态管理优化
- **useTableData**: 管理表格数据的加载、保存、刷新等操作
- **useTableConfig**: 管理表格配置选项
- **useTableEvents**: 管理表格事件处理逻辑
- **useEditorState**: 管理编辑器状态
- **useBroadcastChannel**: 管理跨标签页通信

### 3. 代码复用
- **工具函数**: 提取通用的样式处理和事件处理逻辑
- **组合式函数**: 将相关逻辑封装为可复用的组合式函数

### 4. 性能优化
- **按需加载**: 组件按需加载，减少初始包大小
- **事件优化**: 优化事件处理逻辑，减少不必要的重渲染
- **状态优化**: 使用 reactive 和 ref 进行精确的响应式控制

## 📖 使用方法

### 基本使用

```vue
<template>
  <sheet-editor-optimized
    :disabled="false"
    :child-list-type="childListType"
    @data-change="handleDataChange"
    @save="handleSave"
  />
</template>

<script>
import SheetEditorOptimized from './sheet-editor-optimized.vue'

export default {
  components: {
    SheetEditorOptimized
  },
  data() {
    return {
      childListType: null
    }
  },
  methods: {
    handleDataChange(data) {
      console.log('数据变更:', data)
    },
    handleSave(data) {
      console.log('保存数据:', data)
    }
  }
}
</script>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| disabled | Boolean | false | 是否禁用编辑 |
| childListType | String | null | 子列表类型 |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| data-change | data | 数据变更时触发 |
| save | data | 保存数据时触发 |
| refresh | - | 刷新数据时触发 |
| cell-click | { row, column, rowIndex, columnIndex } | 单元格点击时触发 |
| row-click | { row, rowIndex } | 行点击时触发 |

## 🔧 自定义配置

### 表格配置

可以通过修改 `useTableConfig.js` 来自定义表格配置：

```javascript
// 自定义虚拟滚动配置
const tableOptions = computed(() => ({
  virtualScrollOption: {
    enable: true,
    scrolling: (data) => {
      // 自定义滚动处理逻辑
    }
  }
}))
```

### 样式自定义

可以通过修改 `cellStyleHandler.js` 来自定义单元格样式：

```javascript
// 自定义单元格样式
export function createCellStyleHandler(tableData, oldTableData) {
  return ({ row, column, rowIndex, columnIndex }) => {
    const classes = []
    
    // 添加自定义样式逻辑
    if (row.customFlag) {
      classes.push('custom-style')
    }
    
    return classes.join(' ')
  }
}
```

## 🎯 迁移指南

从原始组件迁移到优化版组件：

1. **替换组件引用**:
   ```javascript
   // 原来
   import SheetEditor from './sheet-editor/index.vue'
   
   // 现在
   import SheetEditorOptimized from './sheet-editor/sheet-editor-optimized.vue'
   ```

2. **更新事件处理**:
   ```javascript
   // 原来的事件可能需要重新映射
   // 参考新组件的事件文档进行调整
   ```

3. **检查自定义样式**:
   ```css
   /* 确保自定义样式与新的类名匹配 */
   .cell-add { /* 新增单元格样式 */ }
   .cell-update { /* 更新单元格样式 */ }
   ```

## 🐛 常见问题

### Q: 如何添加自定义工具栏按钮？
A: 在 `toolbar/toolbar-actions.vue` 中添加新的按钮组件。

### Q: 如何自定义单元格编辑器？
A: 修改 `dialogs/index.vue` 中的 `field-editor` 组件配置。

### Q: 如何处理大数据量的性能问题？
A: 启用虚拟滚动功能，在 `useTableConfig.js` 中设置 `virtualScrollOption.enable = true`。

## 📝 开发说明

### 添加新功能

1. **新增组合式函数**: 在 `composables/` 目录下创建新的组合式函数
2. **新增工具函数**: 在 `utils/` 目录下创建新的工具函数
3. **新增子组件**: 在 `components/` 目录下创建新的子组件

### 代码规范

- 使用 Vue 3 Composition API
- 遵循单一职责原则
- 保持组件的纯净性
- 添加适当的注释和文档

## 🔄 版本历史

- **v1.0.0**: 初始优化版本，完成基本的组件拆分和状态管理优化
- **v1.1.0**: 添加广播通道支持，优化事件处理机制
- **v1.2.0**: 完善工具函数，提升代码复用性

## 📞 支持

如有问题或建议，请联系开发团队或提交 Issue。