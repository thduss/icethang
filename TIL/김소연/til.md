# 📅 기획 자료 제출

## 0. 💡 기획 배경 및 서비스 소개

### 1) 기획 배경
**"한 교실에 한 명은 꼭 있다"**
* **폭발적인 증가세:** 국내 ADHD 환자는 최근 5년간 2배 이상 급증했으며(2018년 약 5.9만 명 → 2022년 약 13.9만 명), 이 중 80% 이상이 10대 아동·청소년입니다.
* **교실 현장의 어려움:** 20~30명 정원 교실에 평균 1~2명의 ADHD 성향 학생이 존재합니다. 이는 단순한 수업 방해를 넘어, 충동적인 교실 이탈과 안전사고로 이어지며 교사들에게 큰 부담이 되고 있습니다.
* **현직 교사 인터뷰 인사이트:** * 태블릿 활용 수업은 늘어나고 있으나, ADHD 학생들의 집중 유지와 이탈 방지에 대한 실질적인 솔루션이 부재합니다.
    * 강압적인 훈육보다는 규칙 인지와 즉각적인 피드백이 효과적입니다.

### 2) 핵심 목표
> **감시나 혼냄이 아닌, 스스로 지키는 "게임 규칙"**
아이들이 '행동 신호등'과 '디지털 거울'을 통해 스스로 "지금은 앉아있을 타이밍"임을 인지하고 행동을 조절하도록 돕습니다.

### 3) 주요 기능
* **🚦 행동 신호등 (Traffic Light):**
    * **Red(Focus):** 착석 유지, 소음 자제 (AI 영상 분석으로 이탈/기립 감지)
    * **Green(Free):** 이동 및 스트레칭 가능
    * **Yellow(Warning):** 엉덩이 들썩임 등 전조 증상 감지 시 경고
* **🪞 디지털 거울:** 태블릿 미사용 수업 시, 본인의 모습을 캐릭터화(안전벨트 착용 등)하여 시각적 피드백 제공
* **🎁 게이미피케이션 보상:** 시선 추적 및 바른 자세 유지 시간을 경험치로 환산하여 캐릭터 육성 및 뽑기(Random Box) 제공
* **👨‍🏫 교사 관리:** 학생 행동 로그(이탈, 집중도) 시각화 및 수업 모드 제어

<br>



## 1. 📋 설문조사 폼
> 타겟 사용자 니즈 파악을 위한 설문조사 링크입니다. 현재 설문조사 진행중입니다.
- [설문조사 바로가기](https://docs.google.com/forms/d/e/1FAIpQLSdxPuOMM_eoiL2UwVJj9BmeGdWLf6zDvBQJs75W7Xd9LeEM4w/viewform?usp=send_form)

<br>

## 2. 📝 컨벤션
팀원 간 협업을 위한 규칙 문서입니다.
- **지라 컨벤션:** [ 바로가기](https://abalone-promotion-4f1.notion.site/2e916a5891e080fcaed3d00d514ed039)
- **브랜치 전략:** [바로가기](https://abalone-promotion-4f1.notion.site/git-branch-2e916a5891e080e6b709e9060e68d43c)
- **코드 컨벤션:** [바로가기](https://abalone-promotion-4f1.notion.site/2e916a5891e080c7ac99c97ee0300b74)

<br>

## 3. 📃 API 명세서
API 명세서입니다.
- [API 명세서 보기](https://abalone-promotion-4f1.notion.site/API-2e916a5891e080dfb50ccc7e574ee9bb)

<br>

## 4. 🗂️ ERD
데이터베이스 설계 도면입니다.
- [ERD 다이어그램 보기](https://abalone-promotion-4f1.notion.site/2e016a5891e08033ac1cd900fe38fa9c?v=2e016a5891e081348954000c052b4c09&p=2e716a5891e0803eaf94ff172ac93f9c&pm=s)

<br>


## 5. 🛠️ 기술 스택 결정
### Frontend
<img src="https://img.shields.io/badge/React_Native-61DAFB?style=flat-square&logo=React&logoColor=black"/>
<img src="https://img.shields.io/badge/Kotlin-7F52FF?style=flat-square&logo=Kotlin&logoColor=white"/>

### Backend
<img src="https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat-square&logo=Spring%20Boot&logoColor=white"/>

### Database
<img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white"/>
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white"/>

### Infrastructure & Tools
 <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=Docker&logoColor=white"/>
 <img src="https://img.shields.io/badge/Amazon_AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white"/>
<img src="https://img.shields.io/badge/Amazon_EC2-FF9900?style=flat-square&logo=amazon-ec2&logoColor=white"/>
<img src="https://img.shields.io/badge/Amazon_RDS-527FFF?style=flat-square&logo=amazon-rds&logoColor=white"/>

## 6. 🏗️ 인프라 구축 예정
**진행 상황**
- EC2 인스턴스 할당 대기 중
- Docker 및 배포 환경 사전 학습

**참고 자료**
- 🔗 [학습 내용 정리(Notion)](https://abalone-promotion-4f1.notion.site/2e916a5891e0806ebc22f8fc4e8a7dc7)

## 7. 🍃 백엔드 초기 프로젝트
Spring Initializr를 통해 생성한 초기 프로젝트를 업로드했습니다.

<img src="https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white"/> <img src="https://img.shields.io/badge/Spring_Boot-3.5.10-6DB33F?style=flat-square&logo=spring-boot&logoColor=white"/>

- 🔗 [초기 프로젝트 코드 보기 (GitHub)](https://lab.ssafy.com/s14-webmobile1-sub1/S14P11E204)