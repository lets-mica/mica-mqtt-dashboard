/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MQTT_HOST: string
  readonly VITE_MQTT_PORT: string
  readonly VITE_MQTT_CLIENT_ID_PREFIX: string
  readonly VITE_AUTH_MODE: string
  readonly VITE_OAUTH_ISSUER: string
  readonly VITE_OAUTH_CLIENT_ID: string
  readonly VITE_OAUTH_SCOPES: string
  readonly VITE_BROKER_USERNAME: string
  readonly VITE_BROKER_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
