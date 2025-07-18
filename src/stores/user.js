// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { $http } from "@/common/http"

// ==================== 常量定义 ====================
const STORAGE_KEYS = {
  CURRENT_LOGIN_USER: 'current_login_user',
  TENANT_LIST: 'tenantList', 
  CURRENT_TENANT: 'currentTenant',
  BX_AUTH_TICKET: 'bx_auth_ticket'
}

// API 端点常量
const API_ENDPOINTS = {
  // 租户切换登录
  TENANT_SWITCH_LOGIN: '/sso/operate/srvuser_app_tenant_swh_login'
}

// ==================== 工具函数 ====================
/**
 * 安全的 JSON 解析函数
 * @param {string} str - 要解析的字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} 解析结果或默认值
 */
const safeJsonParse = (str, defaultValue = null) => {
  try {
    return str ? JSON.parse(str) : defaultValue
  } catch (error) {
    console.warn('JSON 解析失败:', error)
    return defaultValue
  }
}

/**
 * SessionStorage 操作工具类
 * 提供统一的存储操作接口
 */
const storageUtils = {
  /**
   * 获取存储值
   * @param {string} key - 存储键
   * @param {*} defaultValue - 默认值
   * @returns {*} 存储值或默认值
   */
  get(key, defaultValue = null) {
    return safeJsonParse(sessionStorage.getItem(key), defaultValue)
  },

  /**
   * 设置存储值
   * @param {string} key - 存储键
   * @param {*} value - 存储值
   */
  set(key, value) {
    try {
      sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
    } catch (error) {
      console.error('SessionStorage 设置失败:', error)
      throw error
    }
  },

  /**
   * 删除存储值
   * @param {string} key - 存储键
   */
  remove(key) {
    sessionStorage.removeItem(key)
  },

  /**
   * 批量删除存储值
   * @param {string[]} keys - 存储键数组
   */
  removeMultiple(keys) {
    keys.forEach(key => this.remove(key))
  }
}

// ==================== 类型定义 ====================
/**
 * @typedef {Object} UserInfo
 * @property {string} user_no - 用户编号
 * @property {string} user_disp - 用户显示名
 * @property {string} tenant - 租户
 * @property {string} real_name - 真实姓名
 * @property {string} photo_url - 头像URL
 * @property {string} mobile - 手机号
 * @property {string} application - 应用
 * @property {string} dept_no - 部门编号
 * @property {string} email - 邮箱
 * @property {string[]} roles - 角色列表
 */

/**
 * @typedef {Object} TenantInfo
 * @property {string} application - 应用
 * @property {string} application_name - 应用名称
 * @property {string} tenant_no - 租户编号
 * @property {string} tenant_name - 租户名称
 * @property {string} user_no - 用户编号
 */

