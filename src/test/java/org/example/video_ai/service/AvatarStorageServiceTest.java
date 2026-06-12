package org.example.video_ai.service;

import org.example.video_ai.config.AvatarStorageProperties;
import org.example.video_ai.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AvatarStorageServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void storesSupportedImagesWithGeneratedNames() {
        AvatarStorageService service = service(5 * 1024 * 1024);
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../avatar.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1}
        );

        String url = service.store(file);

        assertTrue(url.startsWith("/api/uploads/avatars/"));
        assertTrue(url.endsWith(".png"));
        assertFalse(url.contains(".."));
        assertFalse(url.contains("avatar.png"));
        assertTrue(Files.exists(tempDir.resolve(url.substring(url.lastIndexOf('/') + 1))));
    }

    @Test
    void generatesDifferentNamesForRepeatedUploads() {
        AvatarStorageService service = service(5 * 1024 * 1024);
        MockMultipartFile file = jpeg("avatar.jpg");

        String first = service.store(file);
        String second = service.store(file);

        assertNotEquals(first, second);
    }

    @Test
    void rejectsUnsupportedContentTypes() {
        AvatarStorageService service = service(5 * 1024 * 1024);
        MockMultipartFile file = new MockMultipartFile("file", "avatar.gif", "image/gif", "GIF89a".getBytes());

        assertThrows(ApiException.class, () -> service.store(file));
    }

    @Test
    void rejectsContentWhoseSignatureDoesNotMatchItsDeclaredType() {
        AvatarStorageService service = service(5 * 1024 * 1024);
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", "not-a-png".getBytes()
        );

        assertThrows(ApiException.class, () -> service.store(file));
    }

    @Test
    void rejectsFilesLargerThanConfiguredLimit() {
        AvatarStorageService service = service(8);
        MockMultipartFile file = jpeg("avatar.jpg");

        assertThrows(ApiException.class, () -> service.store(file));
    }

    @Test
    void deletesOnlyManagedAvatarUrls() throws Exception {
        AvatarStorageService service = service(5 * 1024 * 1024);
        String managedUrl = service.store(jpeg("avatar.jpg"));
        Path managedFile = tempDir.resolve(managedUrl.substring(managedUrl.lastIndexOf('/') + 1));
        Path unrelated = tempDir.resolve("unrelated.jpg");
        Files.write(unrelated, new byte[]{1});

        service.deleteManaged(managedUrl);
        service.deleteManaged("https://example.com/avatar.jpg");
        service.deleteManaged("/api/uploads/avatars/../unrelated.jpg");

        assertFalse(Files.exists(managedFile));
        assertTrue(Files.exists(unrelated));
    }

    private AvatarStorageService service(long maxSize) {
        AvatarStorageProperties properties = new AvatarStorageProperties();
        properties.setStorageDirectory(tempDir.toString());
        properties.setPublicPath("/api/uploads/avatars/");
        properties.setMaxSize(maxSize);
        return new AvatarStorageService(properties);
    }

    private MockMultipartFile jpeg(String filename) {
        return new MockMultipartFile(
                "file", filename, "image/jpeg",
                new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe0, 1, 2, 3, 4, 5}
        );
    }
}
