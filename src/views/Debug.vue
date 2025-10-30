<template>
  <div class="debug-page">
      <div class="page-header">
        <h1>MQTT 调试</h1>
        <div class="header-actions">
          <el-button
            :type="connected ? 'danger' : 'primary'"
            @click="toggleConnection"
            :loading="connecting"
          >
            <el-icon><Connection v-if="!connected" /><Close v-else /></el-icon>
            {{ connected ? '断开连接' : '连接' }}
          </el-button>
          <el-button @click="clearMessages" :disabled="!messages.length">
            <el-icon><Delete /></el-icon>
            清空消息
          </el-button>
        </div>
      </div>

      <el-row :gutter="20">
        <!-- 连接配置 -->
        <el-col :span="8">
          <el-card>
            <template #header>
              <span>连接配置</span>
            </template>
            
            <el-form :model="connection" label-width="80px" :disabled="connected">
              <el-form-item label="主机">
                <el-input v-model="connection.host" placeholder="localhost" />
              </el-form-item>
              
              <el-form-item label="端口">
                <el-input-number v-model="connection.port" :min="1" :max="65535" />
              </el-form-item>
              
              <el-form-item label="客户端ID">
                <el-input v-model="connection.clientId" />
              </el-form-item>
              
              <el-form-item label="用户名">
                <el-input v-model="connection.username" />
              </el-form-item>
              
              <el-form-item label="密码">
                <el-input v-model="connection.password" type="password" show-password />
              </el-form-item>
              
              <el-form-item label="清理会话">
                <el-switch v-model="connection.clean" />
              </el-form-item>
              
              <el-form-item label="保活时间">
                <el-input-number v-model="connection.keepalive" :min="0" :max="65535" />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 订阅管理 -->
          <el-card style="margin-top: 20px;">
            <template #header>
              <span>订阅管理</span>
            </template>
            
            <el-form :model="subscribeForm" @submit.prevent="handleSubscribe">
              <el-form-item label="主题">
                <el-input
                  v-model="subscribeForm.topic"
                  placeholder="请输入主题，如: test/topic"
                  clearable
                />
              </el-form-item>
              
              <el-form-item label="QoS">
                <el-select v-model="subscribeForm.qos" placeholder="选择QoS">
                  <el-option label="QoS 0" :value="0" />
                  <el-option label="QoS 1" :value="1" />
                  <el-option label="QoS 2" :value="2" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handleSubscribe" :disabled="!connected">
                  <el-icon><Plus /></el-icon>
                  订阅
                </el-button>
              </el-form-item>
            </el-form>
            
            <div class="subscriptions">
              <div class="subscription-item" v-for="topic in subscriptions" :key="topic">
                <span>{{ topic }}</span>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleUnsubscribe(topic)"
                >
                  取消
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 消息发布 -->
          <el-card style="margin-top: 20px;">
            <template #header>
              <span>消息发布</span>
            </template>
            
            <el-form :model="publishForm" @submit.prevent="handlePublish">
              <el-form-item label="主题">
                <el-input
                  v-model="publishForm.topic"
                  placeholder="请输入主题"
                  clearable
                />
              </el-form-item>
              
              <el-form-item label="消息内容">
                <el-input
                  v-model="publishForm.payload"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入消息内容"
                />
              </el-form-item>
              
              <el-form-item label="QoS">
                <el-select v-model="publishForm.qos" placeholder="选择QoS">
                  <el-option label="QoS 0" :value="0" />
                  <el-option label="QoS 1" :value="1" />
                  <el-option label="QoS 2" :value="2" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="保留消息">
                <el-switch v-model="publishForm.retain" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="handlePublish" :disabled="!connected">
                  <el-icon><Promotion /></el-icon>
                  发布
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 消息列表 -->
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>消息列表</span>
                <div class="header-controls">
                  <el-input
                    v-model="messageFilter.topic"
                    placeholder="按主题过滤"
                    clearable
                    style="width: 200px; margin-right: 12px;"
                    @input="updateFilteredMessages"
                  />
                  <el-select
                    v-model="messageFilter.direction"
                    placeholder="方向"
                    style="width: 120px; margin-right: 12px;"
                    @change="updateFilteredMessages"
                  >
                    <el-option label="全部" value="all" />
                    <el-option label="接收" value="in" />
                    <el-option label="发送" value="out" />
                  </el-select>
                  <el-input-number
                    v-model="maxMessages"
                    :min="100"
                    :max="10000"
                    :step="100"
                    placeholder="最大消息数"
                    style="width: 120px;"
                    @change="updateFilteredMessages"
                  />
                </div>
              </div>
            </template>
            
            <div class="message-list">
              <div
                v-for="message in filteredMessages"
                :key="message.id"
                class="message-item"
                :class="`message-${message.direction}`"
              >
                <div class="message-header">
                  <div class="message-meta">
                    <el-tag :type="message.direction === 'in' ? 'success' : 'primary'" size="small">
                      {{ message.direction === 'in' ? '接收' : '发送' }}
                    </el-tag>
                    <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                    <el-tag size="small">QoS {{ message.qos }}</el-tag>
                    <el-tag v-if="message.retain" type="warning" size="small">保留</el-tag>
                  </div>
                </div>
                
                <div class="message-topic">
                  <strong>主题:</strong> {{ message.topic }}
                </div>
                
                <div class="message-payload">
                  <strong>内容:</strong>
                  <pre>{{ message.payload }}</pre>
                </div>
              </div>
              
              <div v-if="!filteredMessages.length" class="no-messages">
                暂无消息
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, Close, Delete, Plus, Promotion } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useDebugStore } from '@/stores/debug'
import { formatTime } from '@/utils/format'

