import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Layout, Result, Space, Spin, Typography, message } from 'antd';
import { VideoCameraOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage, userApi } from '../services/api';
import type { StudioApplicationRequest, UserInfo } from '../type/api';
import '../styles/global.css';
import './StudioApplication.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

// 背景组件
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

function StudioApplication() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        authApi.me()
            .then((current) => {
                if (current.role !== 'STUDIO') {
                    navigate('/', { replace: true });
                    return;
                }
                sessionStorage.setItem('user', JSON.stringify(current));
                setUser(current);
            })
            .catch(() => navigate('/login', { replace: true }))
            .finally(() => setLoading(false));
    }, [navigate]);

    const submit = async (values: StudioApplicationRequest) => {
        setSubmitting(true);
        try {
            await userApi.applyStudio(values);
            const current = await authApi.me();
            sessionStorage.setItem('user', JSON.stringify(current));
            setUser(current);
            message.success('申请已提交，请等待管理员审核');
        } catch (error) {
            message.error(getApiErrorMessage(error, '申请提交失败'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spin fullscreen />;

    return (
        <>
            <LinearBackground />
            <Layout className="studio-application-shell">
                <Content className="studio-application-content">
                    <Space>
                        <Button className="dark-nav-link" icon={<HomeOutlined />} onClick={() => navigate('/')}>
                            返回首页
                        </Button>
                        <Button className="dark-nav-link" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
                            个人中心
                        </Button>
                    </Space>
                    {user?.studioStatus === 'PENDING' ? (
                        <Card className="studio-application-card">
                            <Result
                                status="info"
                                icon={<VideoCameraOutlined />}
                                title="制片厂申请正在审核"
                                subTitle="审核通过后即可创建作品、季度和剧集。"
                            />
                        </Card>
                    ) : user?.studioStatus === 'APPROVED' ? (
                        <Card className="studio-application-card">
                            <Result
                                status="success"
                                title="制片厂认证已通过"
                                extra={
                                    <Button type="primary" onClick={() => navigate('/studio')}>
                                        进入工作台
                                    </Button>
                                }
                            />
                        </Card>
                    ) : (
                        <Card className="studio-application-card">
                            <Title level={2} style={{ color: 'var(--foreground)', marginBottom: 8 }}>
                                制片厂认证申请
                            </Title>
                            <Paragraph style={{ color: 'var(--foreground-muted)' }}>
                                可以在准备好资料后再提交。审核通过前，账号仍可浏览公开内容。
                            </Paragraph>
                            {user?.studioStatus === 'REJECTED' && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message="上次申请未通过"
                                    description="请修改资料后重新提交。"
                                    style={{ marginBottom: 24 }}
                                />
                            )}
                            <Form layout="vertical" onFinish={submit} className="studio-application-form">
                                <Form.Item
                                    name="studioName"
                                    label="制片厂名称"
                                    rules={[{ required: true, message: '请输入制片厂名称' }]}
                                >
                                    <Input placeholder="例如：XX影业" maxLength={128} />
                                </Form.Item>
                                <Form.Item name="studioDescription" label="制片厂简介">
                                    <Input.TextArea
                                        rows={5}
                                        maxLength={1000}
                                        showCount
                                        placeholder="介绍您的制片厂背景、作品方向等..."
                                    />
                                </Form.Item>
                                <Button type="primary" htmlType="submit" loading={submitting} block>
                                    提交审核
                                </Button>
                            </Form>
                        </Card>
                    )}
                </Content>
            </Layout>
        </>
    );
}

export default StudioApplication;