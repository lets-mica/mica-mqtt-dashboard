# 认证机制设计：Basic（默认）+ 可配置 OAuth

- 日期：2026-08-06
- 状态：已批准
- 范围：mica-mqtt-dashboard 前端认证机制

## 1. 背景与目标

mica-mqtt-dashboard 是纯前端 SPA（Vue 3 + Vite + TS + Pinia + Element Plus），通过 Nginx/Vite 代理访问 mica-mqtt 的 HTTP API（端口 18083）。后端 HTTP API 仅支持 **basic-auth**（`http-listener.basic-auth` 配置），原生不识别 OAuth token。

现状：登录页输入用户名/密码 → 调 `GET /api/v1/stats` 验证 → 账密存 `localStorage` → axios 请求拦截器自动附加 `config.auth`（HTTP Basic）。

目标：

- 默认保持 **Basic 认证**（现有行为不变）
- 可配置 **OAuth 认证**（通用 OIDC，配置驱动），作为登录门禁
- 认证模式通过环境变量 `VITE_AUTH_MODE` 构建时切换

### 已确认的决策

| 决策点 | 选择 |
|---|---|
| OAuth 角色 | 只做登录门禁，broker 凭据单独配置 |
| OAuth 对接范围 | 通用 OIDC，配置驱动（适配 Keycloak、Authing、GitHub、Gitee 等任意 OIDC 兼容 IdP） |
| broker 凭据来源 | 环境变量静态配置（`VITE_BROKER_USERNAME/PASSWORD`） |
| 模式切换 | 环境变量构建时切换（`VITE_AUTH_MODE=basic\|oauth`） |

## 2. 整体架构

新增 `src/auth/` 目录，用**策略模式**统一认证：

```
src/auth/
├── types.ts      # AuthProvider 接口 + AuthConfig 类型
├── basic.ts      # BasicAuthProvider（现有逻辑收拢）
├── oidc.ts       # OidcAuthProvider（通用 OIDC + PKCE）
└── index.ts      # createAuthProvider() 工厂，按 VITE_AUTH_MODE 返回实例
```

### 核心接口

```ts
// src/auth/types.ts
export type AuthMode = 'basic' | 'oauth'

export interface BasicCredentials {
  username: string
  password: string
}

export interface LoginResult {
  success: boolean
  message?: string
}

export interface AuthProvider {
  readonly mode: AuthMode
  init(): void                                // 从 storage 恢复会话
  isAuthenticated(): boolean
  getUsername(): string                       // 显示用（布局顶栏）
  login(...args: any[]): Promise<LoginResult> // basic: 账密; oauth: 触发跳转
  getApiCredentials(): BasicCredentials | null // axios 拦截器取 broker 凭据
  logout(): void
}
```

`stores/auth.ts` 改为持有当前 Provider 实例，组件与路由守卫只跟 store 交互，不感知具体认证方式。

### 工厂与配置校验

```ts
// src/auth/index.ts
export function createAuthProvider(): AuthProvider {
  const mode = (import.meta.env.VITE_AUTH_MODE || 'basic') as AuthMode
  return mode === 'oauth' ? createOidcAuthProvider() : createBasicAuthProvider()
}
```

- `AuthConfig` 由 `createAuthProvider()` 从 `import.meta.env` 读取
- 配置缺失（oauth 模式缺 `VITE_OAUTH_ISSUER`/`VITE_OAUTH_CLIENT_ID`）时启动即抛错并 `ElMessage.error` 提示，避免静默失败

## 3. 配置（环境变量）

`.env.development` / `.env.production` 新增：

```env
# 认证模式: basic（默认） | oauth
VITE_AUTH_MODE=basic

# OAuth 模式配置（VITE_AUTH_MODE=oauth 时生效）
VITE_OAUTH_ISSUER=https://sso.example.com
VITE_OAUTH_CLIENT_ID=your-client-id
VITE_OAUTH_SCOPES=openid profile

# broker 凭据（oauth 模式必填；basic 模式使用用户输入的账密）
VITE_BROKER_USERNAME=
VITE_BROKER_PASSWORD=
```

沿用项目现有 Vite env 体系（`import.meta.env`），无需运行时配置。

## 4. Basic 模式（默认）

