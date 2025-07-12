# Request Builder 组件

这是一个请求构建器组件集合，将原来的单一大组件拆分为多个可复用的子组件。

## 组件结构

### 1. RequestForm.vue
**功能**: 请求表单配置
- 接口名称输入
- 应用名称选择
- 接口类型选择
- 服务名称选择
- 请求参数选项配置

**Props**:
- `value`: 表单数据对象
- `allApp`: 应用列表
- `allService`: 服务列表
- `checkedReqOptions`: 已选择的请求选项

**Events**:
- `input`: 表单数据变化
- `app-change`: 应用变化
- `service-change`: 服务变化
- `req-option-change`: 请求选项变化

### 2. ColumnsConfig.vue
**功能**: 字段配置和条件设置
- 字段选择
- 过滤条件配置
- 分组配置
- 聚合配置
- 排序配置

**Props**:
- `allColum`: 所有字段信息
- `listData`: 配置列表数据
- `checkedColumns`: 已选择的字段
- `endData`: 最终数据

**Events**:
- `data-change`: 数据变化事件

### 3. ActionButtons.vue
**功能**: 操作按钮
- 预览按钮
- 保存按钮

**Events**:
- `preview`: 预览事件
- `save`: 保存事件

### 4. DataPreview.vue
**功能**: 数据预览和导出
- 数据表格显示
- 分页功能
- Excel导出功能

**Props**:
- `tableData`: 表格数据
- `tableTitle`: 表格标题
- `previewInfo`: 分页信息
- `serviceName`: 服务名称

**Events**:
- `export`: 导出事件
- `size-change`: 页面大小变化
- `current-change`: 当前页变化

## 使用方法

```vue
<template>
  <div>
    <!-- 表单配置 -->
    <RequestForm
      v-model="ruleForm"
      :allApp="allApp"
      :allService="allService"
      :checkedReqOptions="checkedReqOptions"
      @app-change="handleAppChange"
      @service-change="handleServiceChange"
      @req-option-change="handleReqOptionChange"
    />

    <!-- 字段配置 -->
    <ColumnsConfig
      :allColum="allColum"
      :listData="listData"
      :checkedColumns.sync="checkedColumns"
      :endData="endData"
      @data-change="handleDataChange"
    />

    <!-- 操作按钮 -->
    <ActionButtons
      @preview="handlePreview"
      @save="handleSave"
    />

    <!-- 数据预览 -->
    <DataPreview
      :tableData="tableData"
      :tableTitle="tableTitle"
      :previewInfo="previewInfo"
      :serviceName="ruleForm.serviceName"
      @export="handleExport"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
import {
  RequestForm,
  ColumnsConfig,
  ActionButtons,
  DataPreview
} from '@/components/request-builder'

export default {
  components: {
    RequestForm,
    ColumnsConfig,
    ActionButtons,
    DataPreview
  },
  // ... 其他配置
}
</script>
```

## 优势

1. **模块化**: 每个组件职责单一，便于维护
2. **可复用**: 子组件可以在其他地方独立使用
3. **可测试**: 每个组件可以独立测试
4. **可扩展**: 新功能可以通过新增组件或扩展现有组件实现
5. **代码清晰**: 代码结构更清晰，易于理解

## 文件结构

```
src/components/request-builder/
├── RequestForm.vue      # 请求表单组件
├── ColumnsConfig.vue    # 字段配置组件
├── ActionButtons.vue    # 操作按钮组件
├── DataPreview.vue      # 数据预览组件
├── index.js            # 统一导出文件
└── README.md           # 说明文档
```