# 1. 자바 실행
FROM eclipse-temurin:17-jdk

# 2. 작업 폴더 생성
WORKDIR /app

# 3. 빌드 변수 생성
ARG JAR_FILE=build/libs/*.jar

# 4. JAR 파일을 컨테이너 안으로 복사하고 이름을 app.jar로 변경
COPY ${JAR_FILE} app.jar

# 5. 환경 변수 설정
ENV TZ=Asia/Seoul

# 6. 실행
ENTRYPOINT ["java", "-Dspring.config.location=/config/", "-jar", "app.jar"]