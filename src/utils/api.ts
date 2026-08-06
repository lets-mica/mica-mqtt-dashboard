import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { BasicCredentials } from '@/auth'

// 认证凭据获取函数（由 main.ts 注入，避免与 auth store 循环依赖）
let credentialsProvider: (() => BasicCredentials | null) | null = null
// 认证失效回调（由 main.ts 注入，调用 authStore.logout）
let unauthorizedHandler: (() => void) | null = null

export const setCredentialsProvider = (fn: (() => BasicCredentials | null) | null) => {
  credentialsProvider = fn
}

export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  unauthorizedHandler = fn
}

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const credentials = credentialsProvider ? credentialsProvider() : null
    if (credentials) {
      config.auth = credentials
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
          if (unauthorizedHandler) {
            unauthorizedHandler()
          }
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
