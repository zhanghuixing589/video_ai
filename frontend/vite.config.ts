import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorChunk = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  const normalized = id.replace(/\\/g, '/');
  if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/scheduler/')) {
    return 'vendor-react';
  }
  if (normalized.includes('/dplayer/') || normalized.includes('/hls.js/') || normalized.includes('/flv.js/')) {
    return 'vendor-player';
  }
  if (normalized.includes('/axios/')) return 'vendor-http';

  const packageName = normalized.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1];
  if (!packageName) return 'vendor-misc';
  if (packageName === 'antd' || packageName.startsWith('@ant-design/') || packageName.startsWith('@rc-component/') || packageName.startsWith('rc-')) {
    return undefined;
  }
  return 'vendor-misc';
};

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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  }
})
