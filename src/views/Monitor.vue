<template>
  <div class="monitor-page">
      <div class="page-header">
        <h1>状态监控</h1>
        <div class="header-actions">
          <el-button
            :type="realtimeEnabled ? 'danger' : 'primary'"
            @click="toggleRealtimeMonitor"
            :loading="loading"
          >
            <el-icon><VideoPlay v-if="!realtimeEnabled" /><VideoPause v-else /></el-icon>
            {{ realtimeEnabled ? '停止监控' : '开始监控' }}
          </el-button>
          <el-button @click="clearMonitorData" :disabled="!monitorData.length">
            <el-icon><Delete /></el-icon>
            清空数据
          </el-button>
        </div>
      </div>

      <!-- 实时统计 -->
      <el-row :gutter="20" class="stats-row">
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

      <!-- 系统资源监控 -->
      <el-row :gutter="20" class="resource-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>内存使用率</span>
            </template>
            <div class="resource-chart">
              <el-progress
                :percentage="stats.memoryUsage"
                :color="getProgressColor(stats.memoryUsage)"
                :stroke-width="20"
              />
              <div class="resource-value">{{ stats.memoryUsage }}%</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>CPU 使用率</span>
            </template>
            <div class="resource-chart">
              <el-progress
                :percentage="stats.cpuUsage"
                :color="getProgressColor(stats.cpuUsage)"
                :stroke-width="20"
              />
              <div class="resource-value">{{ stats.cpuUsage }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 实时监控图表 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>客户端连接数趋势</span>
            </template>
            <div class="chart-container">
              <v-chart
                :option="clientsChartOption"
                style="height: 300px;"
                v-if="monitorData.length > 0"
              />
              <div v-else class="no-data">暂无数据</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>系统资源使用趋势</span>
            </template>
            <div class="chart-container">
              <v-chart
                :option="resourceChartOption"
                style="height: 300px;"
                v-if="monitorData.length > 0"
              />
              <div v-else class="no-data">暂无数据</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 监控数据表格 -->
      <el-card class="monitor-table">
        <template #header>
          <span>监控数据</span>
        </template>
        
        <el-table :data="monitorData.slice(0, 20)" v-loading="loading">
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="connectedClients" label="连接数" width="100" />
          <el-table-column prop="messagesPerSecond" label="消息/秒" width="120" />
          <el-table-column prop="memoryUsage" label="内存使用率" width="120">
            <template #default="{ row }">
              <el-tag :type="getResourceTagType(row.memoryUsage)">
                {{ row.memoryUsage }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cpuUsage" label="CPU使用率" width="120">
            <template #default="{ row }">
              <el-tag :type="getResourceTagType(row.cpuUsage)">
                {{ row.cpuUsage }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useMonitorStore } from '@/stores/monitor'
import { formatNumber, formatTime } from '@/utils/format'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const monitorStore = useMonitorStore()

const { stats, monitorData, loading, realtimeEnabled, fetchStats, startRealtimeMonitor, stopRealtimeMonitor, clearMonitorData } = monitorStore

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

// 获取资源标签类型
const getResourceTagType = (percentage: number) => {
  if (percentage < 50) return 'success'
  if (percentage < 80) return 'warning'
  return 'danger'
}

// 切换实时监控
const toggleRealtimeMonitor = () => {
  if (realtimeEnabled.value) {
    stopRealtimeMonitor()
  } else {
    startRealtimeMonitor()
  }
}

// 客户端连接数图表配置
const clientsChartOption = computed(() => {
  const times = monitorData.value.map(item => formatTime(item.timestamp))
  const clients = monitorData.value.map(item => item.connectedClients)
  
  return {
    title: {
      text: '客户端连接数'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: times
    },
    yAxis: {
      type: 'value',
      name: '连接数'
    },
    series: [
      {
        name: '连接数',
        type: 'line',
        data: clients,
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ]
  }
})

// 系统资源图表配置
const resourceChartOption = computed(() => {
  const times = monitorData.value.map(item => formatTime(item.timestamp))
  const memory = monitorData.value.map(item => item.memoryUsage)
  const cpu = monitorData.value.map(item => item.cpuUsage)
  
  return {
    title: {
      text: '系统资源使用率'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['内存使用率', 'CPU使用率']
    },
    xAxis: {
      type: 'category',
      data: times
    },
    yAxis: {
      type: 'value',
      name: '使用率(%)',
      max: 100
    },
    series: [
      {
        name: '内存使用率',
        type: 'line',
        data: memory,
        smooth: true,
        lineStyle: {
          color: '#67C23A'
        }
      },
      {
        name: 'CPU使用率',
        type: 'line',
        data: cpu,
        smooth: true,
        lineStyle: {
          color: '#E6A23C'
        }
      }
    ]
  }
})

onMounted(() => {
  fetchStats()
})

onUnmounted(() => {
  stopRealtimeMonitor()
})
</script>

<style scoped>
.monitor-page {
  max-width: 1400px;
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

.stats-row {
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

.resource-row {
  margin-bottom: 20px;
}

.resource-chart {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 0;
}

.resource-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.charts-row {
  margin-bottom: 20px;
}

.chart-container {
  position: relative;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--el-text-color-regular);
  font-size: 16px;
}

.monitor-table {
  margin-top: 20px;
}
</style>