// ==================== Store 定义（组合式API） ====================
export const useUserStore = defineStore('user', () => {
  // ==================== 响应式状态 ====================
  /** @type {import('vue').Ref<UserInfo>} 用户信息 */
  const userInfo = ref(storageUtils.get(STORAGE_KEYS.CURRENT_LOGIN_USER, {}))
  
  /** @type {import('vue').Ref<TenantInfo[]>} 租户列表 */
  const tenants = ref(storageUtils.get(STORAGE_KEYS.TENANT_LIST, []))
  
  /** @type {import('vue').Ref<TenantInfo>} 当前租户 */
  const currentTenant = ref(storageUtils.get(STORAGE_KEYS.CURRENT_TENANT, {}))

  /** @type {import('vue').Ref<boolean>} 登录加载状态 */
  const loginLoading = ref(false)

  /** @type {import('vue').Ref<boolean>} 租户切换加载状态 */
  const tenantSwitchLoading = ref(false)

  // ==================== 计算属性 ====================
  /**
   * 是否已登录
   * @returns {import('vue').ComputedRef<boolean>} 登录状态
   */
  const isLoggedIn = computed(() => Boolean(userInfo.value?.user_no))

  /**
   * 是否有租户信息
   * @returns {import('vue').ComputedRef<boolean>} 是否有租户
   */
  const hasTenants = computed(() => Array.isArray(tenants.value) && tenants.value.length > 0)

  /**
   * 当前用户角色
   * @returns {import('vue').ComputedRef<string[]>} 角色列表
   */
  const userRoles = computed(() => userInfo.value?.roles || [])

  /**
   * 用户显示名称
   * @returns {import('vue').ComputedRef<string>} 显示名称
   */
  const displayName = computed(() => 
    userInfo.value?.real_name || userInfo.value?.user_disp || '未知用户'
  )

  /**
   * 用户头像URL
   * @returns {import('vue').ComputedRef<string>} 头像URL
   */
  const avatarUrl = computed(() => userInfo.value?.photo_url || '')

  /**
   * 当前租户名称
   * @returns {import('vue').ComputedRef<string>} 租户名称
   */
  const currentTenantName = computed(() => currentTenant.value?.tenant_name || '')

  /**
   * 获取认证票据
   * @returns {import('vue').ComputedRef<string>} 认证票据
   */
  const authTicket = computed(() => storageUtils.get(STORAGE_KEYS.BX_AUTH_TICKET, ''))

  /**
   * 用户完整信息（包含计算属性）
   * @returns {import('vue').ComputedRef<Object>} 完整用户信息
   */
  const userProfile = computed(() => ({
    ...userInfo.value,
    displayName: displayName.value,
    avatarUrl: avatarUrl.value,
    isLoggedIn: isLoggedIn.value,
    roles: userRoles.value
  }))

  // ==================== 计算函数（返回函数的计算属性） ====================
  /**
   * 是否有特定角色
   * @param {string} role - 角色名称
   * @returns {boolean} 是否有该角色
   */
  const hasRole = (role) => {
    return userInfo.value?.roles?.includes(role) || false
  }

  /**
   * 是否有任一角色
   * @param {string[]} roles - 角色列表
   * @returns {boolean} 是否有任一角色
   */
  const hasAnyRole = (roles) => {
    if (!Array.isArray(roles) || !userInfo.value?.roles) return false
    return roles.some(role => userInfo.value.roles.includes(role))
  }

  // ==================== 操作方法 ====================
  /**
   * 设置用户信息
   * @param {UserInfo} newUserInfo - 用户信息对象
   * @throws {Error} 当用户信息无效时抛出错误
   */
  const setUserInfo = (newUserInfo) => {
    if (!newUserInfo || typeof newUserInfo !== 'object') {
      const error = new Error('无效的用户信息')
      console.warn(error.message, newUserInfo)
      throw error
    }
    
    userInfo.value = { ...newUserInfo }
    storageUtils.set(STORAGE_KEYS.CURRENT_LOGIN_USER, userInfo.value)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('用户信息已更新:', userInfo.value)
    }
  }

  /**
   * 更新用户部分信息
   * @param {Partial<UserInfo>} partialUserInfo - 部分用户信息
   */
  const updateUserInfo = (partialUserInfo) => {
    if (!partialUserInfo || typeof partialUserInfo !== 'object') {
      console.warn('无效的用户信息更新数据')
      return
    }

    userInfo.value = { ...userInfo.value, ...partialUserInfo }
    storageUtils.set(STORAGE_KEYS.CURRENT_LOGIN_USER, userInfo.value)
  }

  /**
   * 设置租户列表
   * @param {TenantInfo[]} newTenants - 租户列表
   * @throws {Error} 当租户列表无效时抛出错误
   */
  const setTenants = (newTenants) => {
    if (!Array.isArray(newTenants)) {
      const error = new Error('租户列表必须是数组')
      console.warn(error.message, newTenants)
      throw error
    }
    
    tenants.value = [...newTenants]
    storageUtils.set(STORAGE_KEYS.TENANT_LIST, tenants.value)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('租户列表已更新:', tenants.value)
    }
  }

  /**
   * 设置当前租户并登录
   * @param {TenantInfo} tenant - 租户信息
   * @returns {Promise<boolean>} 登录是否成功
   */
  const setCurrentTenant = async (tenant) => {
    if (!tenant || typeof tenant !== 'object') {
      console.error('无效的租户信息')
      return false
    }

    tenantSwitchLoading.value = true

    try {
      currentTenant.value = { ...tenant }
      storageUtils.set(STORAGE_KEYS.CURRENT_TENANT, currentTenant.value)
      
      const loginResult = await loginWithTenant(tenant)
      return loginResult
    } catch (error) {
      console.error('设置当前租户失败:', error)
      return false
    } finally {
      tenantSwitchLoading.value = false
    }
  }

  /**
   * 使用租户信息登录
   * @param {TenantInfo} tenant - 租户信息
   * @returns {Promise<boolean>} 登录是否成功
   */
  const loginWithTenant = async (tenant = {}) => {
    const { tenant_no, tenant_name, application } = tenant
    
    // 验证必要参数
    if (!tenant_no || !application) {
      const error = new Error('缺少必要的租户参数: tenant_no 和 application')
      console.error(error.message, { tenant_no, application })
      throw error
    }

    try {
      const requestPayload = [
        {
          serviceName: "srvuser_app_tenant_swh_login",
          data: [
            {
              tenant_no,
              tenant_name,
              application
            }
          ]
        }
      ]

      const response = await $http.post(API_ENDPOINTS.TENANT_SWITCH_LOGIN, requestPayload)
      
      if (!response?.data) {
        throw new Error('服务器响应异常: 响应数据为空')
      }

      const { data } = response
      
      if (data.state !== "SUCCESS") {
        throw new Error(data.message || `登录失败: ${data.state}`)
      }

      const responseData = data.response
      if (!responseData?.length) {
        throw new Error('登录响应为空')
      }

      const loginResult = responseData[0].response
      if (!loginResult?.bx_auth_ticket || !loginResult?.login_user_info) {
        throw new Error('登录响应数据不完整')
      }

      // 批量更新存储
      storageUtils.set(STORAGE_KEYS.BX_AUTH_TICKET, loginResult.bx_auth_ticket)
      storageUtils.set(STORAGE_KEYS.CURRENT_LOGIN_USER, loginResult.login_user_info)
      
      // 更新状态
      userInfo.value = { ...loginResult.login_user_info }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('租户登录成功')
      }
      
      return true
    } catch (error) {
      console.error('租户登录失败:', error)
      throw error
    }
  }

  /**
   * 清除用户数据
   * @param {boolean} clearStorage - 是否清除存储数据
   */
  const clearUserData = (clearStorage = true) => {
    // 重置所有响应式状态
    userInfo.value = {}
    tenants.value = []
    currentTenant.value = {}
    loginLoading.value = false
    tenantSwitchLoading.value = false
    
    if (clearStorage) {
      // 清除 sessionStorage
      storageUtils.removeMultiple(Object.values(STORAGE_KEYS))
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('用户数据已清除')
    }
  }

  /**
   * 从存储刷新用户数据
   */
  const refreshFromStorage = () => {
    try {
      userInfo.value = storageUtils.get(STORAGE_KEYS.CURRENT_LOGIN_USER, {})
      tenants.value = storageUtils.get(STORAGE_KEYS.TENANT_LIST, [])
      currentTenant.value = storageUtils.get(STORAGE_KEYS.CURRENT_TENANT, {})
      
      if (process.env.NODE_ENV === 'development') {
        console.log('用户数据已从存储刷新')
      }
    } catch (error) {
      console.error('从存储刷新数据失败:', error)
      clearUserData(false) // 不清除存储，只重置状态
    }
  }

  /**
   * 检查登录状态有效性
   * @returns {boolean} 登录状态是否有效
   */
  const validateLoginStatus = () => {
    const hasUserInfo = Boolean(userInfo.value?.user_no)
    const hasAuthTicket = Boolean(storageUtils.get(STORAGE_KEYS.BX_AUTH_TICKET))
    
    return hasUserInfo && hasAuthTicket
  }

  /**
   * 获取用户权限列表
   * @returns {string[]} 权限列表
   */
  const getUserPermissions = () => {
    // 这里可以根据角色映射权限，或者从后端获取
    return userRoles.value
  }

  /**
   * 登出操作
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      // 调用登出API
      // await $http.post('/api/logout')
      
      clearUserData(true)
      
      // 可以触发路由跳转到登录页
      // router.push('/login')
    } catch (error) {
      console.error('登出失败:', error)
      // 即使API调用失败，也要清除本地数据
      clearUserData(true)
    }
  }

  // ==================== 返回 Store 接口 ====================
  return {
    // 响应式状态
    userInfo,
    tenants,
    currentTenant,
    loginLoading,
    tenantSwitchLoading,
    
    // 计算属性
    isLoggedIn,
    hasTenants,
    userRoles,
    displayName,
    avatarUrl,
    currentTenantName,
    authTicket,
    userProfile,
    
    // 计算函数
    hasRole,
    hasAnyRole,
    
    // 操作方法
    setUserInfo,
    updateUserInfo,
    setTenants,
    setCurrentTenant,
    loginWithTenant,
    clearUserData,
    refreshFromStorage,
    validateLoginStatus,
    getUserPermissions,
    logout
  }
})