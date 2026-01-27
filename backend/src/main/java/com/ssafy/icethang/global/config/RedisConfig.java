package com.ssafy.icethang.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableRedisRepositories
public class RedisConfig {
    @Value("${spring.data.redis.host}")
    private String host;

    @Value("${spring.data.redis.port}")
    private int port;

    @Value("${spring.data.redis.database:0}")
    private int database; // redis 방번호 적어주기

    // redis 연결용
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        org.springframework.data.redis.connection.RedisStandaloneConfiguration config =
                new org.springframework.data.redis.connection.RedisStandaloneConfiguration();

        config.setHostName(host);
        config.setPort(port);
        config.setDatabase(database); // redis 방번호 적어주기

        return new LettuceConnectionFactory(config);
    }

    // redis에 데이터 쓰고 읽을때 필요한 도구 모음
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        // key, value 를 문자열로 저장 위해서 직렬화
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        return redisTemplate;
    }
}
