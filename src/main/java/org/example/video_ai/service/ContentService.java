package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.entity.Content;
import org.example.video_ai.entity.Episode;
import org.example.video_ai.entity.Season;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.exception.ApiException;
import org.example.video_ai.repository.ContentRepository;
import org.example.video_ai.repository.EpisodeRepository;
import org.example.video_ai.repository.SeasonRepository;
import org.example.video_ai.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentService {
    private final ContentRepository contentRepository;
    private final SeasonRepository seasonRepository;
    private final EpisodeRepository episodeRepository;
    private final UserRepository userRepository;

    @Transactional
    public ContentDTO createContent(String username, ContentDTO.CreateRequest request) {
        User studio = requireApprovedStudio(username);
        Content content = new Content();
        content.setTitle(request.getTitle().trim());
        content.setDescription(trimToNull(request.getDescription()));
        content.setCoverUrl(trimToNull(request.getCoverUrl()));
        content.setType(request.getType());
        content.setGenre(request.getGenre());
        content.setStatus(VideoStatus.DRAFT);
        content.setStudioId(studio.getId());
        return toDTO(contentRepository.save(content));
    }

    @Transactional(readOnly = true)
    public List<ContentDTO> listPublished() {
        return contentRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.PUBLISHED)
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ContentDTO> listMine(String username) {
        User studio = requireApprovedStudio(username);
        return contentRepository.findByStudioIdOrderByCreatedAtDesc(studio.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public ContentDTO.SeasonInfo addSeason(String username, Long contentId, ContentDTO.SeasonRequest request) {
        Content content = requireOwnedContent(username, contentId);
        if (content.getType() == VideoType.MOVIE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "电影不需要季度");
        }
        if (seasonRepository.existsByContentIdAndSeasonNumber(contentId, request.getSeasonNumber())) {
            throw new ApiException(HttpStatus.CONFLICT, "季度编号已存在");
        }
        Season season = new Season();
        season.setContentId(contentId);
        season.setSeasonNumber(request.getSeasonNumber());
        season.setTitle(request.getTitle().trim());
        season.setSortOrder(request.getSortOrder() == null ? request.getSeasonNumber() : request.getSortOrder());
        resetReview(content);
        return toSeasonInfo(seasonRepository.save(season));
    }

    @Transactional
    public ContentDTO.EpisodeInfo addEpisode(String username, Long contentId, ContentDTO.EpisodeRequest request) {
        Content content = requireOwnedContent(username, contentId);
        validateEpisode(content, request);
        Episode episode = new Episode();
        episode.setContentId(contentId);
        episode.setSeasonId(request.getSeasonId());
        episode.setEpisodeNumber(request.getEpisodeNumber());
        episode.setTitle(request.getTitle().trim());
        episode.setVideoUrl(request.getVideoUrl().trim());
        episode.setDurationSeconds(request.getDurationSeconds());
        episode.setPreviewSeconds(300);
        episode.setSortOrder(request.getSortOrder() == null ? request.getEpisodeNumber() : request.getSortOrder());
        resetReview(content);
        return toEpisodeInfo(episodeRepository.save(episode));
    }

    @Transactional
    public List<ContentDTO.EpisodeInfo> addEpisodes(
            String username, Long contentId, ContentDTO.BatchEpisodeRequest request) {
        return request.getEpisodes().stream()
                .map(episode -> addEpisode(username, contentId, episode))
                .toList();
    }

    private void validateEpisode(Content content, ContentDTO.EpisodeRequest request) {
        if (content.getType() == VideoType.MOVIE && request.getSeasonId() != null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "电影剧集不能属于季度");
        }
        if (content.getType() != VideoType.MOVIE && request.getSeasonId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "电视剧和综艺剧集必须选择季度");
        }
        if (request.getSeasonId() == null) {
            if (episodeRepository.existsByContentIdAndSeasonIdIsNullAndEpisodeNumber(
                    content.getId(), request.getEpisodeNumber())) {
                throw new ApiException(HttpStatus.CONFLICT, "集数已存在");
            }
        } else {
            seasonRepository.findByIdAndContentId(request.getSeasonId(), content.getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "季度不存在"));
            if (episodeRepository.existsBySeasonIdAndEpisodeNumber(
                    request.getSeasonId(), request.getEpisodeNumber())) {
                throw new ApiException(HttpStatus.CONFLICT, "集数已存在");
            }
        }
    }

    private User requireApprovedStudio(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "用户不存在"));
        if (user.getRole() != Role.STUDIO || user.getStudioStatus() != StudioStatus.APPROVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "只有审核通过的制片厂可以管理作品");
        }
        return user;
    }

    private Content requireOwnedContent(String username, Long contentId) {
        User studio = requireApprovedStudio(username);
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "作品不存在"));
        if (!studio.getId().equals(content.getStudioId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "不能管理其他制片厂的作品");
        }
        return content;
    }

    private void resetReview(Content content) {
        if (content.getStatus() != VideoStatus.DRAFT) {
            content.setStatus(VideoStatus.PENDING);
            content.setReviewedAt(null);
            content.setReviewedBy(null);
            content.setReviewComment(null);
            contentRepository.save(content);
        }
    }

    private ContentDTO toDTO(Content content) {
        ContentDTO dto = new ContentDTO();
        dto.setId(content.getId());
        dto.setTitle(content.getTitle());
        dto.setDescription(content.getDescription());
        dto.setCoverUrl(content.getCoverUrl());
        dto.setType(content.getType());
        dto.setGenre(content.getGenre());
        dto.setStatus(content.getStatus());
        dto.setStudioId(content.getStudioId());
        dto.setEpisodes(episodeRepository.findByContentIdAndSeasonIdIsNullOrderBySortOrder(content.getId())
                .stream().map(this::toEpisodeInfo).toList());
        dto.setSeasons(seasonRepository.findByContentIdOrderBySortOrder(content.getId()).stream().map(season -> {
            ContentDTO.SeasonInfo info = toSeasonInfo(season);
            info.setEpisodes(episodeRepository.findBySeasonIdOrderBySortOrder(season.getId())
                    .stream().map(this::toEpisodeInfo).toList());
            return info;
        }).toList());
        return dto;
    }

    private ContentDTO.SeasonInfo toSeasonInfo(Season season) {
        ContentDTO.SeasonInfo info = new ContentDTO.SeasonInfo();
        info.setId(season.getId());
        info.setSeasonNumber(season.getSeasonNumber());
        info.setTitle(season.getTitle());
        info.setSortOrder(season.getSortOrder());
        return info;
    }

    private ContentDTO.EpisodeInfo toEpisodeInfo(Episode episode) {
        ContentDTO.EpisodeInfo info = new ContentDTO.EpisodeInfo();
        info.setId(episode.getId());
        info.setEpisodeNumber(episode.getEpisodeNumber());
        info.setTitle(episode.getTitle());
        info.setVideoUrl(episode.getVideoUrl());
        info.setDurationSeconds(episode.getDurationSeconds());
        info.setPreviewSeconds(episode.getPreviewSeconds());
        info.setSortOrder(episode.getSortOrder());
        info.setPublishedAt(episode.getPublishedAt());
        return info;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
