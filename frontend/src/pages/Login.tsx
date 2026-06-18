import {useEffect, useState} from 'react';
import {
    App,
    Button,
    Checkbox,
    Form,
    Input,
    Segmented,
    Select,
    Typography,
} from 'antd';
import {
    ArrowLeftOutlined,
    LockOutlined,
    MailOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import {useLocation, useNavigate} from 'react-router-dom';
import {authApi, getApiErrorMessage} from '../services/api';
import type {LoginRequest, RegisterRequest, UserInfo} from '../type/api';
import {clearAuthNotice, readAuthNotice} from '../services/authNotice';
import heroImage from '../assets/hero.png';
import '../styles/global.css';
import './Login.css';

const {Title, Text} = Typography;

type AuthMode = 'login' | 'register';

function destinationFor(user: UserInfo): string {
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'REVIEWER') return '/reviewer';
    if (user.role === 'STUDIO') {
        return user.studioStatus === 'APPROVED' ? '/studio' : '/studio/application';
    }
    return '/';
}

function getModeFromSearch(search: string): AuthMode {
    return new URLSearchParams(search).get('mode') === 'register' ? 'register' : 'login';
}

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const {message: messageApi} = App.useApp();
    const [mode, setMode] = useState<AuthMode>(() => getModeFromSearch(location.search));
    const [loading, setLoading] = useState(false);
    const [loginForm] = Form.useForm<LoginRequest>();
    const [registerForm] = Form.useForm<RegisterRequest & {confirmPassword: string}>();

    useEffect(() => {
        setMode(getModeFromSearch(location.search));
    }, [location.search]);

    useEffect(() => {
        const notice = readAuthNotice(sessionStorage);
        if (notice) {
            messageApi.error({
                key: 'auth-session-replaced',
                content: notice,
            });
            const timer = window.setTimeout(() => clearAuthNotice(sessionStorage), 0);
            return () => window.clearTimeout(timer);
        }
    }, [messageApi]);

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        navigate(nextMode === 'register' ? '/login?mode=register' : '/login', {replace: true});
    };

    const login = async (values: LoginRequest) => {
        setLoading(true);
        try {
            const result = await authApi.login(values);
            sessionStorage.setItem('token', result.token);
            sessionStorage.setItem('user', JSON.stringify(result.user));
            messageApi.success(`欢迎回来，${result.user.displayName || result.user.username}`);
            navigate(destinationFor(result.user), {replace: true});
        } catch (error) {
            messageApi.error(getApiErrorMessage(error, '登录失败，请检查账号和密码'));
        } finally {
            setLoading(false);
        }
    };

    const register = async (values: RegisterRequest & {confirmPassword: string}) => {
        setLoading(true);
        try {
            const request: RegisterRequest = {
                username: values.username,
                email: values.email,
                password: values.password,
                displayName: values.displayName,
                role: values.role,
            };
            await authApi.register(request);
            registerForm.resetFields();
            loginForm.setFieldValue('username', request.username);
            switchMode('login');
            messageApi.success('注册成功，请登录');
        } catch (error) {
            messageApi.error(getApiErrorMessage(error, '注册失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-shell">
            <section className="auth-showcase" aria-label="映流内容展示">
                <div className="auth-showcase-media">
                    <img src={heroImage} alt="映流精选内容封面" />
                </div>
                <div className="auth-showcase-glass">
                    <span>映流</span>
                    <strong>发现、创作与管理优质影像内容</strong>
                    <p>面向观众、制片厂和审核团队的一体化内容平台。</p>
                </div>
            </section>

            <section className="auth-panel" aria-labelledby="auth-title">
                <button className="auth-home-link" type="button" onClick={() => navigate('/')}>
                    <ArrowLeftOutlined aria-hidden />
                    返回首页
                </button>

                <div className="auth-brand">
                    <span className="auth-brand-mark"><VideoCameraOutlined aria-hidden /></span>
                    <span>映流</span>
                </div>

                <header className="auth-copy">
                    <Title id="auth-title" level={1}>{mode === 'login' ? '登录' : '注册'}</Title>
                    <Text>{mode === 'login' ? '请输入账号和密码继续访问。' : '创建账号后即可开始使用映流。'}</Text>
                </header>

                <Segmented
                    className="auth-mode"
                    block
                    value={mode}
                    options={[{label: '登录', value: 'login'}, {label: '注册', value: 'register'}]}
                    onChange={(value) => switchMode(value as AuthMode)}
                />

                {mode === 'login' ? (
                    <Form form={loginForm} layout="vertical" size="large" onFinish={login}>
                        <Form.Item
                            name="displayName"
                            label="用户名或邮箱"
                            rules={[{required: true, message: '请输入用户名或邮箱'}]}
                        >
                            <Input prefix={<UserOutlined />} autoComplete="displayName" placeholder="用户名或邮箱" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label="密码"
                            rules={[{required: true, message: '请输入密码'}]}
                        >
                            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="密码" />
                        </Form.Item>
                        <div className="auth-row">
                            <Checkbox>记住我</Checkbox>
                            <Button type="link" onClick={() => messageApi.info('请联系管理员重置密码')}>
                                忘记密码？
                            </Button>
                        </div>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            登录
                        </Button>
                    </Form>
                ) : (
                    <Form
                        form={registerForm}
                        layout="vertical"
                        size="large"
                        initialValues={{role: 'USER'}}
                        onFinish={register}
                    >
                        <Form.Item name="role" label="注册身份" rules={[{required: true, message: '请选择注册身份'}]}>
                            <Select
                                options={[
                                    {label: '普通用户', value: 'USER'},
                                    {label: '制片厂', value: 'STUDIO'},
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            name="username"
                            label="名字"
                            rules={[
                                {required: true, message: '请输入您的名字'},
                                {min: 2, max: 64, message: '名字长度为 2-64 个字符'},
                            ]}
                        >
                            <Input prefix={<UserOutlined />} autoComplete="username" placeholder="名字" />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="邮箱"
                            rules={[
                                {required: true, message: '请输入邮箱'},
                                {type: 'email', message: '邮箱格式不正确'},
                            ]}
                        >
                            <Input prefix={<MailOutlined />} autoComplete="email" placeholder="邮箱" />
                        </Form.Item>
                        <Form.Item
                            name="displayName"
                            label="用户名"
                            rules={[
                                {required: true, message: '请输入用户名'},
                                {min: 2, max: 64, message: '用户名长度为 2-64 个字符'},
                            ]}
                        >
                            <Input placeholder="用户名" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label="密码"
                            rules={[
                                {required: true, message: '请输入密码'},
                                {min: 6, message: '密码至少 6 位'},
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="密码" />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="确认密码"
                            dependencies={['password']}
                            rules={[
                                {required: true, message: '请再次输入密码'},
                                ({getFieldValue}) => ({
                                    validator(_, value) {
                                        return !value || getFieldValue('password') === value
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} autoComplete="new-password" placeholder="确认密码" />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            创建账号
                        </Button>
                    </Form>
                )}
            </section>
        </main>
    );
}

export default Login;
