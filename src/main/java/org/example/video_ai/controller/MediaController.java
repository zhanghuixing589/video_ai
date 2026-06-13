package org.example.video_ai.controller;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.service.MediaStorageService;
import org.springframework.security.access.prepost.PreAuthorize;
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
        return ApiResponse.success("封面上传成功", toResponse(mediaStorageService.storeCover(file)));
    }

    @PostMapping("/videos")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<MediaUploadResponse> uploadVideo(@RequestPart("file") MultipartFile file) {
        return ApiResponse.success("视频上传成功", toResponse(mediaStorageService.storeVideo(file)));
    }

    private MediaUploadResponse toResponse(MediaStorageService.StoredMedia stored) {
        return new MediaUploadResponse(
                stored.url(),
                stored.originalFileName(),
                stored.size(),
                stored.contentType()
        );
    }

    public record MediaUploadResponse(String url, String fileName, long size, String contentType) {
    }
}
