package org.example.video_ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class ContentEngagementDTO {

    @Data
    public static class CommentRequest {
        @NotBlank
        @Size(max = 1000)
        private String body;

        //父评论ID
        private Long parentId;
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
        private Integer likeCount;
        private Integer replyCount;
        private Boolean likedByCurrentUser; //当前用户是否点赞
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        //回复
        private Long parentId;
        private Long rootId;
        private List<CommentInfo> replies; //字回复

    }

    @Data
    public static class RatingRequest {
        @NotNull(message = "评分不能为空")
        @Min(value = 1,message = "评分必须在1-10分之间")
        @Max(value = 10,message = "评分必须在1-10分之间")
        private Integer score;
    }

    @Data
    public static class RatingSummary {
        private Double averageScore;
        private Long ratingCount;
        private Integer myScore;
    }

    @Data
    public static class CommentLikeRequest{
        @NotNull
        private Boolean liked; //true-点赞 false-取消点赞
    }
}
