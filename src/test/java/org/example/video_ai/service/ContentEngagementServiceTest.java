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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentEngagementServiceTest {

    @Mock private CommentRepository commentRepository;
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
                commentRepository, ratingRepository, contentRepository, userRepository, contentService);
    }

    @Test
    void listsRealCommentsNewestFirst() {
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(commentRepository.findByContentIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                comment(5L, 1L, 7L, "viewer", "Viewer", "Later", LocalDateTime.parse("2026-06-16T09:00:00")),
                comment(4L, 1L, 8L, "maker", "Maker", "Earlier", LocalDateTime.parse("2026-06-16T08:00:00"))
        ));

        List<ContentEngagementDTO.CommentInfo> comments = commentService.listComments(1L);

        assertThat(comments).extracting(ContentEngagementDTO.CommentInfo::getBody)
                .containsExactly("Later", "Earlier");
        assertThat(comments.get(0).getAuthorDisplayName()).isEqualTo("Viewer");
    }

    @Test
    void listsCommentsWithCurrentAuthorProfile() {
        Comment oldComment = comment(5L, 1L, 7L, "viewer", "Viewer", "Avatar before upload",
                LocalDateTime.parse("2026-06-16T09:00:00"));
        oldComment.setAuthorAvatarUrl(null);
        User updatedUser = user(7L, "viewer", "Viewer Updated");
        updatedUser.setAvatarUrl("/api/uploads/avatars/new.png");
        when(contentRepository.findById(1L)).thenReturn(Optional.of(publishedContent(1L, "Mountain")));
        when(commentRepository.findByContentIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(oldComment));
        when(userRepository.findAllById(List.of(7L))).thenReturn(List.of(updatedUser));

        List<ContentEngagementDTO.CommentInfo> comments = commentService.listComments(1L);

        assertThat(comments).hasSize(1);
        assertThat(comments.get(0).getAuthorDisplayName()).isEqualTo("Viewer Updated");
        assertThat(comments.get(0).getAuthorAvatarUrl()).isEqualTo("/api/uploads/avatars/new.png");
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
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void rejectsBlankComment() {
        ContentEngagementDTO.CommentRequest request = new ContentEngagementDTO.CommentRequest();
        request.setBody("   ");

        assertThatThrownBy(() -> commentService.createComment("viewer", 1L, request))
                .hasMessage("Comment body is required");
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
