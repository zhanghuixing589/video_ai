package org.example.video_ai.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    void staleSessionCannotRemoveTheCurrentSession() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("user:session:1")).thenReturn("new-session");
        SessionService service = new SessionService(redisTemplate);

        boolean removed = service.removeSession(1L, "old-session");

        assertThat(removed).isFalse();
        verify(redisTemplate, never()).delete("user:session:1");
    }

    @Test
    void currentSessionCanBeRemoved() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("user:session:1")).thenReturn("current-session");
        when(redisTemplate.delete("user:session:1")).thenReturn(true);
        SessionService service = new SessionService(redisTemplate);

        boolean removed = service.removeSession(1L, "current-session");

        assertThat(removed).isTrue();
        verify(redisTemplate).delete("user:session:1");
    }
}
