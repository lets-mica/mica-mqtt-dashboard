import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'
import { createAuthProvider } from '@/auth'
import type { AuthProvider, BasicCredentials, LoginResult } from '@/auth'

export const useAuthStore = defineStore('auth', () => {
  const provider: AuthProvider = createAuthProvider()
  const mode = ref(provider.mode)
  const isAuthenticated = ref(provider.isAuthenticated())
  const username = ref(provider.getUsername())

  const syncState = () => {
    isAuthenticated.value = provider.isAuthenticated()
    username.value = provider.getUsername()
  }

  const initAuth = () => {
    provider.init()
    syncState()
  }

  const login = async (user: string, pass: string): Promise<LoginResult> => {
    const result = await provider.login(user, pass)
    syncState()
    return result
  }

  const startLogin = async (): Promise<void> => {
    await provider.startLogin()
  }

  const handleCallback = async (): Promise<LoginResult> => {
    const result = await provider.handleCallback()
    syncState()
    return result
  }

  const getApiCredentials = (): BasicCredentials | null => provider.getApiCredentials()

  const logout = () => {
    provider.logout()
    syncState()
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!isAuthenticated.value) return false

    try {
      const response = await api.get('/api/v1/stats')
      const valid = response.status === 200
      if (!valid) {
        logout()
      }
      return valid
    } catch (error: any) {
      if (error.response?.status === 401) {
        logout()
        return false
      }
      return isAuthenticated.value
    }
  }

  return {
    mode,
    isAuthenticated,
    username,
    initAuth,
    login,
    startLogin,
    handleCallback,
    getApiCredentials,
    logout,
    checkAuth
  }
})
