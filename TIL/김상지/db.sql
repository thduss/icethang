-- 1. 데이터베이스 생성 및 설정 (이미 있다면 생략 가능)
CREATE DATABASE IF NOT EXISTS class_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE class_manager;

-- ==========================================
-- [독립 테이블] 의존성이 없는 테이블 먼저 생성
-- ==========================================

-- 1. 학교 (Schools)
CREATE TABLE schools (
                         school_id INT AUTO_INCREMENT PRIMARY KEY,
                         school_name VARCHAR(100) NOT NULL
) ENGINE=InnoDB COMMENT='학교 기본 정보';

-- 2. 레벨 규칙 (Level_Rules)
CREATE TABLE level_rules (
                             level INT PRIMARY KEY,
                             required_xp INT NOT NULL COMMENT '해당 레벨 도달에 필요한 경험치',
                             updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             deleted_at DATETIME NULL
) ENGINE=InnoDB COMMENT='레벨별 경험치 테이블';

-- 3. 테마 (Themes)
CREATE TABLE themes (
                        theme_id INT AUTO_INCREMENT PRIMARY KEY,
                        theme_name VARCHAR(50) NOT NULL,
                        asset_url VARCHAR(512) NULL COMMENT 'S3 경로 (Lottie JSON 등)',
                        asset_type VARCHAR(20) NULL COMMENT '파일 타입 (LOTTIE, IMAGE...)',
                        theme_category VARCHAR(20) NOT NULL COMMENT '구분: CHARACTER(잠금), BACKGROUND(무료)',
                        unlock_level INT NULL COMMENT 'CHARACTER일 경우 해금 레벨',
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='우주선 및 배경 테마 리소스';

-- ==========================================
-- [의존 테이블] FK가 걸려있는 테이블 생성
-- ==========================================

-- 4. 선생님 (Teachers) - 학교 참조
CREATE TABLE teachers (
                          email VARCHAR(100) PRIMARY KEY COMMENT '로그인 ID로 사용',
                          school_id INT NOT NULL,
                          teacher_name VARCHAR(50) NOT NULL,
                          password VARCHAR(255) NULL COMMENT '소셜 로그인 시 NULL',
                          social_type VARCHAR(20) NULL COMMENT 'KAKAO, NAVER, GOOGLE',
                          social_id VARCHAR(255) NULL COMMENT '소셜 제공자 고유 ID',
                          refresh_token VARCHAR(512) NULL,
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          deleted_at DATETIME NULL,
                          CONSTRAINT fk_teachers_school FOREIGN KEY (school_id) REFERENCES schools(school_id)
) ENGINE=InnoDB COMMENT='선생님 계정 정보';

-- 5. 그룹/반 (Groups) - 선생님 참조
CREATE TABLE groups (
                        group_id INT AUTO_INCREMENT PRIMARY KEY,
                        teacher_id VARCHAR(100) NOT NULL,
                        group_name VARCHAR(50) NOT NULL,
                        invite_code VARCHAR(20) NOT NULL UNIQUE COMMENT '학생 입장용 난수 코드',

    -- 선생님 제어 스위치
                        allow_digital_mode BOOLEAN DEFAULT FALSE COMMENT '디지털 수업 버튼 잠금 해제',
                        allow_normal_mode BOOLEAN DEFAULT FALSE COMMENT '일반 수업 버튼 잠금 해제',
                        allow_theme_change BOOLEAN DEFAULT FALSE COMMENT '테마 변경 버튼 잠금 해제',

                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        deleted_at DATETIME NULL,
                        CONSTRAINT fk_groups_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(email)
) ENGINE=InnoDB COMMENT='반 정보 및 수업 제어 상태';

-- 6. 학생 (Students) - 학교, 그룹, 테마, 레벨 참조
CREATE TABLE students (
                          student_id INT AUTO_INCREMENT PRIMARY KEY,
                          school_id INT NOT NULL,
                          group_id INT NOT NULL,
                          student_number INT NOT NULL,
                          student_name VARCHAR(20) NOT NULL,

    -- 기기 인증 및 로그인
                          device_uuid VARCHAR(100) NULL COMMENT '인증 완료된 기기 고유 ID',

    -- 게임 요소
                          current_xp INT DEFAULT 0,
                          current_level INT DEFAULT 1,
                          equipped_character_id INT NULL COMMENT '장착한 캐릭터 테마',
                          equipped_background_id INT NULL COMMENT '장착한 배경 테마',

                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          deleted_at DATETIME NULL,

    -- 외래키 제약조건
                          CONSTRAINT fk_students_school FOREIGN KEY (school_id) REFERENCES schools(school_id),
                          CONSTRAINT fk_students_group FOREIGN KEY (group_id) REFERENCES groups(group_id),
                          CONSTRAINT fk_students_level FOREIGN KEY (current_level) REFERENCES level_rules(level),
                          CONSTRAINT fk_students_char FOREIGN KEY (equipped_character_id) REFERENCES themes(theme_id),
                          CONSTRAINT fk_students_bg FOREIGN KEY (equipped_background_id) REFERENCES themes(theme_id),

    -- 성능 최적화: UUID로 로그인 시 초고속 검색을 위한 인덱스
                          INDEX idx_students_uuid (device_uuid)
) ENGINE=InnoDB COMMENT='학생 정보 및 상태';

-- 7. 로그인 요청 대기열 (Login_Requests) - 그룹 참조
CREATE TABLE login_requests (
                                request_id INT AUTO_INCREMENT PRIMARY KEY,
                                group_id INT NOT NULL,
                                student_number INT NOT NULL COMMENT '학생이 입력한 번호',
                                student_name VARCHAR(20) NOT NULL COMMENT '학생이 입력한 이름',
                                device_uuid VARCHAR(100) NOT NULL COMMENT '요청 보낸 기기 ID',
                                status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',

                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                deleted_at DATETIME NULL,

                                CONSTRAINT fk_requests_group FOREIGN KEY (group_id) REFERENCES groups(group_id)
) ENGINE=InnoDB COMMENT='학생 기기 인증 요청 대기열';

-- 8. 학생 보유 테마 (Student_Unlocked_Themes) - 학생, 테마 참조
CREATE TABLE student_unlocked_themes (
                                         unlock_id INT AUTO_INCREMENT PRIMARY KEY,
                                         student_id INT NOT NULL,
                                         theme_id INT NOT NULL,
                                         acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                                         CONSTRAINT fk_unlocked_student FOREIGN KEY (student_id) REFERENCES students(student_id),
                                         CONSTRAINT fk_unlocked_theme FOREIGN KEY (theme_id) REFERENCES themes(theme_id)
) ENGINE=InnoDB COMMENT='학생이 획득한 테마 목록';

-- 9. 시간표 (Timetables) - 그룹 참조
CREATE TABLE timetables (
                            timetable_id INT AUTO_INCREMENT PRIMARY KEY,
                            group_id INT NOT NULL,
                            day_of_week VARCHAR(10) NOT NULL COMMENT 'MON, TUE, WED...',
                            class_no INT NOT NULL COMMENT '몇 교시 (1, 2, 3...)',
                            subject VARCHAR(50) NULL,
                            start_time TIME NULL,
                            end_time TIME NULL,

    -- 화이트보드 패턴 (매일 갱신)
                            goal_content TEXT NULL COMMENT '오늘의 학습 목표',
                            goal_date DATE NULL COMMENT '목표가 설정된 날짜',

                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            deleted_at DATETIME NULL,

                            CONSTRAINT fk_timetables_group FOREIGN KEY (group_id) REFERENCES groups(group_id)
) ENGINE=InnoDB COMMENT='시간표 및 일일 학습 목표';

-- 10. 학습 로그 (Study_Logs) - 학생, 시간표 참조
CREATE TABLE study_logs (
                            log_id INT AUTO_INCREMENT PRIMARY KEY,
                            student_id INT NOT NULL,
                            timetable_id INT NULL,
                            date DATE NOT NULL,

    -- 스냅샷 (박제된 데이터)
                            class_no INT NULL COMMENT '당시 교시',
                            subject VARCHAR(50) NULL COMMENT '당시 과목명',
                            start_time TIME NULL,
                            end_time TIME NULL,

    -- 분석 데이터
                            earned_xp INT DEFAULT 0 COMMENT '획득 경험치',
                            focus_rate INT DEFAULT 0 COMMENT '집중도 (0~100)',
                            distraction_score INT DEFAULT 0 COMMENT '산만도 (1~5)',
                            out_of_seat_count INT DEFAULT 0 COMMENT '자리 이탈 횟수',
                            bad_posture_time INT DEFAULT 0 COMMENT '나쁜 자세 유지 시간(분)',

                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            deleted_at DATETIME NULL,

                            CONSTRAINT fk_logs_student FOREIGN KEY (student_id) REFERENCES students(student_id),
                            CONSTRAINT fk_logs_timetable FOREIGN KEY (timetable_id) REFERENCES timetables(timetable_id)
) ENGINE=InnoDB COMMENT='AI 분석 결과 및 학습 이력';