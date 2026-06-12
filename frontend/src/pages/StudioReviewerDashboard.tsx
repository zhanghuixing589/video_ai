import { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Form,
    Input,
    Layout,
    message,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Typography,
    Spin,
} from 'antd';
import { LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage, videoApi } from '../services/api';
import type { CreateVideoRequest, UserInfo, Video } from '../type/api';
import './Dashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const videoTypeLabels: Record<string, string> = {
    MOVIE: '电影',
    VARIETY: '综艺',
    TV_SERIES: '电视剧',
};

const genreLabels: Record<string, string> = {
    ACTION: '热血',
    ROMANCE: '爱情',
    COMEDY: '喜剧',
    SUSPENSE: '悬疑',
    SCI_FI: '科幻',
    DOCUMENTARY: '纪录片',
    ANIMATION: '动画',
    FAMILY: '家庭',
    REALITY: '真人秀',
    OTHER: '其他',
};

const videoStatusLabels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    PUBLISHED: '已发布',
    BANNED: '已下架',
};

function StudioReviewerDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [videos, setVideos] = useState<Video[]>([]);
    const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isStudio, setIsStudio] = useState(false);
    const [form] = Form.useForm();

    const loadData = useCallback(async (currentUser: UserInfo) => {
        setLoading(true);
        try {
            if (currentUser.role === 'STUDIO') {
                setVideos(await videoApi.listByStudio(currentUser.id));
            }
            setPendingVideos(await videoApi.listReviewQueue());
        } catch (error) {
            console.error('加载数据失败:', error);
            message.error(getApiErrorMessage(error, '加载数据失败'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        authApi.me()
            .then((currentUser) => {
                setUser(currentUser);
                setIsStudio(currentUser.role === 'STUDIO');
                void loadData(currentUser);
            })
            .catch(() => navigate('/login', {replace: true}));
    }, [loadData, navigate]);

    const handleSubmitVideo = async (
        values: Omit<CreateVideoRequest, 'createdBy' | 'duration'> & {duration: string},
    ) => {
        if (!user) return;
        try {
            const request: CreateVideoRequest = {
                ...values,
                createdBy: user.id,
                duration: Number(values.duration),
            };
            await videoApi.create(request);
            message.success('视频已提交审核');
            form.resetFields();
            await loadData(user);
        } catch (error) {
            console.error('提交失败:', error);
            message.error(getApiErrorMessage(error, '提交失败'));
        }
    };

    const handleReviewVideo = async (videoId: number, status: 'APPROVED' | 'REJECTED') => {
        if (!user) return;
        try {
            await videoApi.review(videoId, {
                reviewerId: user.id,
                status,
                reviewComment: status === 'APPROVED' ? '内容合规，可发布' : '需要修改后重新提交',
            });
            message.success(`视频已${status === 'APPROVED' ? '通过' : '拒绝'}`);
            await loadData(user);
        } catch (error) {
            console.error('操作失败:', error);
            message.error('操作失败');
        }
    };

    const handlePublishVideo = async (videoId: number) => {
        if (!user) return;
        try {
            await videoApi.publish(videoId);
            message.success('视频已发布');
            await loadData(user);
        } catch (error) {
            console.error('发布失败:', error);
            message.error('发布失败');
        }
    };

    const handleLogout = () => {
        authApi.logout();
        navigate('/login');
        message.success('已退出登录');
    };

    const studioColumns = [
        { title: '片名', dataIndex: 'title' },
        { title: '形态', dataIndex: 'type', render: (v: string) => videoTypeLabels[v] },
        { title: '题材', dataIndex: 'genre', render: (v: string) => genreLabels[v] },
        {
            title: '状态',
            dataIndex: 'status',
            render: (v: string) => {
                const color = v === 'PUBLISHED' ? 'green' : v === 'PENDING' ? 'orange' : v === 'APPROVED' ? 'blue' : 'default';
                return <Tag color={color}>{videoStatusLabels[v]}</Tag>;
            },
        },
        {
            title: '操作',
            render: (_: unknown, record: Video) =>
                record.status === 'APPROVED' ? (
                    <Button type="primary" size="small" onClick={() => handlePublishVideo(record.id)}>
                        发布
                    </Button>
                ) : null,
        },
    ];

    const reviewColumns = [
        { title: '片名', dataIndex: 'title' },
        { title: '制片厂ID', dataIndex: 'createdBy' },
        { title: '形态', dataIndex: 'type', render: (v: string) => videoTypeLabels[v] },
        { title: '题材', dataIndex: 'genre', render: (v: string) => genreLabels[v] },
        { title: '时长', dataIndex: 'duration', render: (v: number) => `${Math.floor(v / 60)}分钟` },
        {
            title: '审核',
            render: (_: unknown, record: Video) => (
                <Space>
                    <Button type="primary" size="small" onClick={() => handleReviewVideo(record.id, 'APPROVED')}>
                        通过
                    </Button>
                    <Button danger size="small" onClick={() => handleReviewVideo(record.id, 'REJECTED')}>
                        拒绝
                    </Button>
                </Space>
            ),
        },
    ];

    const tabItems = [];

    if (isStudio) {
        tabItems.push({
            key: 'studio',
            label: '我的片库',
            children: (
                <Space direction="vertical" size={16} className="page-stack">
                    <Card title="提交新视频" extra={<PlusOutlined />}>
                        <Form form={form} layout="vertical" onFinish={handleSubmitVideo}>
                            <div className="form-grid">
                                <Form.Item label="片名" name="title" rules={[{ required: true }]}>
                                    <Input placeholder="请输入片名" />
                                </Form.Item>
                                <Form.Item label="内容形态" name="type" rules={[{ required: true }]}>
                                    <Select options={Object.entries(videoTypeLabels).map(([v, l]) => ({ value: v, label: l }))} />
                                </Form.Item>
                                <Form.Item label="题材类别" name="genre" rules={[{ required: true }]}>
                                    <Select options={Object.entries(genreLabels).map(([v, l]) => ({ value: v, label: l }))} />
                                </Form.Item>
                                <Form.Item label="时长(秒)" name="duration" rules={[{ required: true }]}>
                                    <Input type="number" placeholder="例如：7380" />
                                </Form.Item>
                                <Form.Item label="视频地址" name="url" rules={[{ required: true }]}>
                                    <Input placeholder="https://cdn.example.com/video.mp4" />
                                </Form.Item>
                                <Form.Item label="封面地址" name="coverUrl">
                                    <Input placeholder="https://cdn.example.com/cover.jpg" />
                                </Form.Item>
                            </div>
                            <Form.Item label="简介" name="description">
                                <Input.TextArea rows={3} />
                            </Form.Item>
                            <Button type="primary" htmlType="submit">
                                提交审核
                            </Button>
                        </Form>
                    </Card>
                    <Card title="我的视频">
                        <Table rowKey="id" columns={studioColumns} dataSource={videos} pagination={false} />
                    </Card>
                </Space>
            ),
        });
    }

    if (user?.role === 'REVIEWER' || user?.role === 'ADMIN') {
        tabItems.push({
            key: 'reviewer',
            label: `待审核队列 (${pendingVideos.length})`,
            children: (
                <Card title="待审核视频">
                    <Table rowKey="id" columns={reviewColumns} dataSource={pendingVideos} pagination={false} />
                </Card>
            ),
        });
    }

    return (
        <Layout className="dashboard-shell">
            <Header className="dashboard-header">
                <div>
                    <Title level={4} className="brand-title">
                        {isStudio ? '制片厂工作台' : user?.role === 'REVIEWER' ? '审片员工作台' : '工作台'}
                    </Title>
                    <Text className="brand-subtitle">
                        {isStudio ? '视频上传与管理' : '视频审核与发布'}
                    </Text>
                </div>
                <Space>
                    <Text>欢迎，{user?.displayName || user?.username}</Text>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
                </Space>
            </Header>
            <Content className="dashboard-content">
                <Spin spinning={loading}>
                    <Tabs items={tabItems} />
                </Spin>
            </Content>
        </Layout>
    );
}

export default StudioReviewerDashboard;
