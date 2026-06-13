import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    App,
    Button,
    Drawer,
    Empty,
    Form,
    Input,
    InputNumber,
    Layout,
    Modal,
    Progress,
    Select,
    Spin,
    Tabs,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from 'antd';
import {
    CheckCircleFilled,
    CloudUploadOutlined,
    FileImageOutlined,
    FolderOpenOutlined,
    HomeOutlined,
    LogoutOutlined,
    PlayCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    SettingOutlined,
    UploadOutlined,
    VideoCameraOutlined,
    WarningFilled,
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {authApi, contentApi, getApiErrorMessage, mediaApi} from '../services/api';
import type {Content, MediaUploadResult, VideoGenre, VideoType} from '../type/api';
import {
    buildPublishChecks,
    flattenEpisodeRows,
    formatDuration,
    formatFileSize,
} from './studioWorkspaceModel';
import './StudioWorkspace.css';

const {Content: PageContent, Sider} = Layout;
const {Text, Title} = Typography;
const {Dragger} = Upload;

const typeOptions: {label: string; value: VideoType}[] = [
    {label: '电影', value: 'MOVIE'},
    {label: '电视剧', value: 'TV_SERIES'},
    {label: '综艺', value: 'VARIETY'},
];

const genreOptions: {label: string; value: VideoGenre}[] = [
    {label: '动作', value: 'ACTION'},
    {label: '爱情', value: 'ROMANCE'},
    {label: '喜剧', value: 'COMEDY'},
    {label: '悬疑', value: 'SUSPENSE'},
    {label: '科幻', value: 'SCI_FI'},
    {label: '纪录片', value: 'DOCUMENTARY'},
    {label: '动画', value: 'ANIMATION'},
    {label: '家庭', value: 'FAMILY'},
    {label: '真人秀', value: 'REALITY'},
    {label: '其他', value: 'OTHER'},
];

const statusLabels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '审核中',
    APPROVED: '已通过',
    REJECTED: '需修改',
    PUBLISHED: '已发布',
    BANNED: '已下架',
};

interface UploadState {
    status: 'idle' | 'uploading' | 'error';
    progress: number;
    message?: string;
}

interface EpisodeFormValues {
    seasonId?: number;
    episodeNumber: number;
    title: string;
    durationSeconds: number;
}

