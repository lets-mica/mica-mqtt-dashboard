# OAuth2 / OIDC 测试服务指南

> 本文档适用于 mica-mqtt-dashboard 的 OAuth 认证模式（`VITE_AUTH_MODE=oauth`）调试与验证。

本项目采用通用 OIDC（OpenID Connect）标准 + PKCE（Proof Key for Code Exchange）授权码流程，通过环境变量 `VITE_OAUTH_ISSUER` 配置身份提供方（Identity Provider，以下简称 IdP）。因此**任何兼容 OIDC 的 IdP 均可用于测试**，无需修改代码。

## 1. 测试服务清单

### 1.1 本地自托管（推荐）

本地部署可控、免费、无网络依赖，适合开发调试。

| 服务 | 说明 | 上手难度 |
|---|---|---|
| **Keycloak** ⭐ | Red Hat 出品，OIDC 支持最全（PKCE、JWKS、introspection 全覆盖），自带图形化管理台 | 低（一条 Docker 命令） |
| **Dex** | CNCF 项目，轻量级，可对接 GitHub / LDAP 等上游 | 低 |
| **Ory Hydra** | 纯 OAuth2 / OIDC 服务，企业级，API 驱动 | 中 |
| **Zitadel** | 功能全面，含用户自助管理 | 中 |
| **IdentityServer** | .NET 生态的 OIDC 实现 | 中（需 .NET 环境） |

### 1.2 在线 SaaS

免部署，但需要注册账号。

| 服务 | 说明 |
|---|---|
| **Auth0** 免费档 | 每月 7500 活跃用户免费，OIDC 标准实现 |
| **Okta Developer** | 永久免费开发者账号 |
| **Microsoft Entra ID**（Azure AD） | 免费租户，支持 PKCE |
| **GitHub / Gitee** OAuth Apps | 国内场景推荐 Gitee，延迟低，两者均兼容 OAuth2 |
| **Authing**（国内） | 中文文档完善 |

### 1.3 演示沙盒

适合快速验证协议流程，无需注册。

- [OAuth 2.0 Sandbox](https://oauth.net/sandbox/)：OAuth 社区维护的协议测试页
- 各大 IdP 的试玩页（Playground）

## 2. 推荐测试路径：Keycloak + Docker

Keycloak 是验证本项目 OAuth 模式最快捷的方式，全程约 10 分钟。

### 2.1 启动 Keycloak

```bash
docker run -d \
  --name keycloak-test \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

启动后访问管理台：http://localhost:8080（账号 `admin` / 密码 `admin`）。

### 2.2 创建 Realm

1. 登录管理台，鼠标悬停左上角 `master`，点击「Create realm」
2. Realm name 填写 `test`，点击 Create

### 2.3 创建客户端（Client）

1. 左侧菜单进入 **Clients** → 点击 **Create client**
2. 配置如下：

| 配置项 | 值 |
|---|---|
| Client type | `OpenID Connect` |
| Client ID | `mica-dashboard` |
| Client authentication | **关闭**（SPA 场景使用 PKCE，无需 Client Secret） |
| Valid redirect URIs | `http://localhost:3000/login` |
| Valid post logout redirect URIs | `http://localhost:3000/login` |
| Web origins | `http://localhost:3000`（若跨域访问 API 需配置） |

3. 点击 Save

### 2.4 创建测试用户

1. 左侧菜单进入 **Users** → 点击 **Add user**
2. Username 填写 `testuser`，点击 Create
3. 打开该用户详情页 → **Credentials** 标签 → 设置密码（如 `test1234`），Temporary 选择 **Off**，点击 Save

### 2.5 配置项目环境变量

修改 `.env.development`：

```env
VITE_AUTH_MODE=oauth
VITE_OAUTH_ISSUER=http://localhost:8080/realms/test
VITE_OAUTH_CLIENT_ID=mica-dashboard
VITE_OAUTH_SCOPES=openid profile
```

> **注意：** `VITE_OAUTH_ISSUER` 必须是 Realm 地址（`/realms/<name>`），前端会自动拼接 `/.well-known/openid-configuration` 完成端点发现。

### 2.6 启动并验证

```bash
pnpm dev
```

访问 http://localhost:3000，按以下步骤验证：

1. 登录页显示「使用企业账号登录」按钮
2. 点击后跳转 Keycloak 登录页，输入 `testuser` / `test1234`
3. 授权后回跳 `/login?code=...&state=...`
4. 登录成功进入仪表盘，顶栏显示用户名
5. 打开浏览器 DevTools → Network 面板，确认 `/api/v1/*` 请求携带请求头：

```
Authorization: Bearer <access_token>
```

> 请求中**不应出现** Basic 凭据。服务端需自定义 `HttpFilter` 校验该 Bearer Token（参考 [认证设计文档](./superpowers/specs/2026-08-06-auth-design.md) 第 5 节）。

## 3. 常见问题排查

| 现象 | 可能原因 | 处理方式 |
|---|---|---|
| 点击登录后跳转回登录页且无反应 | 回调 URL 未匹配 | 检查 Keycloak 客户端的 Valid redirect URIs 是否包含 `http://localhost:3000/login` |
| 页面提示「OAuth 回调校验失败」 | `state` 校验失败（CSRF 防护生效） | 确认浏览器未禁用 Cookie / SessionStorage，刷新重试 |
| 提示「换取 token 失败」 | Client 配置了 Client authentication 但前端未提供 Secret | SPA 场景应关闭 Client authentication，使用 PKCE |
| API 请求返回 401 | 服务端 `HttpFilter` 未实现或 Token 无效 | 在 mica-mqtt 服务端实现 Token 校验（JWKS 验签或 introspection） |
| 顶栏不显示用户名 | userinfo 端点未返回 `preferred_username` / `sub` | 检查 Scope 是否包含 `profile`，或调整取名字段 |

## 4. 切换回 Basic 模式

测试完成后，将 `.env.development` 中的 `VITE_AUTH_MODE` 改回 `basic` 即可恢复默认的账密登录模式：

```env
VITE_AUTH_MODE=basic
```

## 5. 相关文档

- [认证机制设计文档](./superpowers/specs/2026-08-06-auth-design.md)
- [mica-mqtt 官方文档](https://mica-mqtt.dreamlu.net/)
- [Keycloak 官方文档](https://www.keycloak.org/documentation)
