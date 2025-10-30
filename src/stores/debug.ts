import { defineStore } from 'pinia'
import { ref } from 'vue'
import mqtt from 'mqtt'

export interface MqttMessage {
  id: string
  timestamp: number
  topic: string
  payload: string
  qos: number
  retain: boolean
  direction: 'in' | 'out'
}

export interface MqttConnection {
  clientId: string
  host: string
  port: number
  username?: string
  password?: string
  clean: boolean
  keepalive: number
}

export const useDebugStore = defineStore('debug', () => {
  const messages = ref<MqttMessage[]>([])
  const connection = ref<MqttConnection>({
    clientId: `debug_${Date.now()}`,
    host: 'localhost',
    port: 8083,
    clean: true,
    keepalive: 60
  })
  
  const mqttClient = ref<mqtt.MqttClient | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const subscriptions = ref<string[]>([])
  const maxMessages = ref(1000)

  // 连接MQTT
  const connect = async () => {
    if (connecting.value || connected.value) return
    
    connecting.value = true
    
    return new Promise<void>((resolve, reject) => {
      try {
        const client = mqtt.connect({
          host: connection.value.host,
          port: connection.value.port,
          clientId: connection.value.clientId,
          username: connection.value.username,
          password: connection.value.password,
          clean: connection.value.clean,
          keepalive: connection.value.keepalive
        })

        // 连接超时处理
        const timeout = setTimeout(() => {
          connecting.value = false
          connected.value = false
          reject(new Error('连接超时'))
        }, 10000) // 10秒超时

        client.on('connect', () => {
          clearTimeout(timeout)
          connected.value = true
          connecting.value = false
          mqttClient.value = client
          resolve()
        })

        client.on('message', (topic, payload, packet) => {
          addMessage({
            id: `msg_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            topic,
            payload: payload.toString(),
            qos: packet.qos,
            retain: packet.retain,
            direction: 'in'
          })
        })

        client.on('error', (error) => {
          clearTimeout(timeout)
          console.error('MQTT连接错误:', error)
          connecting.value = false
          connected.value = false
          reject(error)
        })

        client.on('close', () => {
          connected.value = false
          mqttClient.value = null
        })

      } catch (error) {
        console.error('MQTT连接失败:', error)
        connecting.value = false
        reject(error)
      }
    })
  }

  // 断开连接
  const disconnect = () => {
    if (mqttClient.value) {
      mqttClient.value.end()
      mqttClient.value = null
      connected.value = false
      subscriptions.value = []
    }
  }

  // 订阅主题
  const subscribe = (topic: string, qos: number = 0) => {
    if (!mqttClient.value || !connected.value) return false
    
    try {
      mqttClient.value.subscribe(topic, { qos })
      if (!subscriptions.value.includes(topic)) {
        subscriptions.value.push(topic)
      }
      return true
    } catch (error) {
      console.error('订阅失败:', error)
      return false
    }
  }

  // 取消订阅
  const unsubscribe = (topic: string) => {
    if (!mqttClient.value || !connected.value) return false
    
    try {
      mqttClient.value.unsubscribe(topic)
      const index = subscriptions.value.indexOf(topic)
      if (index > -1) {
        subscriptions.value.splice(index, 1)
      }
      return true
    } catch (error) {
      console.error('取消订阅失败:', error)
      return false
    }
  }

  // 发布消息
  const publish = (topic: string, payload: string, qos: number = 0, retain: boolean = false) => {
    if (!mqttClient.value || !connected.value) return false
    
    try {
      mqttClient.value.publish(topic, payload, { qos, retain })
      
      // 记录发送的消息
      addMessage({
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        topic,
        payload,
        qos,
        retain,
        direction: 'out'
      })
      
      return true
    } catch (error) {
      console.error('发布消息失败:', error)
      return false
    }
  }

  // 添加消息到列表
  const addMessage = (message: MqttMessage) => {
    messages.value.unshift(message)
    
    // 限制消息数量
    if (messages.value.length > maxMessages.value) {
      messages.value = messages.value.slice(0, maxMessages.value)
    }
  }

  // 清空消息
  const clearMessages = () => {
    messages.value = []
  }

  // 过滤消息
  const filteredMessages = ref<MqttMessage[]>([])
  const messageFilter = ref({
    topic: '',
    direction: 'all' as 'all' | 'in' | 'out'
  })

  const updateFilteredMessages = () => {
    let filtered = messages.value
    
    if (messageFilter.value.topic) {
      filtered = filtered.filter(msg => 
        msg.topic.includes(messageFilter.value.topic)
      )
    }
    
    if (messageFilter.value.direction !== 'all') {
      filtered = filtered.filter(msg => 
        msg.direction === messageFilter.value.direction
      )
    }
    
    filteredMessages.value = filtered
  }

  // 监听过滤条件变化
  const watchFilter = () => {
    updateFilteredMessages()
  }

  return {
    messages,
    connection,
    mqttClient,
    connected,
    connecting,
    subscriptions,
    maxMessages,
    filteredMessages,
    messageFilter,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    addMessage,
    clearMessages,
    updateFilteredMessages,
    watchFilter
  }
})
