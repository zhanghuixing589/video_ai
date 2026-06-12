package org.example.video_ai.config;

import org.example.video_ai.entity.User;
import org.example.video_ai.enums.Role;
import org.example.video_ai.enums.StudioStatus;
import org.example.video_ai.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DevAdminInitializerTest {

    @Test
    void createsDefaultAdminWhenMissing() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.existsByUsername("admin")).thenReturn(false);
        when(repository.existsByEmailIgnoreCase("admin@video-ai.local")).thenReturn(false);
        when(encoder.encode("Admin@123456")).thenReturn("encoded");

        new DevAdminInitializer(repository, encoder).initialize();

        verify(repository).save(any(User.class));
    }

    @Test
    void doesNotOverwriteExistingAdmin() {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        when(repository.existsByUsername("admin")).thenReturn(true);

        new DevAdminInitializer(repository, encoder).initialize();

        verify(repository, never()).save(any(User.class));
    }
}
