package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.config.AvatarStorageProperties;
import org.example.video_ai.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AvatarStorageService {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final AvatarStorageProperties properties;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请选择头像文件");
        }
        if (file.getSize() > properties.getMaxSize()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "头像大小不能超过 5 MB");
        }
        String contentType = file.getContentType();
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "头像仅支持 JPG、PNG 或 WebP");
        }
        try {
            byte[] header = file.getInputStream().readNBytes(12);
            if (!matchesSignature(contentType, header)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "头像文件内容与格式不匹配");
            }
            Path directory = storageDirectory();
            Files.createDirectories(directory);
            String filename = UUID.randomUUID() + extension;
            Path target = directory.resolve(filename).normalize();
            if (!target.getParent().equals(directory)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "头像文件路径无效");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return normalizedPublicPath() + filename;
        } catch (ApiException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "头像保存失败");
        }
    }

    public void deleteManaged(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.startsWith(normalizedPublicPath())) {
            return;
        }
        String filename = avatarUrl.substring(normalizedPublicPath().length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            return;
        }
        Path directory = storageDirectory();
        Path target = directory.resolve(filename).normalize();
        if (!target.getParent().equals(directory)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // A stale avatar file must not make an otherwise successful profile update fail.
        }
    }

    private Path storageDirectory() {
        return Path.of(properties.getStorageDirectory()).toAbsolutePath().normalize();
    }

    private String normalizedPublicPath() {
        String path = properties.getPublicPath();
        return path.endsWith("/") ? path : path + "/";
    }

    private boolean matchesSignature(String contentType, byte[] header) {
        return switch (contentType) {
            case "image/jpeg" -> header.length >= 3
                    && unsigned(header[0]) == 0xff
                    && unsigned(header[1]) == 0xd8
                    && unsigned(header[2]) == 0xff;
            case "image/png" -> header.length >= 8
                    && unsigned(header[0]) == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4e
                    && header[3] == 0x47
                    && header[4] == 0x0d
                    && header[5] == 0x0a
                    && header[6] == 0x1a
                    && header[7] == 0x0a;
            case "image/webp" -> header.length >= 12
                    && new String(header, 0, 4).equals("RIFF")
                    && new String(header, 8, 4).equals("WEBP");
            default -> false;
        };
    }

    private int unsigned(byte value) {
        return value & 0xff;
    }
}
