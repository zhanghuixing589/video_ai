import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
//   解决跨域问题
  server:{
    port:3000,  //前端端口
    proxy:{
      '/api': {
        target: 'http://localhost:8081',  // IDEA 本地后端地址
        changeOrigin: true,
      }
    }
  }
})
