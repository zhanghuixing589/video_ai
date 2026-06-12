package org.example.video_ai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private Role role;
    private StudioStatus studioStatus;
    private String studioName;
    private String studioDescription;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String avatarUrl;

    @Data
    public static class CreateRequest {
        @NotBlank
        @Size(max = 64)
        private String username;

        @NotBlank
        @Email
        @Size(max = 128)
        private String email;

        @NotBlank
        @Size(min = 6, max = 128)
        private String password;

        @Size(max = 64)
        private String displayName;

        @NotNull
        private Role role = Role.USER;
    }

    @Data
    public static class StudioApplyRequest {
        @NotBlank
        @Size(max = 128)
        private String studioName;

        @Size(max = 1000)
        private String studioDescription;
    }

    @Data
    public static class UpdateRoleRequest {
        @NotNull
        private Role role;
    }

    @Data
    public static class ReviewStudioRequest {
        @NotNull
        private StudioStatus studioStatus;
    }
}
