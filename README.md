# Mica MQTT Dashboard

一个现代化的 [Mica MQTT](https://github.com/lets-mica/mica-mqtt) 服务器管理界面，基于 Vue 3 + Vite + TypeScript 构建。

[✨✨✨推广：**BladeX 物联网平台**✨✨✨iot.bladex.cn](https://iot.bladex.cn?from=mica-mqtt)

## 功能特性

### 🏠 仪表盘
- 实时显示服务器统计信息
- 在线客户端数量
- 总消息数和订阅数
- 最近连接的客户端列表

### 👥 客户端管理
- 分页显示所有客户端
- 客户端搜索和筛选
- 查看客户端详细信息
- 踢出指定客户端
- 客户端订阅管理

### 📊 状态监控
- 实时系统监控
- 客户端连接数趋势图
- 可配置的监控数据保留
- 实时数据更新

### 🔧 MQTT 调试
- 基于 WebSocket 的 MQTT 连接
- 实时消息收发
- 主题订阅管理
- 消息过滤和搜索
- 支持 QoS 0/1/2
- 保留消息支持

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **图表**: ECharts
- **MQTT 客户端**: mqtt.js
- **HTTP 客户端**: Axios
- **包管理器**: pnpm

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 环境配置

修改配置项：

```env
# API 配置
VITE_API_BASE_URL=

# MQTT 连接配置
VITE_MQTT_HOST=localhost
VITE_MQTT_PORT=8083
VITE_MQTT_CLIENT_ID_PREFIX=mica_web_
```

### 开发环境

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 配置说明

### 环境变量

项目支持通过环境变量配置连接参数：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 服务器地址 | `http://localhost:18083` |
| `VITE_MQTT_HOST` | MQTT WebSocket 主机 | `localhost` |
| `VITE_MQTT_PORT` | MQTT WebSocket 端口 | `8083` |
| `VITE_MQTT_CLIENT_ID_PREFIX` | MQTT 客户端ID前缀 | `mica_web_` |

### API 代理配置（开发环境）

开发环境下，Vite 会自动代理 API 请求。如需修改代理地址，请编辑 `vite.config.ts` 文件：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-mqtt-server:18083', // 修改为你的 MQTT 服务器地址
      changeOrigin: true
    }
  }
}
```

### 认证配置

通过登录页面输入用户名和密码即可进行认证。认证信息会保存在浏览器的 `localStorage` 中。

## 项目结构

```
mica-mqtt-dashboard/
├── src/
│   ├── components/          # 公共组件
│   ├── stores/              # Pinia 状态管理
│   │   ├── app.ts          # 应用状态
│   │   ├── client.ts       # 客户端管理
│   │   ├── monitor.ts      # 监控状态
│   │   └── debug.ts        # 调试状态
│   ├── utils/               # 工具函数
│   │   ├── api.ts          # API 请求封装
│   │   └── format.ts       # 格式化工具
│   ├── views/               # 页面组件
│   │   ├── Layout.vue      # 布局组件
│   │   ├── Dashboard.vue   # 仪表盘
│   │   ├── Clients.vue     # 客户端管理
│   │   ├── ClientDetail.vue # 客户端详情
│   │   ├── Monitor.vue     # 状态监控
│   │   └── Debug.vue       # MQTT 调试
│   ├── router/              # 路由配置
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── public/                  # 静态资源
├── package.json
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── README.md
```

## API 接口

项目基于 Mica MQTT 的 HTTP API 接口，主要使用以下接口：

- `GET /api/v1/endpoints` - 获取所有 API 接口
- `GET /api/v1/clients` - 获取客户端列表
- `GET /api/v1/clients/info` - 获取客户端详情
- `GET /api/v1/client/subscriptions` - 获取客户端订阅
- `POST /api/v1/clients/delete` - 踢出客户端
- `POST /api/v1/mqtt/publish` - 发布消息
- `POST /api/v1/mqtt/subscribe` - 订阅主题
- `POST /api/v1/mqtt/unsubscribe` - 取消订阅
- `GET /api/v1/stats` - 获取统计信息

## 开发指南

### 添加新页面

1. 在 `src/views/` 目录下创建新的 Vue 组件
2. 在 `src/router/index.ts` 中添加路由配置
3. 在 `src/views/Layout.vue` 中添加导航菜单项

### 添加新的状态管理

1. 在 `src/stores/` 目录下创建新的 store 文件
2. 在 `src/stores/index.ts` 中导出新的 store
3. 在组件中使用 `useStoreName()` 获取状态

### 添加新的 API 接口

1. 在 `src/utils/api.ts` 中添加新的 API 方法
2. 在对应的 store 中调用 API 方法
3. 在组件中使用 store 中的方法

## 部署说明

### 构建部署

```bash
pnpm build
```

构建完成后，将 `dist` 目录部署到 Web 服务器。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://your-mqtt-server:18083;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 许可证

本项目采用 Apache 2.0 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如有问题或建议，请提交 Issue 或联系开发团队。
