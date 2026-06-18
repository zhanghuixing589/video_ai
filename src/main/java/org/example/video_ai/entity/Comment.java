package org.example.video_ai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "content_comments", indexes = {
        @Index(name = "idx_content_comment_content", columnList = "content_id"),
        @Index(name = "idx_content_comment_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "author_username", nullable = false, length = 64)
    private String authorUsername;

    @Column(name = "author_display_name", length = 64)
    private String authorDisplayName;

    @Column(name = "author_avatar_url", length = 500)
    private String authorAvatarUrl;

    @Column(nullable = false, length = 1000)
    private String body;

    //父级评论ID null 表示顶级
    @Column(name = "parent_id")
    private Long parentId;

    //根ID，用于快速查询
    @Column(name = "root_id")
    private Long rootId;

    //点赞数
    @Column(name = "like_count")
    private Integer likeCount = 0;

    //回复数
    @Column(name = "reply_count")
    private Integer replyCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
