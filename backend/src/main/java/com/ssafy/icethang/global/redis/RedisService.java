package com.ssafy.icethang.global.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, String> redisTemplate;

    // 데이터 저장
    public void setValues(String key, String data, Duration duration){
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        values.set(key, data, duration);
    }

    // 데이터 조회
    public String getValues(String key){
        ValueOperations<String, String> values = redisTemplate.opsForValue();
        return values.get(key);
    }

    // 데이터 삭제
    public void deleteValues(String key){
        redisTemplate.delete(key);
    }

    // 키 존재 여부 확인
    public boolean checkExistValue(String value){
        return !value.equals("false");
    }
}
