import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const username = ref('')
  const password = ref('')

  // 初始化时检查本地存储
  const initAuth = () => {
    const storedUsername = localStorage.getItem('mqtt_username')
    const storedPassword = localStorage.getItem('mqtt_password')
    
    if (storedUsername && storedPassword) {
      username.value = storedUsername
      password.value = storedPassword
      isAuthenticated.value = true
    }
  }

  // 登录验证 - 通过调用受保护的API来验证
  const login = async (user: string, pass: string) => {
    try {
      // 先设置临时认证信息
      const tempAuth = {
        username: user,
        password: pass
      }

      // 调用一个受保护的API来验证认证
      const response = await api.get('/api/v1/stats', {
        auth: tempAuth
      })

      if (response.status === 200) {
        // 认证成功，保存信息
        username.value = user
        password.value = pass
        isAuthenticated.value = true
        
        localStorage.setItem('mqtt_username', user)
        localStorage.setItem('mqtt_password', pass)
        
        return { success: true }
      }
      
      return { success: false, message: '认证失败' }
    } catch (error: any) {
      console.error('登录失败:', error)
      
      if (error.response?.status === 401) {
        return { success: false, message: '用户名或密码错误' }
      }
      
      return { success: false, message: error.message || '登录失败，请检查服务器连接' }
    }
  }

  // 登出
  const logout = () => {
    username.value = ''
    password.value = ''
    isAuthenticated.value = false
    
    localStorage.removeItem('mqtt_username')
    localStorage.removeItem('mqtt_password')
  }

  // 检查认证状态
  const checkAuth = async () => {
    if (!username.value || !password.value) {
      return false
    }

    try {
      const response = await api.get('/api/v1/stats')
      return response.status === 200
    } catch (error: any) {
      if (error.response?.status === 401) {
        // 认证失效，清除信息
        logout()
        return false
      }
      // 其他错误不影响认证状态
      return isAuthenticated.value
    }
  }

  return {
    isAuthenticated,
    username,
    password,
    initAuth,
    login,
    logout,
    checkAuth
  }
})

