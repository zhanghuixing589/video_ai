import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Button,
    Card,
    Descriptions,
    Empty,
    Form,
    Input,
    Layout,
    Modal,
    Space,
    Spin,
    Table,
    Tabs,
    Tag,
    Typography,
    Upload,
    message,
} from 'antd';
import {
    EditOutlined,
    HistoryOutlined,
    LockOutlined,
    LogoutOutlined,
    SafetyOutlined,
    UploadOutlined,
    UserOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, contentApi, getApiErrorMessage, userApi } from '../services/api';
import { clearAuthSession, storeAuthenticatedUser } from '../services/authSession';
import type { Content, PasswordUpdateRequest, ProfileUpdateRequest, Role, UserRecord } from '../type/api';
import { getProfileTabKeys, validateAvatarFile } from './userProfileModel';
import '../styles/global.css';
import './UserProfile.css';

const { Header, Content: PageContent } = Layout;
const { Title, Text, Paragraph } = Typography;

const roleLabels: Record<Role, string> = {
    USER: '普通用户',
    STUDIO: '制片厂',
    REVIEWER: '审核员',
    ADMIN: '管理员',
};

const typeLabels: Record<string, string> = {
    MOVIE: '电影',
    TV_SERIES: '电视剧',
    VARIETY: '综艺',
};

