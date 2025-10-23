<template>
  <div class="dashboard">
      <h1>仪表盘</h1>
      
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-cards">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.connectedClients }}</div>
                <div class="stat-label">在线客户端</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Message /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.totalMessages) }}</div>
                <div class="stat-label">总消息数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatNumber(stats.totalSubscriptions) }}</div>
                <div class="stat-label">总订阅数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ formatUptime(stats.uptime) }}</div>
                <div class="stat-label">运行时间</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 系统资源使用情况 -->
      <el-row :gutter="20" class="resource-charts">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>内存使用率</span>
            </template>
            <div class="chart-container">
              <el-progress
                :percentage="stats.memoryUsage"
                :color="getProgressColor(stats.memoryUsage)"
                :stroke-width="20"
              />
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>CPU 使用率</span>
            </template>
            <div class="chart-container">
              <el-progress
                :percentage="stats.cpuUsage"
                :color="getProgressColor(stats.cpuUsage)"
                :stroke-width="20"
              />
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
import { useMonitorStore } from '@/stores/monitor'
import { useClientStore } from '@/stores/client'
import { formatNumber, formatTime } from '@/utils/format'

const monitorStore = useMonitorStore()
const clientStore = useClientStore()

const { stats, loading } = monitorStore
const { clients } = clientStore

// 最近连接的客户端（取前5个）
const recentClients = computed(() => {
  return clients
    .filter(client => client.connected)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .slice(0, 5)
})

// 格式化运行时间
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) {
    return `${days}天 ${hours}小时`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
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

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  font-size: 48px;
  color: var(--el-color-primary);
  margin-right: 16px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
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
