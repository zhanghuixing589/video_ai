import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Avatar,
    Button,
    Empty,
    Input,
    Layout,
    Rate,
    Result,
    Spin,
    Typography,
    message,
} from 'antd';
import {
    ArrowLeftOutlined,
    CrownOutlined,
    DownloadOutlined,
    PlayCircleFilled,
    SendOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import {authApi, contentApi, contentEngagementApi, getApiErrorMessage} from '../services/api';
import {loadAuthenticatedUser} from '../services/authSession';
import DPlayerPlayer from '../components/DPlayerPlayer';
import type {Content, ContentComment, ContentRatingSummary, UserInfo, VideoType} from '../type/api';
import {
    buildPlaybackPath,
    getFirstPlayableEpisode,
    resolvePlayback,
} from './videoPlayModel';
import {CHANNELS} from './consumerChannelModel';
import './VideoPlayPage.css';

const {Header, Content: PageContent} = Layout;
const {Title, Text, Paragraph} = Typography;
const {TextArea} = Input;

const emptyRating: ContentRatingSummary = {
    averageScore: 0,
    ratingCount: 0,
};

const typeLabels: Record<VideoType, string> = {
    TV_SERIES: '电视剧',
    MOVIE: '电影',
    VARIETY: '综艺',
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

const errorCopy = {
    'invalid-route': ['播放链接无效', '链接中的作品或剧集编号不正确。'],
    'content-not-found': ['作品暂不可用', '该作品不存在或尚未发布。'],
    'episode-not-found': ['剧集暂不可用', '该剧集不属于当前作品或尚未发布。'],
    'no-episodes': ['暂无可播放内容', '该作品还没有已发布的剧集。'],
} as const;

function CyberFlowBackground() {
    return (
        <div className="linear-bg play-page-cyber-bg" aria-hidden="true">
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

function formatCommentTime(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function VideoPlayPage() {
    const {contentId, episodeId} = useParams<{contentId: string; episodeId: string}>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [contents, setContents] = useState<Content[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loadError, setLoadError] = useState('');
    const [comments, setComments] = useState<ContentComment[]>([]);
    const [ratingSummary, setRatingSummary] = useState<ContentRatingSummary>(emptyRating);
    const [recommendations, setRecommendations] = useState<Content[]>([]);
    const [engagementLoading, setEngagementLoading] = useState(false);
    const [commentBody, setCommentBody] = useState('');
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [ratingSaving, setRatingSaving] = useState(false);
    const [userRating, setUserRating] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError('');

        Promise.all([
            contentApi.listPublished(),
            loadAuthenticatedUser(sessionStorage, authApi.me),
        ])
            .then(([publishedContents, authenticatedUser]) => {
                if (!active) return;
                setContents(publishedContents);
                setUser(authenticatedUser);
            })
            .catch((error) => {
                if (!active) return;
                setLoadError(getApiErrorMessage(error, '加载播放内容失败'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setComments([]);
        setRatingSummary(emptyRating);
        setRecommendations([]);
        setCommentBody('');
        setUserRating(0);
        window.scrollTo({top: 0, behavior: 'auto'});
    }, [contentId, episodeId]);

    const resolution = useMemo(
        () => resolvePlayback(contents, contentId, episodeId),
        [contents, contentId, episodeId],
    );

    useEffect(() => {
        if (resolution.status !== 'ready') return;

        let active = true;
        setEngagementLoading(true);
        Promise.all([
            contentEngagementApi.listComments(resolution.content.id),
            contentEngagementApi.getRating(resolution.content.id),
            contentEngagementApi.recommendations(resolution.content.id),
        ])
            .then(([loadedComments, loadedRating, loadedRecommendations]) => {
                if (!active) return;
                setComments(loadedComments);
                setRatingSummary(loadedRating);
                setUserRating(loadedRating.myScore ? loadedRating.myScore / 2 : 0);
                setRecommendations(loadedRecommendations);
            })
            .catch((error) => {
                if (!active) return;
                message.error(getApiErrorMessage(error, '加载评论和推荐失败'));
            })
            .finally(() => {
                if (active) setEngagementLoading(false);
            });

        return () => {
            active = false;
        };
    }, [resolution]);

    if (loading) {
        return (
            <>
                <CyberFlowBackground />
                <div className="play-page-loading" role="status" aria-live="polite">
                    <Spin size="large" />
                    <Text>正在准备播放内容...</Text>
                </div>
            </>
        );
    }

    if (loadError) {
        return (
            <>
                <CyberFlowBackground />
                <div className="play-page-error">
                    <Result
                        status="error"
                        title="播放页加载失败"
                        subTitle={loadError}
                        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
                    />
                </div>
            </>
        );
    }

    if (resolution.status !== 'ready') {
        const [title, detail] = errorCopy[resolution.status];
        return (
            <>
                <CyberFlowBackground />
                <div className="play-page-error">
                    <Result
                        status="warning"
                        title={title}
                        subTitle={detail}
                        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
                    />
                </div>
            </>
        );
    }

    const {content, episode, episodes} = resolution;
    const relatedContents = recommendations
        .filter((item) => item.id !== content.id && getFirstPlayableEpisode(item))
        .slice(0, 8);

    const navigateToEpisode = (targetEpisodeId: number) =>
        navigate(buildPlaybackPath(content.id, targetEpisodeId));

    const handleRatingChange = async (value: number) => {
        if (!user) {
            message.info('登录后即可评分');
            navigate('/login');
            return;
        }
        if (value <= 0) return;
        const score = Math.max(1, Math.min(10, Math.round(value * 2)));
        setRatingSaving(true);
        try {
            const summary = await contentEngagementApi.rate(content.id, {score});
            setRatingSummary(summary);
            setUserRating(summary.myScore ? summary.myScore / 2 : value);
            message.success('评分已保存');
        } catch (error) {
            message.error(getApiErrorMessage(error, '评分失败'));
        } finally {
            setRatingSaving(false);
        }
    };

    const handleCommentSubmit = async () => {
        if (!user) {
            message.info('登录后即可发表评论');
            navigate('/login');
            return;
        }
        const body = commentBody.trim();
        if (!body) {
            message.warning('请输入评论内容');
            return;
        }
        setCommentSubmitting(true);
        try {
            const created = await contentEngagementApi.createComment(content.id, {body});
            setComments((current) => [created, ...current]);
            setCommentBody('');
            message.success('评论已发布');
        } catch (error) {
            message.error(getApiErrorMessage(error, '评论发布失败'));
        } finally {
            setCommentSubmitting(false);
        }
    };

    return (
        <>
            <CyberFlowBackground />
            <Layout className="video-play-shell">
                <Header className="play-page-header">
                    <button className="play-brand" type="button" onClick={() => navigate('/')}>
                        <span className="play-brand-icon"><VideoCameraOutlined aria-hidden /></span>
                        <span>Video Platform</span>
                    </button>
                    <nav className="play-category-nav" aria-label="内容分类">
                        {CHANNELS.map((item) => (
                            <button key={item.channel} type="button" onClick={() => navigate(item.path)}>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="back-home-btn"
                        onClick={() => navigate('/')}
                    >
                        返回首页
                    </Button>
                </Header>

                <div className="play-promotion-strip">
                    <span><VideoCameraOutlined aria-hidden /> 创作中心：让好作品被更多人看见</span>
                    <span><DownloadOutlined aria-hidden /> 客户端观看更流畅</span>
                </div>

                <PageContent className="play-page-body">
                    <section className="play-hero" aria-labelledby="video-title">
                        <div className="player-left-zone">
                            <DPlayerPlayer
                                episode={episode}
                                coverUrl={content.coverUrl}
                                authenticated={Boolean(user)}
                                onLogin={() => navigate('/login')}
                                onRegister={() => navigate('/login?mode=register')}
                            />
                            <div className="playing-episode-line">
                                <PlayCircleFilled aria-hidden />
                                正在播放：第 {episode.episodeNumber} 集
                                {episode.title ? ` · ${episode.title}` : ''}
                            </div>
                        </div>

                        <aside className="video-score-panel">
                            <div className="video-label-row">
                                <span>{typeLabels[content.type]}</span>
                                <span>{genreLabels[content.genre] || content.genre}</span>
                                <span>{episodes.length} 集</span>
                            </div>
                            <Title id="video-title" level={1}>{content.title}</Title>
                            <Paragraph>{content.description || '暂无作品简介'}</Paragraph>
                            <div className="score-summary">
                                <div>
                                    <strong>{ratingSummary.averageScore.toFixed(1)}</strong>
                                    <span>分</span>
                                </div>
                                <Text>{ratingSummary.ratingCount.toLocaleString('zh-CN')} 人评分</Text>
                            </div>
                            <div className="score-action">
                                <Text>给这部作品评分</Text>
                                <Rate
                                    allowHalf
                                    value={userRating}
                                    disabled={ratingSaving}
                                    onChange={handleRatingChange}
                                    aria-label="给作品评分"
                                />
                            </div>
                        </aside>
                    </section>

                    <section className="play-section comments-section" aria-labelledby="comments-title">
                        <div className="play-section-heading">
                            <div>

                                <Title id="comments-title" level={2}>观众评论</Title>
                            </div>
                            <Text>{comments.length.toLocaleString('zh-CN')} 条评论</Text>
                        </div>
                        <div className="comment-composer">
                            <TextArea
                                value={commentBody}
                                onChange={(event) => setCommentBody(event.target.value)}
                                maxLength={1000}
                                rows={3}
                                placeholder={user ? '写下你的观看感受' : '登录后即可发表评论'}
                            />
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={commentSubmitting}
                                onClick={handleCommentSubmit}
                            >
                                发布评论
                            </Button>
                        </div>
                        <Spin spinning={engagementLoading}>
                            {comments.length > 0 ? (
                                <div className="comment-stream">
                                    {comments.map((comment) => (
                                        <article key={comment.id} className="comment-item">
                                            <Avatar src={comment.authorAvatarUrl} icon={<UserOutlined />} />
                                            <div>
                                                <div className="comment-meta">
                                                    <strong>{comment.authorDisplayName || comment.authorUsername}</strong>
                                                    <span>{formatCommentTime(comment.createdAt)}</span>
                                                </div>
                                                <p>{comment.body}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无评论" />
                            )}
                        </Spin>
                    </section>

                    <section className="play-section episode-section-panel" aria-labelledby="episodes-title">
                        <div className="update-card">
                            <div>
                                <Text className="section-eyebrow">更新信息</Text>
                                <Title level={3}>已更新至第 {episodes.length} 集</Title>
                                <Paragraph>按顺序观看完整剧情，当前为第 {episode.episodeNumber} 集。</Paragraph>
                            </div>
                            <div className="membership-card">
                                <CrownOutlined aria-hidden />
                                <div>
                                    <strong>会员活动</strong>
                                    <span>开通会员，畅享高清画质与完整内容</span>
                                </div>
                            </div>
                        </div>
                        <div className="episode-list-card">
                            <div className="play-section-heading">
                                <Title id="episodes-title" level={2}>选集</Title>
                                <Text>共 {episodes.length} 集</Text>
                            </div>
                            <div className="playlist-grid">
                                {episodes.map((item) => {
                                    const active = item.id === episode.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className={`playlist-item-btn ${active ? 'active-episode' : ''}`}
                                            aria-current={active ? 'true' : undefined}
                                            aria-label={`播放第 ${item.episodeNumber} 集：${item.title}`}
                                            onClick={() => {
                                                if (!active) navigateToEpisode(item.id);
                                            }}
                                        >
                                            <span>{item.episodeNumber}</span>
                                            {active && <PlayCircleFilled aria-hidden />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="play-section discovery-section" aria-labelledby="related-title">
                        <div className="play-section-heading">
                            <div>
                                <Text className="section-eyebrow">继续探索</Text>
                                <Title id="related-title" level={2}>同类推荐</Title>
                            </div>
                        </div>
                        <div className="discovery-grid">
                            {relatedContents.map((item) => {
                                const firstEpisode = getFirstPlayableEpisode(item)!;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className="related-card"
                                        onClick={() => navigate(buildPlaybackPath(item.id, firstEpisode.id))}
                                    >
                                        {item.coverUrl ? (
                                            <img src={item.coverUrl} alt="" />
                                        ) : (
                                            <span className="related-card-placeholder">
                                                <VideoCameraOutlined aria-hidden />
                                            </span>
                                        )}
                                        <span>
                                            <strong>{item.title}</strong>
                                            <small>{typeLabels[item.type]} · {genreLabels[item.genre] || item.genre}</small>
                                        </span>
                                    </button>
                                );
                            })}
                            {relatedContents.length === 0 && (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无更多推荐" />
                            )}
                        </div>
                    </section>
                </PageContent>
            </Layout>
        </>
    );
}

export default VideoPlayPage;
