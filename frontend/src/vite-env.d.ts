/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_HOME_DOCS_PASSWORD?: string
	readonly VITE_HOME_DOCS_SHORTCUT?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
