package org.example.video_ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoDTO {
    private Long id;
    private String title;
    private String description;
    private String url;
    private Long duration;
    private String coverUrl;
    private VideoType type;
    private VideoGenre genre;
    private VideoStatus status;
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private Double rating;
    private Long createdBy;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewComment;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class CreateRequest {
        @NotBlank
        @Size(max = 200)
        private String title;

        @Size(max = 1000)
        private String description;

        @NotBlank
        private String url;

        @NotNull
        @PositiveOrZero
        private Long duration;

        private String coverUrl;

        @NotNull
        private VideoType type;

        @NotNull
        private VideoGenre genre;

        @NotNull
        private Long createdBy;
    }

    @Data
    public static class ReviewRequest {
        @NotNull
        private Long reviewerId;

        @NotNull
        private VideoStatus status;

        @Size(max = 1000)
        private String reviewComment;
    }
}
