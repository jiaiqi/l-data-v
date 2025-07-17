import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * 广播通道管理组合式函数
 */
export function useBroadcastChannel(channelName = 'sheet-editor') {
  
  const channel = ref(null)
  const isConnected = ref(false)
  
  /**
   * 初始化广播通道
   */
  const initChannel = () => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel.value = new BroadcastChannel(channelName)
        isConnected.value = true
        
        // 监听消息
        channel.value.addEventListener('message', handleMessage)
        
        console.log(`广播通道 ${channelName} 初始化成功`)
      } else {
        console.warn('当前浏览器不支持 BroadcastChannel')
      }
    } catch (error) {
      console.error('初始化广播通道失败:', error)
    }
  }
  
  /**
   * 处理接收到的消息
   */
  const handleMessage = (event) => {
    console.log('收到广播消息:', event.data)
    
    const { type, data } = event.data
    
    switch (type) {
      case 'DATA_UPDATED':
        handleDataUpdated(data)
        break
      case 'USER_LOGIN':
        handleUserLogin(data)
        break
      case 'USER_LOGOUT':
        handleUserLogout(data)
        break
      case 'REFRESH_REQUEST':
        handleRefreshRequest(data)
        break
      default:
        console.log('未知的广播消息类型:', type)
    }
  }
  
  /**
   * 发送广播消息
   */
  const sendMessage = (type, data = {}) => {
    if (channel.value && isConnected.value) {
      try {
        channel.value.postMessage({
          type,
          data,
          timestamp: Date.now(),
          source: 'sheet-editor'
        })
        console.log('发送广播消息:', { type, data })
      } catch (error) {
        console.error('发送广播消息失败:', error)
      }
    } else {
      console.warn('广播通道未连接，无法发送消息')
    }
  }
  
  /**
   * 处理数据更新消息
   */
  const handleDataUpdated = (data) => {
    console.log('处理数据更新:', data)
    // 这里可以触发数据刷新
    // emit('data-updated', data)
  }
  
  /**
   * 处理用户登录消息
   */
  const handleUserLogin = (data) => {
    console.log('处理用户登录:', data)
    // 这里可以更新用户状态
    // emit('user-login', data)
  }
  
  /**
   * 处理用户登出消息
   */
  const handleUserLogout = (data) => {
    console.log('处理用户登出:', data)
    // 这里可以清除用户状态
    // emit('user-logout', data)
  }
  
  /**
   * 处理刷新请求消息
   */
  const handleRefreshRequest = (data) => {
    console.log('处理刷新请求:', data)
    // 这里可以触发页面刷新
    // emit('refresh-request', data)
  }
  
  /**
   * 发送数据更新通知
   */
  const notifyDataUpdated = (data) => {
    sendMessage('DATA_UPDATED', data)
  }
  
  /**
   * 发送用户登录通知
   */
  const notifyUserLogin = (userData) => {
    sendMessage('USER_LOGIN', userData)
  }
  
  /**
   * 发送用户登出通知
   */
  const notifyUserLogout = (userData) => {
    sendMessage('USER_LOGOUT', userData)
  }
  
  /**
   * 发送刷新请求
   */
  const requestRefresh = (data = {}) => {
    sendMessage('REFRESH_REQUEST', data)
  }
  
  /**
   * 关闭广播通道
   */
  const closeChannel = () => {
    if (channel.value) {
      try {
        channel.value.removeEventListener('message', handleMessage)
        channel.value.close()
        channel.value = null
        isConnected.value = false
        console.log('广播通道已关闭')
      } catch (error) {
        console.error('关闭广播通道失败:', error)
      }
    }
  }
  
  // 生命周期钩子
  onMounted(() => {
    initChannel()
  })
  
  onBeforeUnmount(() => {
    closeChannel()
  })
  
  return {
    // 状态
    channel,
    isConnected,
    
    // 方法
    initChannel,
    sendMessage,
    closeChannel,
    
    // 便捷方法
    notifyDataUpdated,
    notifyUserLogin,
    notifyUserLogout,
    requestRefresh
  }
}