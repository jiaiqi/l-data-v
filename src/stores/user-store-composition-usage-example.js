// user-store-composition-usage-example.js
// 展示如何在 Vue 2.7 中使用组合式 API 风格的 Pinia user store

import { defineComponent, computed, watch, onMounted } from 'vue'
import { useUserStore } from './user'

// ==================== 1. 在组件中的基础使用 ====================
export const UserProfileComponent = defineComponent({
  name: 'UserProfile',
  setup() {
    // 获取 store 实例
    const userStore = useUserStore()

    // 直接解构响应式状态和计算属性
    const {
      userInfo,
      isLoggedIn,
      displayName,
      avatarUrl,
      userRoles,
      loginLoading
    } = userStore

    // 解构方法
    const {
      setUserInfo,
      updateUserInfo,
      logout,
      hasRole,
      hasAnyRole
    } = userStore

    // 本地计算属性
    const isAdmin = computed(() => hasRole('admin'))
    const canManageUsers = computed(() => hasAnyRole(['admin', 'user_manager']))

    // 监听用户信息变化
    watch(userInfo, (newUserInfo, oldUserInfo) => {
      console.log('用户信息已更新:', { newUserInfo, oldUserInfo })
    }, { deep: true })

    // 组件方法
    const handleUpdateProfile = async (profileData) => {
      try {
        updateUserInfo(profileData)
        // 显示成功消息
      } catch (error) {
        console.error('更新用户信息失败:', error)
        // 显示错误消息
      }
    }

    const handleLogout = async () => {
      try {
        await logout()
        // 跳转到登录页
      } catch (error) {
        console.error('登出失败:', error)
      }
    }

    return {
      // 状态
      userInfo,
      isLoggedIn,
      displayName,
      avatarUrl,
      userRoles,
      loginLoading,
      
      // 计算属性
      isAdmin,
      canManageUsers,
      
      // 方法
      handleUpdateProfile,
      handleLogout
    }
  },

  template: `
    <div class="user-profile">
      <div v-if="isLoggedIn">
        <img :src="avatarUrl" :alt="displayName" class="avatar" />
        <h3>{{ displayName }}</h3>
        <p>角色: {{ userRoles.join(', ') }}</p>
        <p v-if="isAdmin">管理员权限</p>
        <p v-if="canManageUsers">用户管理权限</p>
        <button @click="handleLogout" :disabled="loginLoading">
          {{ loginLoading ? '登出中...' : '登出' }}
        </button>
      </div>
      <div v-else>
        <p>请先登录</p>
      </div>
    </div>
  `
})

// ==================== 2. 租户切换组件 ====================
export const TenantSwitcher = defineComponent({
  name: 'TenantSwitcher',
  setup() {
    const userStore = useUserStore()
    
    const {
      tenants,
      currentTenant,
      tenantSwitchLoading,
      hasTenants
    } = userStore

    const { setCurrentTenant } = userStore

    const handleTenantSwitch = async (tenant) => {
      try {
        const success = await setCurrentTenant(tenant)
        if (success) {
          // 显示成功消息
          console.log('租户切换成功')
        }
      } catch (error) {
        console.error('租户切换失败:', error)
        // 显示错误消息
      }
    }

    return {
      tenants,
      currentTenant,
      tenantSwitchLoading,
      hasTenants,
      handleTenantSwitch
    }
  },

  template: `
    <div class="tenant-switcher" v-if="hasTenants">
      <h4>切换租户</h4>
      <select 
        :value="currentTenant.tenant_no" 
        @change="handleTenantSwitch(tenants.find(t => t.tenant_no === $event.target.value))"
        :disabled="tenantSwitchLoading"
      >
        <option 
          v-for="tenant in tenants" 
          :key="tenant.tenant_no" 
          :value="tenant.tenant_no"
        >
          {{ tenant.tenant_name }}
        </option>
      </select>
      <span v-if="tenantSwitchLoading">切换中...</span>
    </div>
  `
})

// ==================== 3. 权限控制组合函数 ====================
export function usePermissions() {
  const userStore = useUserStore()
  
  const { hasRole, hasAnyRole, userRoles } = userStore

  // 权限检查函数
  const checkPermission = (permission) => {
    return hasRole(permission)
  }

  const checkAnyPermission = (permissions) => {
    return hasAnyRole(permissions)
  }

  // 管理员权限
  const isAdmin = computed(() => hasRole('admin'))
  
  // 编辑权限
  const canEdit = computed(() => hasAnyRole(['admin', 'editor']))
  
  // 查看权限
  const canView = computed(() => hasAnyRole(['admin', 'editor', 'viewer']))

  return {
    userRoles,
    checkPermission,
    checkAnyPermission,
    isAdmin,
    canEdit,
    canView
  }
}

