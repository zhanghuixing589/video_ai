package org.example.video_ai.service;

import org.example.video_ai.dto.PasswordUpdateRequest;
import org.example.video_ai.dto.ProfileUpdateRequest;
import org.example.video_ai.dto.UserDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.exception.ApiException;
import org.example.video_ai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceProfileTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SessionService sessionService;

    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder, sessionService);
        user = new User();
        user.setId(7L);
        user.setUsername("zhangsan");
        user.setEmail("old@example.com");
        user.setPassword("encoded-old");
        user.setDisplayName("旧名称");
        user.setRole(Role.USER);
        user.setStudioStatus(StudioStatus.NONE);
        user.setEnabled(true);
    }

    @Test
    void updatesAndNormalizesProfileFields() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setDisplayName("  张三审核员  ");
        request.setEmail("  New@Example.COM ");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("new@example.com", 7L)).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        UserDTO result = userService.updateProfile("zhangsan", request);

        assertEquals("张三审核员", result.getDisplayName());
        assertEquals("new@example.com", result.getEmail());
        verify(userRepository).save(user);
    }

    @Test
    void rejectsAnEmailOwnedByAnotherUser() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setDisplayName("张三");
        request.setEmail("taken@example.com");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("taken@example.com", 7L)).thenReturn(true);

        assertThrows(ApiException.class, () -> userService.updateProfile("zhangsan", request));

        verify(userRepository, never()).save(user);
    }

    @Test
    void rejectsDisplayNamesThatAreTooShortAfterTrimming() {
        ProfileUpdateRequest request = new ProfileUpdateRequest();
        request.setDisplayName(" a ");
        request.setEmail("new@example.com");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));

        assertThrows(ApiException.class, () -> userService.updateProfile("zhangsan", request));

        verify(userRepository, never()).save(user);
    }

    @Test
    void rejectsIncorrectOldPassword() {
        PasswordUpdateRequest request = passwordRequest("wrong", "new-password", "new-password");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded-old")).thenReturn(false);

        assertThrows(ApiException.class, () -> userService.updatePassword("zhangsan", request));

        verify(userRepository, never()).save(user);
    }

    @Test
    void rejectsMismatchedPasswordConfirmation() {
        PasswordUpdateRequest request = passwordRequest("old-password", "new-password", "different");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-password", "encoded-old")).thenReturn(true);

        assertThrows(ApiException.class, () -> userService.updatePassword("zhangsan", request));

        verify(userRepository, never()).save(user);
    }

    @Test
    void rejectsReusingTheCurrentPassword() {
        PasswordUpdateRequest request = passwordRequest("old-password", "old-password", "old-password");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-password", "encoded-old")).thenReturn(true);

        assertThrows(ApiException.class, () -> userService.updatePassword("zhangsan", request));

        verify(userRepository, never()).save(user);
    }

    @Test
    void updatesPasswordAndInvalidatesTheCurrentUserSession() {
        PasswordUpdateRequest request = passwordRequest("old-password", "new-password", "new-password");
        when(userRepository.findByUsername("zhangsan")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old-password", "encoded-old")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("encoded-new");
        when(userRepository.save(user)).thenReturn(user);

        userService.updatePassword("zhangsan", request);

        assertEquals("encoded-new", user.getPassword());
        verify(userRepository).save(user);
        verify(sessionService).removeUserSession(7L);
    }

    private PasswordUpdateRequest passwordRequest(String oldPassword, String newPassword, String confirmPassword) {
        PasswordUpdateRequest request = new PasswordUpdateRequest();
        request.setOldPassword(oldPassword);
        request.setNewPassword(newPassword);
        request.setConfirmPassword(confirmPassword);
        return request;
    }
}
