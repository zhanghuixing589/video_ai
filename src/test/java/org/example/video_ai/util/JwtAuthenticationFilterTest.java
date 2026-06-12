package org.example.video_ai.util;

import jakarta.servlet.FilterChain;
import org.example.video_ai.service.SessionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private SessionService sessionService;
    @Mock
    private FilterChain filterChain;

    @Test
    void returnsUtf8SessionReplacedReasonForInvalidatedSession() throws Exception {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtUtil, sessionService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/auth/me");
        request.addHeader("Authorization", "Bearer old-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.validateToken("old-token")).thenReturn(true);
        when(jwtUtil.extractUserId("old-token")).thenReturn(2L);
        when(jwtUtil.extractSessionId("old-token")).thenReturn("old-session");
        when(jwtUtil.extractUsername("old-token")).thenReturn("reviewer");
        when(jwtUtil.extractRole("old-token")).thenReturn("REVIEWER");
        when(sessionService.isSessionValid(2L, "old-session")).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getCharacterEncoding()).isEqualTo(StandardCharsets.UTF_8.name());
        assertThat(response.getHeader("X-Auth-Reason")).isEqualTo("SESSION_REPLACED");
        assertThat(response.getContentAsString(StandardCharsets.UTF_8))
                .contains("您的账号已在其他设备登录，请重新登录");
        verify(filterChain, never()).doFilter(request, response);
    }
}
