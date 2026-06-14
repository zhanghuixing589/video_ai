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
import java.util.ArrayList;
import java.time.LocalDateTime;

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

    @Transactional
    public ContentDTO updateContent(
            String username,
            Long contentId,
            ContentDTO.UpdateRequest request
    ) {
        Content content = requireOwnedContent(username, contentId);
        content.setTitle(request.getTitle().trim());
        content.setDescription(trimToNull(request.getDescription()));
        content.setCoverUrl(trimToNull(request.getCoverUrl()));
        content.setGenre(request.getGenre());
        resetReview(content);
        return toDTO(contentRepository.save(content));
    }

    @Transactional
    public ContentDTO submitForReview(String username, Long contentId) {
        Content content = requireOwnedContent(username, contentId);
        if (content.getCoverUrl() == null || content.getCoverUrl().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请先上传作品封面");
        }
        if (content.getDescription() == null || content.getDescription().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请完善作品简介");
        }
        boolean hasDirectEpisodes = !episodeRepository
                .findByContentIdAndSeasonIdIsNullOrderBySortOrder(contentId)
                .isEmpty();
        boolean hasSeasonEpisodes = seasonRepository.findByContentIdOrderBySortOrder(contentId)
                .stream()
                .anyMatch(season -> !episodeRepository.findBySeasonIdOrderBySortOrder(season.getId()).isEmpty());
        if (!hasDirectEpisodes && !hasSeasonEpisodes) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请至少上传一个视频文件");
        }
        content.setStatus(VideoStatus.PENDING);
        content.setReviewedAt(null);
        content.setReviewedBy(null);
        content.setReviewComment(null);
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

    @Transactional(readOnly = true)
    public List<ContentDTO> listReviewQueue() {
        List<Content> queue = new ArrayList<>(
                contentRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.PENDING));
        queue.addAll(contentRepository.findByStatusOrderByCreatedAtDesc(VideoStatus.APPROVED));
        return queue.stream().map(this::toDTO).toList();
    }

    @Transactional
    public ContentDTO reviewContent(String username, Long contentId, ContentDTO.ReviewRequest request) {
        User reviewer = requireReviewer(username);
        if (request.getStatus() != VideoStatus.APPROVED && request.getStatus() != VideoStatus.REJECTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Review status must be APPROVED or REJECTED");
        }
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Content not found"));
        if (content.getStatus() != VideoStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only pending content can be reviewed");
        }
        LocalDateTime reviewedAt = LocalDateTime.now();
        int updated = contentRepository.reviewPending(
                contentId,
                request.getStatus(),
                reviewer.getId(),
                reviewedAt,
                trimToNull(request.getReviewComment()));
        if (updated != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Content status changed, please refresh and retry");
        }
        return toDTO(contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Content not found")));
    }

    @Transactional
    public ContentDTO publishContent(String username, Long contentId) {
        requireReviewer(username);
        Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Content not found"));
        if (content.getStatus() != VideoStatus.APPROVED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only approved content can be published");
        }

        LocalDateTime publishedAt = LocalDateTime.now();
        List<Episode> episodes = new ArrayList<>(
                episodeRepository.findByContentIdAndSeasonIdIsNullOrderBySortOrder(contentId));
        seasonRepository.findByContentIdOrderBySortOrder(contentId)
                .forEach(season -> episodes.addAll(
                        episodeRepository.findBySeasonIdOrderBySortOrder(season.getId())));
        if (episodes.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Content must contain at least one episode");
        }
        episodes.forEach(episode -> episode.setPublishedAt(publishedAt));
        episodeRepository.saveAll(episodes);
        int updated = contentRepository.publishApproved(contentId, publishedAt);
        if (updated != 1) {
            throw new ApiException(HttpStatus.CONFLICT, "Content status changed, please refresh and retry");
        }
        return toDTO(contentRepository.findById(contentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Content not found")));
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
        // 添加季度后，如果作品已发布或已通过，需要重新审核
        degradeContentStatusOnContentChange(content);
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
        episode.setOriginalFileName(trimToNull(request.getOriginalFileName()));
        episode.setFileSize(request.getFileSize());
        episode.setDurationSeconds(request.getDurationSeconds());
        episode.setPreviewSeconds(300);
        episode.setSortOrder(request.getSortOrder() == null ? request.getEpisodeNumber() : request.getSortOrder());
        // 添加剧集后，如果作品已发布或已通过，需要重新审核
        degradeContentStatusOnContentChange(content);
        return toEpisodeInfo(episodeRepository.save(episode));
    }

    @Transactional
    public List<ContentDTO.EpisodeInfo> addEpisodes(
            String username, Long contentId, ContentDTO.BatchEpisodeRequest request) {
        return request.getEpisodes().stream()
                .map(episode -> addEpisode(username, contentId, episode))
                .toList();
    }

    /**
     * 当作品内容发生变化时（添加/修改/删除剧集或季度），
     * 如果作品状态是 PUBLISHED 或 APPROVED，自动降级为 DRAFT。
     *
     * 注意：此方法会直接修改传入的 Content 对象的状态，
     * 调用方需要确保后续保存该实体。
     */
    private void degradeContentStatusOnContentChange(Content content) {
        VideoStatus currentStatus = content.getStatus();

        // 只有已发布或已通过审核的作品才需要降级
        if (currentStatus == VideoStatus.PUBLISHED || currentStatus == VideoStatus.APPROVED) {
            content.setStatus(VideoStatus.DRAFT);
            content.setReviewedAt(null);
            content.setReviewedBy(null);
            content.setReviewComment(null);
            // 保存状态变更
            contentRepository.save(content);
        }
    }

    /**
     * 删除剧集时的降级处理（如果业务需要）
     */
    @Transactional
    public void deleteEpisode(String username, Long contentId, Long episodeId) {
        Content content = requireOwnedContent(username, contentId);
        Episode episode = episodeRepository.findById(episodeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "剧集不存在"));

        if (!episode.getContentId().equals(contentId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "剧集不属于该作品");
        }

        episodeRepository.delete(episode);
        // 删除剧集后也需要降级
        degradeContentStatusOnContentChange(content);
    }

    /**
     * 删除季度时的降级处理（如果业务需要）
     */
    @Transactional
    public void deleteSeason(String username, Long contentId, Long seasonId) {
        Content content = requireOwnedContent(username, contentId);
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "季度不存在"));

        if (!season.getContentId().equals(contentId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "季度不属于该作品");
        }

        // 先删除该季度下的所有剧集
        List<Episode> episodes = episodeRepository.findBySeasonIdOrderBySortOrder(seasonId);
        episodeRepository.deleteAll(episodes);

        seasonRepository.delete(season);
        // 删除季度后也需要降级
        degradeContentStatusOnContentChange(content);
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

    private User requireReviewer(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getRole() != Role.REVIEWER && user.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only reviewers or administrators can review content");
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
        dto.setReviewedBy(content.getReviewedBy());
        dto.setReviewedAt(content.getReviewedAt());
        dto.setReviewComment(content.getReviewComment());
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
        info.setOriginalFileName(episode.getOriginalFileName());
        info.setFileSize(episode.getFileSize());
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
