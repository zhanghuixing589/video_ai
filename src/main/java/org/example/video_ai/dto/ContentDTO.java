package org.example.video_ai.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class ContentDTO {
    private Long id;
    private String title;
    private String description;
    private String coverUrl;
    private VideoType type;
    private VideoGenre genre;
    private VideoStatus status;
    private Long studioId;
    private List<SeasonInfo> seasons = new ArrayList<>();
    private List<EpisodeInfo> episodes = new ArrayList<>();

    @Data
    public static class CreateRequest {
        @NotBlank @Size(max = 200)
        private String title;
        @Size(max = 1000)
        private String description;
        private String coverUrl;
        @NotNull
        private VideoType type;
        @NotNull
        private VideoGenre genre;
    }

    @Data
    public static class SeasonRequest {
        @NotNull @Positive
        private Integer seasonNumber;
        @NotBlank @Size(max = 200)
        private String title;
        @PositiveOrZero
        private Integer sortOrder;
    }

    @Data
    public static class EpisodeRequest {
        private Long seasonId;
        @NotNull @Positive
        private Integer episodeNumber;
        @NotBlank @Size(max = 200)
        private String title;
        @NotBlank
        private String videoUrl;
        @NotNull @Positive
        private Long durationSeconds;
        @PositiveOrZero
        private Integer sortOrder;
    }

    @Data
    public static class BatchEpisodeRequest {
        @NotEmpty
        private List<@Valid EpisodeRequest> episodes;
    }

    @Data
    public static class SeasonInfo {
        private Long id;
        private Integer seasonNumber;
        private String title;
        private Integer sortOrder;
        private List<EpisodeInfo> episodes = new ArrayList<>();
    }

    @Data
    public static class EpisodeInfo {
        private Long id;
        private Integer episodeNumber;
        private String title;
        private String videoUrl;
        private Long durationSeconds;
        private Integer previewSeconds;
        private Integer sortOrder;
        private LocalDateTime publishedAt;
    }
}
