<template>
  <div class="clients-page">
      <div class="page-header">
        <h1>客户端管理</h1>
        <el-button type="primary" @click="refreshClients" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <!-- 搜索和筛选 -->
      <el-card class="search-card">
        <el-form :model="searchForm" inline>
          <el-form-item label="客户端ID">
            <el-input
              v-model="searchForm.clientId"
              placeholder="请输入客户端ID"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          
          <el-form-item label="用户名">
            <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          
          <el-form-item label="连接状态">
            <el-select v-model="searchForm.connected" placeholder="请选择状态" clearable>
              <el-option label="在线" :value="true" />
              <el-option label="离线" :value="false" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 客户端列表 -->
      <el-card class="clients-table">
        <el-table
          :data="filteredClients"
          v-loading="loading"
          stripe
          @row-click="handleRowClick"
          style="cursor: pointer"
        >
          <el-table-column prop="clientId" label="客户端ID" width="220" />
          <el-table-column prop="username" label="用户名" width="160" />
          <el-table-column prop="ipAddress" label="IP地址" width="120" />
          <el-table-column prop="port" label="端口" width="80" />
          <el-table-column prop="keepAlive" label="keepAlive" width="90">
            <template #default="{ row }">
              {{ row.keepAlive }}s
            </template>
          </el-table-column>
          <el-table-column prop="protoFullName" label="协议" width="100" />
          <el-table-column prop="connected" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.connected ? 'success' : 'danger'">
                {{ row.connected ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="connectedAt" label="连接时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.connectedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click.stop="viewClientDetail(row.clientId)"
              >
                详情
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click.stop="kickClient(row.clientId)"
                :disabled="!row.connected"
              >
                踢出
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Refresh, Search, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useClientStore } from '@/stores/client'
import { formatTime } from '@/utils/format'

const router = useRouter()
const clientStore = useClientStore()

// 使用 storeToRefs 解构响应式状态
const { clients, loading, pagination } = storeToRefs(clientStore)

// 直接解构方法
const { fetchClients, kickClient: storeKickClient } = clientStore

// 搜索表单
const searchForm = ref({
  clientId: '',
  username: '',
  connected: null as boolean | null
})

// 过滤后的客户端列表
const filteredClients = computed(() => {
  let filtered = clients.value

  if (searchForm.value.clientId) {
    filtered = filtered.filter(client =>
      client.clientId.toLowerCase().includes(searchForm.value.clientId.toLowerCase())
    )
  }

  if (searchForm.value.username) {
    filtered = filtered.filter(client =>
      client.username?.toLowerCase().includes(searchForm.value.username.toLowerCase())
    )
  }

  if (searchForm.value.connected !== null) {
    filtered = filtered.filter(client => client.connected === searchForm.value.connected)
  }

  return filtered
})

// 搜索
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    clientId: '',
    username: '',
    connected: null
  }
}

// 刷新客户端列表
const refreshClients = async () => {
  await fetchClients(pagination.value.page, pagination.value.pageSize)
}

// 查看客户端详情
const viewClientDetail = (clientId: string) => {
  router.push(`/clients/${clientId}`)
}

// 踢出客户端
const kickClient = async (clientId: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要踢出客户端 "${clientId}" 吗？`,
      '确认踢出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = await storeKickClient(clientId)
    if (success) {
      ElMessage.success('客户端已踢出')
      await refreshClients()
    } else {
      ElMessage.error('踢出客户端失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

// 行点击事件
const handleRowClick = (row: any) => {
  viewClientDetail(row.clientId)
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  fetchClients(1, size)
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  fetchClients(page, pagination.value.pageSize)
}

onMounted(() => {
  fetchClients()
})
</script>

<style scoped>
.clients-page {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.clients-table {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
