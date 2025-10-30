import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'

// 连接统计
export interface ConnectionStats {
  accepted: number    // 已接受的连接数
  size: number        // 当前连接数
  closed: number      // 已关闭的连接数
}

// 消息统计
export interface MessageStats {
  handledPackets: number      // 已处理的数据包
  handledBytes: number         // 已处理的字节数
  receivedPackets: number      // 已接收的数据包
  receivedBytes: number        // 已接收的字节数
  sendPackets: number          // 已发送的数据包
  sendBytes: number            // 已发送的字节数
  bytesPerTcpReceive: number   // 每次TCP接收的字节数
  packetsPerTcpReceive: number // 每次TCP接收的数据包数
}

// 节点统计
export interface NodeStats {
  clientNodes: number  // 客户端节点数
  connections: number  // 连接数
  users: number        // 用户数
}

// 总体统计
export interface Stats {
  connections: ConnectionStats
  messages: MessageStats
  nodes: NodeStats
}

// 监控数据
export interface MonitorData {
  timestamp: number
  connections: number
  messagesReceived: number
  messagesSent: number
  bytesReceived: number
  bytesSent: number
}

export const useMonitorStore = defineStore('monitor', () => {
  const stats = ref<Stats>({
    connections: {
      accepted: 0,
      size: 0,
      closed: 0
    },
    messages: {
      handledPackets: 0,
      handledBytes: 0,
      receivedPackets: 0,
      receivedBytes: 0,
      sendPackets: 0,
      sendBytes: 0,
      bytesPerTcpReceive: 0,
      packetsPerTcpReceive: 0
    },
    nodes: {
      clientNodes: 0,
      connections: 0,
      users: 0
    }
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
          const data = response.data.data
          const newData: MonitorData = {
            timestamp: Date.now(),
            connections: data.connections.size,
            messagesReceived: data.messages.receivedPackets,
            messagesSent: data.messages.sendPackets,
            bytesReceived: data.messages.receivedBytes,
            bytesSent: data.messages.sendBytes
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
