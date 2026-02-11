#!/bin/bash

# 에러나면 즉시 종료
set -e

# 1. 인자값 받기 (Jenkins)
PROFILE=$1
IMAGE_TAG=$2
IMAGE_NAME="icethang-backend-server"

echo "🚀 배포 스크립트 시작: Profile=${PROFILE}, Tag=${IMAGE_TAG}"

# 2. 포트 및 변수 설정 (Profile에 따라 분기)
if [ "$PROFILE" == "release" ]; then
    DEFAULT_PORT=8081
    ALT_PORT=8083
    NGINX_CONF="/etc/nginx/conf.d/service-url.inc"
elif [ "$PROFILE" == "develop" ]; then
    DEFAULT_PORT=8082
    ALT_PORT=8084
    NGINX_CONF="/etc/nginx/conf.d/develop-url.inc"
else
    echo "❌ 잘못된 Profile입니다: $PROFILE"
    exit 1
fi

# 3. 현재 실행 중인 포트 확인
if [ -f "$NGINX_CONF" ]; then
    CURRENT_PORT=$(grep -oP '(?<=:)\d+(?=;)' $NGINX_CONF)
else
    echo "✨ Nginx 설정 파일이 없습니다. 첫 배포로 간주합니다."
    CURRENT_PORT=""
fi

if [ -z "$CURRENT_PORT" ]; then
    echo "✨ 현재 실행 중인 컨테이너가 없습니다. 기본 포트($DEFAULT_PORT)로 배포합니다."
    TARGET_PORT=$DEFAULT_PORT
elif [ "$CURRENT_PORT" == "$DEFAULT_PORT" ]; then
    TARGET_PORT=$ALT_PORT
else
    TARGET_PORT=$DEFAULT_PORT
fi

echo "🎯 현재 포트: ${CURRENT_PORT:-없음} -> 타겟 포트: ${TARGET_PORT}"

CONTAINER_NAME="${PROFILE}-server-${TARGET_PORT}"

# 4. 새 컨테이너 실행
echo "🐳 Docker Run: ${CONTAINER_NAME}"
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

docker run -d \
    -p ${TARGET_PORT}:8080 \
    --name ${CONTAINER_NAME} \
    --network infra_app-network \
    -v /home/ubuntu/server-conf:/config \
    -e SPRING_PROFILES_ACTIVE=${PROFILE} \
    ${IMAGE_NAME}:${IMAGE_TAG} \
    --spring.data.redis.database=$( [ "$PROFILE" == "develop" ] && echo 1 || echo 0 ) \
    --spring.config.additional-location=file:/config/

# 5. Health Check
echo "🏥 Health Check 시작..."

# 타겟 포트 확인 (디버깅용)
echo "🔍 확인 대상: http://127.0.0.1:${TARGET_PORT}"

for i in {1..15}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${TARGET_PORT} || echo "000")

    if [ "$HTTP_CODE" != "000" ]; then
        echo "✅ 서버 정상 구동 확인! (응답 코드: $HTTP_CODE)"
        break
    else
        echo "⏳ 대기 중... ($i/15) - 아직 응답 없음 (Code: $HTTP_CODE)"
        sleep 10
    fi

    if [ $i -eq 15 ]; then
        echo "❌ 배포 실패: 서버가 응답하지 않습니다."
        echo "💡 힌트: 로컬에서 'curl -v http://127.0.0.1:${TARGET_PORT}'를 실행해서 원인을 확인해보세요."
        docker stop ${CONTAINER_NAME}
        exit 1
    fi
done

# 6. Nginx 설정 변경 및 재시작
echo "🔄 Nginx 포트 변경 -> ${TARGET_PORT}"

VAR_NAME="service_url"
if [ "$PROFILE" == "develop" ]; then
    VAR_NAME="develop_url"
fi

echo "set \$${VAR_NAME} http://127.0.0.1:${TARGET_PORT};" | sudo tee ${NGINX_CONF}
sudo nginx -s reload

# 7. 이전 컨테이너 정리
if [ ! -z "$CURRENT_PORT" ]; then
    OLD_CONTAINER="${PROFILE}-server-${CURRENT_PORT}"
    echo "🗑️ 이전 컨테이너 종료: ${OLD_CONTAINER}"
    docker stop ${OLD_CONTAINER}
    docker rm ${OLD_CONTAINER}
fi

echo "🎉 배포 성공!"