/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin; empty means same origin (the dev server proxies /api). */
  readonly VITE_API_URL?: string
}
