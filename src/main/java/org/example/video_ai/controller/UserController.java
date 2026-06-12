package org.example.video_ai.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.video_ai.dto.ApiResponse;
import org.example.video_ai.dto.UserDTO;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

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
}
