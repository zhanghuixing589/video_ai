package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.AuthDTO;
import org.example.video_ai.service.AuthService;
import org.example.video_ai.util.JwtUtil;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ApiResponse<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return ApiResponse.success("登录成功", authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<AuthDTO.UserInfo> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ApiResponse.success("注册成功，请登录", authService.register(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader("Authorization") String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            Long userId = jwtUtil.extractUserId(token);
            String sessionId = jwtUtil.extractSessionId(token);
            authService.logout(userId, sessionId);
        }
        return ApiResponse.success("退出成功", null);
    }

    @GetMapping("/me")
    public ApiResponse<AuthDTO.UserInfo> getCurrentUser(Authentication authentication) {
        return ApiResponse.success(authService.getCurrentUser(authentication.getName()));
    }
}
