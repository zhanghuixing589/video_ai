package org.example.video_ai.repository;

import org.example.video_ai.entity.Episode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByContentIdAndSeasonIdIsNullOrderBySortOrder(Long contentId);
    List<Episode> findBySeasonIdOrderBySortOrder(Long seasonId);
    boolean existsByContentIdAndSeasonIdIsNullAndEpisodeNumber(Long contentId, Integer episodeNumber);
    boolean existsBySeasonIdAndEpisodeNumber(Long seasonId, Integer episodeNumber);
}
