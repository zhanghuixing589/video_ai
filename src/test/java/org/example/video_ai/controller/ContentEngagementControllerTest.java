package org.example.video_ai.controller;

import org.example.video_ai.dto.ContentDTO;
import org.example.video_ai.dto.ContentEngagementDTO;
import org.example.video_ai.enums.VideoGenre;
import org.example.video_ai.enums.VideoStatus;
import org.example.video_ai.enums.VideoType;
import org.example.video_ai.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ContentEngagementControllerTest {

    @Mock private CommentService commentService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CommentController(commentService)).build();
    }

    @Test
    void listsCommentsForPublishedContent() throws Exception {
        ContentEngagementDTO.CommentInfo comment = new ContentEngagementDTO.CommentInfo();
        comment.setId(3L);
        comment.setContentId(1L);
        comment.setAuthorDisplayName("Viewer");
        comment.setBody("Worth watching.");
        comment.setCreatedAt(LocalDateTime.parse("2026-06-16T09:00:00"));
        when(commentService.listComments(1L, null)).thenReturn(List.of(comment));

        mockMvc.perform(get("/contents/1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].body").value("Worth watching."));
    }

    @Test
    void createsCommentForAuthenticatedUser() throws Exception {
        ContentEngagementDTO.CommentInfo comment = new ContentEngagementDTO.CommentInfo();
        comment.setId(4L);
        comment.setBody("Fresh response.");
        when(commentService.createComment(eq("viewer"), eq(1L), any(ContentEngagementDTO.CommentRequest.class)))
                .thenReturn(comment);

        mockMvc.perform(post("/contents/1/comments")
                        .principal(new TestingAuthenticationToken("viewer", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                                {"body":"Fresh response."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(4));

        verify(commentService).createComment(eq("viewer"), eq(1L), any(ContentEngagementDTO.CommentRequest.class));
    }

    @Test
    void ratesContentForAuthenticatedUser() throws Exception {
        ContentEngagementDTO.RatingSummary summary = new ContentEngagementDTO.RatingSummary();
        summary.setAverageScore(9.5);
        summary.setRatingCount(2L);
        summary.setMyScore(10);
        when(commentService.rateContent(eq("viewer"), eq(1L), any(ContentEngagementDTO.RatingRequest.class)))
                .thenReturn(summary);

        mockMvc.perform(post("/contents/1/rating")
                        .principal(new TestingAuthenticationToken("viewer", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"score":10}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageScore").value(9.5))
                .andExpect(jsonPath("$.data.myScore").value(10));
    }

    @Test
    void readsRatingSummaryForAnonymousViewer() throws Exception {
        ContentEngagementDTO.RatingSummary summary = new ContentEngagementDTO.RatingSummary();
        summary.setAverageScore(0.0);
        summary.setRatingCount(0L);
        when(commentService.getRatingSummary(null, 1L)).thenReturn(summary);

        mockMvc.perform(get("/contents/1/rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ratingCount").value(0));
    }

    @Test
    void listsRecommendations() throws Exception {
        ContentDTO related = new ContentDTO();
        related.setId(2L);
        related.setTitle("Related");
        related.setType(VideoType.MOVIE);
        related.setGenre(VideoGenre.DOCUMENTARY);
        related.setStatus(VideoStatus.PUBLISHED);
        when(commentService.recommendations(1L)).thenReturn(List.of(related));

        mockMvc.perform(get("/contents/1/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(2))
                .andExpect(jsonPath("$.data[0].title").value("Related"));
    }
}