// ==================== 4. 用户状态管理组合函数 ====================
export function useUserState() {
  const userStore = useUserStore()
  
  const {
    userInfo,
    isLoggedIn,
    displayName,
    avatarUrl,
    userProfile
  } = userStore

  const {
    setUserInfo,
    updateUserInfo,
    clearUserData,
    refreshFromStorage,
    validateLoginStatus
  } = userStore

  // 初始化用户状态
  const initializeUser = () => {
    if (!validateLoginStatus()) {
      clearUserData()
      return false
    }
    refreshFromStorage()
    return true
  }

  // 更新用户头像
  const updateAvatar = (newAvatarUrl) => {
    updateUserInfo({ photo_url: newAvatarUrl })
  }

  // 更新用户显示名
  const updateDisplayName = (newDisplayName) => {
    updateUserInfo({ user_disp: newDisplayName })
  }

  return {
    // 状态
    userInfo,
    isLoggedIn,
    displayName,
    avatarUrl,
    userProfile,
    
    // 方法
    setUserInfo,
    updateUserInfo,
    clearUserData,
    refreshFromStorage,
    validateLoginStatus,
    initializeUser,
    updateAvatar,
    updateDisplayName
  }
}

// ==================== 5. 在路由守卫中使用 ====================
export function createAuthGuard() {
  return (to, from, next) => {
    const userStore = useUserStore()
    const { isLoggedIn, validateLoginStatus } = userStore

    // 检查是否需要认证
    if (to.meta?.requiresAuth) {
      if (!isLoggedIn.value || !validateLoginStatus()) {
        // 重定向到登录页
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }

    // 检查权限
    if (to.meta?.requiredRoles) {
      const { hasAnyRole } = userStore
      if (!hasAnyRole(to.meta.requiredRoles)) {
        // 重定向到无权限页面
        next({ name: 'Forbidden' })
        return
      }
    }

    next()
  }
}

// ==================== 6. 错误处理最佳实践 ====================
export function useUserStoreWithErrorHandling() {
  const userStore = useUserStore()

  // 包装异步方法，添加统一错误处理
  const safeLoginWithTenant = async (tenant) => {
    try {
      return await userStore.loginWithTenant(tenant)
    } catch (error) {
      // 统一错误处理
      console.error('租户登录失败:', error)
      
      // 可以在这里添加全局错误提示
      // ElMessage.error(error.message || '登录失败')
      
      throw error
    }
  }

  const safeSetCurrentTenant = async (tenant) => {
    try {
      return await userStore.setCurrentTenant(tenant)
    } catch (error) {
      console.error('设置租户失败:', error)
      // ElMessage.error('切换租户失败')
      return false
    }
  }

  const safeLogout = async () => {
    try {
      await userStore.logout()
      // ElMessage.success('已成功登出')
    } catch (error) {
      console.error('登出失败:', error)
      // 即使失败也要清除本地数据
      userStore.clearUserData()
    }
  }

  return {
    ...userStore,
    // 覆盖原方法，提供错误处理版本
    loginWithTenant: safeLoginWithTenant,
    setCurrentTenant: safeSetCurrentTenant,
    logout: safeLogout
  }
}

// ==================== 7. 在 main.js 中的初始化示例 ====================
export function initializeUserStore() {
  const userStore = useUserStore()
  
  // 应用启动时初始化用户状态
  const { validateLoginStatus, refreshFromStorage, clearUserData } = userStore
  
  if (validateLoginStatus()) {
    refreshFromStorage()
  } else {
    clearUserData()
  }
  
  // 监听页面可见性变化，刷新用户状态
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && validateLoginStatus()) {
      refreshFromStorage()
    }
  })
}

// ==================== 8. TypeScript 类型支持示例 ====================
/*
// 如果使用 TypeScript，可以这样定义类型
import type { ComputedRef, Ref } from 'vue'

interface UserStoreType {
  // 响应式状态
  userInfo: Ref<UserInfo>
  tenants: Ref<TenantInfo[]>
  currentTenant: Ref<TenantInfo>
  loginLoading: Ref<boolean>
  tenantSwitchLoading: Ref<boolean>
  
  // 计算属性
  isLoggedIn: ComputedRef<boolean>
  hasTenants: ComputedRef<boolean>
  userRoles: ComputedRef<string[]>
  displayName: ComputedRef<string>
  avatarUrl: ComputedRef<string>
  currentTenantName: ComputedRef<string>
  authTicket: ComputedRef<string>
  userProfile: ComputedRef<UserProfile>
  
  // 方法
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  setUserInfo: (userInfo: UserInfo) => void
  updateUserInfo: (partialUserInfo: Partial<UserInfo>) => void
  setTenants: (tenants: TenantInfo[]) => void
  setCurrentTenant: (tenant: TenantInfo) => Promise<boolean>
  loginWithTenant: (tenant: TenantInfo) => Promise<boolean>
  clearUserData: (clearStorage?: boolean) => void
  refreshFromStorage: () => void
  validateLoginStatus: () => boolean
  getUserPermissions: () => string[]
  logout: () => Promise<void>
}
*/