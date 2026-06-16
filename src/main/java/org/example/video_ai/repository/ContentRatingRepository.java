package org.example.video_ai.repository;

import org.example.video_ai.entity.ContentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ContentRatingRepository extends JpaRepository<ContentRating, Long> {
    Optional<ContentRating> findByContentIdAndUserId(Long contentId, Long userId);

    long countByContentId(Long contentId);

    @Query("select avg(r.score) from ContentRating r where r.contentId = :contentId")
    Double averageScoreByContentId(@Param("contentId") Long contentId);
}
