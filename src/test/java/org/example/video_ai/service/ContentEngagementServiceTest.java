package org.example.video_ai.service;

import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.entity.Comment;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.ContentRating;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.repository.CommentLikeRepository;
import org.example.video_ai.repository.CommentRepository;
import org.example.video_ai.repository.ContentRatingRepository;
import org.example.video_ai.repository.ContentRepository;
import org.example.video_ai.repository.EpisodeRepository;
import org.example.video_ai.repository.SeasonRepository;
import org.example.video_ai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentEngagementServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private ContentRatingRepository ratingRepository;
    @Mock private ContentRepository contentRepository;
    @Mock private SeasonRepository seasonRepository;
    @Mock private EpisodeRepository episodeRepository;
    @Mock private UserRepository userRepository;
    private CommentService commentService;

    @BeforeEach
    void setUp() {
        ContentService contentService = new ContentService(
                contentRepository, seasonRepository, episodeRepository, userRepository);
        commentService = new CommentService(
                commentRepository, commentLikeRepository, ratingRepository, contentRepository, userRepository, contentService);
    }

    @Test
    void listsRealCommentsNewestFirst() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        List<Comment> comments = List.of(
                comment(5L, 1L, 7L, "viewer", "Viewer", "Later", LocalDateTime.parse("2026-06-16T09:00:00")),
                comment(4L, 1L, 8L, "maker", "Maker", "Earlier", LocalDateTime.parse("2026-06-16T08:00:00"))
        );
        comments.forEach(comment -> comment.setRootId(comment.getId()));
        when(commentRepository.findRootCommentsByContentId(1L)).thenReturn(comments);
        when(commentRepository.findRepliesByRootId(5L)).thenReturn(List.of());
        when(commentRepository.findRepliesByRootId(4L)).thenReturn(List.of());

        List<ContentEngagementDTO.CommentInfo> result = commentService.listComments(1L, null);

        assertThat(result).extracting(ContentEngagementDTO.CommentInfo::getBody)
                .containsExactly("Later", "Earlier");
        assertThat(result.get(0).getAuthorDisplayName()).isEqualTo("Viewer");
    }

    @Test
    void listsCommentsWithCurrentAuthorProfile() {
        Comment oldComment = comment(5L, 1L, 7L, "viewer", "Viewer", "Avatar before upload",
                LocalDateTime.parse("2026-06-16T09:00:00"));
        oldComment.setAuthorAvatarUrl(null);
        User updatedUser = user(7L, "viewer", "Viewer Updated");
        updatedUser.setAvatarUrl("/api/uploads/avatars/new.png");
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        oldComment.setRootId(oldComment.getId());
        when(commentRepository.findRootCommentsByContentId(1L)).thenReturn(List.of(oldComment));
        when(commentRepository.findRepliesByRootId(5L)).thenReturn(List.of());
        when(userRepository.findAllById(List.of(7L))).thenReturn(List.of(updatedUser));

        List<ContentEngagementDTO.CommentInfo> comments = commentService.listComments(1L, null);

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getAuthorDisplayName()).isEqualTo("Viewer Updated");
        assertThat(comments.get(0).getAuthorAvatarUrl()).isEqualTo("/api/uploads/avatars/new.png");
    }

    @Test
    void doesNotDuplicateRootCommentWhenLoadingRepliesByRootId() {
        Comment root = comment(2L, 1L, 7L, "viewer", "Viewer", "Root",
                LocalDateTime.parse("2026-06-17T11:07:03"));
        root.setRootId(2L);
        Comment reply = comment(3L, 1L, 8L, "maker", "Maker", "Reply",
                LocalDateTime.parse("2026-06-17T11:08:03"));
        reply.setParentId(2L);
        reply.setRootId(2L);
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(commentRepository.findRootCommentsByContentId(1L)).thenReturn(List.of(root));
        when(commentRepository.findRepliesByRootId(2L)).thenReturn(List.of(root, reply));
        when(userRepository.findAllById(List.of(7L, 8L))).thenReturn(List.of(
                user(7L, "viewer", "Viewer"),
                user(8L, "maker", "Maker")
        ));

        List<ContentEngagementDTO.CommentInfo> comments = commentService.listComments(1L, null);

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getId()).isEqualTo(2L);
        assertThat(comments.get(0).getReplies()).extracting(ContentEngagementDTO.CommentInfo::getId)
                .containsExactly(3L);
    }

    @Test
    void listsRepliesEvenWhenStoredRootIdIsMissing() {
        Comment root = comment(2L, 1L, 7L, "viewer", "Viewer", "Root",
                LocalDateTime.parse("2026-06-17T11:07:03"));
        root.setRootId(2L);
        Comment reply = comment(3L, 1L, 8L, "maker", "Maker", "Reply with old root id",
                LocalDateTime.parse("2026-06-17T11:08:03"));
        reply.setParentId(2L);
        reply.setRootId(null);
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(commentRepository.findAllByContentId(1L)).thenReturn(List.of(reply, root));
        when(userRepository.findAllById(List.of(8L, 7L))).thenReturn(List.of(
                user(8L, "maker", "Maker"),
                user(7L, "viewer", "Viewer")
        ));

        List<ContentEngagementDTO.CommentInfo> comments = commentService.listComments(1L, null);

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getId()).isEqualTo(2L);
        assertThat(comments.get(0).getReplies()).extracting(ContentEngagementDTO.CommentInfo::getId)
                .containsExactly(3L);
    }

    @Test
    void likesCommentsWhosePersistedLikeCountIsNull() {
        Comment root = comment(2L, 1L, 7L, "viewer", "Viewer", "Root",
                LocalDateTime.parse("2026-06-17T11:07:03"));
        root.setLikeCount(null);
        ContentEngagementDTO.CommentLikeRequest request = new ContentEngagementDTO.CommentLikeRequest();
        request.setLiked(true);
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(userRepository.findByUsername("maker")).thenReturn(Optional.of(user(8L, "maker", "Maker")));
        when(commentRepository.findById(2L)).thenReturn(Optional.of(root));
        when(commentLikeRepository.existsByCommentIdAndUserId(2L, 8L)).thenReturn(false);
        when(commentLikeRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(commentRepository.save(root)).thenReturn(root);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user(7L, "viewer", "Viewer")));

        ContentEngagementDTO.CommentInfo liked = commentService.toggleLike("maker", 1L, 2L, request);

        assertThat(liked.getLikeCount()).isEqualTo(1);
        assertThat(liked.getLikedByCurrentUser()).isTrue();
    }

    @Test
    void createsCommentForAuthenticatedUser() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(userRepository.findByUsername("viewer")).thenReturn(Optional.of(user(7L, "viewer", "Viewer")));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setCreatedAt(LocalDateTime.parse("2026-06-16T10:00:00"));
            saved.setUpdatedAt(saved.getCreatedAt());
            return saved;
        });
        ContentEngagementDTO.CommentRequest request = new ContentEngagementDTO.CommentRequest();
        request.setBody("  Worth watching.  ");

        ContentEngagementDTO.CommentInfo created = commentService.createComment("viewer", 1L, request);

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getBody()).isEqualTo("Worth watching.");
        assertThat(created.getRootId()).isEqualTo(10L);
        verify(commentRepository, atLeastOnce()).save(any(Comment.class));
    }

    @Test
    void rejectsBlankComment() {
        ContentEngagementDTO.CommentRequest request = new ContentEngagementDTO.CommentRequest();
        request.setBody("   ");

        assertThatThrownBy(() -> commentService.createComment("viewer", 1L, request))
                .hasMessage("评论内容不能为空");
    }

    @Test
    void createsThenUpdatesOneRatingPerUserAndContent() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(userRepository.findByUsername("viewer")).thenReturn(Optional.of(user(7L, "viewer", "Viewer")));
        when(ratingRepository.findByContentIdAndUserId(1L, 7L)).thenReturn(Optional.of(rating(1L, 7L, 8)));
        when(ratingRepository.save(any(ContentRating.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(ratingRepository.countByContentId(1L)).thenReturn(2L);
        when(ratingRepository.averageScoreByContentId(1L)).thenReturn(9.0);
        ContentEngagementDTO.RatingRequest request = new ContentEngagementDTO.RatingRequest();
        request.setScore(10);

        ContentEngagementDTO.RatingSummary summary = commentService.rateContent("viewer", 1L, request);

        assertThat(summary.getAverageScore()).isEqualTo(9.0);
        assertThat(summary.getRatingCount()).isEqualTo(2L);
        assertThat(summary.getMyScore()).isEqualTo(10);
    }

    @Test
    void summarizesRatingsWithoutFakeFallback() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(ratingRepository.countByContentId(1L)).thenReturn(0L);
        when(ratingRepository.averageScoreByContentId(1L)).thenReturn(null);

        ContentEngagementDTO.RatingSummary summary = commentService.getRatingSummary(null, 1L);

        assertThat(summary.getAverageScore()).isEqualTo(0.0);
        assertThat(summary.getRatingCount()).isZero();
        assertThat(summary.getMyScore()).isNull();
    }

    @Test
    void recommendsPublishedRelatedContentAndExcludesCurrentContent() {
        Content current = publishedContent(1L, "Current");
        Content related = publishedContent(2L, "Related");
        when(contentRepository.findById(1L)).thenReturn(Optional.of(current));
        when(contentRepository.findTop8ByStatusAndIdNotAndTypeAndGenreOrderByUpdatedAtDesc(
                VideoStatus.PUBLISHED, 1L, VideoType.MOVIE, VideoGenre.DOCUMENTARY))
                .thenReturn(List.of(related));

        List<ContentDTO> recommendations = commentService.recommendations(1L);

        assertThat(recommendations).extracting(ContentDTO::getId).containsExactly(2L);
    }

    private Content publishedContent(Long id, String title) {
        Content content = new Content();
        content.setId(id);
        content.setTitle(title);
        content.setDescription("Description");
        content.setCoverUrl("/cover.png");
        content.setType(VideoType.MOVIE);
        content.setGenre(VideoGenre.DOCUMENTARY);
        content.setStatus(VideoStatus.PUBLISHED);
        content.setStudioId(9L);
        content.setUpdatedAt(LocalDateTime.parse("2026-06-16T08:00:00"));
        return content;
    }

    private Comment comment(Long id, Long contentId, Long userId, String username, String displayName,
                            String body, LocalDateTime createdAt) {
        Comment comment = new Comment();
        comment.setId(id);
        comment.setContentId(contentId);
        comment.setUserId(userId);
        comment.setAuthorUsername(username);
        comment.setAuthorDisplayName(displayName);
        comment.setBody(body);
        comment.setCreatedAt(createdAt);
        comment.setUpdatedAt(createdAt);
        return comment;
    }

    private ContentRating rating(Long contentId, Long userId, int score) {
        ContentRating rating = new ContentRating();
        rating.setContentId(contentId);
        rating.setUserId(userId);
        rating.setScore(score);
        return rating;
    }

    private User user(Long id, String username, String displayName) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setRole(Role.USER);
        user.setEnabled(true);
        return user;
    }
}
