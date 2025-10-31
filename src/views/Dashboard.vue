<template>
  <div class="dashboard">
      <h1>仪表盘</h1>
      
      <!-- 连接统计 -->
      <div class="section-title">
        <span>连接统计</span>
      </div>
      <el-row :gutter="16" class="stats-cards">
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #409EFF">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.nodes?.clientNodes || 0 }}</div>
                <div class="stat-label">客户端节点</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #67C23A">
                <el-icon><Link /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.nodes?.connections || 0 }}</div>
                <div class="stat-label">总连接数</div>
              </div>
            </div>
          </el-card>
        </el-col>
 
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #67C23A">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.connections?.accepted) }}</div>
                <div class="stat-label">已接受连接</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #409EFF">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.connections?.size) }}</div>
                <div class="stat-label">当前连接数</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #909399">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.connections?.closed) }}</div>
                <div class="stat-label">已关闭连接</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #E6A23C">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.nodes?.users || 0 }}</div>
                <div class="stat-label">用户数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 消息统计 -->
      <div class="section-title">消息统计</div>
      <el-row :gutter="16" class="stats-cards">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #67C23A">
                <el-icon><Download /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.messages?.receivedPackets) }}</div>
                <div class="stat-label">接收数据包</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #409EFF">
                <el-icon><Upload /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.messages?.sendPackets) }}</div>
                <div class="stat-label">发送数据包</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #67C23A">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatBytes(stats.messages?.receivedBytes) }}</div>
                <div class="stat-label">接收字节</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="color: #409EFF">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatBytes(stats.messages?.sendBytes) }}</div>
                <div class="stat-label">发送字节</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近连接 -->
      <el-card class="recent-clients">
        <template #header>
          <div class="card-header">
            <span>最近连接的客户端</span>
            <el-button type="primary" @click="$router.push('/clients')">查看全部</el-button>
          </div>
        </template>
        
        <el-table :data="recentClients" v-loading="loading">
          <el-table-column prop="clientId" label="客户端ID" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="ipAddress" label="IP地址" />
          <el-table-column prop="connectedAt" label="连接时间">
            <template #default="{ row }">
              {{ formatTime(row.connectedAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="connected" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.connected ? 'success' : 'danger'">
                {{ row.connected ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  User, 
  Connection, 
  Link, 
  CircleCheck, 
  CircleClose, 
  Download, 
  Upload, 
  FolderOpened, 
  Folder 
} from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { useClientStore } from '@/stores/client'
import { formatNumber, formatTime, formatFileSize } from '@/utils/format'

const monitorStore = useMonitorStore()
const clientStore = useClientStore()

// 使用 storeToRefs 解构响应式状态
const { stats, loading } = storeToRefs(monitorStore)
const { clients } = storeToRefs(clientStore)

// 最近连接的客户端（取前5个）
const recentClients = computed(() => {
  return clients.value
    .filter(client => client.connected)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .slice(0, 5)
})

// 格式化字节数
const formatBytes = (bytes: number | undefined) => {
  if (bytes === undefined || bytes === null) return '0 B'
  return formatFileSize(bytes)
}

onMounted(async () => {
  await Promise.all([
    monitorStore.fetchStats(),
    clientStore.fetchClients(1, 5)
  ])
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 24px 0 16px 0;
  padding-left: 12px;
  border-left: 4px solid var(--el-color-primary);
}

.title-separator {
  margin: 0 12px;
  color: var(--el-color-primary);
  font-weight: 400;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 110px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
}

.stat-icon {
  font-size: 42px;
  color: var(--el-color-primary);
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-charts {
  margin-bottom: 20px;
}

.chart-container {
  padding: 20px 0;
}

.recent-clients {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
