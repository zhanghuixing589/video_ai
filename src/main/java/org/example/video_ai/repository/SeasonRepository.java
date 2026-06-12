package org.example.video_ai.repository;

import org.example.video_ai.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeasonRepository extends JpaRepository<Season, Long> {
    List<Season> findByContentIdOrderBySortOrder(Long contentId);
    Optional<Season> findByIdAndContentId(Long id, Long contentId);
    boolean existsByContentIdAndSeasonNumber(Long contentId, Integer seasonNumber);
}
