<template>
  <el-dropdown v-if="tenants && tenants.length > 1">
    <span class="el-dropdown-link">
      <div class="px-10px flex items-center text-sm cursor-pointer hover-text-blue">
        <span v-if="currentTenant && currentTenant.tenant_name">
          {{ currentTenant.tenant_name }}
        </span>
        <span v-else>选择租户</span>
        <i class="i-ri:organization-chart"></i>
      </div>
    </span>
    <el-dropdown-menu
      v-if="tenants && tenants.length"
      class="max-h-50vh overflow-auto"
    >
      <el-dropdown-item
        v-for="(item, index) in tenants"
        :key="index"
      >
        <span
          class="w-full inline-block"
          @click.stop.prevent="setCurrentTenant(item)"
          :class="{
            'text-blue':
              currentTenant && item.tenant_no === currentTenant.tenant_no,
          }"
        >
          {{ item.tenant_name }}
        </span>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script setup>
import { computed } from "vue";
import { MessageBox, Message } from "element-ui";
import { useUserStore } from "@/stores/user.js";

const userStore = useUserStore();

const tenants = computed(() => userStore.tenants.value);
const currentTenant = computed(() => userStore.currentTenant.value);
const setCurrentTenant = (item) => {
  MessageBox.confirm(
    `是否切换到【${item.tenant_name}】此操作成功后将刷新页面, 是否继续?`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(() => {
      return userStore.setCurrentTenant(item).then(() => {
        if (window.confirm("租户登录成功，是否刷新页面？")) {
          top.window.location.reload()
        }
      });

    })
    .catch(() => {
      Message({
        type: "info",
        message: "已取消操作",
      });
    });
};
</script>

<style
  lang="scss"
  scoped
></style>