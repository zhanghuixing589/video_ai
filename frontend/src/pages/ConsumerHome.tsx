import { useEffect, useMemo, useState } from 'react';
import type {ComponentProps} from 'react';
import { Button, Empty, Layout, Space, Spin, Typography, message, Carousel } from 'antd';
import {
    LogoutOutlined,
    LoginOutlined,
    UserAddOutlined,
    DashboardOutlined,
    VideoCameraOutlined,
    PlayCircleOutlined,
    StarOutlined,
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, contentApi, getApiErrorMessage } from '../services/api';
import { loadAuthenticatedUser } from '../services/authSession';
import type { Content, Episode, UserInfo } from '../type/api';
import SpotlightCard from '../components/SpotlightCard';
import {buildPlaybackPath, getFirstPlayableEpisode} from './videoPlayModel';
import {
    CHANNELS,
    filterContentByGenre,
    GENRE_LABELS,
    getAvailableGenres,
    getChannelContent,
    groupContentByType,
    normalizeGenre,
    type ConsumerChannel,
} from './consumerChannelModel';
import './ConsumerHome.css';

const { Header, Content: PageContent } = Layout;
const { Title, Text, Paragraph } = Typography;

/* ============================================
   标签字典配置
   ============================================ */
const videoTypeLabels: Record<string, string> = {
    TV_SERIES: '电视剧',
    MOVIE: '电影',
    VARIETY: '综艺',
};

/* ============================================
   氛围背景组件
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
   安全箭头包装
   ============================================ */
type CarouselArrowProps = ComponentProps<typeof RightOutlined> & {
    currentSlide?: number;
    slideCount?: number;
};

const withoutCarouselState = (props: CarouselArrowProps) => {
    const cleanProps = {...props};
    delete cleanProps.currentSlide;
    delete cleanProps.slideCount;
    return cleanProps;
};

const SafeNextArrow = (props: CarouselArrowProps) => (
    <RightOutlined {...withoutCarouselState(props)} />
);

const SafePrevArrow = (props: CarouselArrowProps) => (
    <LeftOutlined {...withoutCarouselState(props)} />
);

/* ============================================
   焦点图轮播组件
   ============================================ */
interface LinearHeroCarouselProps {
    items: Content[];
    onSelectEpisode: (item: Content, episode: Episode) => void;
}

