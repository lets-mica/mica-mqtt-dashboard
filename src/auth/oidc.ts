import type { AuthProvider, BasicCredentials, LoginResult } from './types'

const VERIFIER_KEY = 'mqtt_oauth_verifier'
const STATE_KEY = 'mqtt_oauth_state'
const TOKEN_KEY = 'mqtt_oauth_token'
const TOKEN_EXPIRES_KEY = 'mqtt_oauth_token_expires'
const USERNAME_KEY = 'mqtt_oauth_username'

export interface OidcConfig {
  issuer: string
  clientId: string
  scopes: string[]
  brokerUsername: string
  brokerPassword: string
}

interface OidcEndpoints {
  authorizationEndpoint: string
  tokenEndpoint: string
  userinfoEndpoint: string
}

const base64UrlEncode = (input: ArrayBuffer): string => {
  const bytes = new Uint8Array(input)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const generateVerifier = (): string => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes.buffer)
}

const generateChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(digest)
}

const getRedirectUri = (): string => `${window.location.origin}/login`

const discoverEndpoints = async (issuer: string): Promise<OidcEndpoints> => {
  const base = issuer.replace(/\/+$/, '')
  const response = await fetch(`${base}/.well-known/openid-configuration`)
  if (!response.ok) {
    throw new Error(`OIDC 配置发现失败: HTTP ${response.status}`)
  }
  const config = await response.json()
  return {
    authorizationEndpoint: config.authorization_endpoint,
    tokenEndpoint: config.token_endpoint,
    userinfoEndpoint: config.userinfo_endpoint
  }
}

export function createOidcAuthProvider(config: OidcConfig): AuthProvider {
  let isAuthenticated = false
  let username = ''
  let token = ''

  const init = () => {
    const storedToken = sessionStorage.getItem(TOKEN_KEY)
    const storedUsername = sessionStorage.getItem(USERNAME_KEY)
    const storedExpires = sessionStorage.getItem(TOKEN_EXPIRES_KEY)
    const expired = storedExpires ? Date.now() >= Number(storedExpires) : false

    if (storedToken && storedUsername && !expired) {
      token = storedToken
      username = storedUsername
      isAuthenticated = true
    } else if (expired) {
      // token 已过期，清理会话回登录页
      logout()
    }
  }

  const startLogin = async (): Promise<void> => {
    const verifier = generateVerifier()
    const challenge = await generateChallenge(verifier)
    const state = crypto.randomUUID()
    sessionStorage.setItem(VERIFIER_KEY, verifier)
    sessionStorage.setItem(STATE_KEY, state)

    const { authorizationEndpoint } = await discoverEndpoints(config.issuer)
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: getRedirectUri(),
      scope: config.scopes.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    })
    window.location.href = `${authorizationEndpoint}?${params.toString()}`
  }

  const handleCallback = async (): Promise<LoginResult> => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const storedState = sessionStorage.getItem(STATE_KEY)

    if (!code || !state || !storedState || state !== storedState) {
      sessionStorage.removeItem(VERIFIER_KEY)
      sessionStorage.removeItem(STATE_KEY)
      return { success: false, message: 'OAuth 回调校验失败' }
    }

    const verifier = sessionStorage.getItem(VERIFIER_KEY)
    if (!verifier) {
      sessionStorage.removeItem(VERIFIER_KEY)
      sessionStorage.removeItem(STATE_KEY)
      return { success: false, message: '缺少 code_verifier' }
    }

    try {
      const { tokenEndpoint, userinfoEndpoint } = await discoverEndpoints(config.issuer)
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getRedirectUri(),
        client_id: config.clientId,
        code_verifier: verifier
      })
      const tokenResponse = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      })
      if (!tokenResponse.ok) {
        return { success: false, message: '换取 token 失败' }
      }
      const tokenData = await tokenResponse.json()
      token = tokenData.access_token as string
      if (tokenData.expires_in) {
        sessionStorage.setItem(TOKEN_EXPIRES_KEY, String(Date.now() + Number(tokenData.expires_in) * 1000))
      }

      const userResponse = await fetch(userinfoEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!userResponse.ok) {
        return { success: false, message: '获取用户信息失败' }
      }
      const user = await userResponse.json()
      username = user.preferred_username || user.sub || ''

      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USERNAME_KEY, username)
      isAuthenticated = true
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.message || 'OAuth 登录失败' }
    } finally {
      sessionStorage.removeItem(VERIFIER_KEY)
      sessionStorage.removeItem(STATE_KEY)
    }
  }

  const getApiCredentials = (): BasicCredentials | null =>
    isAuthenticated
      ? { username: config.brokerUsername, password: config.brokerPassword }
      : null

  const logout = () => {
    isAuthenticated = false
    token = ''
    username = ''
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRES_KEY)
    sessionStorage.removeItem(USERNAME_KEY)
  }

  return {
    mode: 'oauth',
    init,
    isAuthenticated: () => isAuthenticated,
    getUsername: () => username,
    login: async (): Promise<LoginResult> => ({
      success: false,
      message: 'oauth 模式请使用企业账号登录'
    }),
    startLogin,
    handleCallback,
    getApiCredentials,
    logout
  }
}
