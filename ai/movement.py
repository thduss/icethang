import cv2
import mediapipe as mp
import numpy as np
import time
import math
from collections import deque

# ==============================
# 카메라 설정
# ==============================
cap = cv2.VideoCapture(0)

# ==============================
# MediaPipe
# ==============================
mp_pose = mp.solutions.pose
mp_face = mp.solutions.face_mesh
mp_draw = mp.solutions.drawing_utils

pose = mp_pose.Pose(
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

face_mesh = mp_face.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ==============================
# Calibration
# ==============================
CALIB_TIME = 3.0
baseline_data = []
baseline_done = False
start_time = time.time()

# ==============================
# Thresholds (기준값)
# ==============================
# 시선
GAZE_RATIO_TH = 0.10

# 시선 보정 감도
GAZE_CORRECTION_YAW = 0.005
GAZE_CORRECTION_PITCH = 0.002

# 눈 감음
EYE_AR_THRESHOLD = 0.15
EYE_CLOSED_TIME_LIMIT = 20.0

# 움직임 감지 - 개선된 설정
MOVEMENT_HISTORY_SIZE = 15  # 히스토리 크기 증가
HEAD_MOVEMENT_TH_PER_FRAME = 3.0  # 프레임당 움직임 threshold
BODY_MOVEMENT_TH_PER_FRAME = 0.010  # 프레임당 몸 움직임 threshold (조정: 덜 민감하게)
CONTINUOUS_MOVEMENT_COUNT = 5  # 연속 움직임 최소 횟수

# ==============================
# Smoothing 설정
# ==============================
SMOOTHING_ALPHA = 0.5 
SMOOTHING_ALPHA_BODY = 0.3  # Body는 더 강한 smoothing 적용

prev_head_pose = None  
prev_gaze = None       
prev_body = None       

# ==============================
# 상태 추적 변수
# ==============================
FOCUS_TIME = 3
focus_start = None
reward = 0

eye_closed_start = None

head_yaw_history = deque(maxlen=MOVEMENT_HISTORY_SIZE)
head_pitch_history = deque(maxlen=MOVEMENT_HISTORY_SIZE)
head_roll_history = deque(maxlen=MOVEMENT_HISTORY_SIZE)
body_center_history = deque(maxlen=MOVEMENT_HISTORY_SIZE)

# 움직임 상태 추적 (NEW)
is_head_moving = False
is_body_moving = False
STABLE_FRAMES_TO_RESET = 5  # 5프레임 동안 안정적이면 moving 상태 해제

# ==============================
# Helper Functions
# ==============================

def apply_smoothing(current, prev, alpha):
    if prev is None:
        return current
    return alpha * current + (1 - alpha) * prev

def calc_head_pose_3d(face_landmarks, w, h):
    nose_tip = face_landmarks.landmark[1]
    chin = face_landmarks.landmark[152]
    left_eye_outer = face_landmarks.landmark[33]
    right_eye_outer = face_landmarks.landmark[263]
    left_mouth = face_landmarks.landmark[61]
    right_mouth = face_landmarks.landmark[291]
    forehead = face_landmarks.landmark[10]
    
    nose_2d = np.array([nose_tip.x * w, nose_tip.y * h])
    chin_2d = np.array([chin.x * w, chin.y * h])
    left_eye_2d = np.array([left_eye_outer.x * w, left_eye_outer.y * h])
    right_eye_2d = np.array([right_eye_outer.x * w, right_eye_outer.y * h])
    left_mouth_2d = np.array([left_mouth.x * w, left_mouth.y * h])
    right_mouth_2d = np.array([right_mouth.x * w, right_mouth.y * h])
    forehead_2d = np.array([forehead.x * w, forehead.y * h])
    
    eye_center = (left_eye_2d + right_eye_2d) / 2
    eye_width = np.linalg.norm(right_eye_2d - left_eye_2d)
    nose_offset = nose_2d[0] - eye_center[0]
    yaw = (nose_offset / eye_width) * 50
    
    face_height = np.linalg.norm(chin_2d - forehead_2d)
    mouth_center = (left_mouth_2d + right_mouth_2d) / 2
    vertical_offset = mouth_center[1] - eye_center[1]
    pitch = (vertical_offset / face_height) * 50
    
    eye_angle = math.atan2(
        right_eye_2d[1] - left_eye_2d[1],
        right_eye_2d[0] - left_eye_2d[0]
    )
    roll = math.degrees(eye_angle)
    
    return np.array([yaw, pitch, roll])

def calc_eye_aspect_ratio(face_landmarks, eye_points):
    vertical1 = abs(face_landmarks.landmark[eye_points[0]].y - 
                    face_landmarks.landmark[eye_points[1]].y)
    vertical2 = abs(face_landmarks.landmark[eye_points[4]].y - 
                    face_landmarks.landmark[eye_points[5]].y)
    horizontal = abs(face_landmarks.landmark[eye_points[2]].x - 
                     face_landmarks.landmark[eye_points[3]].x)
    ear = (vertical1 + vertical2) / (2.0 * horizontal)
    return ear

def is_eye_open(face_landmarks):
    left_eye_points = [159, 145, 33, 133, 158, 153]
    right_eye_points = [386, 374, 362, 263, 385, 380]
    left_ear = calc_eye_aspect_ratio(face_landmarks, left_eye_points)
    right_ear = calc_eye_aspect_ratio(face_landmarks, right_eye_points)
    avg_ear = (left_ear + right_ear) / 2.0
    return avg_ear > EYE_AR_THRESHOLD, avg_ear

def calc_gaze_ratio(face_landmarks):
    left_eye_left = face_landmarks.landmark[33]
    left_eye_right = face_landmarks.landmark[133]
    left_eye_top = face_landmarks.landmark[159]
    left_eye_bottom = face_landmarks.landmark[145]
    left_iris_center = face_landmarks.landmark[468]
    
    right_eye_left = face_landmarks.landmark[362]
    right_eye_right = face_landmarks.landmark[263]
    right_eye_top = face_landmarks.landmark[386]
    right_eye_bottom = face_landmarks.landmark[374]
    right_iris_center = face_landmarks.landmark[473]
    
    left_eye_width = abs(left_eye_right.x - left_eye_left.x)
    left_iris_x_from_left = abs(left_iris_center.x - left_eye_left.x)
    left_ratio_x = left_iris_x_from_left / left_eye_width if left_eye_width > 0 else 0.5
    
    left_eye_height = abs(left_eye_bottom.y - left_eye_top.y)
    left_iris_y_from_top = abs(left_iris_center.y - left_eye_top.y)
    left_ratio_y = left_iris_y_from_top / left_eye_height if left_eye_height > 0 else 0.5
    
    right_eye_width = abs(right_eye_right.x - right_eye_left.x)
    right_iris_x_from_left = abs(right_iris_center.x - right_eye_left.x)
    right_ratio_x = right_iris_x_from_left / right_eye_width if right_eye_width > 0 else 0.5
    
    right_eye_height = abs(right_eye_bottom.y - right_eye_top.y)
    right_iris_y_from_top = abs(right_iris_center.y - right_eye_top.y)
    right_ratio_y = right_iris_y_from_top / right_eye_height if right_eye_height > 0 else 0.5
    
    avg_ratio_x = (left_ratio_x + right_ratio_x) / 2
    avg_ratio_y = (left_ratio_y + right_ratio_y) / 2
    
    return np.array([avg_ratio_x, avg_ratio_y])

def calc_body_center(pose_landmarks):
    if not pose_landmarks:
        return None
    left_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    center_x = (left_shoulder.x + right_shoulder.x) / 2
    center_y = (left_shoulder.y + right_shoulder.y) / 2
    return np.array([center_x, center_y])

# ==============================
# 개선된 연속 움직임 감지 함수
# ==============================
def check_continuous_movement(history, threshold_per_frame, min_count):
    """
    연속적인 움직임을 감지합니다.
    
    Args:
        history: 값들의 히스토리 (deque)
        threshold_per_frame: 프레임당 움직임 threshold
        min_count: 최소 연속 움직임 횟수
    
    Returns:
        tuple: (움직임 감지 여부, 현재 움직임 횟수, 최근 움직임 여부)
    """
    if len(history) < 2:
        return False, 0, False
    
    values = list(history)
    movement_count = 0
    
    # 각 프레임 간 차이를 계산하고, threshold를 넘는 횟수를 셉니다
    for i in range(len(values) - 1):
        diff = abs(values[i+1] - values[i])
        if diff > threshold_per_frame:
            movement_count += 1
    
    # 가장 최근 프레임에서 움직임이 있는지 체크
    recent_movement = False
    if len(values) >= 2:
        recent_diff = abs(values[-1] - values[-2])
        recent_movement = recent_diff > threshold_per_frame
    
    # 연속 움직임 횟수가 min_count 이상이면 moving으로 판단
    is_moving = movement_count >= min_count
    
    return is_moving, movement_count, recent_movement

def check_body_continuous_movement(history, threshold_per_frame, min_count):
    """
    몸의 연속적인 움직임을 감지합니다.
    """
    if len(history) < 2:
        return False, 0, 0.0, False
    
    centers = list(history)
    movement_count = 0
    max_movement = 0.0
    total_movement = 0.0  # 평균 계산용
    valid_pairs = 0
    
    for i in range(len(centers) - 1):
        if centers[i] is not None and centers[i+1] is not None:
            diff = np.linalg.norm(centers[i+1] - centers[i])
            max_movement = max(max_movement, diff)
            total_movement += diff
            valid_pairs += 1
            if diff > threshold_per_frame:
                movement_count += 1
    
    # 평균 움직임 계산 (디버그용)
    avg_movement = total_movement / valid_pairs if valid_pairs > 0 else 0.0
    
    # 가장 최근 프레임에서 움직임이 있는지 체크
    recent_movement = False
    if len(centers) >= 2 and centers[-1] is not None and centers[-2] is not None:
        recent_diff = np.linalg.norm(centers[-1] - centers[-2])
        recent_movement = recent_diff > threshold_per_frame
    
    is_moving = movement_count >= min_count
    
    return is_moving, movement_count, avg_movement, recent_movement

# ==============================
# 메인 작동
# ==============================
while cap.isOpened():
    success, image = cap.read()
    image = cv2.flip(image, 1)
    if not success:
        break

    h, w, _ = image.shape
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    pose_result = pose.process(rgb)
    face_result = face_mesh.process(rgb)

    if pose_result.pose_landmarks:
        mp_draw.draw_landmarks(image, pose_result.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    current_time = time.time()

    if face_result.multi_face_landmarks:
        face = face_result.multi_face_landmarks[0]

        # 1. Raw Data 계산
        raw_head_pose = calc_head_pose_3d(face, w, h)
        raw_gaze = calc_gaze_ratio(face)
        raw_body_center = calc_body_center(pose_result.pose_landmarks)
        eyes_open, ear_value = is_eye_open(face)

        # 2. Smoothing
        cur_head_pose = apply_smoothing(raw_head_pose, prev_head_pose, SMOOTHING_ALPHA)
        prev_head_pose = cur_head_pose
        yaw, pitch, roll = cur_head_pose

        cur_gaze = apply_smoothing(raw_gaze, prev_gaze, SMOOTHING_ALPHA)
        prev_gaze = cur_gaze
        
        # Gaze Correction
        corrected_gaze_x = cur_gaze[0] + (yaw * GAZE_CORRECTION_YAW)
        corrected_gaze_y = cur_gaze[1] + (pitch * GAZE_CORRECTION_PITCH)
        
        gaze_x, gaze_y = corrected_gaze_x, corrected_gaze_y

        # Body Smoothing (더 강한 smoothing 적용)
        if raw_body_center is not None:
            cur_body = apply_smoothing(raw_body_center, prev_body, SMOOTHING_ALPHA_BODY)
            prev_body = cur_body
            body_center = cur_body
        else:
            body_center = None

        # ---------- Calibration ----------
        if not baseline_done:
            if current_time - start_time < CALIB_TIME:
                baseline_data.append([yaw, pitch, roll, gaze_x, gaze_y])
                cv2.putText(image, "Calibrating... Look at screen", (20, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
            else:
                baseline = np.mean(baseline_data, axis=0)
                base_yaw, base_pitch, base_roll, base_gx, base_gy = baseline
                baseline_done = True
                print(f"Baseline: Yaw={base_yaw:.2f}, GazeX={base_gx:.4f}")
        else:
            # 히스토리 업데이트
            head_yaw_history.append(yaw)
            head_pitch_history.append(pitch)
            head_roll_history.append(roll)
            body_center_history.append(body_center)

            # 눈 감음 체크
            if not eyes_open:
                if eye_closed_start is None:
                    eye_closed_start = current_time
                eye_closed_duration = current_time - eye_closed_start
                if eye_closed_duration >= EYE_CLOSED_TIME_LIMIT:
                    eyes_too_long_closed = True
                    cv2.putText(image, "SLEEPING?", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
                    focus_start = None
                else:
                    eyes_too_long_closed = False
            else:
                eye_closed_start = None
                eyes_too_long_closed = False

            # 개선된 움직임 체크 with 상태 유지
            body_move_count = 0
            body_max_move = 0.0
            
            # 머리 움직임 체크
            head_detected = False
            head_recent = False
            
            yaw_detected, yaw_count, yaw_recent = check_continuous_movement(
                head_yaw_history, HEAD_MOVEMENT_TH_PER_FRAME, CONTINUOUS_MOVEMENT_COUNT
            )
            pitch_detected, pitch_count, pitch_recent = check_continuous_movement(
                head_pitch_history, HEAD_MOVEMENT_TH_PER_FRAME, CONTINUOUS_MOVEMENT_COUNT
            )
            roll_detected, roll_count, roll_recent = check_continuous_movement(
                head_roll_history, HEAD_MOVEMENT_TH_PER_FRAME, CONTINUOUS_MOVEMENT_COUNT
            )
            
            head_detected = yaw_detected or pitch_detected or roll_detected
            head_recent = yaw_recent or pitch_recent or roll_recent
            
            # 머리 움직임 상태 업데이트
            if head_detected:
                is_head_moving = True
                head_stable_count = 0
            elif is_head_moving:
                # 이미 moving 상태인 경우, 최근 움직임이 없으면 stable count 증가
                if not head_recent:
                    head_stable_count = getattr(check_continuous_movement, 'head_stable_count', 0) + 1
                    check_continuous_movement.head_stable_count = head_stable_count
                    if head_stable_count >= STABLE_FRAMES_TO_RESET:
                        is_head_moving = False
                        check_continuous_movement.head_stable_count = 0
                else:
                    check_continuous_movement.head_stable_count = 0
            
            # 몸 움직임 체크
            body_detected, body_move_count, body_max_move, body_recent = check_body_continuous_movement(
                body_center_history, BODY_MOVEMENT_TH_PER_FRAME, CONTINUOUS_MOVEMENT_COUNT
            )
            
            # 몸 움직임 상태 업데이트
            if body_detected:
                is_body_moving = True
                body_stable_count = 0
            elif is_body_moving:
                # 이미 moving 상태인 경우, 최근 움직임이 없으면 stable count 증가
                if not body_recent:
                    body_stable_count = getattr(check_body_continuous_movement, 'body_stable_count', 0) + 1
                    check_body_continuous_movement.body_stable_count = body_stable_count
                    if body_stable_count >= STABLE_FRAMES_TO_RESET:
                        is_body_moving = False
                        check_body_continuous_movement.body_stable_count = 0
                else:
                    check_body_continuous_movement.body_stable_count = 0
            
            head_moving = is_head_moving
            body_moving = is_body_moving

            # 시선 체크
            gaze_x_diff = abs(gaze_x - base_gx)
            gaze_y_diff = abs(gaze_y - base_gy)
            gaze_focused = (gaze_x_diff < GAZE_RATIO_TH and gaze_y_diff < GAZE_RATIO_TH)

            # 최종 판단
            if not eyes_open and not eyes_too_long_closed:
                focused = (focus_start is not None)
                focus_status = "BLINKING"
                status_color = (255, 165, 0)
            elif eyes_too_long_closed:
                focused = False
                focus_status = "SLEEPING"
                status_color = (0, 0, 255)
            elif head_moving or body_moving:
                focused = False
                focus_status = "MOVING"
                status_color = (0, 0, 255)
            elif gaze_focused:
                focused = True
                focus_status = "FOCUSED"
                status_color = (0, 255, 0)
            else:
                focused = False
                focus_status = "GAZE OFF"
                status_color = (0, 0, 255)

            # 타이머
            if focused:
                if focus_start is None: focus_start = current_time
                elif (current_time - focus_start) >= FOCUS_TIME:
                    reward += 1
                    focus_start = current_time
            else:
                focus_start = None

            # UI
            cv2.putText(image, focus_status, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0, status_color, 2)
            cv2.putText(image, f"Reward: {reward}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)
            
            # 진행바
            if focus_start is not None:
                progress = min((current_time - focus_start) / FOCUS_TIME, 1.0)
                cv2.rectangle(image, (20, 110), (int(20 + 400 * progress), 130), status_color, -1)

            # 디버그 정보
            y_pos = 160
            stable_head = getattr(check_continuous_movement, 'head_stable_count', 0)
            stable_body = getattr(check_body_continuous_movement, 'body_stable_count', 0)
            
            cv2.putText(image, f"Head Moving: {head_moving} (Stable:{stable_head})", 
                       (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            cv2.putText(image, f"Body Moving: {body_moving} (Cnt:{body_move_count}, Avg:{body_max_move:.4f}, Stb:{stable_body})", 
                       (20, y_pos+20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            cv2.putText(image, f"Body Threshold: {BODY_MOVEMENT_TH_PER_FRAME:.4f}, Smoothing: {SMOOTHING_ALPHA_BODY}", 
                       (20, y_pos+40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            cv2.putText(image, f"Gaze Focused: {gaze_focused}", (20, y_pos+60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

    cv2.imshow("Improved Movement Detection", image)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()