function LinearHeroCarousel({ items, onSelectEpisode }: LinearHeroCarouselProps) {
    const bannerItems = useMemo(() => items.filter(i => i.coverUrl).slice(0, 5), [items]);
    if (bannerItems.length === 0) return null;

    return (
        <div className="linear-hero-carousel">
            <Carousel
                autoplay
                effect="fade"
                arrows
                nextArrow={<SafeNextArrow />}
                prevArrow={<SafePrevArrow />}
            >
                {bannerItems.map((item) => {
                    const firstEpisode = getFirstPlayableEpisode(item);
                    return (
                        <div key={item.id} className="linear-banner-slide">
                            <div className="linear-banner-bg" style={{ backgroundImage: `url(${item.coverUrl})` }} />
                            <div className="linear-banner-mask" />
                            <div className="linear-banner-content">
                                <div className="hero-tag"><VideoCameraOutlined /> 重磅推荐</div>
                                <Title level={1} className="hero-title" style={{ margin: '12px 0 24px', color: '#fff' }}>
                                    {item.title}
                                </Title>
                                <Paragraph className="hero-desc" ellipsis={{ rows: 2 }}>
                                    {item.description || '暂无简介'}
                                </Paragraph>
                                {firstEpisode && (
                                    <Button
                                        className="linear-nav-btn linear-nav-btn--primary"
                                        icon={<PlayCircleOutlined />}
                                        onClick={() => onSelectEpisode(item, firstEpisode)}
                                    >
                                        立即观看
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
   作品展示卡片组件
   ============================================ */
interface VideoCardProps {
    item: Content;
    episodes: Episode[];
    onSelectEpisode: (item: Content, episode: Episode) => void;
}

function LinearVideoCard({ item, episodes, onSelectEpisode }: VideoCardProps) {
    const firstEpisode = getFirstPlayableEpisode(item);
    const openFirstEpisode = () => {
        if (firstEpisode) onSelectEpisode(item, firstEpisode);
    };

    return (
        <SpotlightCard>
            <div
                className={`linear-card-inner ${firstEpisode ? 'is-playable' : 'is-unavailable'}`}
                role="button"
                tabIndex={firstEpisode ? 0 : -1}
                aria-disabled={!firstEpisode}
                aria-label={firstEpisode ? `播放《${item.title}》第 1 集` : `《${item.title}》暂无可播放剧集`}
                onClick={openFirstEpisode}
                onKeyDown={(event) => {
                    if (firstEpisode && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        openFirstEpisode();
                    }
                }}
            >
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
                    <Title level={4} className="card-title">{item.title}</Title>
                    <Paragraph className="card-description">{item.description || '暂无简介'}</Paragraph>
                    <Space wrap size={8}>
                        <span className="linear-tag">{videoTypeLabels[item.type] || item.type}</span>
                        <span className="linear-tag">{GENRE_LABELS[item.genre as keyof typeof GENRE_LABELS] || item.genre}</span>
                        <span className="linear-tag">{episodes.length} 集</span>
                    </Space>
                    <div className="episode-section">
                        <div className="episode-label"><PlayCircleOutlined /> 剧集</div>
                        <div className="episode-buttons">
                            {episodes.slice(0, 4).map((episode) => (
                                <Button
                                    key={episode.id}
                                    className="episode-btn"
                                    aria-label={`播放第 ${episode.episodeNumber} 集：${episode.title}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSelectEpisode(item, episode);
                                    }}
                                >
                                    第 {episode.episodeNumber} 集
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SpotlightCard>
    );
}

/* ============================================
   主页面组件
   ============================================ */
function ConsumerHome({channel}: {channel: ConsumerChannel}) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [contents, setContents] = useState<Content[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        Promise.all([
            loadAuthenticatedUser(sessionStorage, authApi.me).then(setUser),
            contentApi
                .listPublished()
                .then(setContents)
                .catch((error) => message.error(getApiErrorMessage(error, '加载作品失败'))),
        ]).finally(() => setLoading(false));
    }, []);

    // 整合、扁平化剧集数据
    const allCards = useMemo(() =>
        contents.map((item) => {
            const episodes = [
                ...item.episodes,
                ...item.seasons.flatMap((season) => season.episodes),
            ];
            return { item, episodes };
        }), [contents]
    );

    const categorizedSections = useMemo(() => {
        const grouped = groupContentByType(contents);
        return Object.fromEntries(
            Object.entries(grouped).map(([type, items]) => [
                type,
                allCards.filter(({item}) => items.some(({id}) => id === item.id)),
            ]),
        ) as Record<string, typeof allCards>;
    }, [allCards, contents]);

    const channelContents = useMemo(
        () => getChannelContent(contents, channel),
        [channel, contents],
    );
    const requestedGenre = searchParams.get('genre');
    const activeGenre = normalizeGenre(requestedGenre);
    const availableGenres = useMemo(
        () => getAvailableGenres(channelContents),
        [channelContents],
    );
    const filteredChannelContents = useMemo(
        () => filterContentByGenre(channelContents, activeGenre),
        [activeGenre, channelContents],
    );
    const filteredChannelCards = useMemo(() => {
        const ids = new Set(filteredChannelContents.map(({id}) => id));
        return allCards.filter(({item}) => ids.has(item.id));
    }, [allCards, filteredChannelContents]);
    const carouselItems = channel === 'HOME' ? contents : channelContents;

    useEffect(() => {
        if (channel !== 'HOME' && requestedGenre && !activeGenre) {
            setSearchParams({}, {replace: true});
        }
    }, [activeGenre, channel, requestedGenre, setSearchParams]);

    const handlePlayVideo = (item: Content, episode: Episode) => {
        if (!episode || !episode.id) {
            message.error('该剧集暂不可播放');
            return;
        }
        navigate(buildPlaybackPath(item.id, episode.id));
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
        message.success('已退出登录');
    };

    const getAdminButton = () => {
        if (!user) return null;
        switch (user.role) {
            case 'ADMIN': return { text: '管理员控制台', icon: <DashboardOutlined />, path: '/admin' };
            case 'REVIEWER': return { text: '审核员控制台', icon: <VideoCameraOutlined />, path: '/reviewer' };
            case 'STUDIO': return {
                text: '制片厂中心',
                icon: <VideoCameraOutlined />,
                path: user.studioStatus === 'APPROVED' ? '/studio' : '/studio/application',
            };
            default: return null;
        }
    };

    const adminButton = getAdminButton();

    const setGenre = (genre: string | null) => {
        if (genre) setSearchParams({genre});
        else setSearchParams({});
    };

    const channelLabel = CHANNELS.find((item) => item.channel === channel)?.label || '首页';

    return (
        <>
            <LinearBackground />
            <Layout className="linear-shell">
                <Header className="linear-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* 左侧：Logo 与 品牌名称 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
                        <button className="header-brand" type="button" onClick={() => navigate('/')}>
                            <div className="brand-icon"><VideoCameraOutlined /></div>
                            <Title level={4} className="brand-title" style={{ margin: 0 }}>Video Platform</Title>
                        </button>

                        <nav className="channel-nav" aria-label="内容频道">
                            {CHANNELS.map((item) => (
                                <button
                                    key={item.channel}
                                    type="button"
                                    className={item.channel === channel ? 'is-active' : ''}
                                    aria-current={item.channel === channel ? 'page' : undefined}
                                    onClick={() => navigate(item.path)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* 右侧：用户操作区 */}
                    <div className="header-actions" style={{ flexShrink: 0 }}>
                        {user ? (
                            <>
                                <div className="user-greeting">
                                    <StarOutlined style={{ color: 'var(--accent)' }} />
                                    <Text style={{ color: 'var(--foreground)', fontWeight: 500 }}>
                                        欢迎，{user.displayName || user.username}
                                    </Text>
                                </div>
                                <Button className="linear-nav-btn" onClick={() => navigate('/profile')}>个人中心</Button>
                                {adminButton && (
                                    <Button className="linear-nav-btn linear-nav-btn--accent" icon={adminButton.icon} onClick={() => navigate(adminButton.path)}>
                                        {adminButton.text}
                                    </Button>
                                )}
                                <Button className="linear-nav-btn" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
                            </>
                        ) : (
                            <>
                                <Button className="linear-nav-btn" icon={<LoginOutlined />} onClick={() => navigate('/login')}>登录</Button>
                                <Button className="linear-nav-btn linear-nav-btn--primary" icon={<UserAddOutlined />} onClick={() => navigate('/login?mode=register')}>注册</Button>
                            </>
                        )}
                    </div>
                </Header>

                <PageContent className="linear-content" style={{ padding: '24px 32px 80px' }}>
                    <Spin spinning={loading} className="linear-spin">
                        {contents.length === 0 ? (
                            <div className="empty-state-card" style={{ marginTop: '64px' }}>
                                <div className="empty-state-icon"><VideoCameraOutlined /></div>
                                <Empty description="暂时没有已发布作品" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                            </div>
                        ) : (
                            <>
                                {/* 顶部高光大焦点图轮播（会自动根据 Tab 联动筛选推荐） */}
                                <LinearHeroCarousel items={carouselItems} onSelectEpisode={handlePlayVideo} />

                                {channel === 'HOME' ? (
                                    <div className="linear-floors-container">
                                        {Object.entries(categorizedSections).map(([typeKey, list]) => {
                                            if (list.length === 0) return null;
                                            return (
                                                <div
                                                    key={typeKey}
                                                    id={`content-floor-${typeKey.toLowerCase()}`}
                                                    className="linear-floor-section"
                                                >
                                                    <div className="linear-floor-header">
                                                        <div className="linear-floor-title-wrap">
                                                            <span className="linear-floor-indicator" />
                                                            <Title level={3} className="linear-floor-title">{videoTypeLabels[typeKey]}专区</Title>
                                                        </div>
                                                    </div>

                                                    <div className="linear-video-grid">
                                                        {list.map(({ item, episodes }) => (
                                                            <LinearVideoCard
                                                                key={item.id}
                                                                item={item}
                                                                episodes={episodes}
                                                                onSelectEpisode={handlePlayVideo}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <section className="channel-page-section" aria-labelledby="channel-page-title">
                                        <div className="linear-floor-header">
                                            <div className="linear-floor-title-wrap">
                                                <span className="linear-floor-indicator" />
                                                <Title id="channel-page-title" level={2} className="linear-floor-title">
                                                    {channelLabel}频道
                                                </Title>
                                            </div>
                                        </div>

                                        <div className="genre-filter" aria-label={`${channelLabel}题材筛选`}>
                                            <button
                                                type="button"
                                                aria-pressed={!activeGenre}
                                                className={!activeGenre ? 'is-active' : ''}
                                                onClick={() => setGenre(null)}
                                            >
                                                全部
                                            </button>
                                            {availableGenres.map((genre) => (
                                                <button
                                                    key={genre}
                                                    type="button"
                                                    aria-pressed={activeGenre === genre}
                                                    className={activeGenre === genre ? 'is-active' : ''}
                                                    onClick={() => setGenre(genre)}
                                                >
                                                    {GENRE_LABELS[genre]}
                                                </button>
                                            ))}
                                        </div>

                                        {filteredChannelCards.length > 0 ? (
                                            <div className="linear-video-grid">
                                                {filteredChannelCards.map(({item, episodes}) => (
                                                    <LinearVideoCard
                                                        key={item.id}
                                                        item={item}
                                                        episodes={episodes}
                                                        onSelectEpisode={handlePlayVideo}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="channel-empty-state">
                                                <Empty
                                                    description={activeGenre
                                                        ? '该分类暂时没有已发布作品'
                                                        : `暂时没有已发布的${channelLabel}内容`}
                                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                />
                                                {activeGenre && (
                                                    <Button className="linear-nav-btn linear-nav-btn--primary" onClick={() => setGenre(null)}>
                                                        查看全部
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </section>
                                )}
                            </>
                        )}
                    </Spin>
                </PageContent>
            </Layout>
        </>
    );
}

export default ConsumerHome;
