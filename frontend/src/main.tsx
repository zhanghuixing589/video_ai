import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';  // ✅ 导入你自己的 App 组件

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);