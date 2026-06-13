package org.example.video_ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "episodes")
@Data
@NoArgsConstructor
public class Episode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "season_id")
    private Long seasonId;

    @Column(name = "episode_number", nullable = false)
    private Integer episodeNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "video_url", nullable = false, length = 1000)
    private String videoUrl;

    @Column(name = "original_file_name", length = 255)
    private String originalFileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "duration_seconds", nullable = false)
    private Long durationSeconds;

    @Column(name = "preview_seconds", nullable = false)
    private Integer previewSeconds = 300;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

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
