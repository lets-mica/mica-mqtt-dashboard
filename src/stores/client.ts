import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/utils/api'

export interface Client {
  clientId: string
  username?: string
  keepAlive?: number
  connected: boolean
  protoName?: string
  protoVer?: number
  protoFullName?: string
  ipAddress?: string
  port?: number
  createdAt: number
  connectedAt: number
  decodeQueueSize?: number
  handlerQueueSize?: number
  sendQueueSize?: number
}

export interface ClientDetail extends Client {
  subscriptions?: Subscription[]
}

export interface Subscription {
  clientId: string
  topicFilter: string
  mqttQoS: number
}

export interface ClientListResponse {
  list: Client[]
  pageNumber: number
  pageSize: number
  totalRow: number
}

export const useClientStore = defineStore('client', () => {
  const clients = ref<Client[]>([])
  const currentClient = ref<ClientDetail | null>(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 获取客户端列表
  const fetchClients = async (page = 1, pageSize = 20) => {
    loading.value = true
    try {
      const response = await api.get<{ data: ClientListResponse; code: number }>('/api/v1/clients', {
        params: { _page: page, _limit: pageSize }
      })
      
      if (response.data.code === 1) {
        clients.value = response.data.data.list
        pagination.value = {
          page: response.data.data.pageNumber,
          pageSize: response.data.data.pageSize,
          total: response.data.data.totalRow
        }
      }
    } catch (error) {
      console.error('获取客户端列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取客户端详情
  const fetchClientDetail = async (clientId: string) => {
    loading.value = true
    try {
      const [clientResponse, subscriptionsResponse] = await Promise.all([
        api.get<{ data: Client; code: number }>(`/api/v1/clients/info?clientId=${clientId}`),
        api.get<{ data: Subscription[]; code: number }>(`/api/v1/client/subscriptions?clientId=${clientId}`)
      ])

      if (clientResponse.data.code === 1 && subscriptionsResponse.data.code === 1) {
        currentClient.value = {
          ...clientResponse.data.data,
          subscriptions: subscriptionsResponse.data.data
        }
      }
    } catch (error) {
      console.error('获取客户端详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 踢出客户端
  const kickClient = async (clientId: string) => {
    try {
      const response = await api.post<{ code: number }>(`/api/v1/clients/delete?clientId=${clientId}`)
      if (response.data.code === 1) {
        // 刷新客户端列表
        await fetchClients(pagination.value.page, pagination.value.pageSize)
        return true
      }
      return false
    } catch (error) {
      console.error('踢出客户端失败:', error)
      return false
    }
  }

  // 代理订阅
  const proxySubscribe = async (clientId: string, topic: string, qos: number = 0) => {
    try {
      const response = await api.post<{ code: number }>('/api/v1/mqtt/subscribe', {
        clientId,
        topic,
        qos
      })
      return response.data.code === 1
    } catch (error) {
      console.error('代理订阅失败:', error)
      return false
    }
  }

  // 代理取消订阅
  const proxyUnsubscribe = async (clientId: string, topic: string) => {
    try {
      const response = await api.post<{ code: number }>('/api/v1/mqtt/unsubscribe', {
        clientId,
        topic
      })
      return response.data.code === 1
    } catch (error) {
      console.error('代理取消订阅失败:', error)
      return false
    }
  }

  return {
    clients,
    currentClient,
    loading,
    pagination,
    fetchClients,
    fetchClientDetail,
    kickClient,
    proxySubscribe,
    proxyUnsubscribe
  }
})
