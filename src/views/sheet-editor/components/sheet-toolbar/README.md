# SheetToolbar 组件

## 概述

`SheetToolbar` 是从 `sheet-next/index.vue` 中抽离出来的独立工具栏组件，负责处理表格的工具栏功能。

## 功能特性

### 1. 添加行功能
- 支持设置添加行数
- 批量插入行操作
- 权限控制显示

### 2. 列表类型切换
- 普通列表/树型列表切换
- 仅在树形结构时显示

### 3. 操作按钮区域
- 颜色图例显示（新增/更新状态）
- 网格按钮组（可展开/收起）
- 刷新按钮
- 保存按钮（带自动保存倒计时）
- 保存列宽按钮

## Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| disabled | Boolean | false | 是否禁用工具栏 |
| addButton | Object | null | 添加按钮配置 |
| insertRowNumber | Number | 1 | 插入行数 |
| listType | String | 'list' | 列表类型 |
| isTree | Boolean | false | 是否为树形结构 |
| childListType | String | '' | 子列表类型 |
| gridButton | Array | [] | 网格按钮配置 |
| calcReqData | Array | [] | 计算请求数据 |
| calcColumnWidthReq | Array | [] | 列宽计算请求 |
| autoSaveTimeout | Number | 0 | 自动保存倒计时 |
| onHandler | Boolean | false | 是否正在处理操作 |

## Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| batch-insert-rows | 批量插入行 | - |
| list-type-change | 列表类型改变 | listType |
| grid-button-click | 网格按钮点击 | buttonItem |
| refresh-data | 刷新数据 | - |
| save-data | 保存数据 | - |
| save-column-width | 保存列宽 | - |
| update:insertRowNumber | 插入行数更新 | number |

## 使用示例

```vue
<template>
  <sheet-toolbar
    :disabled="disabled"
    :add-button="addButton"
    :insert-row-number.sync="insertRowNumber"
    :list-type="listType"
    :is-tree="isTree"
    :child-list-type="childListType"
    :grid-button="gridButton"
    :calc-req-data="calcReqData"
    :calc-column-width-req="calcColumnWidthReq"
    :auto-save-timeout="autoSaveTimeout"
    :on-handler="onHandler"
    @batch-insert-rows="batchInsertRows"
    @list-type-change="listTypeChange"
    @grid-button-click="onGridButton"
    @refresh-data="refreshData"
    @save-data="saveData"
    @save-column-width="saveColumnWidth"
  />
</template>
```

## 样式特性

- 响应式布局，支持不同屏幕尺寸
- 网格按钮组支持展开/收起动画
- 图标按钮统一样式
- 颜色图例清晰标识不同状态

## 文件结构

```
src/views/sheet-next/components/sheet-toolbar/
└── index.vue                 # 工具栏组件主文件
```

## 抽离说明

该组件从原始的 `sheet-next/index.vue` 文件的第16-159行抽离而来，包含：

1. **模板部分**：完整的工具栏HTML结构
2. **逻辑部分**：工具栏相关的数据和方法
3. **样式部分**：工具栏专用的CSS样式

抽离后的优势：
- 代码结构更清晰
- 组件职责单一
- 便于维护和复用
- 降低主文件复杂度