import {useState} from 'react';
import {Button, Card, Form, Input, Segmented, Select, Typography, message} from 'antd';
import {LockOutlined, MailOutlined, UserOutlined, VideoCameraOutlined} from '@ant-design/icons';
import {useLocation, useNavigate} from 'react-router-dom';
import {authApi, getApiErrorMessage} from '../services/api';
import type {LoginRequest, RegisterRequest, UserInfo} from '../type/api';
import './Login.css';

const {Title, Text} = Typography;

function destinationFor(user: UserInfo): string {
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'REVIEWER') return '/reviewer';
    if (user.role === 'STUDIO') {
        return user.studioStatus === 'APPROVED' ? '/studio' : '/studio/application';
    }
    return '/';
}

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState<'login' | 'register'>(
        new URLSearchParams(location.search).get('mode') === 'register' ? 'register' : 'login',
    );
    const [loading, setLoading] = useState(false);
    const [loginForm] = Form.useForm<LoginRequest>();
    const [registerForm] = Form.useForm<RegisterRequest>();

    const login = async (values: LoginRequest) => {
        setLoading(true);
        try {
            const result = await authApi.login(values);
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            message.success(`欢迎回来，${result.user.displayName || result.user.username}`);
            navigate(destinationFor(result.user), {replace: true});
        } catch (error) {
            message.error(getApiErrorMessage(error, '登录失败，请检查账号和密码'));
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
            setMode('login');
            message.success('注册成功，请登录');
        } catch (error) {
            message.error(getApiErrorMessage(error, '注册失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg"><div className="login-overlay"/></div>
            <Card className="login-card" variant="borderless">
                <div className="login-header">
                    <VideoCameraOutlined className="login-logo"/>
                    <Title level={2} className="login-title">Video Platform</Title>
                    <Text type="secondary">发现、创作与管理优质视频内容</Text>
                </div>

                <Segmented
                    className="auth-mode"
                    block
                    value={mode}
                    options={[{label: '登录', value: 'login'}, {label: '注册', value: 'register'}]}
                    onChange={(value) => setMode(value as 'login' | 'register')}
                />

                {mode === 'login' ? (
                    <Form form={loginForm} layout="vertical" size="large" onFinish={login}>
                        <Form.Item name="username" label="用户名或邮箱" rules={[{required: true, message: '请输入用户名或邮箱'}]}>
                            <Input prefix={<UserOutlined/>} autoComplete="username"/>
                        </Form.Item>
                        <Form.Item name="password" label="密码" rules={[{required: true, message: '请输入密码'}]}>
                            <Input.Password prefix={<LockOutlined/>} autoComplete="current-password"/>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
                    </Form>
                ) : (
                    <Form
                        form={registerForm}
                        layout="vertical"
                        size="large"
                        initialValues={{role: 'USER'}}
                        onFinish={register}
                    >
                        <Form.Item name="role" label="注册身份" rules={[{required: true}]}>
                            <Select options={[
                                {label: '普通用户', value: 'USER'},
                                {label: '制片厂', value: 'STUDIO'},
                            ]}/>
                        </Form.Item>
                        <Form.Item name="username" label="用户名" rules={[
                            {required: true, message: '请输入用户名'},
                            {min: 3, max: 64, message: '用户名长度为 3-64 个字符'},
                        ]}>
                            <Input prefix={<UserOutlined/>} autoComplete="username"/>
                        </Form.Item>
                        <Form.Item name="email" label="邮箱" rules={[
                            {required: true, message: '请输入邮箱'},
                            {type: 'email', message: '邮箱格式不正确'},
                        ]}>
                            <Input prefix={<MailOutlined/>} autoComplete="email"/>
                        </Form.Item>
                        <Form.Item name="displayName" label="显示名称（可选）">
                            <Input/>
                        </Form.Item>
                        <Form.Item name="password" label="密码" rules={[
                            {required: true, message: '请输入密码'},
                            {min: 6, message: '密码至少 6 位'},
                        ]}>
                            <Input.Password prefix={<LockOutlined/>} autoComplete="new-password"/>
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
                            <Input.Password prefix={<LockOutlined/>} autoComplete="new-password"/>
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>创建账号</Button>
                    </Form>
                )}

                <Button type="link" block onClick={() => navigate('/')}>先浏览公开内容</Button>
            </Card>
        </div>
    );
}

export default Login;
