import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Button,
    Card,
    Form,
    Input,
    Layout,
    Modal,
    Popconfirm,
    Select,
    Space,
    Spin,
    Statistic,
    Switch,
    Table,
    Tag,
    Typography,
    App,
} from 'antd';
import {
    CheckCircleOutlined,
    LockOutlined,
    LogoutOutlined,
    PlusOutlined,
    UnlockOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage, userApi, videoApi } from '../services/api';
import type { CreateUserRequest, Role, UserInfo, UserRecord } from '../type/api';
import '../styles/global.css'; // 引入全局暗黑主题
import './Dashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface LegacyVideo {
    id: number;
    status: string;
}

const roleLabels: Record<Role, string> = {
    ADMIN: '管理员',
    REVIEWER: '审核员',
    STUDIO: '制片厂',
    USER: '普通用户',
};

const studioStatusLabels: Record<string, string> = {
    NONE: '未申请',
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
};

const roleOptions = (Object.entries(roleLabels) as [Role, string][]).map(([value, label]) => ({ value, label }));
const createRoleOptions = roleOptions.filter((option) => option.value !== 'ADMIN');

// 背景组件
function LinearBackground() {
    return (
        <div className="linear-bg">
            <div className="linear-bg-gradient" />
            <div className="linear-bg-noise" />
            <div className="linear-bg-blob blob-primary" />
            <div className="linear-bg-blob blob-secondary" />
            <div className="linear-bg-blob blob-tertiary" />
            <div className="linear-bg-blob blob-bottom" />
            <div className="linear-bg-grid" />
        </div>
    );
}

