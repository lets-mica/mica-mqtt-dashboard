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
  init(): void
  isAuthenticated(): boolean
  getUsername(): string
  login(username: string, password: string): Promise<LoginResult>
  startLogin(): Promise<void>
  handleCallback(): Promise<LoginResult>
  getApiCredentials(): BasicCredentials | null
  logout(): void
}
