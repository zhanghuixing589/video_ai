import {useEffect, useState} from 'react';
import {Alert, Button, Card, Form, Input, Layout, Result, Spin, Typography, message} from 'antd';
import {useNavigate} from 'react-router-dom';
import {authApi, getApiErrorMessage, userApi} from '../services/api';
import type {StudioApplicationRequest, UserInfo} from '../type/api';
import './StudioApplication.css';

const {Content} = Layout;
const {Title, Paragraph} = Typography;

function StudioApplication() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        authApi.me()
            .then((current) => {
                if (current.role !== 'STUDIO') {
                    navigate('/', {replace: true});
                    return;
                }
                localStorage.setItem('user', JSON.stringify(current));
                setUser(current);
            })
            .catch(() => navigate('/login', {replace: true}))
            .finally(() => setLoading(false));
    }, [navigate]);

    const submit = async (values: StudioApplicationRequest) => {
        setSubmitting(true);
        try {
            await userApi.applyStudio(values);
            const current = await authApi.me();
            localStorage.setItem('user', JSON.stringify(current));
            setUser(current);
            message.success('申请已提交，请等待管理员审核');
        } catch (error) {
            message.error(getApiErrorMessage(error, '申请提交失败'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Spin fullscreen/>;

    return (
        <Layout className="studio-application-shell">
            <Content className="studio-application-content">
                <Button type="link" onClick={() => navigate('/')}>返回首页</Button>
                {user?.studioStatus === 'PENDING' ? (
                    <Result
                        status="info"
                        title="制片厂申请正在审核"
                        subTitle="审核通过后即可创建作品、季度和剧集。"
                    />
                ) : user?.studioStatus === 'APPROVED' ? (
                    <Result
                        status="success"
                        title="制片厂认证已通过"
                        extra={<Button type="primary" onClick={() => navigate('/studio')}>进入工作台</Button>}
                    />
                ) : (
                    <Card className="studio-application-card">
                        <Title level={2}>制片厂认证申请</Title>
                        <Paragraph>可以在准备好资料后再提交。审核通过前，账号仍可浏览公开内容。</Paragraph>
                        {user?.studioStatus === 'REJECTED' && (
                            <Alert
                                type="warning"
                                showIcon
                                message="上次申请未通过"
                                description="请修改资料后重新提交。"
                            />
                        )}
                        <Form layout="vertical" onFinish={submit} className="studio-application-form">
                            <Form.Item
                                name="studioName"
                                label="制片厂名称"
                                rules={[{required: true, message: '请输入制片厂名称'}]}
                            >
                                <Input maxLength={128}/>
                            </Form.Item>
                            <Form.Item name="studioDescription" label="制片厂简介">
                                <Input.TextArea rows={5} maxLength={1000} showCount/>
                            </Form.Item>
                            <Button type="primary" htmlType="submit" loading={submitting}>提交审核</Button>
                        </Form>
                    </Card>
                )}
            </Content>
        </Layout>
    );
}

export default StudioApplication;
