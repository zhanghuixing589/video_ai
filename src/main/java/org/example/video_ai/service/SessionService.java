package org.example.video_ai.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class SessionService {
    private final RedisTemplate<String,String> redisTemplate;
    private static final String SESSION_KEY_PREFIX = "user:session:";
    private static final long SESSION_TTL = 24; //24小时

    /*保存用户会话 - 新设备登录会覆盖就会话*/
    public void saveSession(Long userId,String sessionId){
        String key = SESSION_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key,sessionId,SESSION_TTL, TimeUnit.HOURS);
    }

    /*验证会话是否有效 - 被新设备踢下线*/
    public boolean isSessionValid(Long userId,String sessionId){
        String key = SESSION_KEY_PREFIX + userId;
        String currentSessionId = redisTemplate.opsForValue().get(key);
        return sessionId.equals(currentSessionId);
    }

    /*删除会话 - 退出登录*/
    public boolean removeSession(Long userId, String sessionId){
        String key = SESSION_KEY_PREFIX + userId;
        String currentSessionId = redisTemplate.opsForValue().get(key);
        if (!sessionId.equals(currentSessionId)) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    /*获取当前会话*/
    public boolean removeUserSession(Long userId) {
        return Boolean.TRUE.equals(redisTemplate.delete(SESSION_KEY_PREFIX + userId));
    }

    public String getCurrentSession(Long userId){
        String key = SESSION_KEY_PREFIX + userId;
        return redisTemplate.opsForValue().get(key);
    }
}
