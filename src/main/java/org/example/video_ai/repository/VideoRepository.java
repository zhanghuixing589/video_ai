package org.example.video_ai.repository;

import org.example.video_ai.entity.Video;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VideoRepository extends JpaRepository<Video, Long> {
    List<Video> findByStatus(VideoStatus status);

    List<Video> findByCreatedBy(Long createdBy);

    List<Video> findByTypeAndStatus(VideoType type, VideoStatus status);

    List<Video> findByGenreAndStatus(VideoGenre genre, VideoStatus status);

    List<Video> findByTypeAndGenreAndStatus(VideoType type, VideoGenre genre, VideoStatus status);

    List<Video> findByTitleContainingIgnoreCaseAndStatus(String title, VideoStatus status);
}
