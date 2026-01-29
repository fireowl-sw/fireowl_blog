/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly glob: typeof import('vite')['glob']
  readonly globEager: typeof import('vite')['globEager']
}
