import {useEffect, useRef, useState} from 'react';
import {Button, Modal, Popover, Radio, Typography} from 'antd';
import {ExpandOutlined, InfoCircleOutlined} from '@ant-design/icons';
import DPlayer from 'dplayer';
import type {Episode} from '../type/api';
import {
    getVideoDisplayStyle,
    VIDEO_DISPLAY_OPTIONS,
    type VideoDisplayMode,
} from './videoDisplayMode';
import './DPlayerPlayer.css';

const {Text} = Typography;

interface DPlayerPlayerProps {
    episode: Episode;
    coverUrl?: string;
    authenticated: boolean;
    onLogin: () => void;
    onRegister: () => void;
}

function DPlayerPlayer({
    episode,
    coverUrl,
    authenticated,
    onLogin,
    onRegister,
}: DPlayerPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<DPlayer | null>(null);
    const displayModeRef = useRef<VideoDisplayMode>('contain');
    const [previewEnded, setPreviewEnded] = useState(false);
    const [displayMode, setDisplayMode] = useState<VideoDisplayMode>('contain');
    const [displayMenuOpen, setDisplayMenuOpen] = useState(false);

    useEffect(() => {
        setPreviewEnded(false);
        const container = containerRef.current;
        if (!container) return;

        const player = new DPlayer({
            container,
            theme: '#5e6ad2',
            lang: 'zh-cn',
            hotkey: true,
            mutex: true,
            preload: 'metadata',
            screenshot: false,
            video: {
                url: episode.videoUrl,
                pic: coverUrl,
                type: 'auto',
            },
            contextmenu: [{
                text: 'Video Platform',
            }],
        });
        playerRef.current = player;
        Object.assign(player.video.style, getVideoDisplayStyle(displayModeRef.current));

        player.on('timeupdate', () => {
            if (!authenticated && episode.previewSeconds > 0 && player.video.currentTime >= episode.previewSeconds) {
                player.pause();
                player.seek(episode.previewSeconds);
                setPreviewEnded(true);
            }
        });

        return () => {
            playerRef.current = null;
            player.destroy();
        };
    }, [authenticated, coverUrl, episode.id, episode.previewSeconds, episode.videoUrl]);

    useEffect(() => {
        const player = playerRef.current;
        if (player) {
            Object.assign(player.video.style, getVideoDisplayStyle(displayMode));
        }
    }, [displayMode]);

    const previewMinutes = Math.floor(episode.previewSeconds / 60);
    const previewRemainder = episode.previewSeconds % 60;
    const previewLabel = previewMinutes > 0
        ? `${previewMinutes} 分钟`
        : `${previewRemainder} 秒`;

    return (
        <>
            <div className="dplayer-player-shell">
                <div
                    ref={containerRef}
                    className="dplayer-player"
                    aria-label={`播放第 ${episode.episodeNumber} 集：${episode.title}`}
                />
                <div
                    className="dplayer-display-control"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                >
                    <Popover
                        arrow={false}
                        placement="topRight"
                        trigger="click"
                        open={displayMenuOpen}
                        onOpenChange={setDisplayMenuOpen}
                        overlayClassName="dplayer-display-popover"
                        content={(
                            <div className="dplayer-display-menu" aria-label="画面比例">
                                <div className="dplayer-display-menu-title">画面比例</div>
                                <Radio.Group
                                    value={displayMode}
                                    onChange={(event) => {
                                        const nextMode = event.target.value as VideoDisplayMode;
                                        displayModeRef.current = nextMode;
                                        setDisplayMode(nextMode);
                                        setDisplayMenuOpen(false);
                                    }}
                                >
                                    {VIDEO_DISPLAY_OPTIONS.map((option) => (
                                        <Radio key={option.value} value={option.value}>
                                            <span className="dplayer-display-option-copy">
                                                <strong>{option.label}</strong>
                                                <small>{option.description}</small>
                                            </span>
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </div>
                        )}
                    >
                        <button
                            type="button"
                            className="dplayer-display-trigger"
                            aria-label="设置画面比例"
                            aria-expanded={displayMenuOpen}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setDisplayMenuOpen((open) => !open);
                                }
                            }}
                        >
                            <ExpandOutlined aria-hidden />
                            <span>画面</span>
                        </button>
                    </Popover>
                </div>
            </div>

            {!authenticated && (
                <div className="dplayer-preview-tip" role="status">
                    <InfoCircleOutlined aria-hidden />
                    <Text>游客可试看本集前 {previewLabel}</Text>
                </div>
            )}

            <Modal
                className="preview-modal"
                open={previewEnded}
                title="试看已结束"
                centered
                destroyOnHidden
                onCancel={() => setPreviewEnded(false)}
                footer={[
                    <Button key="register" onClick={onRegister}>免费注册</Button>,
                    <Button key="login" type="primary" onClick={onLogin}>登录继续观看</Button>,
                ]}
            >
                <div className="dplayer-preview-dialog-copy">
                    <InfoCircleOutlined aria-hidden />
                    <Text>登录后即可继续观看完整内容。</Text>
                </div>
            </Modal>
        </>
    );
}

export default DPlayerPlayer;
