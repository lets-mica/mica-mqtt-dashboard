<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="48" color="#409EFF"><Connection /></el-icon>
        </div>
        <h1>MICA MQTT</h1>
        <p class="subtitle">管理控制台</p>
      </div>

      <!-- Basic 模式：账密表单 -->
      <template v-if="!isOAuth">
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="用户名"
              size="large"
              clearable
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="loginForm.remember">记住密码</el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </template>

      <!-- OAuth 模式：企业账号登录 -->
      <template v-else>
        <el-button
          type="primary"
          size="large"
          :loading="oauthLoading"
          class="login-button oauth-button"
          @click="handleOAuthLogin"
        >
          <el-icon><Connection /></el-icon>
          使用企业账号登录
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Connection, User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isOAuth = authStore.mode === 'oauth'
const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const oauthLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 3, message: '密码长度至少3位', trigger: 'blur' }
  ]
}

onMounted(async () => {
  if (isOAuth) {
    // 处理 IdP 授权回调（redirect_uri 为 /login）
    const url = new URL(window.location.href)
    if (url.searchParams.has('code') || url.searchParams.has('state')) {
      oauthLoading.value = true
      try {
        const result = await authStore.handleCallback()
        if (result.success) {
          ElMessage.success('登录成功')
          const redirect = route.query.redirect as string
          await router.push(redirect || '/dashboard')
        } else {
          ElMessage.error(result.message || 'OAuth 登录失败')
        }
      } finally {
        oauthLoading.value = false
      }
    }
    return
  }

  // Basic 模式：从本地存储恢复记住的账号
  const savedUsername = localStorage.getItem('saved_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    loginForm.remember = true
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    try {
      const result = await authStore.login(loginForm.username, loginForm.password)

      if (result.success) {
        ElMessage.success('登录成功')

        // 保存/清除记住的密码
        if (loginForm.remember) {
          localStorage.setItem('saved_username', loginForm.username)
        } else {
          localStorage.removeItem('saved_username')
        }

        // 跳转到目标页面或首页
        const redirect = route.query.redirect as string
        await router.push(redirect || '/dashboard')
      } else {
        ElMessage.error(result.message || '登录失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const handleOAuthLogin = async () => {
  oauthLoading.value = true
  try {
    // 跳转 IdP，成功后由 IdP 回跳 /login 触发回调处理
    await authStore.startLogin()
  } catch (error: any) {
    oauthLoading.value = false
    ElMessage.error(error.message || 'OAuth 登录失败')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-form {
  margin-top: 32px;
}

.login-button {
  width: 100%;
}

.oauth-button {
  margin-top: 32px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
}
</style>
