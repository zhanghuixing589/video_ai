package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.AuthDTO;
import org.example.video_ai.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthDTO.LoginResponse> login(@Valid @RequestBody AuthDTO.LoginRequest request) {
        return ApiResponse.success("登录成功", authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<AuthDTO.UserInfo> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        return ApiResponse.success("注册成功，请登录", authService.register(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthDTO.UserInfo> getCurrentUser(Authentication authentication) {
        return ApiResponse.success(authService.getCurrentUser(authentication.getName()));
    }
}
