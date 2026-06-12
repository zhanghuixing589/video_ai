package org.example.video_ai.service;

import org.example.video_ai.dto.UserDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, passwordEncoder);
    }

    @Test
    void submitsFirstStudioApplicationForCurrentUser() {
        User user = studio(StudioStatus.NONE);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserDTO result = userService.applyStudio("studio", request());

        assertThat(result.getStudioStatus()).isEqualTo(StudioStatus.PENDING);
        assertThat(result.getStudioName()).isEqualTo("星河影业");
    }

    @Test
    void rejectedStudioCanSubmitAgain() {
        User user = studio(StudioStatus.REJECTED);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserDTO result = userService.applyStudio("studio", request());

        assertThat(result.getStudioStatus()).isEqualTo(StudioStatus.PENDING);
    }

    @Test
    void pendingStudioCannotSubmitDuplicateApplication() {
        User user = studio(StudioStatus.PENDING);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.applyStudio("studio", request()))
                .hasMessage("申请正在审核中，请勿重复提交");
    }

    @Test
    void ordinaryUserCannotSubmitStudioApplication() {
        User user = studio(StudioStatus.NONE);
        user.setRole(Role.USER);
        when(userRepository.findByUsername("studio")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.applyStudio("studio", request()))
                .hasMessage("当前账号不是制片厂账号");
    }

    @Test
    void administratorCanCreateReviewerAccount() {
        UserDTO.CreateRequest request = new UserDTO.CreateRequest();
        request.setUsername(" reviewer ");
        request.setEmail(" Reviewer@Example.com ");
        request.setPassword("secret12");
        request.setDisplayName("审核员");
        request.setRole(Role.REVIEWER);
        when(passwordEncoder.encode("secret12")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(11L);
            return saved;
        });

        UserDTO result = userService.createUser(request);

        assertThat(result.getUsername()).isEqualTo("reviewer");
        assertThat(result.getEmail()).isEqualTo("reviewer@example.com");
        assertThat(result.getRole()).isEqualTo(Role.REVIEWER);
        assertThat(result.getStudioStatus()).isEqualTo(StudioStatus.NONE);
    }

    @Test
    void administratorCannotCreateAnotherAdministratorDirectly() {
        UserDTO.CreateRequest request = new UserDTO.CreateRequest();
        request.setUsername("admin2");
        request.setEmail("admin2@example.com");
        request.setPassword("secret12");
        request.setRole(Role.ADMIN);

        assertThatThrownBy(() -> userService.createUser(request))
                .hasMessage("创建账号时不能直接指定管理员角色");
    }

    @Test
    void administratorCannotDowngradeOwnAccount() {
        User admin = admin(1L, "admin");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        UserDTO.UpdateRoleRequest request = new UserDTO.UpdateRoleRequest();
        request.setRole(Role.REVIEWER);

        assertThatThrownBy(() -> userService.updateRole("admin", 1L, request))
                .hasMessage("不能修改自己的管理员角色");
    }

    @Test
    void lastAdministratorCannotBeDowngraded() {
        User operator = admin(1L, "operator");
        User target = admin(2L, "admin");
        when(userRepository.findByUsername("operator")).thenReturn(Optional.of(operator));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);

        UserDTO.UpdateRoleRequest request = new UserDTO.UpdateRoleRequest();
        request.setRole(Role.USER);

        assertThatThrownBy(() -> userService.updateRole("operator", 2L, request))
                .hasMessage("系统必须至少保留一个管理员");
    }

    private UserDTO.StudioApplyRequest request() {
        UserDTO.StudioApplyRequest request = new UserDTO.StudioApplyRequest();
        request.setStudioName("星河影业");
        request.setStudioDescription("专注原创剧集");
        return request;
    }

    private User studio(StudioStatus status) {
        User user = new User();
        user.setId(9L);
        user.setUsername("studio");
        user.setEmail("studio@example.com");
        user.setPassword("encoded");
        user.setDisplayName("studio");
        user.setRole(Role.STUDIO);
        user.setStudioStatus(status);
        user.setEnabled(true);
        return user;
    }

    private User admin(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword("encoded");
        user.setDisplayName(username);
        user.setRole(Role.ADMIN);
        user.setStudioStatus(StudioStatus.NONE);
        user.setEnabled(true);
        return user;
    }
}
