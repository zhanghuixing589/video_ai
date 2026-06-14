import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Descriptions,
    Divider,
    Form,
    Input,
    Layout,
    Space,
    Tag,
    Typography,
    Select,
    Tooltip,
} from 'antd';
import { ArrowLeftOutlined, EyeInvisibleOutlined, AlertOutlined, LockOutlined } from '@ant-design/icons';
import { contentApi } from '../services/api';
import type { Content as ContentItem } from '../type/api';
import './ReviewDetail.css';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const typeOptions: Record<string, string> = { MOVIE: '电影', TV_SERIES: '电视剧', VARIETY: '综艺' };
const genreOptions: Record<string, string> = { ACTION: '动作', ROMANCE: '爱情', COMEDY: '喜剧', SUSPENSE: '悬疑', SCI_FI: '科幻', DOCUMENTARY: '纪录片', ANIMATION: '动画', FAMILY: '家庭', REALITY: '真人秀', OTHER: '其他' };

const VIOLATION_TEMPLATES = [
    { label: '政治与法律红线（一票否决）', value: '内容涉嫌违反相关法律法规，请重新自查并调整核心立意自查。' },
    { label: '暴力与危险行为控制', value: '画面包含不安全/危险行为镜头，请剪辑或打码遮挡后重新提交。' },
    { label: '低俗与色情内容限制', value: '部分画面/台词流于低俗，不符合平台传播规范，请删减相关片段。' },
    { label: '元数据与作品质量（封面/标题问题）', value: '作品简介字数过少/标题存在错别字，请完善基本信息后再提交。' },
    { label: '音视频质量问题（黑屏/声画不同步）', value: '视频存在明显的声画不同步现象，请修复后重新上传。' },
];

const isFormValidationError = (
    error: unknown,
): error is { errorFields: unknown[] } => (
    typeof error === 'object'
    && error !== null
    && 'errorFields' in error
);

// 💡 设定防洗稿、防秒刷的硬性阈值
const MIN_REQUIRED_PLAY_TIME = 15; // 限制审片员必须观看 15 秒以上

