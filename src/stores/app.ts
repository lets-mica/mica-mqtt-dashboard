import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const sidebarCollapsed = ref(false)

  // 初始化主题
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      theme.value = savedTheme
      applyTheme(savedTheme)
    } else {
      // 检测系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
      applyTheme(theme.value)
    }
  }

  // 应用主题
  const applyTheme = (themeValue: 'light' | 'dark') => {
    if (themeValue === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setLoading = (value: boolean) => {
    loading.value = value
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    applyTheme(theme.value)
    localStorage.setItem('theme', theme.value)
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    loading,
    theme,
    sidebarCollapsed,
    setLoading,
    toggleTheme,
    toggleSidebar,
    initTheme
  }
})
