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
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { sidebarCollapsed, theme, toggleSidebar, toggleTheme } = appStore
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

.sidebar-toggle {
  font-size: 18px;
}

.theme-toggle {
  font-size: 18px;
}

.main-content {
  background-color: var(--el-bg-color-page);
  padding: 20px;
}
</style>
