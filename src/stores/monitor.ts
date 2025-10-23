import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'

export interface Stats {
  connectedClients: number
  totalMessages: number
  totalSubscriptions: number
  uptime: number
  memoryUsage: number
  cpuUsage: number
}

export interface MonitorData {
  timestamp: number
  connectedClients: number
  messagesPerSecond: number
  memoryUsage: number
  cpuUsage: number
}

export const useMonitorStore = defineStore('monitor', () => {
  const stats = ref<Stats>({
    connectedClients: 0,
    totalMessages: 0,
    totalSubscriptions: 0,
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0
  })
  
  const monitorData = ref<MonitorData[]>([])
  const loading = ref(false)
  const realtimeEnabled = ref(false)
  let monitorInterval: NodeJS.Timeout | null = null

  // 获取统计数据
  const fetchStats = async () => {
    loading.value = true
    try {
      const response = await api.get<{ data: Stats; code: number }>('/api/v1/stats')
      if (response.data.code === 1) {
        stats.value = response.data.data
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 开始实时监控
  const startRealtimeMonitor = () => {
    if (monitorInterval) return
    
    realtimeEnabled.value = true
    monitorInterval = setInterval(async () => {
      try {
        const response = await api.get<{ data: Stats; code: number }>('/api/v1/stats')
        if (response.data.code === 1) {
          const newData: MonitorData = {
            timestamp: Date.now(),
            connectedClients: response.data.data.connectedClients,
            messagesPerSecond: 0, // 需要根据实际API调整
            memoryUsage: response.data.data.memoryUsage,
            cpuUsage: response.data.data.cpuUsage
          }
          
          monitorData.value.push(newData)
          
          // 只保留最近100个数据点
          if (monitorData.value.length > 100) {
            monitorData.value = monitorData.value.slice(-100)
          }
        }
      } catch (error) {
        console.error('实时监控数据获取失败:', error)
      }
    }, 5000) // 每5秒更新一次
  }

  // 停止实时监控
  const stopRealtimeMonitor = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval)
      monitorInterval = null
    }
    realtimeEnabled.value = false
  }

  // 清理监控数据
  const clearMonitorData = () => {
    monitorData.value = []
  }

  return {
    stats,
    monitorData,
    loading,
    realtimeEnabled,
    fetchStats,
    startRealtimeMonitor,
    stopRealtimeMonitor,
    clearMonitorData
  }
})
