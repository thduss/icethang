package com.ssafy.icethang;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class IcethangApplication {

	public static void main(String[] args) {
		SpringApplication.run(IcethangApplication.class, args);
	}

}