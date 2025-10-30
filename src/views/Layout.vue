<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarCollapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <img src="/logo.png" alt="MICA MQTT" v-if="!sidebarCollapsed" />
        <span v-if="!sidebarCollapsed">MICA MQTT</span>
      </div>

      <el-menu
        :default-active="$route.path"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-menu-item index="/clients">
          <el-icon><User /></el-icon>
          <span>客户端管理</span>
        </el-menu-item>

        <el-menu-item index="/monitor">
          <el-icon><Monitor /></el-icon>
          <span>状态监控</span>
        </el-menu-item>

        <el-menu-item index="/debug">
          <el-icon><Tools /></el-icon>
          <span>MQTT 调试</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
            class="sidebar-toggle"
          >
            <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ $route.meta.title || 'Mica MQTT Dashboard' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-button
            type="text"
            @click="toggleTheme"
            class="theme-toggle"
          >
            <el-icon><Sunny v-if="theme === 'light'" /><Moon v-else /></el-icon>
          </el-button>

          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-icon><User /></el-icon>
              <span>{{ authStore.username }}</span>
              <el-icon class="arrow-down"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 页面内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { House, User, Monitor, Tools, Fold, Expand, Sunny, Moon, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const { sidebarCollapsed, theme, toggleSidebar, toggleTheme } = appStore

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '退出确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  transition: width 0.3s;
}

.logo {
  display: flex;
  align-items: center;
  padding: 16px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.sidebar-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
}

.theme-toggle {
  font-size: 18px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.arrow-down {
  font-size: 12px;
}

.main-content {
  background-color: var(--el-bg-color-page);
  padding: 20px;
}
</style>
