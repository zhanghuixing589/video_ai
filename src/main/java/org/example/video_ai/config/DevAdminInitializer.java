package org.example.video_ai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevAdminInitializer implements ApplicationRunner {

    static final String USERNAME = "admin";
    static final String EMAIL = "admin@video-ai.local";
    static final String PASSWORD = "Admin@123456";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initialize();
    }

    void initialize() {
        if (userRepository.existsByUsername(USERNAME)
                || userRepository.existsByEmailIgnoreCase(EMAIL)) {
            return;
        }

        User admin = new User();
        admin.setUsername(USERNAME);
        admin.setEmail(EMAIL);
        admin.setPassword(passwordEncoder.encode(PASSWORD));
        admin.setDisplayName("系统管理员");
        admin.setRole(Role.ADMIN);
        admin.setStudioStatus(StudioStatus.NONE);
        admin.setEnabled(true);
        userRepository.save(admin);
        log.info("Created default development administrator account: {}", USERNAME);
    }
}
