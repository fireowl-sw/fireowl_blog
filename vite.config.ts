import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.md'],
  // 开发服务器配置
  server: {
    proxy: {
      // 代理 Gitee 图片请求
      '/gitee-proxy': {
        target: 'https://gitee.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gitee-proxy/, ''),
        secure: false,
      }
    }
  }
})
