package org.example.video_ai.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    private final AvatarStorageProperties avatarStorageProperties;
    private final MediaStorageProperties mediaStorageProperties;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(resourceLocation(avatarStorageProperties.getStorageDirectory()))
                .setCachePeriod(3600);
        registry.addResourceHandler("/uploads/covers/**")
                .addResourceLocations(resourceLocation(mediaStorageProperties.getCoverStorageDirectory()))
                .setCachePeriod(3600);
        registry.addResourceHandler("/uploads/videos/**")
                .addResourceLocations(resourceLocation(mediaStorageProperties.getVideoStorageDirectory()))
                .setCachePeriod(3600);
    }

    private String resourceLocation(String directory) {
        String location = Path.of(directory)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        return location.endsWith("/") ? location : location + "/";
    }
}
