package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.service.CommentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/contents/{contentId}")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @GetMapping("/comments")
    public ApiResponse<List<ContentEngagementDTO.CommentInfo>> listComments(@PathVariable Long contentId) {
        return ApiResponse.success(commentService.listComments(contentId));
    }

    @PostMapping("/comments")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ContentEngagementDTO.CommentInfo> createComment(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentEngagementDTO.CommentRequest request) {
        return ApiResponse.success(
                "Comment created",
                commentService.createComment(authentication.getName(), contentId, request));
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
                "Rating saved",
                commentService.rateContent(authentication.getName(), contentId, request));
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<ContentDTO>> recommendations(@PathVariable Long contentId) {
        return ApiResponse.success(commentService.recommendations(contentId));
    }
}
