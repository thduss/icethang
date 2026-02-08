-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 13.125.107.150    Database: release_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `class_event_logs`
--

DROP TABLE IF EXISTS `class_event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_event_logs` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `log_id` bigint NOT NULL,
  `event_type` enum('FOCUS','UNFOCUS','AWAY') NOT NULL COMMENT 'AI 감지 상태: 집중, 미집중, 이탈',
  `detected_at` timestamp NOT NULL COMMENT 'AI 모델이 해당 행동을 감지한 시각',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `student_id` (`student_id`),
  KEY `log_id` (`log_id`),
  CONSTRAINT `class_event_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `class_event_logs_ibfk_2` FOREIGN KEY (`log_id`) REFERENCES `study_logs` (`log_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_groups`
--

DROP TABLE IF EXISTS `class_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_groups` (
  `group_id` bigint NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint NOT NULL,
  `grade` int DEFAULT NULL,
  `class_num` int DEFAULT NULL,
  `invite_code` varchar(20) NOT NULL,
  `allow_digital_mode` tinyint(1) DEFAULT '0',
  `allow_normal_mode` tinyint(1) DEFAULT '0',
  `allow_theme_change` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `class_groups_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `level_rules`
--

DROP TABLE IF EXISTS `level_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `level_rules` (
  `level` int NOT NULL,
  `required_xp` int NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `school_id` int NOT NULL AUTO_INCREMENT,
  `sc_code` varchar(20) NOT NULL COMMENT '시도교육청 코드',
  `school_code` varchar(20) NOT NULL COMMENT '표준학교코드',
  `school_name` varchar(255) NOT NULL,
  PRIMARY KEY (`school_id`),
  UNIQUE KEY `sc_code` (`sc_code`,`school_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_unlocked_themes`
--

DROP TABLE IF EXISTS `student_unlocked_themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_unlocked_themes` (
  `unlock_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `theme_id` bigint NOT NULL,
  `acquired_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`unlock_id`),
  KEY `student_id` (`student_id`),
  KEY `theme_id` (`theme_id`),
  CONSTRAINT `student_unlocked_themes_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `student_unlocked_themes_ibfk_2` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`theme_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` bigint NOT NULL AUTO_INCREMENT,
  `school_id` int DEFAULT NULL,
  `group_id` bigint DEFAULT NULL COMMENT '소속된 반 ID',
  `student_number` int DEFAULT NULL COMMENT '반 번호',
  `student_name` varchar(50) NOT NULL,
  `device_uuid` varchar(255) NOT NULL COMMENT '기기 고유 ID',
  `current_xp` int DEFAULT '0',
  `current_level` int DEFAULT '1',
  `equipped_character_id` bigint DEFAULT NULL,
  `equipped_background_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `device_uuid` (`device_uuid`),
  KEY `school_id` (`school_id`),
  KEY `group_id` (`group_id`),
  KEY `equipped_character_id` (`equipped_character_id`),
  KEY `equipped_background_id` (`equipped_background_id`),
  KEY `current_level` (`current_level`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`),
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `class_groups` (`group_id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`equipped_character_id`) REFERENCES `themes` (`theme_id`),
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`equipped_background_id`) REFERENCES `themes` (`theme_id`),
  CONSTRAINT `students_ibfk_5` FOREIGN KEY (`current_level`) REFERENCES `level_rules` (`level`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_logs`
--

DROP TABLE IF EXISTS `study_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_logs` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `timetable_id` bigint DEFAULT NULL,
  `date` date NOT NULL,
  `class_no` int DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `focus_rate` int DEFAULT NULL COMMENT '0~100',
  `out_of_seat_count` int DEFAULT '0',
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `student_id` (`student_id`),
  KEY `timetable_id` (`timetable_id`),
  CONSTRAINT `study_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `study_logs_ibfk_2` FOREIGN KEY (`timetable_id`) REFERENCES `timetables` (`timetable_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1188 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `teacher_id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `teacher_name` varchar(50) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `provider` varchar(20) DEFAULT NULL COMMENT 'KAKAO, NAVER',
  `provider_id` varchar(255) DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `email` (`email`),
  KEY `school_id` (`school_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`school_id`) REFERENCES `schools` (`school_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `themes` (
  `theme_id` bigint NOT NULL AUTO_INCREMENT,
  `theme_name` varchar(100) NOT NULL,
  `asset_url` varchar(255) DEFAULT NULL COMMENT 'S3 URL',
  `asset_type` varchar(50) DEFAULT NULL,
  `theme_category` varchar(50) DEFAULT NULL COMMENT 'CHARACTER, BACKGROUND',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`theme_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timetables`
--

DROP TABLE IF EXISTS `timetables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetables` (
  `timetable_id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` bigint NOT NULL,
  `day_of_week` varchar(10) DEFAULT NULL COMMENT '요일 : MON, TUE...',
  `class_no` int DEFAULT NULL COMMENT '교시 : 1, 2...',
  `subject` varchar(50) DEFAULT NULL,
  `sem` int DEFAULT NULL COMMENT '학기 : 1, 2...',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`timetable_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `timetables_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `class_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-08 23:06:28
