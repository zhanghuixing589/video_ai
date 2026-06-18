import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {lazy, Suspense, useEffect, useState} from 'react';
import {App as AntApp, ConfigProvider, Spin} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './styles/global.css';
import {authApi} from './services/api';
import type {Role, StudioStatus} from './type/api';

const Login = lazy(() => import('./pages/Login'));
const ConsumerHome = lazy(() => import('./pages/ConsumerHome'));
const VideoPlayPage = lazy(() => import('./pages/VideoPlayPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudioReviewerDashboard = lazy(() => import('./pages/StudioReviewerDashboard'));
const StudioApplication = lazy(() => import('./pages/StudioApplication'));
const StudioWorkspace = lazy(() => import('./pages/StudioWorkspace'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ReviewDetail = lazy(() => import('./pages/ReviewDetail'));

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
        if (!sessionStorage.getItem('token')) {
            setState('login');
            return;
        }
        authApi.me()
            .then((user) => {
                sessionStorage.setItem('user', JSON.stringify(user));
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

function RouteFallback() {
    return (
        <div style={{minHeight: '100dvh', display: 'grid', placeItems: 'center'}}>
            <Spin size="large" />
        </div>
    );
}

function App() {
    return (
        <ConfigProvider
            locale={zhCN}
            theme={{
                token: {
                    colorPrimary: '#0071e3',
                    colorInfo: '#0071e3',
                    colorBgLayout: '#f5f5f7',
                    colorBgContainer: '#ffffff',
                    colorText: '#1d1d1f',
                    colorTextSecondary: '#6e6e73',
                    colorBorder: '#d2d2d7',
                    borderRadius: 14,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
                    boxShadow: '0 18px 44px rgba(0, 0, 0, 0.08)',
                },
                components: {
                    Button: {
                        borderRadius: 999,
                        controlHeight: 38,
                        primaryShadow: '0 12px 28px rgba(0, 113, 227, 0.24)',
                    },
                    Card: {
                        borderRadiusLG: 20,
                        paddingLG: 24,
                    },
                    Input: {
                        borderRadius: 14,
                    },
                    Select: {
                        borderRadius: 14,
                    },
                    Modal: {
                        borderRadiusLG: 20,
                    },
                    Table: {
                        headerBg: '#f5f5f7',
                        headerColor: '#6e6e73',
                    },
                },
            }}
        >
            <AntApp>
                <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            <Route path="/" element={<ConsumerHome channel="HOME"/>}/>
                            <Route path="/tv" element={<ConsumerHome channel="TV_SERIES"/>}/>
                            <Route path="/movies" element={<ConsumerHome channel="MOVIE"/>}/>
                            <Route path="/variety" element={<ConsumerHome channel="VARIETY"/>}/>
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
                            <Route path="/profile" element={
                                <PrivateRoute><UserProfile/></PrivateRoute>
                            }/>
                            <Route path="/review/detail/:id" element={
                                <PrivateRoute allowedRoles={['REVIEWER']}>
                                    <ReviewDetail/>
                                </PrivateRoute>
                            }/>
                            <Route path="/play/:contentId/:episodeId" element={<VideoPlayPage />} />
                            <Route path="*" element={<Navigate to="/" replace/>}/>
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    );
}

export default App;
