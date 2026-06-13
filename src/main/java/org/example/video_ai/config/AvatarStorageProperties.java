package org.example.video_ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.avatar")
public class AvatarStorageProperties {
    private String storageDirectory = "uploads/avatars";
    private String publicPath = "/api/uploads/avatars/";
    private long maxSize = 5 * 1024 * 1024;  //限制5mb大小的文件
}
