package org.example.video_ai.controller;

import org.example.video_ai.dto.PasswordUpdateRequest;
import org.example.video_ai.dto.ProfileUpdateRequest;
import org.example.video_ai.dto.UserDTO;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.service.AvatarStorageService;
import org.example.video_ai.service.UserService;
import org.example.video_ai.service.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserProfileControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private VideoService videoService;

    @Mock
    private AvatarStorageService avatarStorageService;

    private MockMvc mockMvc;
    private UserDTO user;

    @BeforeEach
    void setUp() {
        UserController controller = new UserController(userService, videoService, avatarStorageService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        user = new UserDTO();
        user.setId(7L);
        user.setUsername("zhangsan");
        user.setEmail("zhangsan@example.com");
        user.setDisplayName("张三");
        user.setRole(Role.USER);
        user.setStudioStatus(StudioStatus.NONE);
    }

    @Test
    void getsTheAuthenticatedUsersProfile() throws Exception {
        when(userService.getProfile("zhangsan")).thenReturn(user);

        mockMvc.perform(get("/users/me/profile")
                        .principal(new TestingAuthenticationToken("zhangsan", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("zhangsan"));
    }

    @Test
    void updatesTheAuthenticatedUsersProfile() throws Exception {
        when(userService.updateProfile(any(), any())).thenReturn(user);

        mockMvc.perform(patch("/users/me/profile")
                        .principal(new TestingAuthenticationToken("zhangsan", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"displayName":"  张三  ","email":"  zhangsan@example.com  "}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("zhangsan@example.com"));

        verify(userService).updateProfile(any(String.class), any(ProfileUpdateRequest.class));
    }

    @Test
    void uploadsAnAvatarForTheAuthenticatedUser() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}
        );
        when(userService.getProfile("zhangsan")).thenReturn(user);
        when(avatarStorageService.store(any())).thenReturn("/api/uploads/avatars/new.png");
        user.setAvatarUrl("/api/uploads/avatars/new.png");
        when(userService.updateAvatar("zhangsan", "/api/uploads/avatars/new.png")).thenReturn(user);

        mockMvc.perform(multipart("/users/me/avatar")
                        .file(file)
                        .principal(new TestingAuthenticationToken("zhangsan", null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value("/api/uploads/avatars/new.png"));
    }

    @Test
    void changesTheAuthenticatedUsersPassword() throws Exception {
        mockMvc.perform(patch("/users/me/password")
                        .principal(new TestingAuthenticationToken("zhangsan", null))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "oldPassword":"old-password",
                                  "newPassword":"new-password",
                                  "confirmPassword":"new-password"
                                }
                                """))
                .andExpect(status().isOk());

        verify(userService).updatePassword(any(String.class), any(PasswordUpdateRequest.class));
    }
}
