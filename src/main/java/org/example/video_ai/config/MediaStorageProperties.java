package org.example.video_ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.media")
public class MediaStorageProperties {
    private String coverStorageDirectory = "./uploads/covers";
    private String videoStorageDirectory = "./uploads/videos";
    private String coverPublicPath = "/api/uploads/covers/";
    private String videoPublicPath = "/api/uploads/videos/";
    private long maxCoverSize = 10 * 1024 * 1024;  //封面url大小10mb
    private long maxVideoSize = 2L * 1024 * 1024 * 1024;  //视频文件大小2g
}
