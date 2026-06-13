package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.*;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.service.AvatarStorageService;
import org.example.video_ai.service.UserService;
import org.example.video_ai.service.VideoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final VideoService videoService;
    private final AvatarStorageService avatarStorageService;

    /* 登录 */

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> createUser(@Valid @RequestBody UserDTO.CreateRequest request) {
        return ApiResponse.success("账号创建成功", userService.createUser(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserDTO>> listUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) StudioStatus studioStatus
    ) {
        return ApiResponse.success(userService.listUsers(role, studioStatus));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> getUser(@PathVariable Long id) {
        return ApiResponse.success(userService.getUser(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> updateRole(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UserDTO.UpdateRoleRequest request
    ) {
        return ApiResponse.success("角色已更新",
                userService.updateRole(authentication.getName(), id, request));
    }

    @PostMapping("/me/studio-application")
    @PreAuthorize("hasRole('STUDIO')")
    public ApiResponse<UserDTO> applyStudio(
            Authentication authentication,
            @Valid @RequestBody UserDTO.StudioApplyRequest request
    ) {
        return ApiResponse.success("制片厂申请已提交", userService.applyStudio(authentication.getName(), request));
    }

    @PatchMapping("/{id}/studio-application")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> reviewStudio(
            @PathVariable Long id,
            @Valid @RequestBody UserDTO.ReviewStudioRequest request
    ) {
        return ApiResponse.success("Studio application reviewed", userService.reviewStudio(id, request));
    }

    /* 个人中心 */
    @GetMapping("/me/profile")
    public ApiResponse<UserDTO> getProfile(Authentication authentication) {
        return ApiResponse.success(userService.getProfile(authentication.getName()));
    }

    @PatchMapping("/me/profile")
    public ApiResponse<UserDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return ApiResponse.success("个人资料已更新",
                userService.updateProfile(authentication.getName(), request));
    }

    @PostMapping("/me/avatar")
    public ApiResponse<UserDTO> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
//        UserDTO current = userService.getProfile(authentication.getName());
//        String newAvatarUrl = avatarStorageService.store(file);
//        try {
//            UserDTO updated = userService.updateAvatar(authentication.getName(), newAvatarUrl);
//            avatarStorageService.deleteManaged(current.getAvatarUrl());
//            return ApiResponse.success("头像已更新", updated);
//        } catch (RuntimeException exception) {
//            avatarStorageService.deleteManaged(newAvatarUrl);
//            throw exception;
//        }
        String username = authentication.getName();
        String avatarUrl = avatarStorageService.store(file);

        UserDTO currentUser = userService.getProfile(authentication.getName());
        String oldAvatarUrl = currentUser.getAvatarUrl();

        UserDTO updatedUser = userService.updateAvatar(username,avatarUrl);

        if (oldAvatarUrl != null && !oldAvatarUrl.contains("default")){
            avatarStorageService.deleteManaged(oldAvatarUrl);
        }
        return ApiResponse.success("头像已更新",updatedUser);
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> updatePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordUpdateRequest request
    ) {
        userService.updatePassword(authentication.getName(), request);
        return ApiResponse.success("密码已修改，请重新登录", null);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> updateUserStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return ApiResponse.success(
                request.isEnabled() ? "账号已启用" : "账号已禁用",
                userService.updateStatus(authentication.getName(), id, request.isEnabled())
        );
    }

    @Data
    public static class UpdateStatusRequest {
        private boolean enabled;
    }

}
