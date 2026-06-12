package org.example.video_ai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    private String displayName;

    @NotBlank
    @Email
    @Size(max = 128)
    private String email;

    public void setDisplayName(String displayName) {
        this.displayName = displayName == null ? null : displayName.trim();
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }
}
