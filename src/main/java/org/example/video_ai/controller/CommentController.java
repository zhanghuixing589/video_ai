package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.service.CommentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contents/{contentId}")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @GetMapping("/comments")
    public ApiResponse<List<ContentEngagementDTO.CommentInfo>> listComments(
            Authentication authentication,
            @PathVariable Long contentId) {
        String username = authentication == null ? null : authentication.getName();
        return ApiResponse.success(commentService.listComments(contentId, username));
    }

    @PostMapping("/comments")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ContentEngagementDTO.CommentInfo> createComment(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentEngagementDTO.CommentRequest request) {
        return ApiResponse.success(
                "评论发布成功",
                commentService.createComment(authentication.getName(), contentId, request));
    }

    @PostMapping("/comments/{commentId}/like")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ContentEngagementDTO.CommentInfo> toggleLike(
            Authentication authentication,
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @Valid @RequestBody ContentEngagementDTO.CommentLikeRequest request) {
        return ApiResponse.success(
                request.getLiked() ? "点赞成功" : "取消点赞成功",
                commentService.toggleLike(authentication.getName(), contentId, commentId, request));
    }

    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteComment(
            Authentication authentication,
            @PathVariable Long contentId,
            @PathVariable Long commentId) {
        commentService.deleteComment(authentication.getName(), contentId, commentId);
        return ApiResponse.success("评论删除成功", null);
    }

    @GetMapping("/rating")
    public ApiResponse<ContentEngagementDTO.RatingSummary> getRating(
            Authentication authentication,
            @PathVariable Long contentId) {
        String username = authentication == null ? null : authentication.getName();
        return ApiResponse.success(commentService.getRatingSummary(username, contentId));
    }

    @PostMapping("/rating")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ContentEngagementDTO.RatingSummary> rate(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentEngagementDTO.RatingRequest request) {
        return ApiResponse.success(
                "评分保存成功",
                commentService.rateContent(authentication.getName(), contentId, request));
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<ContentDTO>> recommendations(@PathVariable Long contentId) {
        return ApiResponse.success(commentService.recommendations(contentId));
    }
}