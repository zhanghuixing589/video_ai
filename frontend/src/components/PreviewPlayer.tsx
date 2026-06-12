import {useRef, useState} from 'react';
import {Button, Modal, Typography} from 'antd';
import {useNavigate} from 'react-router-dom';
import type {Episode} from '../type/api';
import './PreviewPlayer.css';

const {Text} = Typography;

interface PreviewPlayerProps {
    episode: Episode;
    authenticated: boolean;
}

function PreviewPlayer({episode, authenticated}: PreviewPlayerProps) {
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

    return (
        <>
            <video
                ref={videoRef}
                className="preview-player"
                controls
                src={episode.videoUrl}
                onTimeUpdate={onTimeUpdate}
            >
                当前浏览器不支持视频播放。
            </video>
            {!authenticated && (
                <Text type="secondary">游客可试看本集前 {Math.floor(episode.previewSeconds / 60)} 分钟</Text>
            )}
            <Modal
                open={previewEnded}
                title="试看已结束"
                footer={[
                    <Button key="register" onClick={() => navigate('/login?mode=register')}>免费注册</Button>,
                    <Button key="login" type="primary" onClick={() => navigate('/login')}>登录继续观看</Button>,
                ]}
                onCancel={() => setPreviewEnded(false)}
            >
                登录后即可继续观看完整内容。
            </Modal>
        </>
    );
}

export default PreviewPlayer;
