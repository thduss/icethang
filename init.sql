CREATE DATABASE IF NOT EXISTS release_db;
CREATE DATABASE IF NOT EXISTS develop_db;

USE release_db;
-- 1. 학교
CREATE TABLE schools (
    school_id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 선생님 (ID PK 체제)
CREATE TABLE teachers (
    teacher_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    school_id INT,
    teacher_name VARCHAR(50) NOT NULL,
    password VARCHAR(255),
    provider VARCHAR(20) COMMENT 'KAKAO, NAVER, GOOGLE',
    provider_id VARCHAR(255),
    refresh_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (school_id) REFERENCES schools (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 그룹/반
CREATE TABLE class_groups (
    group_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    groups_name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    allow_digital_mode TINYINT(1) DEFAULT 0,
    allow_normal_mode TINYINT(1) DEFAULT 0,
    allow_theme_change TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 테마 (학생 참조를 위해 먼저 생성)
CREATE TABLE themes (
    theme_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL,
    asset_url VARCHAR(255) COMMENT 'S3 URL',
    asset_type VARCHAR(50),
    theme_category VARCHAR(50) COMMENT 'CHARACTER, BACKGROUND',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 레벨 규칙 (학생 참조를 위해 먼저 생성)
CREATE TABLE level_rules (
    level INT PRIMARY KEY,
    required_xp INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 학생 (class_members 삭제 -> group_id 포함)
CREATE TABLE students (
    student_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    school_id INT,
    group_id BIGINT COMMENT '소속된 반 ID',
    student_number INT COMMENT '반 번호',
    student_name VARCHAR(50) NOT NULL,
    device_uuid VARCHAR(255) UNIQUE NOT NULL COMMENT '기기 고유 ID',
    current_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    equipped_character_id BIGINT,
    equipped_background_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools (school_id),
    FOREIGN KEY (group_id) REFERENCES class_groups (group_id) ON DELETE SET NULL,
    FOREIGN KEY (equipped_character_id) REFERENCES themes (theme_id),
    FOREIGN KEY (equipped_background_id) REFERENCES themes (theme_id),
    FOREIGN KEY (current_level) REFERENCES level_rules (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 시간표
CREATE TABLE timetables (
    timetable_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    day_of_week VARCHAR(10) COMMENT 'MON, TUE...',
    class_no INT COMMENT '1교시, 2교시...',
    subject VARCHAR(50),
    start_time TIME,
    end_time TIME,
    goal_content TEXT,
    goal_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES class_groups (group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 학습 로그
CREATE TABLE study_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    timetable_id BIGINT,
    date DATE NOT NULL,
    class_no INT,
    subject VARCHAR(50),
    start_time TIME,
    end_time TIME,
    earned_xp INT DEFAULT 0,
    focus_rate INT COMMENT '0~100',
    distraction_score INT COMMENT '1~5',
    out_of_seat_count INT DEFAULT 0,
    bad_posture_time INT DEFAULT 0 COMMENT '분 단위',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students (student_id) ON DELETE CASCADE,
    FOREIGN KEY (timetable_id) REFERENCES timetables (timetable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 학생 보유 테마
CREATE TABLE student_unlocked_themes (
    unlock_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    theme_id BIGINT NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (student_id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes (theme_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


USE develop_db;
-- 1. 학교
CREATE TABLE schools (
    school_id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 선생님 (ID PK 체제)
CREATE TABLE teachers (
    teacher_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    school_id INT,
    teacher_name VARCHAR(50) NOT NULL,
    password VARCHAR(255),
    provider VARCHAR(20) COMMENT 'KAKAO, NAVER, GOOGLE',
    provider_id VARCHAR(255),
    refresh_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (school_id) REFERENCES schools (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 그룹/반
CREATE TABLE class_groups (
    group_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    groups_name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    allow_digital_mode TINYINT(1) DEFAULT 0,
    allow_normal_mode TINYINT(1) DEFAULT 0,
    allow_theme_change TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (teacher_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 테마 (학생 참조를 위해 먼저 생성)
CREATE TABLE themes (
    theme_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL,
    asset_url VARCHAR(255) COMMENT 'S3 URL',
    asset_type VARCHAR(50),
    theme_category VARCHAR(50) COMMENT 'CHARACTER, BACKGROUND',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 레벨 규칙 (학생 참조를 위해 먼저 생성)
CREATE TABLE level_rules (
    level INT PRIMARY KEY,
    required_xp INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 학생 (class_members 삭제 -> group_id 포함)
CREATE TABLE students (
    student_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    school_id INT,
    group_id BIGINT COMMENT '소속된 반 ID',
    student_number INT COMMENT '반 번호',
    student_name VARCHAR(50) NOT NULL,
    device_uuid VARCHAR(255) UNIQUE NOT NULL COMMENT '기기 고유 ID',
    current_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    equipped_character_id BIGINT,
    equipped_background_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (school_id) REFERENCES schools (school_id),
    FOREIGN KEY (group_id) REFERENCES class_groups (group_id) ON DELETE SET NULL,
    FOREIGN KEY (equipped_character_id) REFERENCES themes (theme_id),
    FOREIGN KEY (equipped_background_id) REFERENCES themes (theme_id),
    FOREIGN KEY (current_level) REFERENCES level_rules (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 시간표
CREATE TABLE timetables (
    timetable_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    day_of_week VARCHAR(10) COMMENT 'MON, TUE...',
    class_no INT COMMENT '1교시, 2교시...',
    subject VARCHAR(50),
    start_time TIME,
    end_time TIME,
    goal_content TEXT,
    goal_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES class_groups (group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. 학습 로그
CREATE TABLE study_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    timetable_id BIGINT,
    date DATE NOT NULL,
    class_no INT,
    subject VARCHAR(50),
    start_time TIME,
    end_time TIME,
    earned_xp INT DEFAULT 0,
    focus_rate INT COMMENT '0~100',
    distraction_score INT COMMENT '1~5',
    out_of_seat_count INT DEFAULT 0,
    bad_posture_time INT DEFAULT 0 COMMENT '분 단위',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students (student_id) ON DELETE CASCADE,
    FOREIGN KEY (timetable_id) REFERENCES timetables (timetable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. 학생 보유 테마
CREATE TABLE student_unlocked_themes (
    unlock_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    theme_id BIGINT NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (student_id) ON DELETE CASCADE,
    FOREIGN KEY (theme_id) REFERENCES themes (theme_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;