function AdminDashboard() {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [videos, setVideos] = useState<LegacyVideo[]>([]);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm] = Form.useForm<CreateUserRequest & { confirmPassword: string }>();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [userList, videosResponse] = await Promise.all([
                userApi.list(),
                videoApi.listPublished(),
            ]);
            setUsers(userList);
            setVideos(videosResponse);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) return;
            message.error(getApiErrorMessage(error, '加载管理数据失败'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        authApi.me()
            .then((user) => {
                if (user.role !== 'ADMIN') {
                    message.warning('无权访问管理员页面');
                    navigate('/', { replace: true });
                    return;
                }
                setCurrentUser(user);
                loadData();
            })
            .catch(() => navigate('/login', { replace: true }));
    }, [loadData, navigate]);

    const createUser = async (values: CreateUserRequest & { confirmPassword: string }) => {
        setSubmitting(true);
        try {
            const request: CreateUserRequest = {
                username: values.username,
                email: values.email,
                password: values.password,
                displayName: values.displayName,
                role: values.role,
            };
            await userApi.create(request);
            createForm.resetFields();
            setCreateOpen(false);
            message.success('账号创建成功');
            await loadData();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) return;
            message.error(getApiErrorMessage(error, '创建账号失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const updateRole = async (record: UserRecord, role: Role) => {
        if (record.id === currentUser?.id && role !== 'ADMIN') {
            message.warning('不能修改自己的管理员角色');
            return;
        }
        try {
            await userApi.updateRole(record.id, { role });
            message.success(`${record.username} 已调整为${roleLabels[role]}`);
            await loadData();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) return;
            message.error(getApiErrorMessage(error, '角色调整失败'));
        }
    };

    const reviewStudio = async (userId: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await userApi.reviewStudio(userId, { studioStatus: status });
            message.success(`制片厂申请已${status === 'APPROVED' ? '通过' : '拒绝'}`);
            await loadData();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) return;
            message.error(getApiErrorMessage(error, '审核操作失败'));
        }
    };

    const toggleUserStatus = async (record: UserRecord) => {
        if (record.id === currentUser?.id) {
            message.warning('不能禁用当前登录的管理员账号');
            return;
        }
        const newStatus = !record.enabled;
        try {
            await userApi.updateStatus(record.id, { enabled: newStatus });
            message.success(`${record.username} 已${newStatus ? '启用' : '禁用'}`);
            await loadData();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) return;
            message.error(getApiErrorMessage(error, '账号状态修改失败'));
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('退出登录接口调用失败:', error);
        } finally {
            authApi.clearLocalAuth();
            message.success('已退出登录');
            navigate('/login', { replace: true });
        }
    };

    const pendingStudios = users.filter((user) => user.role === 'STUDIO' && user.studioStatus === 'PENDING');

    const userColumns = [
        { title: '用户', dataIndex: 'displayName' },
        { title: '账号', dataIndex: 'username' },
        { title: '邮箱', dataIndex: 'email' },
        {
            title: '角色',
            dataIndex: 'role',
            render: (role: Role, record: UserRecord) => (
                <Select
                    value={role}
                    options={roleOptions}
                    style={{ width: 120 }}
                    disabled={record.id === currentUser?.id}
                    onChange={(value: Role) => updateRole(record, value)}
                />
            ),
        },
        {
            title: '制片厂状态',
            dataIndex: 'studioStatus',
            render: (value: string, record: UserRecord) => {
                // 只有制片厂角色才显示状态
                if (record.role !== 'STUDIO') {
                    return <Tag color="default">-</Tag>;
                }
                const statusMap: Record<string, { color: string; label: string }> = {
                    NONE: { color: 'default', label: '未申请' },
                    PENDING: { color: 'processing', label: '待审核' },
                    APPROVED: { color: 'success', label: '已通过' },
                    REJECTED: { color: 'error', label: '已拒绝' },
                };
                const status = statusMap[value] || { color: 'default', label: value };
                return <Tag color={status.color}>{status.label}</Tag>;
            },
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            render: (enabled: boolean, record: UserRecord) => (
                <Space>
                    <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>
                    <Popconfirm
                        title={`确定要${enabled ? '禁用' : '启用'}该账号吗？`}
                        description={enabled ? '禁用后该账号将无法登录系统' : '启用后该账号将恢复正常访问'}
                        onConfirm={() => toggleUserStatus(record)}
                        okText="确定"
                        cancelText="取消"
                        disabled={record.id === currentUser?.id}
                    >
                        <Switch
                            checked={enabled}
                            checkedChildren={<UnlockOutlined />}
                            unCheckedChildren={<LockOutlined />}
                            disabled={record.id === currentUser?.id}
                            onChange={() => {}}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const studioColumns = [
        { title: '制片厂', dataIndex: 'studioName' },
        { title: '联系人', dataIndex: 'displayName' },
        { title: '邮箱', dataIndex: 'email' },
        {
            title: '审核',
            render: (_: unknown, record: UserRecord) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => reviewStudio(record.id, 'APPROVED')}>通过</Button>
                    <Button danger size="small" onClick={() => reviewStudio(record.id, 'REJECTED')}>拒绝</Button>
                </Space>
            ),
        },
    ];

    return (
        <>
            <LinearBackground />
            <Layout className="dashboard-shell">
                <Header className="dashboard-header">
                    <div className="header-brand">
                        <div className="brand-icon">
                            <VideoCameraOutlined />
                        </div>
                        <div>
                            <Title level={4} className="brand-title">管理员控制台</Title>
                            <Text className="brand-subtitle">用户、审核员、制片厂与内容管理</Text>
                        </div>
                    </div>
                    <Space>
                        <Button className="dark-nav-btn" onClick={() => navigate('/')}>公开首页</Button>
                        <Button className="dark-nav-btn" onClick={() => navigate('/profile')}>个人中心</Button>
                        <Button className="dark-nav-btn" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
                    </Space>
                </Header>
                <Content className="dashboard-content">
                    <Spin spinning={loading}>
                        <Space direction="vertical" size={24} className="page-stack">
                            <div className="stats-grid">
                                <Card className="dark-stat-card">
                                    <Statistic title="用户总数" value={users.length} prefix={<UserOutlined />} />
                                </Card>
                                <Card className="dark-stat-card">
                                    <Statistic title="审核员" value={users.filter((u) => u.role === 'REVIEWER').length} />
                                </Card>
                                <Card className="dark-stat-card">
                                    <Statistic title="待审核制片厂" value={pendingStudios.length} prefix={<CheckCircleOutlined />} />
                                </Card>
                                <Card className="dark-stat-card">
                                    <Statistic title="已发布视频" value={videos.filter((v) => v.status === 'PUBLISHED').length} prefix={<VideoCameraOutlined />} />
                                </Card>
                            </div>

                            <Card className="dark-card" title="制片厂申请审核">
                                {pendingStudios.length === 0
                                    ? <Text style={{ color: 'var(--foreground-muted)' }}>暂无待审核的制片厂申请</Text>
                                    : <Table className="dark-table" rowKey="id" columns={studioColumns} dataSource={pendingStudios} pagination={false} />}
                            </Card>

                            <Card
                                className="dark-card"
                                title="用户与角色管理"
                                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>创建账号</Button>}
                            >
                                <Table className="dark-table" rowKey="id" columns={userColumns} dataSource={users} pagination={{ pageSize: 8 }} />
                            </Card>
                        </Space>
                    </Spin>
                </Content>

                <Modal
                    className="dark-modal"
                    open={createOpen}
                    title="创建平台账号"
                    okText="创建账号"
                    cancelText="取消"
                    confirmLoading={submitting}
                    onOk={() => createForm.submit()}
                    onCancel={() => setCreateOpen(false)}
                >
                    <Form form={createForm} layout="vertical" initialValues={{ role: 'REVIEWER' }} onFinish={createUser}>
                        <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                            <Select options={createRoleOptions} />
                        </Form.Item>
                        <Form.Item name="username" label="用户名" rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, max: 64, message: '用户名长度为 3-64 个字符' },
                        ]}>
                            <Input autoComplete="off" />
                        </Form.Item>
                        <Form.Item name="email" label="邮箱" rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '邮箱格式不正确' },
                        ]}>
                            <Input autoComplete="off" />
                        </Form.Item>
                        <Form.Item name="displayName" label="显示名称"><Input /></Form.Item>
                        <Form.Item name="password" label="初始密码" rules={[
                            { required: true, message: '请输入初始密码' },
                            { min: 6, message: '密码至少 6 位' },
                        ]}>
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="确认密码"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: '请再次输入密码' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        return !value || getFieldValue('password') === value
                                            ? Promise.resolve()
                                            : Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                    </Form>
                </Modal>
            </Layout>
        </>
    );
}

export default AdminDashboard;