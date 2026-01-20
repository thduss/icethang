pipeline {
    agent any

    environment {
        // 프로젝트 설정
        TARGET_BRANCH = 'master'
        BACKEND_DIR = 'backend'
        IMAGE_NAME = 'icethang-backend-server'
        CONTAINER_NAME = 'icethang-backend-server'
        
        // 서버 내 설정 파일 경로
        HOST_CONF_DIR = '/home/ubuntu/server-conf'
        
        // Mattermost Webhook URL
        MATTERMOST_URL = 'https://meeting.ssafy.com/hooks/83x1b6t177b59nxcej5ufsxtja'
    }

stages {
        stage('Checkout & Check Changes') {
            steps {
                script {
                    // 1. 브랜치 감지
                    checkout scm

                    // 2. 변경 사항 감지 (backend 폴더에 변화가 있는지 확인)
                    try {
                        def changes = sh(script: "git diff --name-only HEAD HEAD~1", returnStdout: true).trim()
                        echo "📝 변경된 파일 목록:\n${changes}"

                        // 백엔드 폴더가 변경되었거나, 첫 빌드(비교불가)라면 빌드 진행
                        if (changes.contains("${BACKEND_DIR}")) {
                            echo "🚨 백엔드 코드 변경 감지! 빌드를 진행합니다."
                            env.IS_BACKEND_CHANGED = "true"
                        } else {
                            echo "💤 백엔드 변경 없음. (빌드 스킵 가능)"
                            env.IS_BACKEND_CHANGED = "false"
                        }
                    } catch (Exception e) {
                        echo "⚠️ 첫 빌드거나 커밋 기록이 부족합니다. 무조건 빌드를 진행합니다."
                        env.IS_BACKEND_CHANGED = "true"
                    }
                }
            }
        }

        stage('Build Gradle') {
            when { expression { return env.IS_BACKEND_CHANGED == "true" } }
            steps {
                dir("${BACKEND_DIR}") {
                    echo '🛠️ Gradle 빌드 시작...'
                    sh 'chmod +x gradlew'
                    sh './gradlew clean build -x test'
                }
            }
        }

        // Dockerfile을 이용해 이미지 생성
        stage('Build Docker Image') {
            when { expression { return env.IS_BACKEND_CHANGED == "true" } }
            steps {
                dir("${BACKEND_DIR}") {
                    echo '🐳 도커 이미지 빌드...'
                    sh "docker build -t ${IMAGE_NAME} ."
                }
            }
        }

        stage('Deploy') {
            when { expression { return env.IS_BACKEND_CHANGED == "true" } }
            steps {
                echo '🚀 EC2 배포 시작...'
                script {
                    // 1. 기존 컨테이너 정리 (에러 무시)
                    try {
                        sh "docker stop ${CONTAINER_NAME}"
                        sh "docker rm ${CONTAINER_NAME}"
                    } catch (Exception e) {
                        echo '기존에 실행 중인 컨테이너가 없습니다.'
                    }

                    // 2. 새 컨테이너 실행 (/config/application-prod.yml 읽음)
                    sh """
                        docker run -d \
                        -p 8080:8080 \
                        --name ${CONTAINER_NAME} \
                        -v ${HOST_CONF_DIR}:/config \
                        -e SPRING_PROFILES_ACTIVE=prod \
                        ${IMAGE_NAME}
                    """
                }
            }
        }
        
        // 사용하지 않는 이미지 삭제
        stage('Clean Up') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    // 매터모스트 알림 설정
    post {
        success {
            script {
                def Author_ID = sh(script: "git show -s --pretty=%an", returnStdout: true).trim()
                def Commit_Message = sh(script: "git show -s --pretty=%B", returnStdout: true).trim()
                
                // mattermostSend 플러그인이 깔려있어야 작동합니다.
                 mattermostSend(color: 'good', 
                    message: "### ✅ E204 백엔드 배포 성공!\n- **작성자**: ${Author_ID}\n- **메시지**: ${Commit_Message}",
                    endpoint: "${MATTERMOST_URL}",
                    channel: '#team-e204'
                )
            }
        }
        failure {
            script {
                 mattermostSend(color: 'danger', 
                    message: "### 🚨 E204 백엔드 배포 실패... 로그를 확인해주세요.",
                    endpoint: "${MATTERMOST_URL}",
                    channel: '#team-e204'
                )
            }
        }
    }
}