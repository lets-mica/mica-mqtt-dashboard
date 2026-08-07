import { createBasicAuthProvider } from './basic'
import { createOidcAuthProvider } from './oidc'
import type { AuthMode, AuthProvider } from './types'

export * from './types'

export function createAuthProvider(): AuthProvider {
  const mode = (import.meta.env.VITE_AUTH_MODE || 'basic') as AuthMode

  if (mode !== 'basic' && mode !== 'oauth') {
    throw new Error(`无效的认证模式: ${mode}（仅支持 basic / oauth）`)
  }

  if (mode === 'oauth') {
    const issuer = import.meta.env.VITE_OAUTH_ISSUER
    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID
    if (!issuer || !clientId) {
      throw new Error('OAuth 模式缺少配置: VITE_OAUTH_ISSUER / VITE_OAUTH_CLIENT_ID')
    }
    return createOidcAuthProvider({
      issuer,
      clientId,
      scopes: (import.meta.env.VITE_OAUTH_SCOPES || 'openid profile').split(' '),
      brokerUsername: import.meta.env.VITE_BROKER_USERNAME || '',
      brokerPassword: import.meta.env.VITE_BROKER_PASSWORD || ''
    })
  }

  return createBasicAuthProvider()
}
