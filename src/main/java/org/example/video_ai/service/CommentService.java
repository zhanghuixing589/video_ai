package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.entity.Comment;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.ContentRating;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.exception.ApiException;
import org.example.video_ai.repository.CommentRepository;
import org.example.video_ai.repository.ContentRatingRepository;
import org.example.video_ai.repository.ContentRepository;
import org.example.video_ai.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final ContentRatingRepository ratingRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final ContentService contentService;

    @Transactional(readOnly = true)
    public List<ContentEngagementDTO.CommentInfo> listComments(Long contentId) {
        requirePublishedContent(contentId);
        List<Comment> comments = commentRepository.findByContentIdOrderByCreatedAtDesc(contentId);
        Map<Long, User> authorProfiles = currentAuthorProfiles(comments);
        return comments.stream()
                .map(comment -> toCommentInfo(comment, authorProfiles))
                .toList();
    }

    @Transactional
    public ContentEngagementDTO.CommentInfo createComment(
            String username,
            Long contentId,
            ContentEngagementDTO.CommentRequest request) {
        String body = trimToNull(request.getBody());
        if (body == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Comment body is required");
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
        return toCommentInfo(commentRepository.save(comment));
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
            throw new ApiException(HttpStatus.BAD_REQUEST, "Rating score must be between 1 and 10");
        }
        User user = requireUser(username);
        ContentRating rating = ratingRepository.findByContentIdAndUserId(contentId, user.getId())
                .orElseGet(() -> {
                    ContentRating created = new ContentRating();
                    created.setContentId(contentId);
                    created.setUserId(user.getId());
                    return created;
                });
        rating.setScore(request.getScore());
        ratingRepository.save(rating);
        return ratingSummary(contentId, request.getScore());
    }

    @Transactional(readOnly = true)
    public List<ContentDTO> recommendations(Long contentId) {
        Content content = requirePublishedContent(contentId);
        Map<Long, Content> recommended = new LinkedHashMap<>();
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

    private Content requirePublishedContent(Long contentId) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Content not found"));
        if (content.getStatus() != VideoStatus.PUBLISHED) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Content not found");
        }
        return content;
    }

    private User requireUser(String username) {
        if (username == null || username.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Login required");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
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

    private ContentEngagementDTO.CommentInfo toCommentInfo(Comment comment) {
        return toCommentInfo(comment, Map.of());
    }

    private ContentEngagementDTO.CommentInfo toCommentInfo(Comment comment, Map<Long, User> authorProfiles) {
        User currentAuthor = authorProfiles.get(comment.getUserId());
        ContentEngagementDTO.CommentInfo info = new ContentEngagementDTO.CommentInfo();
        info.setId(comment.getId());
        info.setContentId(comment.getContentId());
        info.setUserId(comment.getUserId());
        info.setAuthorUsername(currentAuthor == null ? comment.getAuthorUsername() : currentAuthor.getUsername());
        info.setAuthorDisplayName(currentAuthor == null ? comment.getAuthorDisplayName() : displayName(currentAuthor));
        info.setAuthorAvatarUrl(currentAuthor == null ? comment.getAuthorAvatarUrl() : currentAuthor.getAvatarUrl());
        info.setBody(comment.getBody());
        info.setCreatedAt(comment.getCreatedAt());
        info.setUpdatedAt(comment.getUpdatedAt());
        return info;
    }

    private Map<Long, User> currentAuthorProfiles(List<Comment> comments) {
        List<Long> authorIds = comments.stream()
                .map(Comment::getUserId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (authorIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String displayName(User user) {
        return trimToNull(user.getDisplayName()) == null ? user.getUsername() : user.getDisplayName().trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
