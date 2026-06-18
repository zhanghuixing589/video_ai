package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.entity.Comment;
import org.example.video_ai.entity.CommentLike;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.ContentRating;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.exception.ApiException;
import org.example.video_ai.repository.CommentLikeRepository;
import org.example.video_ai.repository.CommentRepository;
import org.example.video_ai.repository.ContentRatingRepository;
import org.example.video_ai.repository.ContentRepository;
import org.example.video_ai.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final ContentRatingRepository ratingRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final ContentService contentService;

    @Transactional(readOnly = true)
    public List<ContentEngagementDTO.CommentInfo> listComments(Long contentId, String currentUsername) {
        requirePublishedContent(contentId);

        List<Comment> allComments = commentRepository.findAllByContentId(contentId);
        if (allComments.isEmpty()) {
            allComments = loadCommentsByRootId(contentId);
        }
        if (allComments.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, Comment> commentMap = allComments.stream()
                .collect(Collectors.toMap(
                        Comment::getId,
                        Function.identity(),
                        (existing, duplicate) -> existing,
                        LinkedHashMap::new));
        allComments = new ArrayList<>(commentMap.values());
        Map<Long, User> userMap = getCommentUsers(allComments);
        Map<Long, Boolean> likeStatusMap = getLikeStatusMap(currentUsername, commentMap);

        Map<Long, ContentEngagementDTO.CommentInfo> dtoMap = new HashMap<>();
        for (Comment comment : allComments) {
            User author = userMap.get(comment.getUserId());
            ContentEngagementDTO.CommentInfo dto = toCommentInfo(comment, author);
            dto.setLikedByCurrentUser(likeStatusMap.getOrDefault(comment.getId(), false));
            dtoMap.put(comment.getId(), dto);
        }

        Map<Long, List<ContentEngagementDTO.CommentInfo>> repliesByParentId = dtoMap.values().stream()
                .filter(dto -> dto.getParentId() != null)
                .collect(Collectors.groupingBy(ContentEngagementDTO.CommentInfo::getParentId));
        repliesByParentId.values().forEach(replies -> replies.sort(commentTimeAscending()));

        List<Comment> roots = allComments.stream()
                .filter(comment -> comment.getParentId() == null)
                .sorted(Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed())
                .toList();

        List<ContentEngagementDTO.CommentInfo> result = new ArrayList<>();
        for (Comment root : roots) {
            ContentEngagementDTO.CommentInfo rootDto = dtoMap.get(root.getId());
            if (rootDto != null) {
                rootDto.setReplies(buildReplyTree(root.getId(), repliesByParentId));
                result.add(rootDto);
            }
        }
        return result;
    }

    @Transactional
    public ContentEngagementDTO.CommentInfo createComment(
            String username,
            Long contentId,
            ContentEngagementDTO.CommentRequest request) {
        String body = trimToNull(request.getBody());
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "评论内容不能为空");
        }

        requirePublishedContent(contentId);
        User user = requireUser(username);

        Comment comment = new Comment();
        comment.setContentId(contentId);
        comment.setUserId(user.getId());
        comment.setAuthorUsername(user.getUsername());
        comment.setAuthorDisplayName(displayName(user));
        comment.setAuthorAvatarUrl(user.getAvatarUrl());
        comment.setBody(body);
        comment.setLikeCount(0);
        comment.setReplyCount(0);

        if (request.getParentId() != null) {
            Comment parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "要回复的评论不存在"));

            if (!parentComment.getContentId().equals(contentId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "评论不属于该作品");
            }

            comment.setParentId(parentComment.getId());
            Long rootId = parentComment.getRootId() != null ? parentComment.getRootId() : parentComment.getId();
            comment.setRootId(rootId);

            Comment saved = commentRepository.save(comment);
            commentRepository.updateReplyCount(parentComment.getId(), 1);

            return toCommentInfo(saved, user);
        }

        Comment saved = commentRepository.save(comment);
        saved.setRootId(saved.getId());
        commentRepository.save(saved);
        return toCommentInfo(saved, user);
    }

    @Transactional
    public ContentEngagementDTO.CommentInfo toggleLike(
            String username,
            Long contentId,
            Long commentId,
            ContentEngagementDTO.CommentLikeRequest request) {

        User user = requireUser(username);
        requirePublishedContent(contentId);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "评论不存在"));

        if (!comment.getContentId().equals(contentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "评论不属于该作品");
        }

        boolean currentlyLiked = commentLikeRepository.existsByCommentIdAndUserId(commentId, user.getId());

        if (request.getLiked() && !currentlyLiked) {
            CommentLike like = new CommentLike();
            like.setCommentId(commentId);
            like.setUserId(user.getId());
            like.setUserUsername(user.getUsername());
            commentLikeRepository.save(like);

            comment.setLikeCount(countOrZero(comment.getLikeCount()) + 1);
            commentRepository.save(comment);
        } else if (!request.getLiked() && currentlyLiked) {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, user.getId());

            comment.setLikeCount(Math.max(0, countOrZero(comment.getLikeCount()) - 1));
            commentRepository.save(comment);
        }

        User author = userRepository.findById(comment.getUserId()).orElse(null);
        ContentEngagementDTO.CommentInfo result = toCommentInfo(comment, author);
        result.setLikedByCurrentUser(request.getLiked());
        return result;
    }

    @Transactional
    public void deleteComment(String username, Long contentId, Long commentId) {
        User user = requireUser(username);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "评论不存在"));

        if (!comment.getContentId().equals(contentId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "评论不属于该作品");
        }

        if (!comment.getUserId().equals(user.getId()) && !user.getRole().name().equals("ADMIN")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "只有评论作者或管理员可以删除评论");
        }

        if (comment.getParentId() == null) {
            List<Comment> replies = commentRepository.findRepliesByRootId(commentId);
            for (Comment reply : replies) {
                commentLikeRepository.deleteByCommentIdAndUserId(reply.getId(), null);
            }
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, null);
            commentRepository.deleteAll(replies);
            commentRepository.delete(comment);
        } else {
            commentLikeRepository.deleteByCommentIdAndUserId(commentId, null);
            commentRepository.delete(comment);
            commentRepository.updateReplyCount(comment.getParentId(), -1);
        }
    }

    @Transactional(readOnly = true)
    public ContentEngagementDTO.RatingSummary getRatingSummary(String username, Long contentId) {
        requirePublishedContent(contentId);
        Integer myScore = null;
        if (username != null && !username.isBlank()) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                myScore = ratingRepository.findByContentIdAndUserId(contentId, user.getId())
                        .map(ContentRating::getScore)
                        .orElse(null);
            }
        }
        return ratingSummary(contentId, myScore);
    }

    @Transactional
    public ContentEngagementDTO.RatingSummary rateContent(
            String username,
            Long contentId,
            ContentEngagementDTO.RatingRequest request) {
        requirePublishedContent(contentId);

        if (request.getScore() == null || request.getScore() < 1 || request.getScore() > 10) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "评分必须在1-10分之间");
        }

        User user = requireUser(username);
        ContentRating rating = ratingRepository.findByContentIdAndUserId(contentId, user.getId())
                .orElseGet(() -> {
                    ContentRating newRating = new ContentRating();
                    newRating.setContentId(contentId);
                    newRating.setUserId(user.getId());
                    return newRating;
                });

        rating.setScore(request.getScore());
        ratingRepository.save(rating);

        return ratingSummary(contentId, request.getScore());
    }

    @Transactional(readOnly = true)
    public List<ContentDTO> recommendations(Long contentId) {
        Content content = requirePublishedContent(contentId);
        Map<Long, Content> recommended = new HashMap<>();

        contentRepository.findTop8ByStatusAndIdNotAndTypeAndGenreOrderByUpdatedAtDesc(
                        VideoStatus.PUBLISHED,
                        contentId,
                        content.getType(),
                        content.getGenre())
                .forEach(item -> recommended.put(item.getId(), item));

        if (recommended.size() < 8) {
            contentRepository.findTop8ByStatusAndIdNotAndTypeOrderByUpdatedAtDesc(
                            VideoStatus.PUBLISHED,
                            contentId,
                            content.getType())
                    .forEach(item -> recommended.putIfAbsent(item.getId(), item));
        }

        return recommended.values().stream()
                .limit(8)
                .map(contentService::toDTO)
                .toList();
    }

    private List<Comment> loadCommentsByRootId(Long contentId) {
        List<Comment> rootComments = commentRepository.findRootCommentsByContentId(contentId);
        List<Comment> allComments = new ArrayList<>();
        allComments.addAll(rootComments);
        for (Comment root : rootComments) {
            allComments.addAll(commentRepository.findRepliesByRootId(root.getId()));
        }
        return allComments;
    }

    private Map<Long, Boolean> getLikeStatusMap(String currentUsername, Map<Long, Comment> commentMap) {
        Map<Long, Boolean> likeStatusMap = new HashMap<>();
        if (currentUsername == null || currentUsername.isBlank()) {
            return likeStatusMap;
        }
        User currentUser = userRepository.findByUsername(currentUsername).orElse(null);
        if (currentUser == null) {
            return likeStatusMap;
        }
        for (Long commentId : commentMap.keySet()) {
            likeStatusMap.put(
                    commentId,
                    commentLikeRepository.existsByCommentIdAndUserId(commentId, currentUser.getId()));
        }
        return likeStatusMap;
    }

    private List<ContentEngagementDTO.CommentInfo> buildReplyTree(
            Long parentId,
            Map<Long, List<ContentEngagementDTO.CommentInfo>> repliesByParentId) {
        List<ContentEngagementDTO.CommentInfo> replies = repliesByParentId.getOrDefault(parentId, List.of());
        List<ContentEngagementDTO.CommentInfo> result = new ArrayList<>();
        for (ContentEngagementDTO.CommentInfo reply : replies) {
            reply.setReplies(buildReplyTree(reply.getId(), repliesByParentId));
            result.add(reply);
        }
        return result;
    }

    private Comparator<ContentEngagementDTO.CommentInfo> commentTimeAscending() {
        return Comparator.comparing(
                ContentEngagementDTO.CommentInfo::getCreatedAt,
                Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private Content requirePublishedContent(Long contentId) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "作品不存在"));
        if (content.getStatus() != VideoStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "作品不存在");
        }
        return content;
    }

    private User requireUser(String username) {
        if (username == null || username.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "用户不存在"));
    }

    private ContentEngagementDTO.RatingSummary ratingSummary(Long contentId, Integer myScore) {
        long count = ratingRepository.countByContentId(contentId);
        Double average = ratingRepository.averageScoreByContentId(contentId);
        ContentEngagementDTO.RatingSummary summary = new ContentEngagementDTO.RatingSummary();
        summary.setRatingCount(count);
        summary.setAverageScore(average == null ? 0.0 : Math.round(average * 10.0) / 10.0);
        summary.setMyScore(myScore);
        return summary;
    }

    private ContentEngagementDTO.CommentInfo toCommentInfo(Comment comment, User author) {
        ContentEngagementDTO.CommentInfo info = new ContentEngagementDTO.CommentInfo();
        info.setId(comment.getId());
        info.setContentId(comment.getContentId());
        info.setUserId(comment.getUserId());
        info.setAuthorUsername(author != null ? author.getUsername() : comment.getAuthorUsername());
        info.setAuthorDisplayName(author != null ? displayName(author) : comment.getAuthorDisplayName());
        info.setAuthorAvatarUrl(author != null ? author.getAvatarUrl() : comment.getAuthorAvatarUrl());
        info.setBody(comment.getBody());
        info.setLikeCount(countOrZero(comment.getLikeCount()));
        info.setReplyCount(countOrZero(comment.getReplyCount()));
        info.setCreatedAt(comment.getCreatedAt());
        info.setUpdatedAt(comment.getUpdatedAt());
        info.setParentId(comment.getParentId());
        info.setRootId(comment.getRootId());
        return info;
    }

    private Map<Long, User> getCommentUsers(List<Comment> comments) {
        List<Long> userIds = comments.stream()
                .map(Comment::getUserId)
                .distinct()
                .toList();
        if (userIds.isEmpty()) {
            return new HashMap<>();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String displayName(User user) {
        return trimToNull(user.getDisplayName()) == null ? user.getUsername() : user.getDisplayName().trim();
    }

    private int countOrZero(Integer count) {
        return count == null ? 0 : count;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
