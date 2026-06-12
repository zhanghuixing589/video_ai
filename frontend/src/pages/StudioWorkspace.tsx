import {useCallback, useEffect, useState} from 'react';
import {Button, Card, Form, Input, InputNumber, Layout, Select, Space, Table, Tabs, Tag, Typography, message} from 'antd';
import {LogoutOutlined, PlusOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {authApi, contentApi, getApiErrorMessage} from '../services/api';
import type {Content} from '../type/api';
import './Dashboard.css';

const {Header, Content: PageContent} = Layout;
const {Title, Text} = Typography;

const typeOptions = [
    {label: '电影', value: 'MOVIE'},
    {label: '电视剧', value: 'TV_SERIES'},
    {label: '综艺', value: 'VARIETY'},
];

const genreOptions = ['ACTION', 'ROMANCE', 'COMEDY', 'SUSPENSE', 'SCI_FI', 'DOCUMENTARY',
    'ANIMATION', 'FAMILY', 'REALITY', 'OTHER'].map((value) => ({label: value, value}));

function StudioWorkspace() {
    const navigate = useNavigate();
    const [contents, setContents] = useState<Content[]>([]);
    const [selectedContentId, setSelectedContentId] = useState<number>();
    const [contentForm] = Form.useForm();
    const [seasonForm] = Form.useForm();
    const [episodeForm] = Form.useForm();

    const loadContents = useCallback(async () => {
        try {
            const result = await contentApi.listMine();
            setContents(result);
            setSelectedContentId((current) => current ?? result[0]?.id);
        } catch (error) {
            message.error(getApiErrorMessage(error, '加载作品失败'));
        }
    }, []);

    useEffect(() => {
        void loadContents();
    }, [loadContents]);

    const createContent = async (values: {
        title: string; description?: string; coverUrl?: string; type: string; genre: string;
    }) => {
        try {
            const created = await contentApi.create(values);
            contentForm.resetFields();
            setSelectedContentId(created.id);
            await loadContents();
            message.success('作品已创建，可以继续添加季度和剧集');
        } catch (error) {
            message.error(getApiErrorMessage(error, '创建作品失败'));
        }
    };

    const addSeason = async (values: {seasonNumber: number; title: string; sortOrder?: number}) => {
        if (!selectedContentId) return;
        try {
            await contentApi.addSeason(selectedContentId, values);
            seasonForm.resetFields();
            await loadContents();
            message.success('季度已添加');
        } catch (error) {
            message.error(getApiErrorMessage(error, '添加季度失败'));
        }
    };

    const addEpisode = async (values: {
        seasonId?: number; episodeNumber: number; title: string; videoUrl: string; durationSeconds: number;
    }) => {
        if (!selectedContentId) return;
        try {
            await contentApi.addEpisode(selectedContentId, values);
            episodeForm.resetFields();
            await loadContents();
            message.success('剧集已添加，游客默认可试看前五分钟');
        } catch (error) {
            message.error(getApiErrorMessage(error, '添加剧集失败'));
        }
    };

    const selected = contents.find((content) => content.id === selectedContentId);
    const seasonOptions = selected?.seasons.map((season) => ({
        label: `第 ${season.seasonNumber} 季 ${season.title}`,
        value: season.id,
    })) || [];

    const logout = () => {
        authApi.logout();
        navigate('/login');
    };

    return (
        <Layout className="dashboard-shell">
            <Header className="dashboard-header">
                <div>
                    <Title level={4} className="brand-title">制片厂工作台</Title>
                    <Text className="brand-subtitle">按作品、季度和剧集管理片库</Text>
                </div>
                <Space>
                    <Button onClick={() => navigate('/')}>公开首页</Button>
                    <Button icon={<LogoutOutlined/>} onClick={logout}>退出</Button>
                </Space>
            </Header>
            <PageContent className="dashboard-content">
                <Tabs items={[
                    {
                        key: 'content',
                        label: '作品',
                        children: (
                            <Space direction="vertical" size={20} className="page-stack">
                                <Card title="创建作品" extra={<PlusOutlined/>}>
                                    <Form form={contentForm} layout="vertical" onFinish={createContent}>
                                        <div className="form-grid">
                                            <Form.Item name="title" label="作品名称" rules={[{required: true}]}>
                                                <Input/>
                                            </Form.Item>
                                            <Form.Item name="type" label="类型" rules={[{required: true}]}>
                                                <Select options={typeOptions}/>
                                            </Form.Item>
                                            <Form.Item name="genre" label="题材" rules={[{required: true}]}>
                                                <Select options={genreOptions}/>
                                            </Form.Item>
                                            <Form.Item name="coverUrl" label="封面 URL">
                                                <Input/>
                                            </Form.Item>
                                        </div>
                                        <Form.Item name="description" label="简介"><Input.TextArea rows={3}/></Form.Item>
                                        <Button type="primary" htmlType="submit">创建作品</Button>
                                    </Form>
                                </Card>
                                <Card title="我的作品">
                                    <Table
                                        rowKey="id"
                                        pagination={false}
                                        dataSource={contents}
                                        rowSelection={{
                                            type: 'radio',
                                            selectedRowKeys: selectedContentId ? [selectedContentId] : [],
                                            onChange: (keys) => setSelectedContentId(Number(keys[0])),
                                        }}
                                        columns={[
                                            {title: '名称', dataIndex: 'title'},
                                            {title: '类型', dataIndex: 'type'},
                                            {title: '状态', dataIndex: 'status', render: (value) => <Tag>{value}</Tag>},
                                        ]}
                                    />
                                </Card>
                            </Space>
                        ),
                    },
                    {
                        key: 'episodes',
                        label: '季度与剧集',
                        disabled: !selected,
                        children: selected && (
                            <Space direction="vertical" size={20} className="page-stack">
                                <Card title={`当前作品：${selected.title}`}>
                                    <Text>电影直接添加剧集；电视剧和综艺请先添加季度。</Text>
                                </Card>
                                {selected.type !== 'MOVIE' && (
                                    <Card title="添加季度">
                                        <Form form={seasonForm} layout="inline" onFinish={addSeason}>
                                            <Form.Item name="seasonNumber" rules={[{required: true}]}>
                                                <InputNumber min={1} placeholder="季号"/>
                                            </Form.Item>
                                            <Form.Item name="title" rules={[{required: true}]}>
                                                <Input placeholder="季度标题"/>
                                            </Form.Item>
                                            <Button type="primary" htmlType="submit">添加季度</Button>
                                        </Form>
                                    </Card>
                                )}
                                <Card title="添加剧集">
                                    <Form form={episodeForm} layout="vertical" onFinish={addEpisode}>
                                        <div className="form-grid">
                                            {selected.type !== 'MOVIE' && (
                                                <Form.Item name="seasonId" label="所属季度" rules={[{required: true}]}>
                                                    <Select options={seasonOptions}/>
                                                </Form.Item>
                                            )}
                                            <Form.Item name="episodeNumber" label="集数" rules={[{required: true}]}>
                                                <InputNumber min={1}/>
                                            </Form.Item>
                                            <Form.Item name="title" label="标题" rules={[{required: true}]}>
                                                <Input/>
                                            </Form.Item>
                                            <Form.Item name="durationSeconds" label="时长（秒）" rules={[{required: true}]}>
                                                <InputNumber min={1}/>
                                            </Form.Item>
                                        </div>
                                        <Form.Item name="videoUrl" label="视频 URL" rules={[{required: true}]}>
                                            <Input/>
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit">添加剧集</Button>
                                    </Form>
                                </Card>
                            </Space>
                        ),
                    },
                ]}/>
            </PageContent>
        </Layout>
    );
}

export default StudioWorkspace;
