package com.ssafy.icethang.global.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/health")
  public String healthController(){
    return "I'm Alive!";
  }
}
