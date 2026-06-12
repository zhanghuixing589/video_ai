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

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(avatarStorageProperties.getStorageDirectory())
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
