package org.example.video_ai.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.service.CommentService;
import org.example.video_ai.util.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = org.example.video_ai.controller.CommentController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = WebMvcConfig.class))
@Import({SecurityConfig.class, ObjectMapper.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void allowsAnonymousVisitorsToReadPlaybackEngagementData() throws Exception {
        ContentEngagementDTO.RatingSummary summary = new ContentEngagementDTO.RatingSummary();
        summary.setAverageScore(0.0);
        summary.setRatingCount(0L);
        when(commentService.listComments(1L, null)).thenReturn(List.of());
        when(commentService.getRatingSummary(null, 1L)).thenReturn(summary);
        when(commentService.recommendations(1L)).thenReturn(List.of());

        mockMvc.perform(get("/contents/1/comments"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/contents/1/rating"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/contents/1/recommendations"))
                .andExpect(status().isOk());
    }
}
