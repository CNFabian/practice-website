/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // Add other VITE_ prefixed environment variables here
  // readonly VITE_OTHER_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}