pipeline {
    agent any

    environment {
        // 프로젝트 설정
        BACKEND_DIR = 'backend'
        IMAGE_NAME = 'icethang-backend-server'

        // java 17 버전 설정
        JAVA_HOME = '/usr/lib/jvm/java-17-openjdk-amd64'
        PATH = "${JAVA_HOME}/bin:${env.PATH}"
        
        // Mattermost Webhook URL
        MATTERMOST_URL = 'https://meeting.ssafy.com/hooks/83x1b6t177b59nxcej5ufsxtja'
    }

stages {
        stage('Checkout & Check Changes') {
            steps {
                script {
                    // 1. 브랜치 감지
                    checkout scm

                    echo "🔍 [디버깅] 현재 인식된 브랜치 이름: '${env.BRANCH_NAME}'" 
                    echo "🔍 [디버깅] GIT_BRANCH 변수 확인: '${env.GIT_BRANCH}'"

                    // 2. 현재 브랜치 확인 및 변수 설정
                    if (env.BRANCH_NAME == 'master'|| env.GIT_BRANCH?.contains('master')) {
                        echo "🚨 [운영 배포] Master 브랜치 감지 -> Release Server 배포 설정"
                        env.IMAGE_TAG = 'release'
                        env.SPRING_PROFILE = 'release'
                    } else {
                        echo "🚧 [개발 배포] Develop 브랜치 감지 -> Develop Server 배포 설정"
                        env.IMAGE_TAG = 'develop'
                        env.SPRING_PROFILE = 'develop'
                    }

                    // 3. backend 폴더 & 인프라 변경 사항 감지
                    try {
                        def changes = sh(script: "git diff --name-only HEAD HEAD~1", returnStdout: true).trim()
                        echo "📝 변경된 파일 목록:\n${changes}"

                        if (changes.contains("${BACKEND_DIR}") || changes.contains("infra") || changes.contains("Jenkinsfile") || changes.contains("docker-compose")) {
                            echo "🚨 [변경 감지] 백엔드 코드 또는 인프라 설정이 변경되었습니다. 빌드를 진행합니다."
                            env.IS_BACKEND_CHANGED = "true"
                        } else {
                            echo "💤 감지 대상(백엔드, 인프라) 변경 없음. (빌드 스킵)"
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
                    echo "🐳 도커 이미지 빌드... (${IMAGE_NAME}:${env.IMAGE_TAG})"
                    sh "docker build -t ${IMAGE_NAME}:${env.IMAGE_TAG} ."
                }
            }
        }

        stage('Deploy (Blue-Green)') {
            when { expression { return env.IS_BACKEND_CHANGED == "true" } }
            steps {
                dir("${BACKEND_DIR}") {
                    echo "🚀 Blue-Green 배포 스크립트 실행"
                    
                    // 스크립트에 실행 권한 주기
                    sh 'chmod +x deploy.sh'
                    
                    // 스크립트 실행 (인자: 프로필, 이미지태그)
                    sh "./deploy.sh ${env.SPRING_PROFILE} ${env.IMAGE_TAG}"
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
                // Git 정보 가져오기 (실패 시에도 정보 획득 시도)
                def Author = sh(script: "git show -s --pretty=%an", returnStdout: true).trim()
                def Msg = sh(script: "git show -s --pretty=%B", returnStdout: true).trim()
                def Branch = env.BRANCH_NAME ?: env.GIT_BRANCH
                
                // 에러 로그 바로가기 링크 생성
                def BuildUrl = env.BUILD_URL
                def ConsoleUrl = "${BuildUrl}console"
                
                // Mattermost 메시지 포맷팅
                def failMessage = """### 🚨 **배포 실패 (Build Failed)**
| 정보 | 내용 |
|---|---|
| **프로젝트** | ${env.JOB_NAME} #${env.BUILD_NUMBER} |
| **브랜치** | ${Branch} |
| **작성자** | ${Author} |
| **커밋 메시지** | ${Msg} |
| **에러 로그** | [👉 **바로가기 (Click Here)**](${ConsoleUrl}) |

> **확인 방법**: 위 링크를 클릭하여 Console Output의 맨 아래 에러 로그를 확인해주세요.
"""

                mattermostSend(
                    color: 'danger', 
                    message: failMessage, 
                    endpoint: "${MATTERMOST_URL}", 
                    channel: '#team-e204'
                )
            }
        }
    }
}