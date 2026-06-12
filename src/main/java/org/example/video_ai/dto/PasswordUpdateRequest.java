package org.example.video_ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PasswordUpdateRequest {
    @NotBlank
    private String oldPassword;

    @NotBlank
    @Size(min = 6, max = 128)
    private String newPassword;

    @NotBlank
    private String confirmPassword;
}