function ReviewDetail() {
    const { message } = App.useApp();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [video, setVideo] = useState<ContentItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // ────────────────────────────────────────────────────────
    // 💡 核心防刷状态控制
    // ────────────────────────────────────────────────────────
    const [hasPlayed, setHasPlayed] = useState(false);             // 是否点过播放
    const [accumulatedTime, setAccumulatedTime] = useState(0);     // 累计实际观看时间(秒)
    const [visitedPoints, setVisitedPoints] = useState<number[]>([]);// 审片员拉动进度条抽查的时间点记录
    const lastTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (location.state?.videoDetail) {
            setVideo(location.state.videoDetail);
        } else {
            message.error('未获取到作品信息，请返回列表重新进入');
            navigate(-1);
        }
    }, [location.state, navigate, id, message]);

    // 💡 播放器事件：开始播放
    const handleVideoPlay = () => {
        setHasPlayed(true);
    };

    // 💡 播放器事件：时间更新（计算实际人眼观看时长，防止直接拖动进度条作弊）
    const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const videoElement = e.currentTarget;
        const currentTime = videoElement.currentTime;

        if (lastTimeRef.current !== null) {
            const delta = currentTime - lastTimeRef.current;
            // 如果 delta 大于 0 且小于 2 秒，说明是正常播放（不是大跨度拖拽）
            if (delta > 0 && delta < 2) {
                setAccumulatedTime((prev) => prev + delta);
            }

            // 如果发生了跨度超过 5 秒的跳跃（拖动进度条抽查）
            if (Math.abs(delta) > 5) {
                const roundedPoint = Math.floor(currentTime);
                setVisitedPoints((prev) => {
                    if (!prev.includes(roundedPoint)) {
                        return [...prev, roundedPoint];
                    }
                    return prev;
                });
            }
        }
        lastTimeRef.current = currentTime;
    };

    const handleTemplateChange = (value: string) => {
        form.setFieldsValue({ comment: value });
    };

    // 💡 是否满足解锁审核的要求
    const isReviewUnlocked = hasPlayed && accumulatedTime >= MIN_REQUIRED_PLAY_TIME;

    const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
        if (!video) return;

        // 💡 严格执行合规校验：拦截未看视频就随便审核的行为
        if (!isReviewUnlocked) {
            message.error(`拦截违规审核！依据风控规范，你必须至少观看视频正片 ${MIN_REQUIRED_PLAY_TIME} 秒方可签发决定。`);
            return;
        }

        try {
            const values = await form.validateFields();
            const comment = values.comment?.trim();

            if (status === 'REJECTED' && !comment) {
                message.warning('根据审核规则：退回修改时，必须填写详细的审核批注与修改意见。');
                return;
            }

            setSubmitting(true);

            // 💡 行为流痕迹上报（在请求后端时，隐式附带其审片行为报告作为后台留痕审计）
            const auditPayload = {
                status,
                reviewComment: comment || (status === 'APPROVED' ? '内容合规，准予发布。' : ''),

            };

            console.log('前端审计风控留痕指标:', {
                actualWatchSeconds: Math.floor(accumulatedTime),
                hasTriggeredPlay: hasPlayed,
                dragCheckPointsCount: visitedPoints.length
            });

            console.log('即将提交的视频ID：', video.id, typeof video.id);
            await contentApi.review(video.id, auditPayload);
            message.success(`审核处理完成：已${status === 'APPROVED' ? '通过' : '退回'}`);
            navigate(-1);
        } catch (error) {
            if (!isFormValidationError(error)) {
                console.error('审核处理失败:', error);
                message.error('提交审核操作失败，请重试');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!video) return null;

    const episodes = [
        ...(video.episodes || []),
        ...(video.seasons?.flatMap((s) => s.episodes) || []),
    ];
    const previewVideoUrl = episodes[0]?.videoUrl;

    return (
        <div className="review-detail-shell">
            {/* 顶部标题区 */}
            <header className="review-detail-header">
                <Space size="middle">
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ color: '#8ea1b7' }} />
                    <div>
                        <Text style={{ color: '#71849a', fontSize: '12px', display: 'block' }}>审片队列 / 标准合规审核</Text>
                        <Space className="project-title-row" style={{ marginTop: '4px' }}>
                            <Title level={2}>{video.title}</Title>
                            <Tag color="blue">{typeOptions[video.type] || video.type}</Tag>
                            <Tag color="orange">待审核流程</Tag>
                        </Space>
                    </div>
                </Space>
            </header>

            {/* 双栏工作台 */}
            <Content className="review-detail-workspace">

                {/* 左侧：视频预览器与作品资料 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 视频核心预览面板 */}
                    <div className="review-video-panel">
                        {previewVideoUrl ? (
                            <video
                                src={previewVideoUrl}
                                controls
                                poster={video.coverUrl}
                                controlsList="nodownload"
                                /* 💡 监听播放与时间滴答，用来计算审片员实际盯盘时长 */
                                onPlay={handleVideoPlay}
                                onTimeUpdate={handleVideoTimeUpdate}
                            />
                        ) : (
                            <div className="review-video-empty">
                                <EyeInvisibleOutlined />
                                <strong>暂无预览视频文件</strong>
                                <span>该作品可能未正确上传正片源文件</span>
                            </div>
                        )}
                    </div>

                    {/* 实时行为质检播报（让审核员肉眼可见系统在监督他） */}
                    <div style={{ background: '#131e2d', border: '1px dashed #2c3e55', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <span style={{ color: '#e6a345' }}>●</span>
                            <Text style={{ color: '#8ca1b9' }}>审片留痕监视：</Text>
                            <Text style={{ color: hasPlayed ? '#66c67a' : '#f07178' }}>
                                {hasPlayed ? '已开始播映' : '未检测到播放行为'}
                            </Text>
                            <Divider type="vertical" style={{ borderColor: '#2c3e55' }} />
                            <Text style={{ color: '#8ca1b9' }}>当前有效观看时长：</Text>
                            <Text style={{ color: accumulatedTime >= MIN_REQUIRED_PLAY_TIME ? '#66c67a' : '#e6a345', fontWeight: 'bold' }}>
                                {Math.floor(accumulatedTime)}秒 / 目标 {MIN_REQUIRED_PLAY_TIME}秒
                            </Text>
                        </Space>
                        <Tag color={isReviewUnlocked ? "success" : "default"}>
                            {isReviewUnlocked ? "风控解锁：可签发" : "风控中：请继续核验视频"}
                        </Tag>
                    </div>

                    {/* 作品元数据卡片 */}
                    <Card className="review-dark-card" title="作品元数据检查">
                        <div style={{ display: 'grid', gridTemplateColumns: video.coverUrl ? '1fr 140px' : '1fr', gap: '24px' }}>
                            <div>
                                <Descriptions bordered column={1} size="small" className="review-dark-descriptions">
                                    <Descriptions.Item label="作品名称">{video.title}</Descriptions.Item>
                                    <Descriptions.Item label="题材分类">{genreOptions[video.genre] || video.genre}</Descriptions.Item>
                                    <Descriptions.Item label="关联集数">{episodes.length} 个文件</Descriptions.Item>
                                </Descriptions>
                            </div>
                            {video.coverUrl && (
                                <div style={{ textAlign: 'center' }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>作品封面图</Text>
                                    <img src={video.coverUrl} alt="封面" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '6px', border: '1px solid #223044' }} />
                                </div>
                            )}
                        </div>
                        <Divider style={{ borderColor: '#223044', margin: '20px 0' }} />
                        <Title level={5} style={{ color: '#edf3fb', marginBottom: '10px' }}>作品故事简介</Title>
                        <Paragraph style={{ color: '#8092a7', margin: 0, lineHeight: '1.6' }}>{video.description || '制片厂未填写该作品的简介信息。'}</Paragraph>
                    </Card>
                </div>

                {/* 右侧：审核意见表单栏 */}
                <Card className="review-dark-card" title={<Space><AlertOutlined style={{ color: '#e6a345' }} /><span>合规裁决面板</span></Space>}>
                    <Form form={form} layout="vertical" className="review-dark-form">

                        <Form.Item label="违规红线快捷模板" name="template">
                            <Select
                                placeholder="选择常见违规原因自动填充"
                                onChange={handleTemplateChange}
                                allowClear
                                classNames={{ popup: { root: 'review-dropdown-custom' } }}
                            >
                                {VIOLATION_TEMPLATES.map((t, idx) => (
                                    <Option key={idx} value={t.value}>{t.label}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="comment"
                            label="审核批注 / 详细意见反馈"
                            extra={<span style={{ color: '#73869b', fontSize: '11px', display: 'block', marginTop: '4px' }}>⚠️ 依据工作纪律：若拒绝退回，请务必具体写明“哪一集、具体到分秒”以及具体原因。</span>}
                        >
                            <Input.TextArea rows={7} placeholder="示例：第1集 02:15 处画面包含不安全行为，请进行画面删减或打码遮挡..." maxLength={300} showCount />
                        </Form.Item>

                        <Divider style={{ borderColor: '#223044', margin: '16px 0' }} />

                        {/* 💡 决策提交按钮组 */}
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <Tooltip title={!isReviewUnlocked ? `系统检测到您尚未观看完毕视频正片，请先观看满 ${MIN_REQUIRED_PLAY_TIME} 秒` : ''}>
                                <Button
                                    type="primary"
                                    block
                                    disabled={!isReviewUnlocked} // 💡 没看够时间，直接前端禁用
                                    loading={submitting}
                                    onClick={() => handleReview('APPROVED')}
                                    style={{ backgroundColor: isReviewUnlocked ? '#66c67a' : '#2c3947', borderColor: isReviewUnlocked ? '#66c67a' : '#2c3947', height: '42px', fontWeight: 600 }}
                                    icon={!isReviewUnlocked ? <LockOutlined /> : null}
                                >
                                    准予通过 · 发布作品
                                </Button>
                            </Tooltip>

                            <Button
                                danger
                                block
                                disabled={!isReviewUnlocked} // 💡 没看够时间，直接前端禁用
                                loading={submitting}
                                onClick={() => handleReview('REJECTED')}
                                style={{ height: '42px', fontWeight: 600 }}
                                icon={!isReviewUnlocked ? <LockOutlined /> : null}
                            >
                                违规拒绝 · 退回修改
                            </Button>
                        </Space>
                    </Form>
                </Card>

            </Content>
        </div>
    );
}

export default ReviewDetail;
