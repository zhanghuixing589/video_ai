import {useEffect, useMemo, useState} from 'react';
import {Button, Card, Empty, Layout, Modal, Space, Spin, Tag, Typography, message} from 'antd';
import {LogoutOutlined, LoginOutlined, UserAddOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {authApi, contentApi, getApiErrorMessage} from '../services/api';
import {loadAuthenticatedUser} from '../services/authSession';
import type {Content, Episode, UserInfo} from '../type/api';
import PreviewPlayer from '../components/PreviewPlayer';
import './ConsumerHome.css';

const {Header, Content: PageContent} = Layout;
const {Title, Text, Paragraph} = Typography;

function ConsumerHome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contents, setContents] = useState<Content[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

    useEffect(() => {
        Promise.all([
            loadAuthenticatedUser(localStorage, authApi.me).then(setUser),
            contentApi.listPublished()
                .then(setContents)
                .catch((error) => message.error(getApiErrorMessage(error, '加载作品失败'))),
        ])
            .finally(() => setLoading(false));
    }, []);

    const cards = useMemo(() => contents.map((item) => {
        const episodes = [...item.episodes, ...item.seasons.flatMap((season) => season.episodes)];
        return {item, episodes};
    }), [contents]);

    const logout = () => {
        authApi.logout();
        setUser(null);
        message.success('已退出登录');
    };

    return (
        <Layout className="consumer-shell">
            <Header className="consumer-header">
                <div>
                    <Title level={4} className="brand-title">Video Platform</Title>
                    <Text className="brand-subtitle">游客可试看每集前五分钟</Text>
                </div>
                <Space>
                    {user ? (
                        <>
                            <Text>欢迎，{user.displayName || user.username}</Text>
                            {user.role === 'STUDIO' && (
                                <Button onClick={() => navigate(
                                    user.studioStatus === 'APPROVED' ? '/studio' : '/studio/application',
                                )}>制片厂中心</Button>
                            )}
                            <Button icon={<LogoutOutlined/>} onClick={logout}>退出</Button>
                        </>
                    ) : (
                        <>
                            <Button icon={<LoginOutlined/>} onClick={() => navigate('/login')}>登录</Button>
                            <Button type="primary" icon={<UserAddOutlined/>} onClick={() => navigate('/login?mode=register')}>
                                注册
                            </Button>
                        </>
                    )}
                </Space>
            </Header>
            <PageContent className="consumer-content">
                <div className="consumer-hero">
                    <div className="hero-copy">
                        <Tag color="blue">公开片库</Tag>
                        <Title>先试看，再决定从哪里开始</Title>
                        <Paragraph>电影、电视剧和综艺按作品、季度与剧集清晰组织。</Paragraph>
                    </div>
                </div>
                <Spin spinning={loading}>
                    {cards.length === 0 ? (
                        <Empty description="暂时没有已发布作品"/>
                    ) : (
                        <div className="video-grid">
                            {cards.map(({item, episodes}) => (
                                <Card
                                    key={item.id}
                                    className="video-card"
                                    cover={item.coverUrl ? <img src={item.coverUrl} alt={item.title}/> : undefined}
                                >
                                    <Title level={4}>{item.title}</Title>
                                    <Paragraph ellipsis={{rows: 2}}>{item.description}</Paragraph>
                                    <Space wrap>
                                        <Tag>{item.type}</Tag>
                                        <Tag>{item.genre}</Tag>
                                        <Tag>{episodes.length} 集</Tag>
                                    </Space>
                                    <div className="episode-list">
                                        {episodes.map((episode) => (
                                            <Button key={episode.id} onClick={() => setSelectedEpisode(episode)}>
                                                第 {episode.episodeNumber} 集 {episode.title}
                                            </Button>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </Spin>
            </PageContent>
            <Modal
                open={Boolean(selectedEpisode)}
                title={selectedEpisode?.title}
                width={900}
                footer={null}
                destroyOnHidden
                onCancel={() => setSelectedEpisode(null)}
            >
                {selectedEpisode && <PreviewPlayer episode={selectedEpisode} authenticated={Boolean(user)}/>}
            </Modal>
        </Layout>
    );
}

export default ConsumerHome;
