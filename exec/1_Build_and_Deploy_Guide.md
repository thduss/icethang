
# 1. 빌드 및 배포 가이드 문서

프로젝트의 빌드, 배포 환경 및 실행 방법에 대해 기술합니다.

## 1. 개발 환경

| 구분 | 항목 | 버전 (Version) | 비고 |
| :--- | :--- | :--- | :--- |
| **OS** | Server | SSAFY EC2 | |
| **Language** | Java | OpenJDK 17 | |
| **Framework** | Spring Boot | 3.5.11 | |
| **Build Tool** | Gradle | 8.x | |
| **Database** | MySQL | 8.0 (Docker) | `infra` 폴더 내 docker-compose로 실행 |
| **In-memory DB** | Redis | 7.x (Docker) | `infra` 폴더 내 docker-compose로 실행 |
| **Web Server** | Nginx | 1.18.0 | Reverse Proxy & Load Balancing |
| **Infrastructure** | Docker | 24.0.5 | |

---

## 2. 포트 구성 및 아키텍처

무중단 배포 및 부하 분산을 위해 Nginx 뒤에 2개의 WAS 인스턴스를 두는 구조로 구성되어 있습니다.

| 서비스명 | 포트 (Port) | 설명 |
| :--- | :--- | :--- |
| **Nginx** | `80` → `443` | HTTPS 리다이렉트 및 리버스 프록시 |
| **Spring Boot (Blue)** | `8081` |  release server |
| **Spring Boot (Green)** | `8082` | devleop server|
| **MySQL** | `3306` | Docker 컨테이너 (EC2 내부) | 
| **Redis** | `6379` | Docker 컨테이너 (EC2 내부) |

> **동작 방식:** > 외부 요청(443) → Nginx → `upstream` 설정을 통해 8081 또는 8082 포트로 트래픽 전달

---

## 3. 서버 내부 디렉토리 구조 및 환경 설정

보안 및 관리를 위해 소스 코드와 분리하여 EC2 서버 내부에 설정 파일과 인프라 관련 파일을 위치시켰습니다.

### 3-1. 디렉토리 구조 (EC2)

```text
/home/ubuntu/
├── server-conf/                 # [환경 설정] Spring Boot 설정 파일 위치
│   ├── application-release.yml  # 운영 환경 설정
│   ├── application-develop.yml  # 개발 환경 설정
│   └── application.yml    # 기본 환경 설정
│
└── infra/                       # [인프라] DB 및 Redis 컨테이너 관리
    ├── docker-compose.yml       # MySQL, Redis 실행 스크립트
    └── mysql_data/              # MySQL 데이터 볼륨 마운트 폴더

```

### 3-2. 환경 변수 및 설정 파일 관리

* **설정 파일 위치:** `/home/ubuntu/server-conf/`
* 빌드 된 Jar 파일 실행 시, `-Dspring.config.location` 옵션을 사용하여 위 경로의 설정 파일을 주입합니다.
* **주요 포함 정보:** DB 접속 정보, Redis 호스트, OAuth 키 값 등 민감 정보 포함.

---

## 4. 데이터베이스 구동 가이드

DB(MySQL)와 Redis는 EC2 내부의 `infra` 폴더에서 Docker Compose를 통해 실행됩니다.

### 4-1. 실행 방법

1. **infra 폴더로 이동**
```bash
cd /home/ubuntu/infra

```


2. **컨테이너 실행 (MySQL, Redis)**
```bash
docker-compose up -d

```


* 위 명령어 실행 시 `docker-compose.yml` 설정에 따라 MySQL과 Redis 컨테이너가 생성 및 실행됩니다.
* 데이터는 `mysql_data` 폴더에 영구 저장됩니다.


3. **실행 상태 확인**
```bash
docker ps
# mysql 및 redis 컨테이너 상태가 'Up'인지 확인

```



---

## 5. 프로젝트 빌드 및 실행

### 5-1. 소스 클론 및 빌드

```bash
# 1. GitLab 소스 클론
git clone [GitLab_Repository_URL]

# 2. 프로젝트 루트로 이동
cd [Project_Name]

# 3. Gradle 빌드 (Test 제외 권장)
./gradlew clean build -x test

```

### 5-2. 배포 및 실행 (예시)

Nginx 설정에 따라 8081 또는 8082 포트로 실행합니다.

```bash
# 8081 포트로 실행 시 (예시)
nohup java -jar \
  -Dserver.port=8081 \
  -Dspring.config.location=/home/ubuntu/server-conf/application-release.yml \
  build/libs/[Jar_File_Name].jar &

```

---

## 6. DB 접속 정보

프로젝트 검증을 위한 DB 접속 정보는 아래와 같습니다.

* **Host:** `[EC2_Public_IP]` (또는 localhost)
* **Port:** `3306`
* **Schema:** `release_db`
* **Username:** `root`
* **Password:** `icethang204204`

> **참고:** 상세한 스키마 정보는 `exec` 폴더 내 첨부된 **DB 덤프 파일**을 확인해 주시기 바랍니다.
