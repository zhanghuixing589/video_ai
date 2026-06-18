import { useRef, useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Episode } from '../type/api';
import '../styles/global.css';
import './PreviewPlayer.css';

const { Text } = Typography;

interface PreviewPlayerProps {
    episode: Episode;
    authenticated: boolean;
}

function PreviewPlayer({ episode, authenticated }: PreviewPlayerProps) {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [previewEnded, setPreviewEnded] = useState(false);

    const onTimeUpdate = () => {
        const video = videoRef.current;
        if (!authenticated && video && video.currentTime >= episode.previewSeconds) {
            video.pause();
            video.currentTime = episode.previewSeconds;
            setPreviewEnded(true);
        }
    };

    // 计算试看时长（分钟）
    const previewMinutes = Math.floor(episode.previewSeconds / 60);
    const previewSecondsRemainder = episode.previewSeconds % 60;

    return (
        <>
            <video
                ref={videoRef}
                className="preview-player"
                controls
                src={episode.videoUrl}
                onTimeUpdate={onTimeUpdate}
                playsInline
            >
                当前浏览器不支持视频播放。
            </video>

            {!authenticated && (
                <div className="preview-tip">
                    <InfoCircleOutlined className="preview-tip-icon" />
                    <Text style={{ color: 'var(--foreground-muted)' }}>
                        游客可试看本集前{' '}
                        {previewMinutes > 0 ? `${previewMinutes} 分钟` : `${previewSecondsRemainder} 秒`}
                    </Text>
                </div>
            )}

            <Modal
                className="preview-modal"
                open={previewEnded}
                title="试看已结束"
                footer={[
                    <Button key="register" onClick={() => navigate('/login?mode=register')}>
                        免费注册
                    </Button>,
                    <Button key="login" type="primary" onClick={() => navigate('/login')}>
                        登录继续观看
                    </Button>,
                ]}
                onCancel={() => setPreviewEnded(false)}
                centered
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'var(--accent-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <InfoCircleOutlined style={{ color: 'var(--accent)', fontSize: 20 }} />
                    </div>
                    <Text style={{ color: 'var(--foreground)' }}>
                        登录后即可继续观看完整内容。
                    </Text>
                </div>
            </Modal>
        </>
    );
}

export default PreviewPlayer;
