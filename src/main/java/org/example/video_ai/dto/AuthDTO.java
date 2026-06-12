package org.example.video_ai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.video_ai.enums.Role;

@Data
public class AuthDTO {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;

        @NotBlank(message = "密码不能为空")
        private String password;

        // 手动添加无参构造器
        public LoginRequest() {}

        // 手动添加全参构造器
        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }
    }

    @Data
    public static class LoginResponse {
        private String token;
        private UserInfo user;

        public LoginResponse() {}

        public LoginResponse(String token, UserInfo user) {
            this.token = token;
            this.user = user;
        }
    }

    @Data
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String displayName;
        private String role;
        private String studioStatus;
        private String studioName;

        public UserInfo() {}

        public UserInfo(Long id, String username, String email, String displayName,
                        String role, String studioStatus, String studioName) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.displayName = displayName;
            this.role = role;
            this.studioStatus = studioStatus;
            this.studioName = studioName;
        }
    }

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "用户名不能为空")
        @Size(min = 3, max = 64, message = "用户名长度为3-64个字符")
        private String username;

        @NotBlank(message = "邮箱不能为空")
        @Email(message = "邮箱格式不正确")
        @Size(max = 128, message = "邮箱长度不能超过128个字符")
        private String email;

        @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 128, message = "密码长度为6-128个字符")
        private String password;

        @Size(max = 64, message = "显示名称长度不能超过64个字符")
        private String displayName;

        private Role role = Role.USER;

        public RegisterRequest() {}

        public RegisterRequest(String username, String email, String password, String displayName) {
            this.username = username;
            this.email = email;
            this.password = password;
            this.displayName = displayName;
        }
    }
}
