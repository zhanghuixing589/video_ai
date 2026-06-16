package org.example.video_ai.repository;

import org.example.video_ai.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByContentIdOrderByCreatedAtDesc(Long contentId);
}
