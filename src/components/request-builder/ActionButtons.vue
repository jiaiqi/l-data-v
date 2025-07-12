<template>
  <div class="btn-box">
    <el-button @click="handlePreview" type="success" icon="el-icon-view"
      >预览</el-button
    >
    <el-button @click="handleSave" type="primary" icon="el-icon-upload"
      >保存</el-button
    >
  </div>
</template>

<script>
export default {
  name: 'ActionButtons',
  methods: {
    handlePreview() {
      this.$emit('preview')
    },
    handleSave() {
      this.$emit('save')
    }
  }
}
</script>

<style scoped lang="scss">
.btn-box {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;

  .el-button {
    padding: 10px 24px;
    font-weight: 500;
    border-radius: 4px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.el-button--success {
      background: linear-gradient(135deg, #50b11f, #85ce61);
      border-color: #85ce61;
    }

    &.el-button--primary {
      background: linear-gradient(135deg, #1989fa, #096dd9);
      border-color: #409eff;
    }
  }
}
</style>