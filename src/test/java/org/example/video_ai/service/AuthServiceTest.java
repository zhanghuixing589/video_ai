package org.example.video_ai.service;

import org.example.video_ai.dto.AuthDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.repository.UserRepository;
import org.example.video_ai.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private SessionService sessionService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtUtil, sessionService);
    }

    @Test
    void registersStudioWithoutSubmittingApplication() {
        AuthDTO.RegisterRequest request = registerRequest(" studio ", " Studio@Example.com ", Role.STUDIO);
        when(passwordEncoder.encode("secret12")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });

        AuthDTO.UserInfo result = authService.register(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("studio");
        assertThat(saved.getEmail()).isEqualTo("studio@example.com");
        assertThat(saved.getRole()).isEqualTo(Role.STUDIO);
        assertThat(saved.getStudioStatus()).isEqualTo(StudioStatus.NONE);
        assertThat(result.getRole()).isEqualTo("STUDIO");
    }

    @Test
    void rejectsPublicAdministratorRegistration() {
        AuthDTO.RegisterRequest request = registerRequest("admin2", "admin2@example.com", Role.ADMIN);

        assertThatThrownBy(() -> authService.register(request))
                .hasMessage("公开注册仅支持普通用户或制片厂");
    }

    @Test
    void logsInWithNormalizedEmail() {
        User user = user(1L, "viewer", "viewer@example.com", true);
        when(userRepository.findByUsername("VIEWER@EXAMPLE.COM")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("VIEWER@EXAMPLE.COM")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret12", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken(
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.eq("viewer"),
                org.mockito.ArgumentMatchers.eq("USER"),
                org.mockito.ArgumentMatchers.anyString()
        )).thenReturn("token");

        AuthDTO.LoginResponse response =
                authService.login(new AuthDTO.LoginRequest(" VIEWER@EXAMPLE.COM ", "secret12"));

        assertThat(response.getToken()).isEqualTo("token");
        assertThat(response.getUser().getUsername()).isEqualTo("viewer");
    }

    @Test
    void rejectsDisabledAccount() {
        User user = user(1L, "viewer", "viewer@example.com", false);
        when(userRepository.findByUsername("viewer")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret12", "encoded")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(new AuthDTO.LoginRequest("viewer", "secret12")))
                .hasMessage("账号已被禁用，请联系管理员");
    }

    @Test
    void logoutRemovesOnlyTheSessionFromThePresentedToken() {
        authService.logout(1L, "current-session");

        verify(sessionService).removeSession(1L, "current-session");
    }

    private AuthDTO.RegisterRequest registerRequest(String username, String email, Role role) {
        AuthDTO.RegisterRequest request = new AuthDTO.RegisterRequest();
        request.setUsername(username);
        request.setEmail(email);
        request.setPassword("secret12");
        request.setDisplayName("");
        request.setRole(role);
        return request;
    }

    private User user(Long id, String username, String email, boolean enabled) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("encoded");
        user.setDisplayName(username);
        user.setRole(Role.USER);
        user.setStudioStatus(StudioStatus.NONE);
        user.setEnabled(enabled);
        return user;
    }
}