function StudioWorkspace() {
    const navigate = useNavigate();
    const {message} = App.useApp();
    const [contents, setContents] = useState<Content[]>([]);
    const [selectedContentId, setSelectedContentId] = useState<number>();
    const [selectedEpisodeId, setSelectedEpisodeId] = useState<number>();
    const [activeTab, setActiveTab] = useState('media');
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [seasonOpen, setSeasonOpen] = useState(false);
    const [episodeOpen, setEpisodeOpen] = useState(false);
    const [metadataSaving, setMetadataSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [coverProgress, setCoverProgress] = useState(0);
    const [videoFile, setVideoFile] = useState<File>();
    const [videoUpload, setVideoUpload] = useState<UploadState>({status: 'idle', progress: 0});
    const [videoAbortController, setVideoAbortController] = useState<AbortController>();
    const [previewedContentIds, setPreviewedContentIds] = useState<Set<number>>(new Set());
    const [createForm] = Form.useForm();
    const [metadataForm] = Form.useForm();
    const [seasonForm] = Form.useForm();
    const [episodeForm] = Form.useForm<EpisodeFormValues>();

    const loadContents = useCallback(async (preferredId?: number) => {
        try {
            const result = await contentApi.listMine();
            setContents(result);
            setSelectedContentId((current) => {
                if (preferredId && result.some((item) => item.id === preferredId)) return preferredId;
                if (current && result.some((item) => item.id === current)) return current;
                return result[0]?.id;
            });
        } catch (error) {
            message.error(getApiErrorMessage(error, '加载作品失败'));
        } finally {
            setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        void loadContents();
    }, [loadContents]);

    const selected = useMemo(
        () => contents.find((content) => content.id === selectedContentId),
        [contents, selectedContentId],
    );
    const episodeRows = useMemo(() => flattenEpisodeRows(selected), [selected]);
    const selectedEpisode = useMemo(
        () => episodeRows.find((episode) => episode.id === selectedEpisodeId) ?? episodeRows[0],
        [episodeRows, selectedEpisodeId],
    );
    const publishChecks = useMemo(
        () => buildPublishChecks(
            selected,
            selected ? previewedContentIds.has(selected.id) : false,
        ),
        [previewedContentIds, selected],
    );
    const canSubmit = publishChecks.every((check) => check.complete)
        && selected?.status !== 'PENDING'
        && selected?.status !== 'PUBLISHED';

    useEffect(() => {
        if (!selected) return;
        metadataForm.setFieldsValue({
            title: selected.title,
            description: selected.description,
            genre: selected.genre,
        });
        setSelectedEpisodeId(flattenEpisodeRows(selected)[0]?.id);
    }, [metadataForm, selected]);

    const createContent = async (values: {
        title: string;
        description?: string;
        type: VideoType;
        genre: VideoGenre;
    }) => {
        try {
            const created = await contentApi.create(values);
            createForm.resetFields();
            setCreateOpen(false);
            setActiveTab('basic');
            await loadContents(created.id);
            message.success('作品已创建，请继续上传封面和视频');
        } catch (error) {
            message.error(getApiErrorMessage(error, '创建作品失败'));
        }
    };

    const saveMetadata = async (values: {
        title: string;
        description?: string;
        genre: VideoGenre;
    }) => {
        if (!selected) return;
        setMetadataSaving(true);
        try {
            await contentApi.update(selected.id, {...values, coverUrl: selected.coverUrl});
            await loadContents(selected.id);
            message.success('作品资料已保存');
        } catch (error) {
            message.error(getApiErrorMessage(error, '保存作品资料失败'));
        } finally {
            setMetadataSaving(false);
        }
    };

    const uploadCover = async (file: File) => {
        if (!selected) return;
        setCoverProgress(1);
        try {
            const uploaded = await mediaApi.uploadCover(file, setCoverProgress);
            const values = metadataForm.getFieldsValue();
            await contentApi.update(selected.id, {
                title: values.title || selected.title,
                description: values.description,
                genre: values.genre || selected.genre,
                coverUrl: uploaded.url,
            });
            await loadContents(selected.id);
            message.success('封面上传成功');
        } catch (error) {
            message.error(getApiErrorMessage(error, '封面上传失败'));
        } finally {
            setCoverProgress(0);
        }
    };

    const addSeason = async (values: {seasonNumber: number; title: string}) => {
        if (!selected) return;
        try {
            await contentApi.addSeason(selected.id, values);
            seasonForm.resetFields();
            setSeasonOpen(false);
            await loadContents(selected.id);
            message.success('季度已添加');
        } catch (error) {
            message.error(getApiErrorMessage(error, '添加季度失败'));
        }
    };

    const openEpisodeEditor = () => {
        if (!selected) return;
        const nextEpisodeNumber = episodeRows.length + 1;
        episodeForm.resetFields();
        episodeForm.setFieldsValue({
            seasonId: selected.type === 'MOVIE' ? undefined : selected.seasons[0]?.id,
            episodeNumber: selected.type === 'MOVIE' ? 1 : nextEpisodeNumber,
            title: selected.type === 'MOVIE' ? '正片' : '',
        });
        setVideoFile(undefined);
        setVideoUpload({status: 'idle', progress: 0});
        setEpisodeOpen(true);
    };

    const chooseVideo = async (file: File) => {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            message.error('仅支持 MP4、WebM 或 MOV 视频');
            return Upload.LIST_IGNORE;
        }
        if (file.size > 2 * 1024 * 1024 * 1024) {
            message.error('单个视频不能超过 2 GB');
            return Upload.LIST_IGNORE;
        }
        setVideoFile(file);
        setVideoUpload({status: 'idle', progress: 0});
        try {
            const duration = await readVideoDuration(file);
            episodeForm.setFieldValue('durationSeconds', Math.max(1, Math.round(duration)));
        } catch {
            message.warning('未能自动读取时长，请手动填写');
        }
        return false;
    };

    const uploadAndCreateEpisode = async (values: EpisodeFormValues) => {
        if (!selected || !videoFile) {
            message.error('请先选择本地视频文件');
            return;
        }
        const controller = new AbortController();
        setVideoAbortController(controller);
        setVideoUpload({status: 'uploading', progress: 0});
        try {
            const uploaded: MediaUploadResult = await mediaApi.uploadVideo(
                videoFile,
                (progress) => setVideoUpload({status: 'uploading', progress}),
                controller.signal,
            );
            await contentApi.addEpisode(selected.id, {
                ...values,
                videoUrl: uploaded.url,
                originalFileName: uploaded.fileName,
                fileSize: uploaded.size,
            });
            setEpisodeOpen(false);
            setVideoFile(undefined);
            setVideoUpload({status: 'idle', progress: 0});
            await loadContents(selected.id);
            message.success(selected.type === 'MOVIE' ? '正片上传完成' : '剧集上传完成');
        } catch (error) {
            const fallback = controller.signal.aborted ? '上传已取消' : '视频上传失败，请重试';
            setVideoUpload({status: 'error', progress: 0, message: fallback});
            if (!controller.signal.aborted) {
                message.error(getApiErrorMessage(error, fallback));
            }
        } finally {
            setVideoAbortController(undefined);
        }
    };

    const submitForReview = async () => {
        if (!selected || !canSubmit) return;
        setSubmitting(true);
        try {
            await contentApi.submitForReview(selected.id);
            await loadContents(selected.id);
            message.success('作品已提交审核');
        } catch (error) {
            message.error(getApiErrorMessage(error, '提交审核失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const logout = async () => {
        await authApi.logout();
        navigate('/login');
    };

    return (
        <Layout className="studio-shell">
            <Sider width={152} className="studio-nav">
                <div className="studio-logo">
                    <VideoCameraOutlined/>
                    <span>制片厂工作台</span>
                </div>
                <nav className="studio-nav-list" aria-label="工作台导航">
                    <button type="button"><HomeOutlined/>工作台</button>
                    <button type="button" className="is-active"><FolderOpenOutlined/>作品管理</button>
                    <button type="button"><CloudUploadOutlined/>上传任务</button>
                </nav>
                <div className="studio-nav-bottom">
                    <button type="button" onClick={() => navigate('/profile')}>
                        <SettingOutlined/>账号设置
                    </button>
                    <button type="button" onClick={logout}>
                        <LogoutOutlined/>退出登录
                    </button>
                </div>
            </Sider>

            <aside className="works-rail">
                <div className="works-rail-header">
                    <div>
                        <Text className="rail-kicker">作品管理</Text>
                        <Title level={4}>全部作品 <span>{contents.length}</span></Title>
                    </div>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={() => setCreateOpen(true)}>
                        新建作品
                    </Button>
                </div>
                <div className="works-list">
                    {contents.map((content) => (
                        <button
                            type="button"
                            key={content.id}
                            className={`work-item ${content.id === selectedContentId ? 'is-selected' : ''}`}
                            onClick={() => setSelectedContentId(content.id)}
                        >
                            <div className="work-cover">
                                {content.coverUrl
                                    ? <img src={content.coverUrl} alt=""/>
                                    : <FileImageOutlined/>}
                            </div>
                            <div className="work-copy">
                                <strong>{content.title}</strong>
                                <span>{typeOptions.find((item) => item.value === content.type)?.label}</span>
                                <small className={`status-${content.status.toLowerCase()}`}>
                                    {statusLabels[content.status] || content.status}
                                </small>
                            </div>
                        </button>
                    ))}
                    {!loading && contents.length === 0 && (
                        <Empty description="还没有作品" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                    )}
                </div>
            </aside>

            <Layout className="studio-main">
                <Spin spinning={loading} fullscreen/>
                {selected ? (
                    <>
                        <header className="project-header">
                            <div>
                                <Text className="project-breadcrumb">作品管理 / {selected.title}</Text>
                                <div className="project-title-row">
                                    <Title level={2}>{selected.title}</Title>
                                    <Tag>{typeOptions.find((item) => item.value === selected.type)?.label}</Tag>
                                    <Tag color={selected.status === 'PENDING' ? 'processing' : 'gold'}>
                                        {statusLabels[selected.status] || selected.status}
                                    </Tag>
                                </div>
                            </div>
                            <div className="project-actions">
                                <Button onClick={() => setActiveTab('basic')}>保存草稿</Button>
                                <Tooltip title={canSubmit ? '' : '请先完成全部发布检查'}>
                                    <Button
                                        type="primary"
                                        disabled={!canSubmit}
                                        loading={submitting}
                                        onClick={submitForReview}
                                    >
                                        提交审核
                                    </Button>
                                </Tooltip>
                            </div>
                        </header>

                        <Tabs
                            className="studio-tabs"
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={[
                                {
                                    key: 'basic',
                                    label: '基本信息',
                                    children: (
                                        <BasicInfoPanel
                                            selected={selected}
                                            form={metadataForm}
                                            coverProgress={coverProgress}
                                            saving={metadataSaving}
                                            onSave={saveMetadata}
                                            onUploadCover={uploadCover}
                                        />
                                    ),
                                },
                                {
                                    key: 'media',
                                    label: '视频与剧集',
                                    children: (
                                        <PageContent className="media-workspace">
                                            <div className="preview-panel">
                                                {selectedEpisode ? (
                                                    <video
                                                        key={selectedEpisode.videoUrl}
                                                        controls
                                                        src={selectedEpisode.videoUrl}
                                                        poster={selected.coverUrl}
                                                        onPlay={() => setPreviewedContentIds((current) => {
                                                            const next = new Set(current);
                                                            next.add(selected.id);
                                                            return next;
                                                        })}
                                                    />
                                                ) : (
                                                    <div className="preview-empty">
                                                        <PlayCircleOutlined/>
                                                        <strong>还没有可预览的视频</strong>
                                                        <span>上传正片或剧集后可在这里检查播放效果</span>
                                                        <Button type="primary" icon={<UploadOutlined/>} onClick={openEpisodeEditor}>
                                                            上传视频
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <section className="publish-checks">
                                                <Title level={4}>发布检查</Title>
                                                {publishChecks.map((check) => (
                                                    <div className="check-row" key={check.key}>
                                                        {check.complete
                                                            ? <CheckCircleFilled className="check-complete"/>
                                                            : <WarningFilled className="check-warning"/>}
                                                        <div>
                                                            <strong>{check.label}</strong>
                                                            <span>{check.detail}</span>
                                                        </div>
                                                        <small>{check.complete ? '已完成' : '待完善'}</small>
                                                    </div>
                                                ))}
                                            </section>
                                            <section className="episode-library">
                                                <div className="episode-toolbar">
                                                    <div>
                                                        <Title level={4}>
                                                            {selected.type === 'MOVIE' ? '正片文件' : '季度与剧集'}
                                                        </Title>
                                                        <Text>{episodeRows.length} 个视频文件</Text>
                                                    </div>
                                                    <div>
                                                        {selected.type !== 'MOVIE' && (
                                                            <Button onClick={() => setSeasonOpen(true)}>添加季度</Button>
                                                        )}
                                                        <Button type="primary" icon={<PlusOutlined/>} onClick={openEpisodeEditor}>
                                                            {selected.type === 'MOVIE' ? '上传正片' : '添加剧集'}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="episode-table" role="table" aria-label="视频文件列表">
                                                    <div className="episode-table-head" role="row">
                                                        <span>集数</span>
                                                        <span>剧集标题</span>
                                                        <span>本地视频文件</span>
                                                        <span>时长</span>
                                                        <span>上传状态</span>
                                                        <span>操作</span>
                                                    </div>
                                                    {episodeRows.map((episode) => (
                                                        <div
                                                            className={`episode-row ${episode.id === selectedEpisode?.id ? 'is-active' : ''}`}
                                                            role="row"
                                                            key={episode.id}
                                                        >
                                                            <span>{String(episode.episodeNumber).padStart(2, '0')}</span>
                                                            <button type="button" onClick={() => setSelectedEpisodeId(episode.id)}>
                                                                {episode.title}
                                                            </button>
                                                            <span>
                                                                <strong>{episode.originalFileName || '已上传视频'}</strong>
                                                                <small>{formatFileSize(episode.fileSize)}</small>
                                                            </span>
                                                            <span>{formatDuration(episode.durationSeconds)}</span>
                                                            <span className="upload-complete">
                                                                <CheckCircleFilled/> 已完成
                                                            </span>
                                                            <span>
                                                                <Button type="link" onClick={() => setSelectedEpisodeId(episode.id)}>预览</Button>
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {episodeRows.length === 0 && (
                                                        <div className="episode-table-empty">
                                                            暂无视频，点击“{selected.type === 'MOVIE' ? '上传正片' : '添加剧集'}”开始。
                                                        </div>
                                                    )}
                                                </div>
                                            </section>
                                        </PageContent>
                                    ),
                                },
                                {
                                    key: 'publish',
                                    label: '预览发布',
                                    children: (
                                        <div className="publish-summary">
                                            <Title level={3}>提交前检查</Title>
                                            <Text>完成全部检查后，即可将作品提交给审核人员。</Text>
                                            {publishChecks.map((check) => (
                                                <div key={check.key}>
                                                    {check.complete ? <CheckCircleFilled/> : <WarningFilled/>}
                                                    <span>{check.label}</span>
                                                    <small>{check.detail}</small>
                                                </div>
                                            ))}
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </>
                ) : (
                    <div className="studio-empty">
                        <VideoCameraOutlined/>
                        <Title level={3}>创建第一部作品</Title>
                        <Text>建立作品资料后，即可上传封面、正片或季度剧集。</Text>
                        <Button type="primary" icon={<PlusOutlined/>} onClick={() => setCreateOpen(true)}>
                            新建作品
                        </Button>
                    </div>
                )}
            </Layout>

            <Modal
                title="新建作品"
                open={createOpen}
                okText="创建作品"
                cancelText="取消"
                onOk={() => createForm.submit()}
                onCancel={() => setCreateOpen(false)}
            >
                <Form form={createForm} layout="vertical" onFinish={createContent}>
                    <Form.Item name="title" label="作品名称" rules={[{required: true, message: '请输入作品名称'}]}>
                        <Input placeholder="例如：山海之旅"/>
                    </Form.Item>
                    <div className="modal-form-grid">
                        <Form.Item name="type" label="类型" rules={[{required: true}]}>
                            <Select options={typeOptions}/>
                        </Form.Item>
                        <Form.Item name="genre" label="题材" rules={[{required: true}]}>
                            <Select options={genreOptions}/>
                        </Form.Item>
                    </div>
                    <Form.Item name="description" label="简介">
                        <Input.TextArea rows={4} maxLength={1000} showCount/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="添加季度"
                open={seasonOpen}
                okText="添加季度"
                cancelText="取消"
                onOk={() => seasonForm.submit()}
                onCancel={() => setSeasonOpen(false)}
            >
                <Form form={seasonForm} layout="vertical" onFinish={addSeason}>
                    <Form.Item name="seasonNumber" label="季度编号" rules={[{required: true}]}>
                        <InputNumber min={1} style={{width: '100%'}}/>
                    </Form.Item>
                    <Form.Item name="title" label="季度名称" rules={[{required: true}]}>
                        <Input placeholder="例如：第一季"/>
                    </Form.Item>
                </Form>
            </Modal>

            <Drawer
                title={selected?.type === 'MOVIE' ? '上传正片' : '添加剧集'}
                width={420}
                open={episodeOpen}
                destroyOnClose
                onClose={() => {
                    videoAbortController?.abort();
                    setEpisodeOpen(false);
                }}
                extra={<Button type="text" icon={<ReloadOutlined/>} onClick={() => setVideoFile(undefined)}/>}
                footer={(
                    <div className="drawer-footer">
                        <Button onClick={() => setEpisodeOpen(false)}>取消</Button>
                        {videoUpload.status === 'uploading' ? (
                            <Button danger onClick={() => videoAbortController?.abort()}>取消上传</Button>
                        ) : (
                            <Button type="primary" onClick={() => episodeForm.submit()}>
                                上传并保存
                            </Button>
                        )}
                    </div>
                )}
            >
                <Form form={episodeForm} layout="vertical" onFinish={uploadAndCreateEpisode}>
                    {selected?.type !== 'MOVIE' && (
                        <Form.Item name="seasonId" label="所属季度" rules={[{required: true, message: '请选择季度'}]}>
                            <Select
                                placeholder={selected?.seasons.length ? '请选择季度' : '请先创建季度'}
                                options={selected?.seasons.map((season) => ({
                                    label: `第 ${season.seasonNumber} 季 · ${season.title}`,
                                    value: season.id,
                                }))}
                                disabled={!selected?.seasons.length}
                            />
                        </Form.Item>
                    )}
                    <div className="drawer-form-grid">
                        <Form.Item name="episodeNumber" label="集数" rules={[{required: true}]}>
                            <InputNumber min={1} style={{width: '100%'}}/>
                        </Form.Item>
                        <Form.Item name="durationSeconds" label="时长（秒）" rules={[{required: true}]}>
                            <InputNumber min={1} style={{width: '100%'}}/>
                        </Form.Item>
                    </div>
                    <Form.Item name="title" label="剧集标题" rules={[{required: true, message: '请输入标题'}]}>
                        <Input maxLength={200} showCount/>
                    </Form.Item>
                    <Form.Item label="视频文件" required>
                        <Dragger
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                            maxCount={1}
                            beforeUpload={chooseVideo}
                            fileList={videoFile ? [{
                                uid: videoFile.name,
                                name: videoFile.name,
                                size: videoFile.size,
                                type: videoFile.type,
                                status: 'done',
                            }] : []}
                            onRemove={() => {
                                setVideoFile(undefined);
                                setVideoUpload({status: 'idle', progress: 0});
                            }}
                        >
                            <p className="ant-upload-drag-icon"><CloudUploadOutlined/></p>
                            <p className="ant-upload-text">点击或拖拽视频到此处</p>
                            <p className="ant-upload-hint">支持 MP4、WebM、MOV，单个文件不超过 2 GB</p>
                        </Dragger>
                    </Form.Item>
                    {videoUpload.status !== 'idle' && (
                        <div className={`video-upload-progress is-${videoUpload.status}`}>
                            <div>
                                <strong>{videoUpload.status === 'error' ? '上传失败' : '正在上传视频'}</strong>
                                <span>{videoUpload.message || videoFile?.name}</span>
                            </div>
                            <Progress
                                percent={videoUpload.progress}
                                status={videoUpload.status === 'error' ? 'exception' : 'active'}
                            />
                        </div>
                    )}
                </Form>
            </Drawer>
        </Layout>
    );
}

function BasicInfoPanel({
    selected,
    form,
    coverProgress,
    saving,
    onSave,
    onUploadCover,
}: {
    selected: Content;
    form: ReturnType<typeof Form.useForm>[0];
    coverProgress: number;
    saving: boolean;
    onSave: (values: {title: string; description?: string; genre: VideoGenre}) => Promise<void>;
    onUploadCover: (file: File) => Promise<void>;
}) {
    return (
        <div className="basic-info-panel">
            <section>
                <Title level={3}>作品资料</Title>
                <Text>完善名称、题材和简介，信息会用于公开首页和审核。</Text>
                <Form form={form} layout="vertical" onFinish={onSave}>
                    <Form.Item name="title" label="作品名称" rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item label="类型">
                        <Input value={typeOptions.find((item) => item.value === selected.type)?.label} disabled/>
                    </Form.Item>
                    <Form.Item name="genre" label="题材" rules={[{required: true}]}>
                        <Select options={genreOptions}/>
                    </Form.Item>
                    <Form.Item name="description" label="简介" rules={[{required: true, message: '请输入作品简介'}]}>
                        <Input.TextArea rows={6} maxLength={1000} showCount/>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={saving}>保存资料</Button>
                </Form>
            </section>
            <section className="cover-editor">
                <Title level={4}>作品封面</Title>
                <div className="cover-preview">
                    {selected.coverUrl
                        ? <img src={selected.coverUrl} alt={`${selected.title}封面`}/>
                        : <FileImageOutlined/>}
                </div>
                <Upload
                    accept="image/jpeg,image/png,image/webp"
                    showUploadList={false}
                    customRequest={({file, onSuccess, onError}) => {
                        void onUploadCover(file as File)
                            .then(() => onSuccess?.({}))
                            .catch(onError);
                    }}
                >
                    <Button icon={<UploadOutlined/>}>上传封面</Button>
                </Upload>
                <Text>支持 JPG、PNG、WebP，建议使用 16:9 横版图片。</Text>
                {coverProgress > 0 && <Progress percent={coverProgress} size="small"/>}
            </section>
        </div>
    );
}

function readVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            resolve(video.duration);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('无法读取视频时长'));
        };
        video.src = url;
    });
}

export default StudioWorkspace;
