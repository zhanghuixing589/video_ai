package org.example.video_ai.repository;

import org.example.video_ai.entity.Content;
import org.example.video_ai.enums.VideoStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findByStatusOrderByCreatedAtDesc(VideoStatus status);
    List<Content> findByStudioIdOrderByCreatedAtDesc(Long studioId);
}
