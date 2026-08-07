import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'
import { setCredentialsProvider, setUnauthorizedHandler } from './utils/api'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)

// 注入认证凭据获取与失效处理（依赖 auth store，需在 pinia 安装后）
setCredentialsProvider(() => useAuthStore().getApiCredentials())
setUnauthorizedHandler(() => useAuthStore().logout())

app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

app.mount('#app')
