package org.example.video_ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsDTO {
    private Long totalVideos;
    private Long totalViews;
    private Long totalLikes;
    private Long totalComments;
    private Double averageRating;
    private Long publishedCount;
    private Long pendingCount;
    private Long draftCount;
    private Long rejectedCount;
}