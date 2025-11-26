<template>
  <div class="client-detail">
      <!-- 页面头部 -->
      <div class="page-header">
        <el-button @click="$router.back()" class="back-button">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>客户端详情</h1>
      </div>

      <div v-loading="loading">
        <el-row :gutter="20">
          <!-- 客户端基本信息 -->
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>基本信息</span>
                  <el-button
                    type="danger"
                    @click="handleKickClient"
                    :disabled="!currentClient?.connected"
                  >
                    <el-icon><Close /></el-icon>
                    踢出客户端
                  </el-button>
                </div>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item label="客户端ID">
                  {{ currentClient?.clientId }}
                </el-descriptions-item>
                <el-descriptions-item label="用户名">
                  {{ currentClient?.username }}
                </el-descriptions-item>
                <el-descriptions-item label="连接状态">
                  <el-tag :type="currentClient?.connected ? 'success' : 'danger'">
                    {{ currentClient?.connected ? '在线' : '离线' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="IP地址">
                  {{ currentClient?.ipAddress }}
                </el-descriptions-item>
                <el-descriptions-item label="端口">
                  {{ currentClient?.port }}
                </el-descriptions-item>
                <el-descriptions-item label="协议">
                  {{ currentClient?.protoFullName }}
                </el-descriptions-item>
                <el-descriptions-item label="WebSocket">
                  {{ currentClient?.webSocket ? '是' : '否' }}
                </el-descriptions-item>
                <el-descriptions-item label="SSL">
                  {{ currentClient?.ssl ? '是' : '否' }}
                </el-descriptions-item>
                <el-descriptions-item label="keepAlive">
                  {{ currentClient?.keepAlive }}s
                </el-descriptions-item>
                <el-descriptions-item label="解码队列大小">
                  {{ currentClient?.decodeQueueSize }}
                </el-descriptions-item>
                <el-descriptions-item label="处理队列大小">
                  {{ currentClient?.handlerQueueSize }}
                </el-descriptions-item>
                <el-descriptions-item label="发送队列大小">
                  {{ currentClient?.sendQueueSize }}
                </el-descriptions-item>
                <el-descriptions-item label="连接时间">
                  {{ currentClient?.connectedAt ? formatTime(currentClient.connectedAt) : '' }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ currentClient?.createdAt ? formatTime(currentClient.createdAt) : '' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <!-- 操作面板 -->
          <el-col :span="12">
            <!-- 代理订阅 -->
            <el-card>
              <template #header>
                <span>代理订阅</span>
              </template>
              
              <el-form :model="subscribeForm" @submit.prevent="handleProxySubscribe">
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
                  <el-button type="primary" @click="handleProxySubscribe" :loading="subscribing">
                    <el-icon><Plus /></el-icon>
                    代理订阅
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>
            <!-- 订阅列表 -->
            <el-card style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>订阅列表</span>
                  <el-button @click="refreshSubscriptions" :loading="loading">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </template>
              <el-table :data="currentClient?.subscriptions || []" v-loading="loading">
                <el-table-column prop="topicFilter" label="主题过滤器" />
                <el-table-column prop="mqttQoS" label="QoS">
                  <template #default="{ row }">
                    <el-tag>{{ row.mqttQoS }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button
                      type="danger"
                      size="small"
                      @click="handleUnsubscribe(row.topicFilter)"
                    >
                      取消订阅
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ArrowLeft, Plus, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClientStore } from '@/stores/client'
import { formatTime } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const clientStore = useClientStore()

// 使用 storeToRefs 解构响应式状态
const { currentClient, loading } = storeToRefs(clientStore)

// 直接解构方法
const { fetchClientDetail, kickClient, proxySubscribe, proxyUnsubscribe } = clientStore

const clientId = computed(() => route.params.clientId as string)

// 代理订阅表单
const subscribeForm = ref({
  topic: '',
  qos: 0
})

const subscribing = ref(false)

// 获取客户端详情
const loadClientDetail = async () => {
  if (clientId.value) {
    await fetchClientDetail(clientId.value)
  }
}

// 踢出客户端
const handleKickClient = async () => {
  if (!currentClient.value) return

  try {
    await ElMessageBox.confirm(
      `确定要踢出客户端 "${currentClient.value.clientId}" 吗？`,
      '确认踢出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = await kickClient(currentClient.value.clientId)
    if (success) {
      ElMessage.success('客户端已踢出')
      // 踢出成功后返回客户端列表
      router.back()
    } else {
      ElMessage.error('踢出客户端失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 代理订阅
const handleProxySubscribe = async () => {
  if (!subscribeForm.value.topic.trim()) {
    ElMessage.warning('请输入主题')
    return
  }

  if (!currentClient.value) return

  subscribing.value = true
  try {
    const success = await proxySubscribe(
      currentClient.value.clientId,
      subscribeForm.value.topic,
      subscribeForm.value.qos
    )

    if (success) {
      ElMessage.success('代理订阅成功')
      subscribeForm.value.topic = ''
      await loadClientDetail()
    } else {
      ElMessage.error('代理订阅失败')
    }
  } catch (error) {
    ElMessage.error('代理订阅失败')
  } finally {
    subscribing.value = false
  }
}

// 取消订阅
const handleUnsubscribe = async (topic: string) => {
  if (!currentClient.value) return

  try {
    await ElMessageBox.confirm(
      `确定要取消订阅主题 "${topic}" 吗？`,
      '确认取消订阅',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = await proxyUnsubscribe(currentClient.value.clientId, topic)
    if (success) {
      ElMessage.success('取消订阅成功')
      await loadClientDetail()
    } else {
      ElMessage.error('取消订阅失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 刷新订阅列表
const refreshSubscriptions = async () => {
  await loadClientDetail()
}

onMounted(() => {
  loadClientDetail()
})
</script>

<style scoped>
.client-detail {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
