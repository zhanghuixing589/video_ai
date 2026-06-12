package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.VideoDTO;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.service.VideoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
public class VideoController {
    private final VideoService videoService;

    @PostMapping
    public ApiResponse<VideoDTO> createVideo(@Valid @RequestBody VideoDTO.CreateRequest request) {
        return ApiResponse.success("Video submitted for review", videoService.createVideo(request));
    }

    @GetMapping("/public")
    public ApiResponse<List<VideoDTO>> listPublished(
            @RequestParam(required = false) VideoType type,
            @RequestParam(required = false) VideoGenre genre,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(videoService.listPublished(type, genre, keyword));
    }

    @GetMapping("/studio/{studioId}")
    public ApiResponse<List<VideoDTO>> listByStudio(@PathVariable Long studioId) {
        return ApiResponse.success(videoService.listByStudio(studioId));
    }

    @GetMapping("/review-queue")
    public ApiResponse<List<VideoDTO>> listReviewQueue() {
        return ApiResponse.success(videoService.listReviewQueue());
    }

    @GetMapping("/{id}")
    public ApiResponse<VideoDTO> getVideo(@PathVariable Long id) {
        return ApiResponse.success(videoService.getVideo(id));
    }

    @PatchMapping("/{id}/review")
    public ApiResponse<VideoDTO> reviewVideo(
            @PathVariable Long id,
            @Valid @RequestBody VideoDTO.ReviewRequest request
    ) {
        return ApiResponse.success("Video reviewed", videoService.reviewVideo(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ApiResponse<VideoDTO> publishVideo(@PathVariable Long id) {
        return ApiResponse.success("Video published", videoService.publishVideo(id));
    }
}
