package com.ssafy.icethang;

import com.ssafy.icethang.global.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class IcethangApplication {
	public static void main(String[] args) {
		SpringApplication.run(IcethangApplication.class, args);
	}
}