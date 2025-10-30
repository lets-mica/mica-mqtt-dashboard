/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_MQTT_HOST: string
  readonly VITE_MQTT_PORT: string
  readonly VITE_MQTT_CLIENT_ID_PREFIX: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

