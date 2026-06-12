import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {App as AntApp, ConfigProvider} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import ConsumerHome from './pages/ConsumerHome';
import AdminDashboard from './pages/AdminDashboard';
import StudioReviewerDashboard from './pages/StudioReviewerDashboard';
import StudioApplication from './pages/StudioApplication';
import StudioWorkspace from './pages/StudioWorkspace';
import {authApi} from './services/api';
import type {Role, StudioStatus} from './type/api';

function PrivateRoute({
    children,
    allowedRoles,
    requiredStudioStatus,
}: {
    children: React.ReactElement;
    allowedRoles?: Role[];
    requiredStudioStatus?: StudioStatus;
}) {
    const [state, setState] = useState<'loading' | 'allowed' | 'login' | 'home' | 'application'>('loading');

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            setState('login');
            return;
        }
        authApi.me()
            .then((user) => {
                localStorage.setItem('user', JSON.stringify(user));
                if (allowedRoles && !allowedRoles.includes(user.role)) setState('home');
                else if (requiredStudioStatus && user.studioStatus !== requiredStudioStatus) setState('application');
                else setState('allowed');
            })
            .catch(() => setState('login'));
    }, [allowedRoles, requiredStudioStatus]);

    if (state === 'loading') return null;
    if (state === 'login') return <Navigate to="/login" replace/>;
    if (state === 'home') return <Navigate to="/" replace/>;
    if (state === 'application') return <Navigate to="/studio/application" replace/>;
    return children;
}

function App() {
    return (
        <ConfigProvider locale={zhCN} theme={{token: {colorPrimary: '#1f6feb', borderRadius: 8}}}>
            <AntApp>
                <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <Routes>
                        <Route path="/" element={<ConsumerHome/>}/>
                        <Route path="/login" element={<Login/>}/>
                        <Route path="/studio/application" element={
                            <PrivateRoute allowedRoles={['STUDIO']}><StudioApplication/></PrivateRoute>
                        }/>
                        <Route path="/studio" element={
                            <PrivateRoute allowedRoles={['STUDIO']} requiredStudioStatus="APPROVED">
                                <StudioWorkspace/>
                            </PrivateRoute>
                        }/>
                        <Route path="/reviewer" element={
                            <PrivateRoute allowedRoles={['REVIEWER', 'ADMIN']}><StudioReviewerDashboard/></PrivateRoute>
                        }/>
                        <Route path="/admin" element={
                            <PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard/></PrivateRoute>
                        }/>
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    );
}

export default App;