const statusLabels: Record<string, string> = {
    DRAFT: '草稿',
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    PUBLISHED: '已发布',
    BANNED: '已下架',
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

function UserProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserRecord | null>(null);
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [profileForm] = Form.useForm<ProfileUpdateRequest>();
    const [passwordForm] = Form.useForm<PasswordUpdateRequest>();

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const current = await userApi.profile();
                if (!active) return;
                setProfile(current);
                storeAuthenticatedUser(sessionStorage, current);
                if (current.role === 'STUDIO' && current.studioStatus === 'APPROVED') {
                    const studioContents = await contentApi.listMine();
                    if (active) setContents(studioContents);
                }
            } catch (error) {
                setLoadFailed(true);
                message.error(getApiErrorMessage(error, '加载个人资料失败'));
            } finally {
                if (active) setLoading(false);
            }
        };
        void load();
        return () => {
            active = false;
        };
    }, []);

    const updateCachedProfile = (updated: UserRecord) => {
        setProfile(updated);
        storeAuthenticatedUser(sessionStorage, updated);
    };

    const openProfileModal = () => {
        if (!profile) return;
        profileForm.setFieldsValue({ displayName: profile.displayName, email: profile.email });
        setProfileModalOpen(true);
    };

    const saveProfile = async (values: ProfileUpdateRequest) => {
        setSavingProfile(true);
        try {
            const updated = await userApi.updateProfile(values);
            updateCachedProfile(updated);
            setProfileModalOpen(false);
            message.success('个人资料已更新');
        } catch (error) {
            message.error(getApiErrorMessage(error, '更新个人资料失败'));
        } finally {
            setSavingProfile(false);
        }
    };

    const uploadAvatar = async (file: File) => {
        const validationMessage = validateAvatarFile(file);
        if (validationMessage) {
            message.error(validationMessage);
            return;
        }
        setUploadingAvatar(true);
        try {
            const updated = await userApi.uploadAvatar(file);
            updateCachedProfile(updated);
            message.success('头像已更新');
        } catch (error) {
            message.error(getApiErrorMessage(error, '头像上传失败'));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const savePassword = async (values: PasswordUpdateRequest) => {
        setSavingPassword(true);
        try {
            await userApi.updatePassword(values);
            clearAuthSession(sessionStorage);
            message.success('密码已修改，请重新登录');
            navigate('/login', { replace: true });
        } catch (error) {
            message.error(getApiErrorMessage(error, '修改密码失败'));
        } finally {
            setSavingPassword(false);
        }
    };

    const logout = async () => {
        await authApi.logout();
        navigate('/login', { replace: true });
    };

    // 获取头像完整URL
    const getAvatarUrl = () => {
        if (!profile?.avatarUrl) return undefined;
        if (profile.avatarUrl.startsWith('http')) {
            return profile.avatarUrl;
        }
        return `/api${profile.avatarUrl}`;
    };

    const tabs = useMemo(() => {
        if (!profile) return [];
        return getProfileTabKeys(profile.role).map((key) => {
            if (key === 'profile') {
                return {
                    key,
                    label: <span><UserOutlined /> 个人信息</span>,
                    children: (
                        <Card className="profile-panel dark-card" title="基本信息">
                            <Descriptions bordered column={1} styles={{ label: { width: 160 } }}>
                                <Descriptions.Item label="用户名">{profile.username}</Descriptions.Item>
                                <Descriptions.Item label="显示名称">{profile.displayName}</Descriptions.Item>
                                <Descriptions.Item label="邮箱">{profile.email}</Descriptions.Item>
                                <Descriptions.Item label="角色">
                                    <Tag color="blue">{roleLabels[profile.role]}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                            <div className="profile-actions">
                                <Button type="primary" icon={<EditOutlined />} onClick={openProfileModal}>
                                    编辑资料
                                </Button>
                                <Button icon={<LockOutlined />} onClick={() => setPasswordModalOpen(true)}>
                                    修改密码
                                </Button>
                            </div>
                        </Card>
                    ),
                };
            }
            if (key === 'videos') {
                return {
                    key,
                    label: <span><VideoCameraOutlined /> 我的视频 ({contents.length})</span>,
                    children: (
                        <Card className="profile-panel dark-card" title="我的作品">
                            <Table
                                className="dark-table"
                                rowKey="id"
                                dataSource={contents}
                                locale={{ emptyText: <Empty description="还没有创建作品" /> }}
                                pagination={contents.length > 8 ? { pageSize: 8 } : false}
                                columns={[
                                    { title: '片名', dataIndex: 'title' },
                                    {
                                        title: '类型',
                                        dataIndex: 'type',
                                        render: (value: string) => typeLabels[value] ?? value,
                                    },
                                    {
                                        title: '状态',
                                        dataIndex: 'status',
                                        render: (value: string) => <Tag>{statusLabels[value] ?? value}</Tag>,
                                    },
                                ]}
                            />
                        </Card>
                    ),
                };
            }
            if (key === 'history') {
                return {
                    key,
                    label: <span><HistoryOutlined /> 浏览痕迹</span>,
                    children: (
                        <Card className="profile-panel dark-card">
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="浏览痕迹功能正在建设中"
                            >
                                <Text style={{ color: 'var(--foreground-muted)' }}>
                                    后续将在这里展示观看历史、收藏和点赞记录。
                                </Text>
                            </Empty>
                        </Card>
                    ),
                };
            }
            return {
                key,
                label: <span><SafetyOutlined /> 安全设置</span>,
                children: (
                    <Card className="profile-panel dark-card" title="账号安全">
                        <Paragraph style={{ color: 'var(--foreground-muted)' }}>
                            定期修改密码有助于保护账号安全。修改成功后需要重新登录。
                        </Paragraph>
                        <Space wrap>
                            <Button type="primary" icon={<LockOutlined />} onClick={() => setPasswordModalOpen(true)}>
                                修改密码
                            </Button>
                            <Button danger icon={<LogoutOutlined />} onClick={() => void logout()}>
                                退出登录
                            </Button>
                        </Space>
                    </Card>
                ),
            };
        });
    }, [contents, profile]);

    if (loading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    if (loadFailed || !profile) {
        return (
            <div className="loading-container">
                <Empty description="个人资料加载失败">
                    <Button type="primary" onClick={() => window.location.reload()}>
                        重新加载
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <>
            <LinearBackground />
            <Layout className="profile-shell">
                <Header className="profile-header">
                    <div className="header-brand">
                        <div className="brand-icon">
                            <VideoCameraOutlined />
                        </div>
                        <div>
                            <Title level={4} className="brand-title">Video Platform</Title>
                            <Text className="brand-subtitle">个人中心</Text>
                        </div>
                    </div>
                    <Space>
                        <Button className="dark-nav-btn" onClick={() => navigate('/')}>
                            返回首页
                        </Button>
                        <Button className="dark-nav-btn" icon={<LogoutOutlined />} onClick={() => void logout()}>
                            退出
                        </Button>
                    </Space>
                </Header>
                <PageContent className="profile-content">
                    <section className="profile-avatar-section">
                        <Avatar size={104} src={getAvatarUrl()} icon={<UserOutlined />} />
                        <Upload
                            accept="image/jpeg,image/png,image/webp"
                            showUploadList={false}
                            beforeUpload={(file) => {
                                void uploadAvatar(file);
                                return false;
                            }}
                        >
                            <Button
                                className="avatar-upload-button"
                                size="small"
                                icon={<UploadOutlined />}
                                loading={uploadingAvatar}
                            >
                                更换头像
                            </Button>
                        </Upload>
                        <Title level={2} className="profile-name">
                            {profile.displayName || profile.username}
                        </Title>
                        <Tag color="blue">{roleLabels[profile.role]}</Tag>
                    </section>
                    <Tabs className="profile-tabs" items={tabs} />
                </PageContent>

                {/* 编辑资料模态框 */}
                <Modal
                    className="dark-modal"
                    title="编辑资料"
                    open={profileModalOpen}
                    onCancel={() => setProfileModalOpen(false)}
                    footer={null}
                    destroyOnHidden
                    forceRender
                >
                    <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
                        <Form.Item
                            name="displayName"
                            label="显示名称"
                            rules={[
                                { required: true, message: '请输入显示名称' },
                                { min: 2, max: 50, message: '显示名称长度为 2 至 50 个字符' },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="邮箱"
                            rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '邮箱格式不正确' },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                        <div className="modal-actions">
                            <Button onClick={() => setProfileModalOpen(false)}>取消</Button>
                            <Button type="primary" htmlType="submit" loading={savingProfile}>
                                保存
                            </Button>
                        </div>
                    </Form>
                </Modal>

                {/* 修改密码模态框 */}
                <Modal
                    className="dark-modal"
                    title="修改密码"
                    open={passwordModalOpen}
                    onCancel={() => setPasswordModalOpen(false)}
                    footer={null}
                    destroyOnHidden
                    forceRender
                >
                    <Form form={passwordForm} layout="vertical" onFinish={savePassword}>
                        <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
                            <Input.Password autoComplete="current-password" />
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label="新密码"
                            rules={[
                                { required: true },
                                { min: 6, max: 128, message: '密码长度为 6 至 128 个字符' },
                            ]}
                        >
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="确认新密码"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                        return Promise.reject(new Error('两次输入的新密码不一致'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <div className="modal-actions">
                            <Button onClick={() => setPasswordModalOpen(false)}>取消</Button>
                            <Button type="primary" htmlType="submit" loading={savingPassword}>
                                确认修改
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </Layout>
        </>
    );
}

export default UserProfile;