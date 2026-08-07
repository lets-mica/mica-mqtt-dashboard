export type AuthMode = 'basic' | 'oauth'

export interface BasicCredentials {
  username: string
  password: string
}

// axios 请求附加的认证信息：Basic 模式用 auth，OAuth 模式用 headers
export interface ApiCredentials {
  auth?: BasicCredentials
  headers?: Record<string, string>
}

export interface LoginResult {
  success: boolean
  message?: string
}

export interface AuthProvider {
  readonly mode: AuthMode
  init(): void
  isAuthenticated(): boolean
  getUsername(): string
  login(username: string, password: string): Promise<LoginResult>
  startLogin(): Promise<void>
  handleCallback(): Promise<LoginResult>
  getApiCredentials(): ApiCredentials | null
  logout(): void
}