行为与现状一致，逻辑收拢到 `BasicAuthProvider`：

- `login(user, pass)`：调 `GET /api/v1/stats`（携带临时 Basic 凭据）验证，200 即成功
- 成功后账密存 `localStorage`（`mqtt_username` / `mqtt_password`）
- `getApiCredentials()` 返回 localStorage 中的账密
- `logout()` 清除 localStorage
- 登录页显示账密表单（现状保留）

### 改动点

- `stores/auth.ts`：内部改为调用 `basicAuthProvider`
- `utils/api.ts`：请求拦截器改为 `provider.getApiCredentials()`（由 store 导出）
- `views/Login.vue`：通过 store 调用 `login`，表单交互不变

## 5. OAuth 模式（OIDC + PKCE）

采用 **Authorization Code + PKCE**（SPA 标准，无需 client secret），原生 `crypto` 实现，不新增依赖。

### 登录流程

1. 登录页显示「使用企业账号登录」按钮 → `OidcAuthProvider.login()`：
   - `crypto.randomUUID()` 生成 `code_verifier`
   - `crypto.subtle.digest('SHA-256', verifier)` 生成 `code_challenge`（base64url）
   - `crypto.randomUUID()` 生成 `state`
   - 跳转 IdP 授权端点（`response_type=code&client_id=...&redirect_uri=<当前origin>/login&state=...&code_challenge=...&code_challenge_method=S256`）
2. IdP 回调 `/login?code=...&state=...`：
   - 校验 `state`（防 CSRF，与发起时一致）
   - 用 `code` + `code_verifier` 请求 IdP token 端点换取 `access_token`（+ `id_token`）
   - 调用 IdP `userinfo` 端点获取用户名（`preferred_username` 或 `sub`），仅用于顶栏显示
3. 登录成功：token 存 **sessionStorage**（不落盘），`isAuthenticated = true`

### broker 凭据

- `getApiCredentials()` 返回环境变量 `VITE_BROKER_USERNAME/PASSWORD`
- **OAuth token 不进 broker API**，纯门禁
- OAuth 模式要求 broker 侧开启 basic-auth 且与 `VITE_BROKER_*` 一致

### 会话过期

- 路由守卫检查 `isAuthenticated`；userinfo 401/过期 → `logout()` 回登录页
- 刷新页面后从 sessionStorage 恢复会话；token 过期由下次 userinfo 校验发现（可选：按需刷新）

### 端点发现

- 优先从 IdP `/.well-known/openid-configuration` 发现 `authorization_endpoint` / `token_endpoint` / `userinfo_endpoint`（OIDC 标准）
- 兜底：环境变量直接配置端点（`VITE_OAUTH_AUTHORIZE_URL` 等，可选）

## 6. 数据流与错误处理

| 环节 | 行为 |
|---|---|
| 登录验证 | Basic：调 `/api/v1/stats`；OAuth：IdP 换 token 成功即登录 |
| axios 请求拦截器 | 改为 `provider.getApiCredentials()`，有则附加 `config.auth` |
| 401 响应 | 清会话 → 跳 `/login?redirect=...`（现状保留，适配两种模式） |
| 路由守卫 | 只判断 `authStore.isAuthenticated`，不感知模式（现状基本保留） |
| 配置缺失 | `createAuthProvider()` 启动即抛错 + `ElMessage.error` 提示 |

## 7. 测试与验证

- 项目无测试框架（AGENTS.md 明确），以 `pnpm type-check` + `pnpm lint:check` 为准
- 手动验证清单：
  1. Basic 登录/登出/401 跳转回归
  2. `VITE_AUTH_MODE=oauth` 且配置缺失 → 启动报错提示
  3. OAuth 登录 → IdP 授权 → 回调 → 显示用户名 → API 请求携带 broker 凭据
  4. OAuth 模式下 token 仅存 sessionStorage，关闭浏览器即失效

## 8. 非目标（YAGNI）

- 不做多 IdP 并行（登录页多个按钮）
- 不做运行时配置切换（构建时定死）
- 不引入 `oidc-client-ts` 等新依赖
- 不做 token 自动刷新（OAuth 仅门禁，broker 凭据不随 token 过期）
- 不改造 mica-mqtt 后端（保持前端纯静态部署形态）
