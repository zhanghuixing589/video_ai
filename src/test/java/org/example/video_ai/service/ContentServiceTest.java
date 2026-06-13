package org.example.video_ai.service;

import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.Episode;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.repository.ContentRepository;
import org.example.video_ai.repository.EpisodeRepository;
import org.example.video_ai.repository.SeasonRepository;
import org.example.video_ai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContentServiceTest {

    @Mock private ContentRepository contentRepository;
    @Mock private SeasonRepository seasonRepository;
    @Mock private EpisodeRepository episodeRepository;
    @Mock private UserRepository userRepository;
    private ContentService contentService;

    @BeforeEach
    void setUp() {
        contentService = new ContentService(contentRepository, seasonRepository, episodeRepository, userRepository);
    }

    @Test
    void approvedStudioCanCreateContent() {
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> {
            Content content = invocation.getArgument(0);
            content.setId(1L);
            return content;
        });

        ContentDTO result = contentService.createContent("studio", createRequest(VideoType.TV_SERIES));

        assertThat(result.getStudioId()).isEqualTo(9L);
        assertThat(result.getTitle()).isEqualTo("远方");
    }

    @Test
    void unapprovedStudioCannotCreateContent() {
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.PENDING)));

        assertThatThrownBy(() -> contentService.createContent("studio", createRequest(VideoType.MOVIE)))
                .hasMessage("只有审核通过的制片厂可以管理作品");
    }

    @Test
    void episodeDefaultsToFiveMinutePreview() {
        Content content = new Content();
        content.setId(1L);
        content.setType(VideoType.MOVIE);
        content.setStudioId(9L);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(episodeRepository.existsByContentIdAndSeasonIdIsNullAndEpisodeNumber(1L, 1)).thenReturn(false);
        when(episodeRepository.save(any(Episode.class))).thenAnswer(invocation -> {
            Episode episode = invocation.getArgument(0);
            episode.setId(3L);
            return episode;
        });

        ContentDTO.EpisodeInfo episode = contentService.addEpisode("studio", 1L, episodeRequest());

        assertThat(episode.getPreviewSeconds()).isEqualTo(300);
    }

    @Test
    void episodePreservesUploadedVideoFileName() {
        Content content = new Content();
        content.setId(1L);
        content.setType(VideoType.MOVIE);
        content.setStudioId(9L);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(episodeRepository.save(any(Episode.class))).thenAnswer(invocation -> {
            Episode episode = invocation.getArgument(0);
            episode.setId(3L);
            return episode;
        });
        ContentDTO.EpisodeRequest request = episodeRequest();
        request.setOriginalFileName("mountain-final.mp4");
        request.setFileSize(2_556_887_040L);
        request.setVideoUrl("/api/uploads/videos/generated.mp4");

        ContentDTO.EpisodeInfo episode = contentService.addEpisode("studio", 1L, request);

        assertThat(episode.getVideoUrl()).isEqualTo("/api/uploads/videos/generated.mp4");
        assertThat(episode.getOriginalFileName()).isEqualTo("mountain-final.mp4");
        assertThat(episode.getFileSize()).isEqualTo(2_556_887_040L);
    }

    @Test
    void updatesOwnedDraftMetadataAndCover() {
        Content content = new Content();
        content.setId(1L);
        content.setStudioId(9L);
        content.setType(VideoType.TV_SERIES);
        content.setGenre(VideoGenre.DOCUMENTARY);
        content.setTitle("旧标题");
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ContentDTO.UpdateRequest request = new ContentDTO.UpdateRequest();
        request.setTitle("  山海之旅  ");
        request.setDescription("  穿越山川与湖泊  ");
        request.setGenre(VideoGenre.DOCUMENTARY);
        request.setCoverUrl("/api/uploads/covers/generated.png");

        ContentDTO updated = contentService.updateContent("studio", 1L, request);

        assertThat(updated.getTitle()).isEqualTo("山海之旅");
        assertThat(updated.getDescription()).isEqualTo("穿越山川与湖泊");
        assertThat(updated.getCoverUrl()).isEqualTo("/api/uploads/covers/generated.png");
        verify(contentRepository).save(content);
    }

    @Test
    void submitsCompleteContentForReview() {
        Content content = new Content();
        content.setId(1L);
        content.setStudioId(9L);
        content.setType(VideoType.MOVIE);
        content.setGenre(VideoGenre.DOCUMENTARY);
        content.setTitle("山海之旅");
        content.setDescription("穿越山川与湖泊");
        content.setCoverUrl("/api/uploads/covers/generated.png");
        content.setStatus(VideoStatus.DRAFT);
        Episode episode = new Episode();
        episode.setId(3L);
        episode.setContentId(1L);
        episode.setEpisodeNumber(1);
        episode.setTitle("正片");
        episode.setVideoUrl("/api/uploads/videos/generated.mp4");
        episode.setDurationSeconds(120L);
        episode.setPreviewSeconds(120);
        episode.setSortOrder(1);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(episodeRepository.findByContentIdAndSeasonIdIsNullOrderBySortOrder(1L))
                .thenReturn(List.of(episode));
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContentDTO submitted = contentService.submitForReview("studio", 1L);

        assertThat(submitted.getStatus()).isEqualTo(VideoStatus.PENDING);
    }

    @Test
    void refusesReviewSubmissionWithoutUploadedMedia() {
        Content content = new Content();
        content.setId(1L);
        content.setStudioId(9L);
        content.setType(VideoType.MOVIE);
        content.setGenre(VideoGenre.DOCUMENTARY);
        content.setTitle("山海之旅");
        content.setDescription("穿越山川与湖泊");
        content.setCoverUrl("/api/uploads/covers/generated.png");
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(studio(StudioStatus.APPROVED)));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));

        assertThatThrownBy(() -> contentService.submitForReview("studio", 1L))
                .hasMessage("请至少上传一个视频文件");
    }

    @Test
    void reviewerQueueUsesSubmittedContentWithEpisodes() {
        Content content = reviewableContent(VideoStatus.PENDING);
        Episode episode = episode();
        when(contentRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.PENDING))
                .thenReturn(List.of(content));
        when(contentRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.APPROVED))
                .thenReturn(List.of());
        when(episodeRepository.findByContentIdAndSeasonIdIsNullOrderBySortOrder(1L))
                .thenReturn(List.of(episode));

        List<ContentDTO> queue = contentService.listReviewQueue();

        assertThat(queue).hasSize(1);
        assertThat(queue.get(0).getId()).isEqualTo(1L);
        assertThat(queue.get(0).getEpisodes()).extracting(ContentDTO.EpisodeInfo::getVideoUrl)
                .containsExactly("/api/uploads/videos/generated.mp4");
    }

    @Test
    void reviewerApprovesSubmittedContentInsteadOfLegacyVideo() {
        Content content = reviewableContent(VideoStatus.PENDING);
        ContentDTO.ReviewRequest request = new ContentDTO.ReviewRequest();
        request.setStatus(VideoStatus.APPROVED);
        request.setReviewComment("Content approved");
        when(userRepository.findByUsername("reviewer")).thenReturn(Optional.of(reviewer()));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContentDTO reviewed = contentService.reviewContent("reviewer", 1L, request);

        assertThat(reviewed.getStatus()).isEqualTo(VideoStatus.APPROVED);
        assertThat(reviewed.getReviewedBy()).isEqualTo(11L);
        assertThat(reviewed.getReviewedAt()).isNotNull();
        assertThat(reviewed.getReviewComment()).isEqualTo("Content approved");
    }

    @Test
    void publishingApprovedContentPublishesItsEpisodes() {
        Content content = reviewableContent(VideoStatus.APPROVED);
        Episode episode = episode();
        when(userRepository.findByUsername("reviewer")).thenReturn(Optional.of(reviewer()));
        when(contentRepository.findById(1L)).thenReturn(Optional.of(content));
        when(episodeRepository.findByContentIdAndSeasonIdIsNullOrderBySortOrder(1L))
                .thenReturn(List.of(episode));
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContentDTO published = contentService.publishContent("reviewer", 1L);

        assertThat(published.getStatus()).isEqualTo(VideoStatus.PUBLISHED);
        assertThat(episode.getPublishedAt()).isNotNull();
        verify(episodeRepository).saveAll(List.of(episode));
    }

    private ContentDTO.CreateRequest createRequest(VideoType type) {
        ContentDTO.CreateRequest request = new ContentDTO.CreateRequest();
        request.setTitle("远方");
        request.setDescription("一部作品");
        request.setType(type);
        request.setGenre(VideoGenre.DOCUMENTARY);
        return request;
    }

    private ContentDTO.EpisodeRequest episodeRequest() {
        ContentDTO.EpisodeRequest request = new ContentDTO.EpisodeRequest();
        request.setEpisodeNumber(1);
        request.setTitle("正片");
        request.setVideoUrl("https://example.com/video.mp4");
        request.setDurationSeconds(7200L);
        return request;
    }

    private User studio(StudioStatus status) {
        User user = new User();
        user.setId(9L);
        user.setUsername("studio");
        user.setRole(Role.STUDIO);
        user.setStudioStatus(status);
        user.setEnabled(true);
        return user;
    }

    private User reviewer() {
        User user = new User();
        user.setId(11L);
        user.setUsername("reviewer");
        user.setRole(Role.REVIEWER);
        user.setEnabled(true);
        return user;
    }

    private Content reviewableContent(VideoStatus status) {
        Content content = new Content();
        content.setId(1L);
        content.setStudioId(9L);
        content.setType(VideoType.MOVIE);
        content.setGenre(VideoGenre.DOCUMENTARY);
        content.setTitle("Reviewable content");
        content.setDescription("Description");
        content.setCoverUrl("/api/uploads/covers/generated.png");
        content.setStatus(status);
        return content;
    }

    private Episode episode() {
        Episode episode = new Episode();
        episode.setId(3L);
        episode.setContentId(1L);
        episode.setEpisodeNumber(1);
        episode.setTitle("Main episode");
        episode.setVideoUrl("/api/uploads/videos/generated.mp4");
        episode.setDurationSeconds(120L);
        episode.setPreviewSeconds(120);
        episode.setSortOrder(1);
        return episode;
    }
}
