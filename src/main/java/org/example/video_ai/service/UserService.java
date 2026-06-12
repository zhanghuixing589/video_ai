package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.UserDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.example.video_ai.exception.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDTO createUser(UserDTO.CreateRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "创建账号时不能直接指定管理员角色");
        }
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "用户名已存在");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "邮箱已被注册");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDisplayName(request.getDisplayName() == null || request.getDisplayName().isBlank()
                ? username : request.getDisplayName().trim());
        user.setRole(request.getRole());
        user.setStudioStatus(StudioStatus.NONE);
        user.setEnabled(true);
        return toDTO(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserDTO> listUsers(Role role, StudioStatus studioStatus) {
        List<User> users;
        if (role != null) {
            users = userRepository.findByRole(role);
        } else if (studioStatus != null) {
            users = userRepository.findByStudioStatus(studioStatus);
        } else {
            users = userRepository.findAll();
        }
        return users.stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public UserDTO getUser(Long id) {
        return toDTO(findUser(id));
    }

    @Transactional
    public UserDTO updateRole(String operatorUsername, Long id, UserDTO.UpdateRoleRequest request) {
        User operator = userRepository.findByUsername(operatorUsername)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "当前管理员不存在"));
        User user = findUser(id);
        if (operator.getId().equals(user.getId()) && user.getRole() == Role.ADMIN
                && request.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.CONFLICT, "不能修改自己的管理员角色");
        }
        if (user.getRole() == Role.ADMIN && request.getRole() != Role.ADMIN
                && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ApiException(HttpStatus.CONFLICT, "系统必须至少保留一个管理员");
        }
        user.setRole(request.getRole());
        if (request.getRole() != Role.STUDIO) {
            user.setStudioStatus(StudioStatus.NONE);
            user.setStudioName(null);
            user.setStudioDescription(null);
        } else if (user.getStudioStatus() == StudioStatus.NONE) {
            user.setStudioStatus(StudioStatus.PENDING);
        }
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO applyStudio(String username, UserDTO.StudioApplyRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "用户不存在"));
        if (user.getRole() != Role.STUDIO) {
            throw new ApiException(HttpStatus.FORBIDDEN, "当前账号不是制片厂账号");
        }
        if (user.getStudioStatus() == StudioStatus.PENDING) {
            throw new ApiException(HttpStatus.CONFLICT, "申请正在审核中，请勿重复提交");
        }
        if (user.getStudioStatus() == StudioStatus.APPROVED) {
            throw new ApiException(HttpStatus.CONFLICT, "制片厂申请已通过");
        }
        user.setStudioStatus(StudioStatus.PENDING);
        user.setStudioName(request.getStudioName().trim());
        user.setStudioDescription(request.getStudioDescription() == null
                ? null : request.getStudioDescription().trim());
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO reviewStudio(Long id, UserDTO.ReviewStudioRequest request) {
        if (request.getStudioStatus() == StudioStatus.NONE || request.getStudioStatus() == StudioStatus.PENDING) {
            throw new IllegalArgumentException("Studio review result must be APPROVED or REJECTED");
        }
        User user = findUser(id);
        if (user.getRole() != Role.STUDIO) {
            throw new IllegalArgumentException("User is not a studio applicant");
        }
        user.setStudioStatus(request.getStudioStatus());
        return toDTO(userRepository.save(user));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "用户不存在"));
    }

    private UserDTO toDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.getStudioStatus(),
                user.getStudioName(),
                user.getStudioDescription(),
                user.getEnabled(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
