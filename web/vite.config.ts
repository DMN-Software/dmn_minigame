import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        // shared/ liegt ausserhalb des vite-roots, sonst verweigert der dev-server den zugriff
        fs: { allow: ['..'] },
        proxy: { '/api': 'http://127.0.0.1:8090' },
    },
    build: {
        // fivem-cef haengt je nach build auf einem aelteren chromium
        target: 'chrome103',
        chunkSizeWarningLimit: 300,
    },
})
