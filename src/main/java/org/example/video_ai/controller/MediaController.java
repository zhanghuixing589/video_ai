package org.example.video_ai.controller;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.enums.TranscodeStatus;
import org.example.video_ai.service.MediaStorageService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {
    private final MediaStorageService mediaStorageService;

    @PostMapping("/covers")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<MediaUploadResponse> uploadCover(@RequestPart("file") MultipartFile file) {
        return ApiResponse.success("Cover uploaded", toResponse(mediaStorageService.storeCover(file)));
    }

    @PostMapping("/videos")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<VideoTranscodeResponse> uploadVideo(@RequestPart("file") MultipartFile file) {
        return ApiResponse.success("Video upload accepted for transcoding", toResponse(mediaStorageService.storeVideo(file)));
    }

    @GetMapping("/videos/jobs/{jobId}")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<VideoTranscodeResponse> getVideoJob(@PathVariable Long jobId) {
        return ApiResponse.success(toResponse(mediaStorageService.getVideoJob(jobId)));
    }

    private MediaUploadResponse toResponse(MediaStorageService.StoredMedia stored) {
        return new MediaUploadResponse(
                stored.url(),
                stored.originalFileName(),
                stored.size(),
                stored.contentType()
        );
    }

    private VideoTranscodeResponse toResponse(MediaStorageService.QueuedVideo queued) {
        return new VideoTranscodeResponse(
                queued.jobId(),
                queued.status(),
                queued.sourceUrl(),
                queued.hlsUrl(),
                queued.originalFileName(),
                queued.size(),
                queued.contentType(),
                queued.errorMessage()
        );
    }

    public record MediaUploadResponse(String url, String fileName, long size, String contentType) {
    }

    public record VideoTranscodeResponse(
            Long jobId,
            TranscodeStatus status,
            String sourceUrl,
            String hlsUrl,
            String fileName,
            long size,
            String contentType,
            String errorMessage
    ) {
    }
}
