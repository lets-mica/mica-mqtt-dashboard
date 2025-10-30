import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证信息
    const username = localStorage.getItem('mqtt_username')
    const password = localStorage.getItem('mqtt_password')

    if (username && password) {
      config.auth = {
        username,
        password
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // 认证失败，清除本地认证信息并跳转到登录页
          localStorage.removeItem('mqtt_username')
          localStorage.removeItem('mqtt_password')
          
          // 避免在登录页面重复提示
          if (!window.location.pathname.includes('/login')) {
            ElMessage.error('认证失败，请重新登录')
            
            // 延迟跳转，确保消息显示
            setTimeout(() => {
              const currentPath = window.location.pathname
              window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
            }, 500)
          }
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查服务器状态')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export { api }
