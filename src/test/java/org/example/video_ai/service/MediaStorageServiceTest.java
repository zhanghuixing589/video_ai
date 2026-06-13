package org.example.video_ai.service;

import org.example.video_ai.config.MediaStorageProperties;
import org.example.video_ai.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MediaStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storesCoverWithGeneratedSafeFilename() {
        MediaStorageService service = service();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "../../cover.png",
                "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1}
        );

        MediaStorageService.StoredMedia stored = service.storeCover(file);

        assertThat(stored.url()).startsWith("/api/uploads/covers/").endsWith(".png");
        assertThat(stored.url()).doesNotContain("..", "cover.png");
        assertThat(stored.originalFileName()).isEqualTo("cover.png");
        assertThat(Files.exists(fileFor(stored.url()))).isTrue();
    }

    @Test
    void storesMp4VideoAndPreservesMetadata() {
        MediaStorageService service = service();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "mountain.mp4",
                "video/mp4",
                mp4Bytes()
        );

        MediaStorageService.StoredMedia stored = service.storeVideo(file);

        assertThat(stored.url()).startsWith("/api/uploads/videos/").endsWith(".mp4");
        assertThat(stored.originalFileName()).isEqualTo("mountain.mp4");
        assertThat(stored.contentType()).isEqualTo("video/mp4");
        assertThat(stored.size()).isEqualTo(mp4Bytes().length);
        assertThat(Files.exists(fileFor(stored.url()))).isTrue();
    }

    @Test
    void rejectsCoverWhenSignatureDoesNotMatchMimeType() {
        MediaStorageService service = service();
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.png", "image/png", "not-a-png".getBytes()
        );

        assertThatThrownBy(() -> service.storeCover(file))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void rejectsUnsupportedVideoType() {
        MediaStorageService service = service();
        MockMultipartFile file = new MockMultipartFile(
                "file", "clip.avi", "video/x-msvideo", "RIFF-data".getBytes()
        );

        assertThatThrownBy(() -> service.storeVideo(file))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void enforcesSeparateCoverAndVideoSizeLimits() {
        MediaStorageProperties properties = properties();
        properties.setMaxCoverSize(8);
        properties.setMaxVideoSize(12);
        MediaStorageService service = new MediaStorageService(properties);

        assertThatThrownBy(() -> service.storeCover(png("cover.png")))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> service.storeVideo(new MockMultipartFile(
                "file", "large.mp4", "video/mp4", new byte[13]
        ))).isInstanceOf(ApiException.class);
    }

    private MediaStorageService service() {
        return new MediaStorageService(properties());
    }

    private MediaStorageProperties properties() {
        MediaStorageProperties properties = new MediaStorageProperties();
        properties.setCoverStorageDirectory(tempDir.resolve("covers").toString());
        properties.setVideoStorageDirectory(tempDir.resolve("videos").toString());
        properties.setCoverPublicPath("/api/uploads/covers/");
        properties.setVideoPublicPath("/api/uploads/videos/");
        properties.setMaxCoverSize(10 * 1024 * 1024);
        properties.setMaxVideoSize(2L * 1024 * 1024 * 1024);
        return properties;
    }

    private Path fileFor(String url) {
        String filename = url.substring(url.lastIndexOf('/') + 1);
        return url.contains("/covers/")
                ? tempDir.resolve("covers").resolve(filename)
                : tempDir.resolve("videos").resolve(filename);
    }

    private MockMultipartFile png(String name) {
        return new MockMultipartFile(
                "file",
                name,
                "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1}
        );
    }

    private byte[] mp4Bytes() {
        return new byte[]{
                0, 0, 0, 24, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm',
                0, 0, 0, 0, 'i', 's', 'o', 'm', 'm', 'p', '4', '2'
        };
    }
}
