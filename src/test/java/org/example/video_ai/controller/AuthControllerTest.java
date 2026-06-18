package org.example.video_ai.controller;

import org.example.video_ai.dto.AuthDTO;
import org.example.video_ai.enums.Role;
import org.example.video_ai.service.AuthService;
import org.example.video_ai.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private JwtUtil jwtUtil;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, jwtUtil)).build();
    }

    @Test
    void registersWithTwoCharacterUsername() throws Exception {
        AuthDTO.UserInfo user = new AuthDTO.UserInfo(
                2L,
                "阿海",
                "surf@example.com",
                "爱冲浪",
                Role.USER.name(),
                "NONE",
                null,
                null
        );
        when(authService.register(any(AuthDTO.RegisterRequest.class))).thenReturn(user);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username":"阿海",
                                  "email":"surf@example.com",
                                  "password":"secret12",
                                  "displayName":"爱冲浪",
                                  "role":"USER"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("阿海"));

        verify(authService).register(any(AuthDTO.RegisterRequest.class));
    }
}
