package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.service.ContentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contents")
@RequiredArgsConstructor
public class ContentController {
    private final ContentService contentService;

    @GetMapping("/public")
    public ApiResponse<List<ContentDTO>> listPublished() {
        return ApiResponse.success(contentService.listPublished());
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<List<ContentDTO>> listMine(Authentication authentication) {
        return ApiResponse.success(contentService.listMine(authentication.getName()));
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<ContentDTO> create(
            Authentication authentication, @Valid @RequestBody ContentDTO.CreateRequest request) {
        return ApiResponse.success("作品已创建", contentService.createContent(authentication.getName(), request));
    }

    @PostMapping("/{contentId}/seasons")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<ContentDTO.SeasonInfo> addSeason(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentDTO.SeasonRequest request) {
        return ApiResponse.success("季度已添加",
                contentService.addSeason(authentication.getName(), contentId, request));
    }

    @PostMapping("/{contentId}/episodes")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<ContentDTO.EpisodeInfo> addEpisode(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentDTO.EpisodeRequest request) {
        return ApiResponse.success("剧集已添加",
                contentService.addEpisode(authentication.getName(), contentId, request));
    }

    @PostMapping("/{contentId}/episodes/batch")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<List<ContentDTO.EpisodeInfo>> addEpisodes(
            Authentication authentication,
            @PathVariable Long contentId,
            @Valid @RequestBody ContentDTO.BatchEpisodeRequest request) {
        return ApiResponse.success("剧集已批量添加",
                contentService.addEpisodes(authentication.getName(), contentId, request));
    }
}
