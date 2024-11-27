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
        <span @click.stop.prevent="setCurrentTenant(item)">
          {{ item.tenant_name }}
        </span>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import { computed, onMounted } from 'vue';
const userStore = useUserStore();
console.log(userStore);

const tenants = computed(() => userStore.tenants);
const currentTenant = computed(() => userStore.currentTenant);
const setCurrentTenant = (item) => {
  userStore.setCurrentTenant(item)
};
// onMounted(() => {
//   if (!currentTenant.value && tenants.value.length > 0) {
//     userStore.setCurrentTenant(tenants.value[0]);
//   }
// })
</script>

<style
  lang="scss"
  scoped
></style>