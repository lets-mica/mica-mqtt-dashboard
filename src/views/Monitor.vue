<template>
  <div class="monitor-page">
      <div class="page-header">
        <h1>状态监控</h1>
        <div class="header-actions">
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
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.connections?.size || 0 }}</div>
                <div class="stat-label">当前连接数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
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
              <div class="stat-icon">
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
              <div class="stat-icon">
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

      <!-- 实时监控图表 -->
      <el-row :gutter="20" class="charts-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>连接数趋势</span>
            </template>
            <div class="chart-container">
              <v-chart
                :option="connectionsChartOption"
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
              <span>消息流量趋势</span>
            </template>
            <div class="chart-container">
              <v-chart
                :option="messagesChartOption"
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
          <el-table-column prop="connections" label="连接数" width="100" />
          <el-table-column prop="messagesReceived" label="接收数据包" width="120" />
          <el-table-column prop="messagesSent" label="发送数据包" width="120" />
          <el-table-column prop="bytesReceived" label="接收字节" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.bytesReceived) }}
            </template>
          </el-table-column>
          <el-table-column prop="bytesSent" label="发送字节" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.bytesSent) }}
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
import { storeToRefs } from 'pinia'
import { Delete, User, Connection, Download, Upload } from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { formatNumber, formatTime, formatFileSize } from '@/utils/format'

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

// 使用 storeToRefs 解构响应式状态
const { stats, monitorData, loading, realtimeEnabled } = storeToRefs(monitorStore)

// 直接解构方法
const { fetchStats, startRealtimeMonitor, stopRealtimeMonitor, clearMonitorData } = monitorStore

// 注意：不再需要手动切换监控，页面加载时自动开始监控

// 连接数图表配置
const connectionsChartOption = computed(() => {
  const times = monitorData.value.map(item => formatTime(item.timestamp))
  const connections = monitorData.value.map(item => item.connections)
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '连接数'
    },
    series: [
      {
        name: '当前连接',
        type: 'line',
        data: connections,
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 2
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
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      }
    ]
  }
})

// 消息流量图表配置
const messagesChartOption = computed(() => {
  const times = monitorData.value.map(item => formatTime(item.timestamp))
  const received = monitorData.value.map(item => item.messagesReceived)
  const sent = monitorData.value.map(item => item.messagesSent)
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['接收数据包', '发送数据包']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '数据包数'
    },
    series: [
      {
        name: '接收数据包',
        type: 'line',
        data: received,
        smooth: true,
        lineStyle: {
          color: '#67C23A',
          width: 2
        }
      },
      {
        name: '发送数据包',
        type: 'line',
        data: sent,
        smooth: true,
        lineStyle: {
          color: '#409EFF',
          width: 2
        }
      }
    ]
  }
})

onMounted(() => {
  fetchStats()
  // 页面加载后自动开始实时监控
  startRealtimeMonitor()
})

onUnmounted(() => {
  stopRealtimeMonitor()
})
</script>

<style scoped>
.monitor-page {
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
