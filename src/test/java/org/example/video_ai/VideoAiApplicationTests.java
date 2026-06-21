package org.example.video_ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
class VideoAiApplicationTests {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Spring Boot test context uses an isolated empty database migrated by Flyway")
    void contextLoadsWithIsolatedFlywaySchema() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).contains("jdbc:h2:mem:video_ai_test");
        }

        String latestMigrationVersion = jdbcTemplate.queryForObject("""
                select version
                from flyway_schema_history
                where success = true and version is not null
                order by installed_rank desc
                limit 1
                """, String.class);

        assertThat(latestMigrationVersion).isEqualTo("4");
        Integer transcodeJobTables = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.tables
                where lower(table_name) = 'media_transcode_jobs'
                """, Integer.class);
        assertThat(transcodeJobTables).isEqualTo(1);
    }

}
