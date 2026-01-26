pipeline {
    agent any

    environment {
        // 프로젝트 설정
        BACKEND_DIR = 'backend'
        IMAGE_NAME = 'icethang-backend-server'

        // java 17 버전 설정
        JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64'
        PATH = "${JAVA_HOME}/bin:${env.PATH}"
        
        // 서버 내 설정 파일 경로
        HOST_CONF_DIR = '/home/ubuntu/server-conf'
        
        // Mattermost Webhook URL
        MATTERMOST_URL = 'https://meeting.ssafy.com/hooks/83x1b6t177b59nxcej5ufsxtja'
        
        // 기본값 설정
        SERVICE_NAME = 'develop-server'
        IMAGE_TAG = 'develop'
        SPRING_PROFILE = 'develop' // 기본 프로필
    }

stages {
        stage('Checkout & Check Changes') {
            steps {
                script {
                    // 1. 브랜치 감지
                    checkout scm

                    // 2. 현재 브랜치 확인 및 변수 설정
                    if (env.BRANCH_NAME == 'master') {
                        echo "🚨 [운영 배포] Master 브랜치 감지 -> Release Server 배포 설정"
                        env.SERVICE_NAME = 'release-server'
                        env.IMAGE_TAG = 'release'
                        env.SPRING_PROFILE = 'release'
                        env.CONTAINER_NAME = 'release-server'
                        env.HOST_PORT = '8081'
                    } else {
                        echo "🚧 [개발 배포] Develop 브랜치 감지 -> Develop Server 배포 설정"
                        env.SERVICE_NAME = 'develop-server'
                        env.IMAGE_TAG = 'develop'
                        env.SPRING_PROFILE = 'develop'
                        env.CONTAINER_NAME = 'develop-server'
                        env.HOST_PORT = '8082'
                    }

                    // 3. backend 폴더 변경 사항 감지
                    try {
                        def changes = sh(script: "git diff --name-only HEAD HEAD~1", returnStdout: true).trim()
                        echo "📝 변경된 파일 목록:\n${changes}"

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
                echo "🚀 EC2 배포 시작... (Profile: ${env.SPRING_PROFILE}, Port: ${env.HOST_PORT})"
                script {
                    // 1. 기존 컨테이너 정리
                    try {
                        sh "docker stop ${env.CONTAINER_NAME}"
                        sh "docker rm ${env.CONTAINER_NAME}"
                    } catch (Exception e) {
                        echo '기존에 실행 중인 컨테이너가 없습니다.'
                    }

                    // 2. 새 컨테이너 실행
                    sh """
                        docker run -d \
                        -p ${env.HOST_PORT}:8080 \
                        --name ${env.CONTAINER_NAME} \
                        --network infra_app-network \
                        -v ${HOST_CONF_DIR}:/config \
                        -e SPRING_PROFILES_ACTIVE=${env.SPRING_PROFILE} \
                        ${env.IMAGE_NAME}
                    """
                }
            }
        }
        
        stage('Clean Up') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            script {
                if (env.IS_BACKEND_CHANGED == "true") {
                    def Author_ID = sh(script: "git show -s --pretty=%an", returnStdout: true).trim()
                    def Commit_Message = sh(script: "git show -s --pretty=%B", returnStdout: true).trim()
                    
                    mattermostSend(color: 'good', 
                        message: "### ✅ E204 백엔드 배포 성공!\n- **Profile**: ${env.SPRING_PROFILE}\n- **작성자**: ${Author_ID}\n- **메시지**: ${Commit_Message}",
                        endpoint: "${MATTERMOST_URL}",
                        channel: '#team-e204'
                    )
                }
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