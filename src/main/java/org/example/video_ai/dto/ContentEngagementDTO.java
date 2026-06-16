package org.example.video_ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

public class ContentEngagementDTO {

    @Data
    public static class CommentRequest {
        @NotBlank
        @Size(max = 1000)
        private String body;
    }

    @Data
    public static class CommentInfo {
        private Long id;
        private Long contentId;
        private Long userId;
        private String authorUsername;
        private String authorDisplayName;
        private String authorAvatarUrl;
        private String body;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class RatingRequest {
        @NotNull
        @Min(1)
        @Max(10)
        private Integer score;
    }

    @Data
    public static class RatingSummary {
        private Double averageScore;
        private Long ratingCount;
        private Integer myScore;
    }
}
