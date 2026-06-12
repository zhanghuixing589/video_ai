package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.VideoDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.entity.Video;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.repository.UserRepository;
import org.example.video_ai.repository.VideoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VideoService {
    private final VideoRepository videoRepository;
    private final UserRepository userRepository;

    @Transactional
    public VideoDTO createVideo(VideoDTO.CreateRequest request) {
        User studio = userRepository.findById(request.getCreatedBy())
                .orElseThrow(() -> new IllegalArgumentException("Studio user not found: " + request.getCreatedBy()));
        if (studio.getRole() != Role.STUDIO || studio.getStudioStatus() != StudioStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved studios can submit videos");
        }

        Video video = new Video();
        video.setTitle(request.getTitle());
        video.setDescription(request.getDescription());
        video.setUrl(request.getUrl());
        video.setDuration(request.getDuration());
        video.setCoverUrl(request.getCoverUrl());
        video.setType(request.getType());
        video.setGenre(request.getGenre());
        video.setCreatedBy(request.getCreatedBy());
        video.setStatus(VideoStatus.PENDING);
        return toDTO(videoRepository.save(video));
    }

    @Transactional(readOnly = true)
    public List<VideoDTO> listPublished(VideoType type, VideoGenre genre, String keyword) {
        List<Video> videos;
        if (keyword != null && !keyword.isBlank()) {
            videos = videoRepository.findByTitleContainingIgnoreCaseAndStatus(keyword, VideoStatus.PUBLISHED);
        } else if (type != null && genre != null) {
            videos = videoRepository.findByTypeAndGenreAndStatus(type, genre, VideoStatus.PUBLISHED);
        } else if (type != null) {
            videos = videoRepository.findByTypeAndStatus(type, VideoStatus.PUBLISHED);
        } else if (genre != null) {
            videos = videoRepository.findByGenreAndStatus(genre, VideoStatus.PUBLISHED);
        } else {
            videos = videoRepository.findByStatus(VideoStatus.PUBLISHED);
        }
        return videos.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<VideoDTO> listByStudio(Long studioId) {
        return videoRepository.findByCreatedBy(studioId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<VideoDTO> listReviewQueue() {
        return videoRepository.findByStatus(VideoStatus.PENDING).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public VideoDTO getVideo(Long id) {
        return toDTO(findVideo(id));
    }

    @Transactional
    public VideoDTO reviewVideo(Long id, VideoDTO.ReviewRequest request) {
        if (request.getStatus() != VideoStatus.APPROVED && request.getStatus() != VideoStatus.REJECTED) {
            throw new IllegalArgumentException("Review status must be APPROVED or REJECTED");
        }
        User reviewer = userRepository.findById(request.getReviewerId())
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found: " + request.getReviewerId()));
        if (reviewer.getRole() != Role.REVIEWER && reviewer.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only reviewers or administrators can review videos");
        }

        Video video = findVideo(id);
        video.setStatus(request.getStatus());
        video.setReviewedBy(request.getReviewerId());
        video.setReviewedAt(LocalDateTime.now());
        video.setReviewComment(request.getReviewComment());
        return toDTO(videoRepository.save(video));
    }

    @Transactional
    public VideoDTO publishVideo(Long id) {
        Video video = findVideo(id);
        if (video.getStatus() != VideoStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved videos can be published");
        }
        video.setStatus(VideoStatus.PUBLISHED);
        video.setPublishedAt(LocalDateTime.now());
        return toDTO(videoRepository.save(video));
    }

    private Video findVideo(Long id) {
        return videoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Video not found: " + id));
    }

    private VideoDTO toDTO(Video video) {
        return new VideoDTO(
                video.getId(),
                video.getTitle(),
                video.getDescription(),
                video.getUrl(),
                video.getDuration(),
                video.getCoverUrl(),
                video.getType(),
                video.getGenre(),
                video.getStatus(),
                video.getViewCount(),
                video.getLikeCount(),
                video.getCommentCount(),
                video.getRating(),
                video.getCreatedBy(),
                video.getReviewedBy(),
                video.getReviewedAt(),
                video.getReviewComment(),
                video.getPublishedAt(),
                video.getCreatedAt(),
                video.getUpdatedAt()
        );
    }
}
