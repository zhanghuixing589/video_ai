package org.example.video_ai.service;

import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.Episode;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.enums.VideoGenre;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
}
