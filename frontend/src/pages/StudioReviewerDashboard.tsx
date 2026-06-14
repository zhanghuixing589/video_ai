import { useCallback, useEffect, useState } from 'react';
import {
    App,
    Button,
    Card,
    Layout,
    Table,
    Tabs,
    Tag,
    Typography,
    Spin, Space,
} from 'antd';
import {LogoutOutlined, VideoCameraOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, contentApi, getApiErrorMessage, userApi } from '../services/api';
import type { Content as ContentItem } from '../type/api';
import {
    getReviewStatusPresentation,
    isContentPublishable,
} from './reviewerDashboardModel';
import '../styles/global.css';
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

function ReviewerDashboard() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [publishingId, setPublishingId] = useState<number | null>(null);
    const [pendingVideos, setPendingVideos] = useState<ContentItem[]>([]);
    const [studioNames, setStudioNames] = useState<Record<number, string>>({});

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const pending = await contentApi.listReviewQueue();
            const studioIds = [...new Set(pending.map(item => item.studioId).filter(Boolean))];
            const nameMap: Record<number, string> = {};

            await Promise.all(
                studioIds.map(async (id) => {
                    try {
                        const studio = await userApi.get(id);
                        nameMap[id] = studio.displayName || studio.username;
                    } catch (error) {
                        console.error(`获取制片厂 ${id} 信息失败:`, error);
                        nameMap[id] = `制片厂 #${id}`;
                    }
                })
            );

            setStudioNames(nameMap);
            setPendingVideos(pending);
        } catch (error) {
            console.error('加载数据失败:', error);
            message.error(getApiErrorMessage(error, '加载数据失败'));
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        authApi.me()
            .then((currentUser) => {
                if (currentUser.role !== 'REVIEWER' && currentUser.role !== 'ADMIN') {
                    message.error('无权限访问审片员工作台');
                    navigate('/profile');
                    return;
                }
                void loadData();
            })
            .catch(() => navigate('/login', { replace: true }));
    }, [loadData, message, navigate]);

    const handlePublish = async (contentId: number) => {
        setPublishingId(contentId);
        try {
            const latestQueue = await contentApi.listReviewQueue();
            if (!isContentPublishable(latestQueue, contentId)) {
                setPendingVideos(latestQueue);
                message.warning('作品状态已变化，请刷新列表后重试');
                return;
            }
            await contentApi.publish(contentId);
            message.success('作品已发布');
            await loadData();
        } catch (error) {
            console.error('发布失败:', error);
            message.error(getApiErrorMessage(error, '发布失败'));
        } finally {
            setPublishingId(null);
        }
    };

    const reviewColumns = [
        { title: '片名', dataIndex: 'title' },
        {
            title: '制片厂',
            dataIndex: 'studioId',
            render: (studioId: number) => studioNames[studioId] || (studioId ? `制片厂 #${studioId}` : '未知制片厂')
        },
        { title: '形态', dataIndex: 'type', render: (v: string) => videoTypeLabels[v] || v },
        { title: '题材', dataIndex: 'genre', render: (v: string) => genreLabels[v] || v },
        {
            title: '时长',
            render: (_: unknown, record: ContentItem) => {
                const episodes = [
                    ...(record.episodes || []),
                    ...(record.seasons?.flatMap((season) => season.episodes) || []),
                ];
                const seconds = episodes.reduce((total, episode) => total + (episode.durationSeconds || 0), 0);
                return `${Math.floor(seconds / 60)}分钟`;
            },
        },
        {
            title: '审核状态',
            dataIndex: 'status',
            render: (status: ContentItem['status']) => {
                const presentation = getReviewStatusPresentation(status);
                return <Tag color={presentation.color}>{presentation.label}</Tag>;
            },
        },
        {
            title: '操作',
            render: (_: unknown, record: ContentItem) => {
                const presentation = getReviewStatusPresentation(record.status);
                return presentation.canPublish ? (
                    <Button
                        type="primary"
                        size="small"
                        loading={publishingId === record.id}
                        disabled={publishingId !== null && publishingId !== record.id}
                        onClick={(event) => {
                            event.stopPropagation();
                            void handlePublish(record.id);
                        }}
                    >
                        发布
                    </Button>
                ) : null;
            },
        },
    ];

    const tabItems = [
        {
            key: 'reviewer',
            label: `待审核队列 (${pendingVideos.length})`,
            children: (
                <Card className="dark-card" title="待审核视频">
                    <Table
                        className="dark-table"
                        rowKey="id"
                        columns={reviewColumns}
                        dataSource={pendingVideos}
                        pagination={false}
                        // 💡 核心改动：点击行时跳转，并通过 state 将当前行数据传递到审核页
                        onRow={(record) => ({
                            onClick: () => {
                                navigate(`/review/detail/${record.id}`, { state: { videoDetail: record } });
                            },
                            style: { cursor: 'pointer' } // 鼠标悬浮变成手型
                        })}
                    />
                </Card>
            ),
        },
    ];

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
                            <Title level={4} className="brand-title">审片员工作台</Title>
                            <Text className="brand-subtitle">视频审核与发布</Text>
                        </div>
                    </div>
                    <Space>
                        <Button className="dark-nav-btn" onClick={() => navigate('/profile')}>个人中心</Button>
                        <Button className="dark-nav-btn" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
                    </Space>
                </Header>
                <Content className="dashboard-content">
                    <Spin spinning={loading}>
                        <Tabs className="dark-tabs" items={tabItems} />
                    </Spin>
                </Content>
            </Layout>
        </>
    );
}

export default ReviewerDashboard;
