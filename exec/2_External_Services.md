# 2. 외부 서비스 정보 문서

본 프로젝트에서 사용된 외부 API 및 서비스(OAuth, Open API 등)의 정보와 설정 방법을 기술합니다.

## 1. 소셜 로그인 (Social Login / OAuth 2.0)

사용자 편의성을 위해 카카오와 네이버 로그인을 연동하였습니다.

### 1-1. 카카오 로그인 (Kakao)
* **서비스 용도:** 간편 로그인 및 사용자 기본 정보(닉네임, 프로필 사진) 조회
* **설정 파일 위치:** `/home/ubuntu/server-conf/application-release.yml`
* **주요 설정 정보:**
  * **Redirect URI:**
    * (운영) `https://[도메인]/login/oauth2/code/kakao`
    * (로컬) `http://localhost:8080/login/oauth2/code/kakao`
  * **Scope:** `profile_nickname`, `profile_image`, `account_email`

### 1-2. 네이버 로그인 (Naver)
* **서비스 용도:** 간편 로그인 및 이메일 정보 획득
* **설정 파일 위치:** `/home/ubuntu/server-conf/application-release.yml`
* **주요 설정 정보:**
  * **Redirect URI:**
    * (운영) `https://[도메인]/login/oauth2/code/naver`
    * (로컬) `http://localhost:8080/login/oauth2/code/naver`

---

## 2. 외부 데이터 API

### 2-1. 나이스 (NEIS) API
* **서비스 명:** NEIS API
* **서비스 용도:** 학교 인증, 학교 시간표
* **설정 파일 위치:** `/home/ubuntu/server-conf/application.yml`
* **API Key / 인증 정보:**
  * **학교 정보 Endpoint URL:** `https://open.neis.go.kr/hub/schoolInfo`
  * **시간표 Endpoint URL:** `https://open.neis.go.kr/hub/elsTimetable`

---

## 3. API 키 관리 및 보안 (Security)

* 모든 API Key와 Secret Key는 보안을 위해 **Git 리포지토리에 직접 포함하지 않고**, EC2 서버 내부의 **외부 설정 파일(`server-conf/*.yml`)**을 통해 주입받아 사용합니다.
* 심사 및 테스트를 위해 필요한 전체 키 값은 **EC2 서버 내부 `application.yml` (또는 `application-release.yml`) 파일**을 확인해 주시기 바랍니다.