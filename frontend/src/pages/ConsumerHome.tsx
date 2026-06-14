import { useEffect, useMemo, useState, useRef } from 'react';
import { Button, Empty, Layout, Modal, Space, Spin, Typography, message, Carousel } from 'antd';
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
    LeftOutlined,
    RightOutlined,
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
   LABEL TRANSLATION CONFIGURATIONS
   ============================================ */
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
   LINEAR HERO CAROUSEL (Linear 风格的腾讯式焦点图)
   ============================================ */
interface LinearHeroCarouselProps {
    items: Content[];
    onSelectEpisode: (episode: Episode) => void;
}

function LinearHeroCarousel({ items, onSelectEpisode }: LinearHeroCarouselProps) {
    const bannerItems = useMemo(() => items.filter(i => i.coverUrl).slice(0, 5), [items]);

    if (bannerItems.length === 0) return null;

    return (
        <div className="linear-hero-carousel">
            <Carousel autoplay effect="fade" arrows nextArrow={<RightOutlined />} prevArrow={<LeftOutlined />}>
                {bannerItems.map((item) => {
                    const firstEpisode = item.episodes?.[0] || item.seasons?.[0]?.episodes?.[0];
                    return (
                        <div key={item.id} className="linear-banner-slide">
                            <div className="linear-banner-bg" style={{ backgroundImage: `url(${item.coverUrl})` }} />
                            <div className="linear-banner-mask" />
                            <div className="linear-banner-content">
                                <div className="hero-tag">
                                    <VideoCameraOutlined /> 重磅推荐
                                </div>
                                <Title level={1} className="hero-title" style={{ margin: '12px 0 24px' }}>
                                    {item.title}
                                </Title>
                                <Paragraph className="hero-desc" ellipsis={{ rows: 2 }}>
                                    {item.description || '暂无简介'}
                                </Paragraph>
                                {firstEpisode && (
                                    <Button
                                        className="linear-nav-btn linear-nav-btn--primary"
                                        style={{ height: '40px !important', padding: '0 24px !important', fontSize: '0.875rem !important' }}
                                        icon={<PlayCircleOutlined />}
                                        onClick={() => onSelectEpisode(firstEpisode)}
                                    >
                                        立即试看
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </Carousel>
        </div>
    );
}

/* ============================================
   VIDEO CARD COMPONENT (完全保留你的视觉)
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
                        <span className="linear-tag">
                            {videoTypeLabels[item.type] || item.type}
                        </span>
                        <span className="linear-tag">
                            {genreLabels[item.genre] || item.genre}
                        </span>
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

    // 整合列表基础数据
    const allCards = useMemo(
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

    // 🌟 腾讯视频的核心改动：按作品类型将数据分组（楼层）
    const categorizedSections = useMemo(() => {
        const sections: Record<string, typeof allCards> = {
            TV_SERIES: [],
            MOVIE: [],
            VARIETY: [],
        };
        allCards.forEach(card => {
            if (sections[card.item.type]) {
                sections[card.item.type].push(card);
            }
        });
        return sections;
    }, [allCards]);

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
                                    <Text style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                                        欢迎，{user.displayName || user.username}
                                    </Text>
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

                <PageContent className="linear-content" style={{ padding: '24px 32px 80px' }}>
                    <Spin spinning={loading} className="linear-spin">
                        {contents.length === 0 ? (
                            <div className="empty-state-card" style={{ marginTop: '64px' }}>
                                <div className="empty-state-icon">
                                    <VideoCameraOutlined />
                                </div>
                                <Empty description="暂时没有已发布作品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                <Paragraph style={{ marginTop: 16, color: 'var(--foreground-muted)', fontSize: 14 }}>
                                    制片厂们正在努力创作中，稍后再来看看吧～
                                </Paragraph>
                            </div>
                        ) : (
                            <>
                                {/* 🌟 1. 顶部全屏宽大焦点轮播（基于你的样式和变量） */}
                                <LinearHeroCarousel items={contents} onSelectEpisode={setSelectedEpisode} />

                                {/* 🌟 2. 核心频道楼层区域 */}
                                <div className="linear-floors-container">
                                    {Object.entries(categorizedSections).map(([typeKey, list]) => {
                                        if (list.length === 0) return null;
                                        return (
                                            <div key={typeKey} className="linear-floor-section">
                                                {/* 楼层头部 */}
                                                <div className="linear-floor-header">
                                                    <div className="linear-floor-title-wrap">
                                                        <span className="linear-floor-indicator" />
                                                        <Title level={3} className="linear-floor-title">
                                                            {videoTypeLabels[typeKey]}专区
                                                        </Title>
                                                    </div>
                                                    <Button type="link" className="linear-nav-btn linear-nav-btn--accent">
                                                        全部查看 &gt;
                                                    </Button>
                                                </div>

                                                {/* 对应的视频网格群 */}
                                                <div className="linear-video-grid">
                                                    {list.map(({ item, episodes }) => (
                                                        <LinearVideoCard
                                                            key={item.id}
                                                            item={item}
                                                            episodes={episodes}
                                                            onSelectEpisode={setSelectedEpisode}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
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