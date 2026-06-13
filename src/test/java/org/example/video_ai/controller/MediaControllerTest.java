package org.example.video_ai.controller;

import org.example.video_ai.service.MediaStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MediaControllerTest {

    @Mock
    private MediaStorageService mediaStorageService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new MediaController(mediaStorageService)).build();
    }

    @Test
    void uploadsCoverAndReturnsStoredMetadata() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.png", "image/png", new byte[]{1, 2, 3}
        );
        when(mediaStorageService.storeCover(any())).thenReturn(
                new MediaStorageService.StoredMedia(
                        "/api/uploads/covers/generated.png", "cover.png", 3, "image/png"
                )
        );

        mockMvc.perform(multipart("/media/covers").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value("/api/uploads/covers/generated.png"))
                .andExpect(jsonPath("$.data.fileName").value("cover.png"))
                .andExpect(jsonPath("$.data.size").value(3))
                .andExpect(jsonPath("$.data.contentType").value("image/png"));
    }

    @Test
    void uploadsVideoAndReturnsPlayableUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "episode.mp4", "video/mp4", new byte[]{1, 2, 3, 4}
        );
        when(mediaStorageService.storeVideo(any())).thenReturn(
                new MediaStorageService.StoredMedia(
                        "/api/uploads/videos/generated.mp4", "episode.mp4", 4, "video/mp4"
                )
        );

        mockMvc.perform(multipart("/media/videos").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.url").value("/api/uploads/videos/generated.mp4"))
                .andExpect(jsonPath("$.data.fileName").value("episode.mp4"));
    }
}
