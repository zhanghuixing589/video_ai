import {useState} from 'react';
import {
    App,
    Avatar,
    Button,
    Input,
    Space,
    Tooltip,
    Typography,
} from 'antd';
import {
    DeleteOutlined,
    LikeFilled,
    LikeOutlined,
    MessageOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {contentEngagementApi, getApiErrorMessage} from '../services/api';
import type {ContentComment, UserInfo} from '../type/api';
import {resolveCommentAvatarUrl} from './commentAvatarUrl';
import {getReplyPrefix, mergeLikedComment} from './commentItemModel';
import './CommentItem.css';

const {Text, Paragraph} = Typography;
const {TextArea} = Input;

interface CommentItemProps {
    comment: ContentComment;
    contentId: number;
    currentUser: UserInfo | null;
    depth?: number;
    parentAuthorName?: string;
    onCommentDeleted?: (commentId: number) => void;
    onReplyAdded?: (reply: ContentComment) => void;
    onLikeToggled?: (commentId: number, liked: boolean) => void;
}

function CommentItem({
    comment,
    contentId,
    currentUser,
    depth = 0,
    parentAuthorName,
    onCommentDeleted,
    onReplyAdded,
    onLikeToggled,
}: CommentItemProps) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [localComment, setLocalComment] = useState(comment);
    const {message: messageApi} = App.useApp();

    if (!comment || !comment.id) {
        return null;
    }

    const maxDepth = 3;
    const isReply = depth > 0;
    const authorName = localComment.authorDisplayName || localComment.authorUsername || '未知用户';
    const replyPrefix = getReplyPrefix(parentAuthorName);
    const isOwnComment = currentUser?.id === localComment.userId;
    const isAdmin = currentUser?.role === 'ADMIN';
    const canDelete = isOwnComment || isAdmin;

    const formatTime = (value?: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleLike = async () => {
        if (!currentUser) {
            messageApi.info('请先登录');
            return;
        }
        if (!localComment.id) {
            messageApi.error('评论ID不存在');
            return;
        }

        setLikeLoading(true);
        try {
            const updated = await contentEngagementApi.toggleLike(
                contentId,
                localComment.id,
                {liked: !localComment.likedByCurrentUser},
            );
            setLocalComment((current) => mergeLikedComment(current, updated));
            onLikeToggled?.(localComment.id, updated.likedByCurrentUser || false);
        } catch (error) {
            messageApi.error(getApiErrorMessage(error, '操作失败'));
        } finally {
            setLikeLoading(false);
        }
    };

    const handleReply = async () => {
        if (!currentUser) {
            messageApi.info('请先登录');
            return;
        }

        const body = replyBody.trim();
        if (!body) {
            messageApi.warning('请输入回复内容');
            return;
        }

        setSubmitting(true);
        try {
            const created = await contentEngagementApi.createComment(contentId, {
                body,
                parentId: localComment.rootId || localComment.id,
            });

            setLocalComment((current) => ({
                ...current,
                replies: [created, ...(current.replies || [])],
                replyCount: (current.replyCount || 0) + 1,
            }));

            setReplyBody('');
            setShowReplyInput(false);
            onReplyAdded?.(created);
            messageApi.success('回复成功');
        } catch (error) {
            messageApi.error(getApiErrorMessage(error, '回复失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentUser) return;
        if (!canDelete) {
            messageApi.warning('只有评论作者或管理员可以删除');
            return;
        }

        try {
            await contentEngagementApi.deleteComment(contentId, localComment.id);
            onCommentDeleted?.(localComment.id);
            messageApi.success('删除成功');
        } catch (error) {
            messageApi.error(getApiErrorMessage(error, '删除失败'));
        }
    };

    return (
        <div
            className={`comment-item ${isReply ? 'comment-reply' : ''}`}
            style={{marginLeft: isReply ? `${Math.min(depth, maxDepth) * 24}px` : 0}}
        >
            <div className="comment-item-header">
                <Avatar
                    src={resolveCommentAvatarUrl(localComment.authorAvatarUrl)}
                    icon={<UserOutlined />}
                    size={isReply ? 28 : 40}
                />
                <div className="comment-item-main">
                    <div className="comment-item-meta">
                        <Text strong className="comment-author">{authorName}</Text>
                        {!isReply && (
                            <Text type="secondary" className="comment-time">
                                {formatTime(localComment.createdAt)}
                            </Text>
                        )}
                    </div>

                    <Paragraph className="comment-text">
                        {isReply && replyPrefix && (
                            <Text className="comment-reply-prefix">{replyPrefix}</Text>
                        )}
                        {localComment.body || ''}
                    </Paragraph>

                    <div className="comment-item-actions">
                        <Space size={isReply ? 'small' : 'middle'}>
                            <Button
                                type="text"
                                size="small"
                                icon={localComment.likedByCurrentUser ? <LikeFilled /> : <LikeOutlined />}
                                onClick={handleLike}
                                loading={likeLoading}
                                className={localComment.likedByCurrentUser ? 'liked' : ''}
                            >
                                {(localComment.likeCount || 0) > 0
                                    ? localComment.likeCount
                                    : (isReply ? '赞' : '')}
                            </Button>
                            <Button
                                type="text"
                                size="small"
                                icon={isReply ? undefined : <MessageOutlined />}
                                onClick={() => setShowReplyInput(!showReplyInput)}
                            >
                                {(localComment.replyCount || 0) > 0 && localComment.replyCount}
                                回复
                            </Button>
                            {isReply && (
                                <Text type="secondary" className="comment-time">
                                    {formatTime(localComment.createdAt)}
                                </Text>
                            )}
                        </Space>
                    </div>
                </div>

                {canDelete && (
                    <Tooltip title="删除">
                        <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={handleDelete}
                            className="comment-delete-btn"
                            aria-label="删除评论"
                        />
                    </Tooltip>
                )}
            </div>

            {showReplyInput && (
                <div className="comment-reply-input">
                    <TextArea
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder="写下你的回复..."
                        rows={2}
                        maxLength={1000}
                    />
                    <Space className="reply-actions">
                        <Button size="small" onClick={() => setShowReplyInput(false)}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            size="small"
                            loading={submitting}
                            onClick={handleReply}
                        >
                            回复
                        </Button>
                    </Space>
                </div>
            )}

            {localComment.replies && localComment.replies.length > 0 && (
                <div className="comment-replies">
                    {localComment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            contentId={contentId}
                            currentUser={currentUser}
                            depth={depth + 1}
                            parentAuthorName={authorName}
                            onCommentDeleted={onCommentDeleted}
                            onReplyAdded={onReplyAdded}
                            onLikeToggled={onLikeToggled}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
