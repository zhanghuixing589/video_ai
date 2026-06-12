package org.example.video_ai.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "seasons", uniqueConstraints = {
        @UniqueConstraint(name = "uk_season_content_number", columnNames = {"content_id", "season_number"})
})
@Data
@NoArgsConstructor
public class Season {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_id", nullable = false)
    private Long contentId;

    @Column(name = "season_number", nullable = false)
    private Integer seasonNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
