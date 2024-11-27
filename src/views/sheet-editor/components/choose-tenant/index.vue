<template>
  <!-- <div v-if="currentTenant&&currentTenant.tenant_name" class="px-10px flex items-center text-sm">
    {{ currentTenant.tenant_name }}
    <i class="i-ri:exchange-2-fill  cursor-pointer"></i>
  </div> -->
  <el-dropdown v-if="tenants && tenants.length > 1">
    <span class="el-dropdown-link">
      <div v-if="currentTenant && currentTenant.tenant_name"
        class="px-10px flex items-center text-sm cursor-pointer hover-text-blue">
        {{ currentTenant.tenant_name }}
        <i class="i-ri:exchange-2-fill  "></i>
      </div>
      <div class="px-10px flex items-center text-sm cursor-pointer hover-text-blue" v-else>选择租户</div>
    </span>
    <el-dropdown-menu v-if="tenants && tenants.length">
      <el-dropdown-item v-for="(item, index) in tenants" :key="index">
        <span @click.stop.prevent="setCurrentTenant(item)" :class="{'text-blue': currentTenant && item.tenant_no === currentTenant.tenant_no}">
          {{ item.tenant_name }}
        </span>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import {MessageBox,Message} from 'element-ui'
const userStore = useUserStore();

const tenants = computed(() => userStore.tenants);
const currentTenant = computed(() => userStore.currentTenant);
const setCurrentTenant = (item) => {
  MessageBox.confirm(`是否切换到【${item.tenant_name}】此操作成功后将刷新页面, 是否继续?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.setCurrentTenant(item)
    Message({
      type: 'success',
      message: '操作成功!'
    });
  }).catch(() => {
    Message({
      type: 'info',
      message: '已取消操作'
    });
  });
};
</script>

<style
  lang="scss"
  scoped
></style>