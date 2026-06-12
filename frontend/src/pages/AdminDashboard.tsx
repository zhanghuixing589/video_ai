import {useEffect, useState} from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    Layout,
    Modal,
    Select,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    CheckCircleOutlined,
    LogoutOutlined,
    PlusOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {authApi, getApiErrorMessage, userApi, videoApi} from '../services/api';
import type {CreateUserRequest, Role, UserInfo, UserRecord} from '../type/api';
import './Dashboard.css';

const {Header, Content} = Layout;
const {Title, Text} = Typography;

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

const roleOptions = (Object.entries(roleLabels) as [Role, string][]).map(([value, label]) => ({value, label}));
const createRoleOptions = roleOptions.filter((option) => option.value !== 'ADMIN');

function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [videos, setVideos] = useState<LegacyVideo[]>([]);
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm] = Form.useForm<CreateUserRequest & {confirmPassword: string}>();

    const loadData = async () => {
        setLoading(true);
        try {
            const [userList, videosResponse] = await Promise.all([
                userApi.list(),
                videoApi.listPublished(),
            ]);
            setUsers(userList);
            setVideos(videosResponse);
        } catch (error) {
            message.error(getApiErrorMessage(error, '加载管理数据失败'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        authApi.me()
            .then((user) => {
                if (user.role !== 'ADMIN') {
                    navigate('/', {replace: true});
                    return;
                }
                setCurrentUser(user);
                loadData();
            })
            .catch(() => navigate('/login', {replace: true}));
    }, [navigate]);

    const createUser = async (values: CreateUserRequest & {confirmPassword: string}) => {
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
            await userApi.updateRole(record.id, {role});
            message.success(`${record.username} 已调整为${roleLabels[role]}`);
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, '角色调整失败'));
        }
    };

    const reviewStudio = async (userId: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await userApi.reviewStudio(userId, {studioStatus: status});
            message.success(`制片厂申请已${status === 'APPROVED' ? '通过' : '拒绝'}`);
            await loadData();
        } catch (error) {
            message.error(getApiErrorMessage(error, '审核操作失败'));
        }
    };

    const logout = () => {
        authApi.logout();
        navigate('/login');
        message.success('已退出登录');
    };

    const pendingStudios = users.filter((user) => user.role === 'STUDIO' && user.studioStatus === 'PENDING');

    const userColumns = [
        {title: '用户', dataIndex: 'displayName'},
        {title: '账号', dataIndex: 'username'},
        {title: '邮箱', dataIndex: 'email'},
        {
            title: '角色',
            dataIndex: 'role',
            render: (role: Role, record: UserRecord) => (
                <Select
                    value={role}
                    options={roleOptions}
                    style={{width: 120}}
                    disabled={record.id === currentUser?.id}
                    onChange={(value: Role) => updateRole(record, value)}
                />
            ),
        },
        {
            title: '制片厂状态',
            dataIndex: 'studioStatus',
            render: (value: string) => <Tag>{studioStatusLabels[value] || value}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>,
        },
    ];

    const studioColumns = [
        {title: '制片厂', dataIndex: 'studioName'},
        {title: '联系人', dataIndex: 'displayName'},
        {title: '邮箱', dataIndex: 'email'},
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
        <Layout className="dashboard-shell">
            <Header className="dashboard-header">
                <div>
                    <Title level={4} className="brand-title">管理员控制台</Title>
                    <Text className="brand-subtitle">用户、审核员、制片厂与内容管理</Text>
                </div>
                <Space>
                    <Text>欢迎，{currentUser?.displayName || currentUser?.username}</Text>
                    <Button icon={<LogoutOutlined/>} onClick={logout}>退出</Button>
                </Space>
            </Header>
            <Content className="dashboard-content">
                <Spin spinning={loading}>
                    <Space direction="vertical" size={24} className="page-stack">
                        <div className="stats-grid">
                            <Card><Statistic title="用户总数" value={users.length} prefix={<UserOutlined/>}/></Card>
                            <Card><Statistic title="审核员" value={users.filter((u) => u.role === 'REVIEWER').length}/></Card>
                            <Card><Statistic title="待审核制片厂" value={pendingStudios.length} prefix={<CheckCircleOutlined/>}/></Card>
                            <Card><Statistic title="已发布视频" value={videos.filter((v) => v.status === 'PUBLISHED').length} prefix={<VideoCameraOutlined/>}/></Card>
                        </div>

                        <Card title="制片厂申请审核">
                            {pendingStudios.length === 0
                                ? <Text type="secondary">暂无待审核的制片厂申请</Text>
                                : <Table rowKey="id" columns={studioColumns} dataSource={pendingStudios} pagination={false}/>}
                        </Card>

                        <Card
                            title="用户与角色管理"
                            extra={<Button type="primary" icon={<PlusOutlined/>} onClick={() => setCreateOpen(true)}>创建账号</Button>}
                        >
                            <Table rowKey="id" columns={userColumns} dataSource={users} pagination={{pageSize: 8}}/>
                        </Card>
                    </Space>
                </Spin>
            </Content>

            <Modal
                open={createOpen}
                title="创建平台账号"
                okText="创建账号"
                cancelText="取消"
                confirmLoading={submitting}
                onOk={() => createForm.submit()}
                onCancel={() => setCreateOpen(false)}
            >
                <Form form={createForm} layout="vertical" initialValues={{role: 'REVIEWER'}} onFinish={createUser}>
                    <Form.Item name="role" label="角色" rules={[{required: true}]}>
                        <Select options={createRoleOptions}/>
                    </Form.Item>
                    <Form.Item name="username" label="用户名" rules={[
                        {required: true, message: '请输入用户名'},
                        {min: 3, max: 64, message: '用户名长度为 3-64 个字符'},
                    ]}>
                        <Input autoComplete="off"/>
                    </Form.Item>
                    <Form.Item name="email" label="邮箱" rules={[
                        {required: true, message: '请输入邮箱'},
                        {type: 'email', message: '邮箱格式不正确'},
                    ]}>
                        <Input autoComplete="off"/>
                    </Form.Item>
                    <Form.Item name="displayName" label="显示名称"><Input/></Form.Item>
                    <Form.Item name="password" label="初始密码" rules={[
                        {required: true, message: '请输入初始密码'},
                        {min: 6, message: '密码至少 6 位'},
                    ]}>
                        <Input.Password autoComplete="new-password"/>
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
                        <Input.Password autoComplete="new-password"/>
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}

export default AdminDashboard;
