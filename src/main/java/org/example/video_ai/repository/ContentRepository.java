package org.example.video_ai.repository;

import org.example.video_ai.entity.Content;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ContentRepository extends JpaRepository<Content, Long> {
    List<Content> findByStatusOrderByCreatedAtDesc(VideoStatus status);
    List<Content> findByStudioIdOrderByCreatedAtDesc(Long studioId);
    List<Content> findTop8ByStatusAndIdNotAndTypeAndGenreOrderByUpdatedAtDesc(
            VideoStatus status,
            Long id,
            VideoType type,
            VideoGenre genre);
    List<Content> findTop8ByStatusAndIdNotAndTypeOrderByUpdatedAtDesc(
            VideoStatus status,
            Long id,
            VideoType type);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Content c
            set c.status = :status,
                c.reviewedBy = :reviewedBy,
                c.reviewedAt = :reviewedAt,
                c.reviewComment = :reviewComment,
                c.updatedAt = :reviewedAt
            where c.id = :contentId
              and c.status = org.example.video_ai.enums.VideoStatus.PENDING
            """)
    int reviewPending(
            @Param("contentId") Long contentId,
            @Param("status") VideoStatus status,
            @Param("reviewedBy") Long reviewedBy,
            @Param("reviewedAt") LocalDateTime reviewedAt,
            @Param("reviewComment") String reviewComment);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Content c
            set c.status = org.example.video_ai.enums.VideoStatus.PUBLISHED,
                c.updatedAt = :updatedAt
            where c.id = :contentId
              and c.status = org.example.video_ai.enums.VideoStatus.APPROVED
            """)
    int publishApproved(
            @Param("contentId") Long contentId,
            @Param("updatedAt") LocalDateTime updatedAt);
}
