package org.example.video_ai.repository;

import org.example.video_ai.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByContentIdOrderByCreatedAtDesc(Long contentId);

    @Query("SELECT c FROM Comment c WHERE c.contentId = :contentId AND c.parentId IS NULL ORDER BY c.createdAt DESC")
    List<Comment> findRootCommentsByContentId(@Param("contentId") Long contentId);

    @Query("SELECT c FROM Comment c WHERE c.rootId = :rootId AND c.parentId IS NOT NULL ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByRootId(@Param("rootId") Long rootId);

    @Query("SELECT c FROM Comment c WHERE c.parentId = :parentId ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.rootId = :rootId AND c.id != :rootId")
    long countRepliesByRootId(@Param("rootId") Long rootId);

    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + :delta WHERE c.id = :commentId")
    int updateLikeCount(@Param("commentId") Long commentId, @Param("delta") int delta);

    @Modifying
    @Query("UPDATE Comment c SET c.replyCount = c.replyCount + :delta WHERE c.id = :commentId")
    int updateReplyCount(@Param("commentId") Long commentId, @Param("delta") int delta);

    @Query("SELECT c FROM Comment c WHERE c.contentId = :contentId ORDER BY c.createdAt DESC")
    List<Comment> findAllByContentId(@Param("contentId") Long contentId);
}
