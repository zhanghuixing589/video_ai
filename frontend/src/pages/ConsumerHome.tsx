import { useEffect, useMemo, useState, useRef } from 'react';
import { Button, Empty, Layout, Modal, Space, Spin, Typography, message } from 'antd';
import {
    LogoutOutlined,
    LoginOutlined,
    UserAddOutlined,
    DashboardOutlined,
    VideoCameraOutlined,
    PlayCircleOutlined,
    StarOutlined,
    MenuOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, contentApi, getApiErrorMessage } from '../services/api';
import { loadAuthenticatedUser } from '../services/authSession';
import type { Content, Episode, UserInfo } from '../type/api';
import PreviewPlayer from '../components/PreviewPlayer';
import './ConsumerHome.css';

const { Header, Content: PageContent } = Layout;
const { Title, Text, Paragraph } = Typography;

/* ============================================
   BACKGROUND COMPONENT (Ambient Lighting System)
   ============================================ */
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

/* ============================================
   SPOTLIGHT CARD (Mouse Tracking Effect)
   ============================================ */
interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
}

function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [spotlightPosition, setSpotlightPosition] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setSpotlightPosition({ x, y });
    };

    return (
        <div
            ref={cardRef}
            className={`linear-card ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{ position: 'relative' }}
        >
            {isHovering && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '20px',
                        background: `radial-gradient(circle at ${spotlightPosition.x}% ${spotlightPosition.y}%, rgba(94, 106, 210, 0.15), transparent 60%)`,
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                />
            )}
            {children}
        </div>
    );
}

/* ============================================
   VIDEO CARD COMPONENT
   ============================================ */
interface VideoCardProps {
    item: Content;
    episodes: Episode[];
    onSelectEpisode: (episode: Episode) => void;
}

function LinearVideoCard({ item, episodes, onSelectEpisode }: VideoCardProps) {
    return (
        <SpotlightCard>
            <div className="linear-card-inner">
                {item.coverUrl ? (
                    <div className="card-cover-wrapper">
                        <img src={item.coverUrl} alt={item.title} className="card-cover-img" />
                    </div>
                ) : (
                    <div className="card-cover-placeholder">
                        <VideoCameraOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                )}
                <div className="card-content">
                    <Title level={4} className="card-title">
                        {item.title}
                    </Title>
                    <Paragraph className="card-description">
                        {item.description || '暂无简介'}
                    </Paragraph>
                    <Space wrap size={8}>
                        <span className="linear-tag">{item.type}</span>
                        <span className="linear-tag">{item.genre}</span>
                        <span className="linear-tag">{episodes.length} 集</span>
                    </Space>
                    <div className="episode-section">
                        <div className="episode-label">
                            <PlayCircleOutlined /> 剧集
                        </div>
                        <div className="episode-buttons">
                            {episodes.slice(0, 4).map((episode) => (
                                <Button
                                    key={episode.id}
                                    className="episode-btn"
                                    onClick={() => onSelectEpisode(episode)}
                                >
                                    第 {episode.episodeNumber} 集
                                </Button>
                            ))}
                            {episodes.length > 4 && (
                                <Button className="episode-btn">
                                    +{episodes.length - 4} 更多
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SpotlightCard>
    );
}

/* ============================================
   HERO SECTION
   ============================================ */
function LinearHero() {
    return (
        <div className="linear-hero">
            <div className="hero-content">
                <div className="hero-tag">
                    <VideoCameraOutlined /> 公开片库
                </div>
                <Title level={1} className="hero-title">
                    先试看，
                    <br />
                    再决定
                    <span className="hero-title-gradient"> 从哪里开始</span>
                    <span style={{ color: 'var(--accent)' }}>.</span>
                </Title>
                <Paragraph className="hero-desc">
                    电影、电视剧和综艺按作品、季度与剧集清晰组织。
                    <br />
                    每一帧，都精心呈现。
                </Paragraph>
            </div>
        </div>
    );
}

/* ============================================
   MAIN CONSUMER HOME PAGE
   ============================================ */
function ConsumerHome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contents, setContents] = useState<Content[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        Promise.all([
            loadAuthenticatedUser(sessionStorage, authApi.me).then(setUser),
            contentApi
                .listPublished()
                .then(setContents)
                .catch((error) => message.error(getApiErrorMessage(error, '加载作品失败'))),
        ]).finally(() => setLoading(false));
    }, []);

    const cards = useMemo(
        () =>
            contents.map((item) => {
                const episodes = [
                    ...item.episodes,
                    ...item.seasons.flatMap((season) => season.episodes),
                ];
                return { item, episodes };
            }),
        [contents]
    );

    const logout = () => {
        authApi.logout();
        setUser(null);
        message.success('已退出登录');
    };

    const getAdminButton = () => {
        if (!user) return null;
        switch (user.role) {
            case 'ADMIN':
                return { text: '管理员控制台', icon: <DashboardOutlined />, path: '/admin' };
            case 'REVIEWER':
                return { text: '审核员控制台', icon: <VideoCameraOutlined />, path: '/reviewer' };
            case 'STUDIO':
                return {
                    text: '制片厂中心',
                    icon: <VideoCameraOutlined />,
                    path: user.studioStatus === 'APPROVED' ? '/studio' : '/studio/application',
                };
            default:
                return null;
        }
    };

    const adminButton = getAdminButton();

    // Mobile menu toggle
    const MobileMenu = () => (
        <div
            style={{
                position: 'fixed',
                top: 56,
                left: 0,
                right: 0,
                background: 'rgba(5, 5, 6, 0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-default)',
                padding: '20px',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
            }}
        >
            {user ? (
                <>
                    <div style={{ padding: '8px 0', color: 'var(--foreground-muted)' }}>
                        <StarOutlined /> 欢迎，{user.displayName || user.username}
                    </div>
                    <Button className="linear-nav-btn" block onClick={() => navigate('/profile')}>
                        个人中心
                    </Button>
                    {adminButton && (
                        <Button
                            className="linear-nav-btn linear-nav-btn--accent"
                            block
                            icon={adminButton.icon}
                            onClick={() => navigate(adminButton.path)}
                        >
                            {adminButton.text}
                        </Button>
                    )}
                    <Button className="linear-nav-btn" block icon={<LogoutOutlined />} onClick={logout}>
                        退出
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        className="linear-nav-btn"
                        block
                        icon={<LoginOutlined />}
                        onClick={() => navigate('/login')}
                    >
                        登录
                    </Button>
                    <Button
                        className="linear-nav-btn linear-nav-btn--primary"
                        block
                        icon={<UserAddOutlined />}
                        onClick={() => navigate('/login?mode=register')}
                    >
                        注册
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <>
            <LinearBackground />
            <Layout className="linear-shell">
                <Header className="linear-header">
                    <div className="header-brand">
                        <div className="brand-icon">
                            <VideoCameraOutlined />
                        </div>
                        <div>
                            <Title level={4} className="brand-title">
                                Video Platform
                            </Title>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="header-actions" style={{ display: 'flex' }}>
                        {user ? (
                            <>
                                <div className="user-greeting">
                                    <StarOutlined style={{ color: 'var(--accent)' }} />
                                    <Text>欢迎，{user.displayName || user.username}</Text>
                                </div>
                                <Button className="linear-nav-btn" onClick={() => navigate('/profile')}>
                                    个人中心
                                </Button>
                                {adminButton && (
                                    <Button
                                        className="linear-nav-btn linear-nav-btn--accent"
                                        icon={adminButton.icon}
                                        onClick={() => navigate(adminButton.path)}
                                    >
                                        {adminButton.text}
                                    </Button>
                                )}
                                <Button className="linear-nav-btn" icon={<LogoutOutlined />} onClick={logout}>
                                    退出
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    className="linear-nav-btn"
                                    icon={<LoginOutlined />}
                                    onClick={() => navigate('/login')}
                                >
                                    登录
                                </Button>
                                <Button
                                    className="linear-nav-btn linear-nav-btn--primary"
                                    icon={<UserAddOutlined />}
                                    onClick={() => navigate('/login?mode=register')}
                                >
                                    注册
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        className="linear-nav-btn"
                        style={{ display: 'none' }}
                        icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    />
                </Header>

                {mobileMenuOpen && <MobileMenu />}

                <PageContent className="linear-content">
                    <LinearHero />

                    <Spin spinning={loading} className="linear-spin">
                        {cards.length === 0 ? (
                            <div className="empty-state-card">
                                <div className="empty-state-icon">
                                    <VideoCameraOutlined />
                                </div>
                                <Empty description="暂时没有已发布作品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                <Paragraph
                                    style={{
                                        marginTop: 16,
                                        color: 'var(--foreground-muted)',
                                        fontSize: 14,
                                    }}
                                >
                                    制片厂们正在努力创作中，稍后再来看看吧～
                                </Paragraph>
                            </div>
                        ) : (
                            <div className="linear-video-grid">
                                {cards.map(({ item, episodes }) => (
                                    <LinearVideoCard
                                        key={item.id}
                                        item={item}
                                        episodes={episodes}
                                        onSelectEpisode={setSelectedEpisode}
                                    />
                                ))}
                            </div>
                        )}
                    </Spin>
                </PageContent>

                <footer className="linear-footer">
                    <Text style={{ color: 'var(--foreground-muted)', fontSize: 13 }}>
                        Made with <span style={{ color: 'var(--accent)' }}>♥</span> — Video Platform
                    </Text>
                </footer>

                <Modal
                    open={Boolean(selectedEpisode)}
                    title={selectedEpisode?.title || '视频预览'}
                    width={900}
                    footer={null}
                    destroyOnHidden
                    onCancel={() => setSelectedEpisode(null)}
                    styles={{
                        content: {
                            background: 'var(--bg-elevated)',
                            borderRadius: '20px',
                            border: '1px solid var(--border-default)',
                            boxShadow: 'var(--shadow-card)',
                        },
                        header: {
                            background: 'transparent',
                            borderBottom: '1px solid var(--border-default)',
                            borderRadius: '20px 20px 0 0',
                        },
                        body: { padding: '24px' },
                    }}
                >
                    {selectedEpisode && (
                        <PreviewPlayer episode={selectedEpisode} authenticated={Boolean(user)} />
                    )}
                </Modal>
            </Layout>
        </>
    );
}

export default ConsumerHome;
