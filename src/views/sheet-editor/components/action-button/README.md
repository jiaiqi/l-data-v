# Action Button 组件

可复用的操作按钮组件，包含单个按钮和按钮容器。

## 组件结构

```
action-button/
├── index.js              # 导出文件
├── ActionButton.vue      # 单个按钮组件
├── ActionButtonGroup.vue # 按钮容器组件
└── README.md             # 使用文档
```

## 组件说明

### ActionButton

单个操作按钮组件。

**Props:**
- `icon` (String): 按钮图标 URL
- `iconClass` (String): 按钮图标类名（可选）
- `text` (String): 按钮文本
- `title` (String): 按钮提示文本
- `disabled` (Boolean): 是否禁用
- `buttonClass` (String): 自定义按钮类名

**Events:**
- `click`: 点击按钮时触发

**Usage:**
```vue
<ActionButton
  :icon="addIcon"
  text="新增"
  title="新增记录"
  @click="handleAdd"
/>
```

### ActionButtonGroup

按钮容器组件，自动管理多个按钮的布局。

**Props:**
- `buttons` (Array): 按钮配置数组

**按钮配置对象结构:**
```javascript
{
  key: 'add',              // 唯一标识
  icon: addIcon,           // 图标（可选）
  iconClass: 'el-icon-add', // 图标类名（可选）
  text: '新增',            // 按钮文本
  title: '新增记录',       // 提示文本
  disabled: false,         // 是否禁用
  className: 'btn-add',    // 自定义类名
  handler: () => {}         // 点击处理函数
}
```

**Events:**
- `button-click`: 点击按钮时触发，回传按钮配置对象

**Usage:**
```vue
<action-button-group
  v-if="actionButtons.length > 0"
  :buttons="actionButtons"
  @button-click="handleButtonClick"
/>
```

## 使用示例

### 在组件中定义按钮

```javascript
computed: {
  actionButtons() {
    const buttons = [];
    
    if (this.canAdd) {
      buttons.push({
        key: 'add',
        icon: addIcon,
        text: '新增',
        title: '新增记录',
        className: 'btn-add',
        handler: this.handleAdd
      });
    }
    
    if (this.canEdit) {
      buttons.push({
        key: 'edit',
        icon: editIcon,
        text: '编辑',
        title: '编辑记录',
        className: 'btn-edit',
        handler: this.handleEdit
      });
    }
    
    return buttons;
  }
}
```

### 在模板中使用

```vue
<template>
  <div class="my-component">
    <el-input v-model="value" />
    
    <action-button-group
      v-if="actionButtons.length > 0"
      :buttons="actionButtons"
    />
  </div>
</template>

<script>
import { ActionButtonGroup } from './action-button';

export default {
  components: {
    ActionButtonGroup
  },
  // ... rest of component
}
</script>
```

## 样式特点

- 垂直排列的按钮组
- 白色背景带阴影和圆角边框
- 悬浮时按钮放大效果
- 点击时按钮缩小反馈
- 禁用状态半透明处理
- 平滑的过渡动画

## 最佳实践

1. **按钮数据集中管理**: 在 computed 中统一管理按钮配置
2. **条件显示**: 根据权限和业务状态动态决定按钮显示
3. **统一事件处理**: 集中处理按钮点击事件
4. **图标管理**: 将图标导入集中在一个地方
