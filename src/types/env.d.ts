/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FORMATS: string
  readonly VITE_MAX_IMAGE_WIDTH: string
  readonly VITE_MAX_IMAGE_HEIGHT: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
