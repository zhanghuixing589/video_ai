package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.config.MediaStorageProperties;
import org.example.video_ai.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaStorageService {
    private static final Map<String, String> COVER_EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );
    private static final Map<String, String> VIDEO_EXTENSIONS = Map.of(
            "video/mp4", ".mp4",
            "video/webm", ".webm",
            "video/quicktime", ".mov"
    );

    private final MediaStorageProperties properties;

    public StoredMedia storeCover(MultipartFile file) {
        return store(
                file,
                COVER_EXTENSIONS,
                properties.getMaxCoverSize(),
                properties.getCoverStorageDirectory(),
                properties.getCoverPublicPath(),
                true
        );
    }

    public StoredMedia storeVideo(MultipartFile file) {
        return store(
                file,
                VIDEO_EXTENSIONS,
                properties.getMaxVideoSize(),
                properties.getVideoStorageDirectory(),
                properties.getVideoPublicPath(),
                false
        );
    }

    private StoredMedia store(
            MultipartFile file,
            Map<String, String> extensions,
            long maxSize,
            String storageDirectory,
            String publicPath,
            boolean cover
    ) {
        String label = cover ? "封面" : "视频";
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请选择" + label + "文件");
        }
        if (file.getSize() > maxSize) {
            throw new ApiException(HttpStatus.BAD_REQUEST, label + "文件超过允许的大小");
        }
        String contentType = file.getContentType();
        String extension = extensions.get(contentType);
        if (extension == null) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    cover ? "封面仅支持 JPG、PNG 或 WebP" : "视频仅支持 MP4、WebM 或 MOV"
            );
        }

        try {
            byte[] header;
            try (InputStream input = file.getInputStream()) {
                header = input.readNBytes(16);
            }
            if (!matchesSignature(contentType, header)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, label + "文件内容与格式不匹配");
            }

            Path directory = Path.of(storageDirectory).toAbsolutePath().normalize();
            Files.createDirectories(directory);
            String storedFileName = UUID.randomUUID() + extension;
            Path target = directory.resolve(storedFileName).normalize();
            if (!target.getParent().equals(directory)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, label + "文件路径无效");
            }
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
            }

            return new StoredMedia(
                    normalizePublicPath(publicPath) + storedFileName,
                    originalFileName(file),
                    file.getSize(),
                    contentType
            );
        } catch (ApiException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, label + "文件保存失败");
        }
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
                    && ascii(header, 0, 4).equals("RIFF")
                    && ascii(header, 8, 4).equals("WEBP");
            case "video/mp4", "video/quicktime" -> header.length >= 12
                    && ascii(header, 4, 4).equals("ftyp");
            case "video/webm" -> header.length >= 4
                    && unsigned(header[0]) == 0x1a
                    && unsigned(header[1]) == 0x45
                    && unsigned(header[2]) == 0xdf
                    && unsigned(header[3]) == 0xa3;
            default -> false;
        };
    }

    private String originalFileName(MultipartFile file) {
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            return "file";
        }
        return Path.of(original.replace('\\', '/')).getFileName().toString();
    }

    private String normalizePublicPath(String publicPath) {
        return publicPath.endsWith("/") ? publicPath : publicPath + "/";
    }

    private String ascii(byte[] bytes, int offset, int length) {
        return new String(bytes, offset, length, StandardCharsets.US_ASCII);
    }

    private int unsigned(byte value) {
        return value & 0xff;
    }

    public record StoredMedia(String url, String originalFileName, long size, String contentType) {
    }
}
