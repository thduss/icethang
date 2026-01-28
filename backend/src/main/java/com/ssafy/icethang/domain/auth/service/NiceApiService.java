package com.ssafy.icethang.domain.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.icethang.domain.auth.entity.Schools;
import com.ssafy.icethang.domain.auth.repository.SchoolsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NiceApiService {

    private final SchoolsRepository schoolsRepository;
    private final RestTemplate restTemplate;

    @Value("${nice.api.key}")
    private String apiKey;

    // 생성자를 통해 Repository 주입 및 RestTemplate 초기화
    public NiceApiService(SchoolsRepository schoolsRepository) {
        this.schoolsRepository = schoolsRepository;
        this.restTemplate = new RestTemplate();

        // 한글 깨짐 방지를 위한 UTF-8 설정
        this.restTemplate.getMessageConverters()
                .add(0, new StringHttpMessageConverter(StandardCharsets.UTF_8));
    }

    public Schools searchAndSaveSchool(String schoolName) {
        try {
            // 1. 학교명 수동 인코딩
            String encodedName = URLEncoder.encode(schoolName.trim(), StandardCharsets.UTF_8);

            // 2. URL 조립
            String urlString = "https://open.neis.go.kr/hub/schoolInfo"
                    + "?KEY=" + apiKey.trim()
                    + "&Type=json"
                    + "&pIndex=1"
                    + "&pSize=10"
                    + "&SCHUL_NM=" + encodedName;

            // 2. 헤더 설정 (브라우저와 똑같은 헤더 세팅)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json, text/plain, */*");
            headers.set("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7");

            HttpEntity<String> entity = new HttpEntity<>(headers);

            // 3. URI 객체로 변환
            URI uri = new URI(urlString);

            // 4. 호출
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            Map<String, Object> response = responseEntity.getBody();

            // 5. 데이터 파싱
            if (response == null || !response.containsKey("schoolInfo")) {
                throw new RuntimeException("학교 정보를 찾을 수 없습니다.");
            }

            List<Map<String, Object>> schoolInfo = (List<Map<String, Object>>) response.get("schoolInfo");
            Map<String, String> firstSchool = ((List<Map<String, String>>) schoolInfo.get(1).get("row")).get(0);

            return schoolsRepository.save(Schools.builder()
                    .scCode(firstSchool.get("ATPT_OFCDC_SC_CODE"))
                    .schoolCode(firstSchool.get("SD_SCHUL_CODE"))
                    .schoolName(firstSchool.get("SCHUL_NM"))
                    .build());

        } catch (Exception e) {
            throw new RuntimeException("나이스 서버가 자바 요청을 거부함: " + e.getMessage());
        }
    }

}