const debugStore = useDebugStore()

// 使用 storeToRefs 解构响应式状态
const {
  connection,
  connected,
  connecting,
  subscriptions,
  messages,
  maxMessages,
  filteredMessages,
  messageFilter
} = storeToRefs(debugStore)

// 直接解构方法
const {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  publish,
  clearMessages,
  updateFilteredMessages
} = debugStore

// 订阅表单
const subscribeForm = ref({
  topic: '',
  qos: 0
})

// 发布表单
const publishForm = ref({
  topic: '',
  payload: '',
  qos: 0,
  retain: false
})

// 切换连接
const toggleConnection = async () => {
  if (connected.value) {
    disconnect()
    ElMessage.success('已断开连接')
  } else {
    await connect()
    if (connected.value) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error('连接失败')
    }
  }
}

// 订阅主题
const handleSubscribe = async () => {
  if (!subscribeForm.value.topic.trim()) {
    ElMessage.warning('请输入主题')
    return
  }

  const success = await subscribe(subscribeForm.value.topic, subscribeForm.value.qos)
  if (success) {
    ElMessage.success('订阅成功')
    subscribeForm.value.topic = ''
  } else {
    ElMessage.error('订阅失败')
  }
}

// 取消订阅
const handleUnsubscribe = async (topic: string) => {
  const success = await unsubscribe(topic)
  if (success) {
    ElMessage.success('取消订阅成功')
  } else {
    ElMessage.error('取消订阅失败')
  }
}

// 发布消息
const handlePublish = async () => {
  if (!publishForm.value.topic.trim()) {
    ElMessage.warning('请输入主题')
    return
  }

  if (!publishForm.value.payload.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  const success = await publish(
    publishForm.value.topic,
    publishForm.value.payload,
    publishForm.value.qos,
    publishForm.value.retain
  )

  if (success) {
    ElMessage.success('消息发布成功')
    publishForm.value.payload = ''
  } else {
    ElMessage.error('消息发布失败')
  }
}

// 监听过滤条件变化
watch([messageFilter, maxMessages], () => {
  updateFilteredMessages()
}, { deep: true })

onMounted(() => {
  updateFilteredMessages()
})
</script>

<style scoped>
.debug-page {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}

.subscriptions {
  margin-top: 16px;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  margin-bottom: 8px;
}

.message-list {
  max-height: 600px;
  overflow-y: auto;
}

.message-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background-color: var(--el-bg-color);
}

.message-item.message-in {
  border-left: 4px solid var(--el-color-success);
}

.message-item.message-out {
  border-left: 4px solid var(--el-color-primary);
}

.message-header {
  margin-bottom: 8px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.message-topic {
  font-size: 14px;
  margin-bottom: 8px;
  word-break: break-all;
}

.message-payload {
  font-size: 14px;
}

.message-payload pre {
  margin: 8px 0 0 0;
  padding: 8px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.no-messages {
  text-align: center;
  color: var(--el-text-color-regular);
  padding: 40px;
}
</style>
