package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.AuthDTO;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.exception.ApiException;
import org.example.video_ai.repository.UserRepository;
import org.example.video_ai.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final SessionService sessionService;

    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest request) {
        String identity = request.getUsername().trim();
        User user = userRepository.findByUsername(identity)
                .or(() -> userRepository.findByEmailIgnoreCase(identity))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "账号已被禁用，请联系管理员");
        }
        //生成新的sessionId
        String sessionId = UUID.randomUUID().toString();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().name(),sessionId);

        //保存到会话redis - 覆盖旧会话，实现单设备登录
        sessionService.saveSession(user.getId(),sessionId);

        return new AuthDTO.LoginResponse(token, toUserInfo(user));
    }

    @Transactional
    public AuthDTO.UserInfo register(AuthDTO.RegisterRequest request) {
        Role role = request.getRole() == null ? Role.USER : request.getRole();
        if (role != Role.USER && role != Role.STUDIO) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "公开注册仅支持普通用户或制片厂");
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
        user.setRole(role);
        user.setStudioStatus(StudioStatus.NONE);
        user.setEnabled(true);
        return toUserInfo(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthDTO.UserInfo getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "用户不存在"));
        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "账号已被禁用，请联系管理员");
        }
        return toUserInfo(user);
    }

    private AuthDTO.UserInfo toUserInfo(User user) {
        return new AuthDTO.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name(),
                user.getStudioStatus().name(),
                user.getStudioName(),
                user.getAvatarUrl()
        );
    }

    /*退出登录*/
    public void logout(Long userId, String sessionId){
        sessionService.removeSession(userId, sessionId);
    }
}
