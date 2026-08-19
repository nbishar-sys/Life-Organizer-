/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public OAuth client ID for Google sign-in (Calendar/Gmail). Not a
   * secret — safe to bake into the built bundle. See README "Connecting
   * Google" for how to create one. Empty string when unset.
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
