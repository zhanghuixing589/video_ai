package org.example.video_ai.repository;

import org.example.video_ai.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike,Long> {
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    List<CommentLike> findByUserId(Long userId);

    long countByCommentId(Long commentId);

    @Modifying
    @Query("DELETE FROM CommentLike cl WHERE cl.commentId = :commentId AND cl.userId = :userId")
    void deleteByCommentIdAndUserId(@Param("commentId") Long commentId, @Param("userId") Long userId);

}
