import cv2
import mediapipe as mp
import numpy as np
import time
import math

# ==============================
# 카메라 번호 설정_ 기본 탑재된 카메라는 0번
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
# Calibration & Focus Params
# 화면 위치 조정을 위한 초기 캘리브레이션
# ==============================
CALIB_TIME = 3.0
baseline_data = []
baseline_done = False
start_time = time.time()

# Threshold 값 - 시선만 체크
HEAD_YAW_TH = 15      # 좌우 회전 threshold
HEAD_PITCH_TH = 15    # 위아래 회전 threshold
GAZE_RATIO_TH = 0.10  # 시선 비율 threshold
EYE_AR_THRESHOLD = 0.15  # 눈 깜빡임 threshold

FOCUS_TIME = 3  # 임의 설정
focus_start = None
reward = 0

# ==============================
# Helper Functions
# ==============================
def calc_head_pose(face_landmarks, w, h):
    """head pose 계산"""
    nose_tip = face_landmarks.landmark[1]
    chin = face_landmarks.landmark[152]
    left_eye_outer = face_landmarks.landmark[33]
    right_eye_outer = face_landmarks.landmark[263]
    left_mouth = face_landmarks.landmark[61]
    right_mouth = face_landmarks.landmark[291]
    
    nose_2d = np.array([nose_tip.x * w, nose_tip.y * h])
    chin_2d = np.array([chin.x * w, chin.y * h])
    left_eye_2d = np.array([left_eye_outer.x * w, left_eye_outer.y * h])
    right_eye_2d = np.array([right_eye_outer.x * w, right_eye_outer.y * h])
    left_mouth_2d = np.array([left_mouth.x * w, left_mouth.y * h])
    right_mouth_2d = np.array([right_mouth.x * w, right_mouth.y * h])
    
    eye_center = (left_eye_2d + right_eye_2d) / 2
    eye_width = np.linalg.norm(right_eye_2d - left_eye_2d)
    nose_offset = nose_2d[0] - eye_center[0]
    yaw = (nose_offset / eye_width) * 50
    
    face_height = np.linalg.norm(chin_2d - nose_2d)
    mouth_center = (left_mouth_2d + right_mouth_2d) / 2
    vertical_offset = mouth_center[1] - eye_center[1]
    pitch = (vertical_offset / face_height) * 50
    
    return yaw, pitch


def calc_eye_aspect_ratio(face_landmarks, eye_points):
    """
    Eye Aspect Ratio (EAR) 계산 - 눈이 얼마나 열려있는지
    eye_points: [top, bottom, left, right, top2, bottom2] 인덱스
    """
    # 수직 거리 2개
    vertical1 = abs(face_landmarks.landmark[eye_points[0]].y - 
                    face_landmarks.landmark[eye_points[1]].y)
    vertical2 = abs(face_landmarks.landmark[eye_points[4]].y - 
                    face_landmarks.landmark[eye_points[5]].y)
    
    # 수평 거리
    horizontal = abs(face_landmarks.landmark[eye_points[2]].x - 
                     face_landmarks.landmark[eye_points[3]].x)
    
    # EAR 계산
    ear = (vertical1 + vertical2) / (2.0 * horizontal)
    return ear


def is_eye_open(face_landmarks):
    """양쪽 눈이 떠져 있는지 확인"""
    # 왼쪽 눈 랜드마크: 위, 아래, 좌, 우, 위2, 아래2
    left_eye_points = [159, 145, 33, 133, 158, 153]
    # 오른쪽 눈 랜드마크: 위, 아래, 좌, 우, 위2, 아래2  
    right_eye_points = [386, 374, 362, 263, 385, 380]
    
    left_ear = calc_eye_aspect_ratio(face_landmarks, left_eye_points)
    right_ear = calc_eye_aspect_ratio(face_landmarks, right_eye_points)
    
    avg_ear = (left_ear + right_ear) / 2.0
    
    return avg_ear > EYE_AR_THRESHOLD, avg_ear


def calc_gaze_ratio(face_landmarks):
    """
    눈 안에서 iris의 상대적 위치를 비율로 계산
    왼쪽 눈과 오른쪽 눈 각각 계산
    """
    # 왼쪽 눈 랜드마크
    left_eye_left = face_landmarks.landmark[33]
    left_eye_right = face_landmarks.landmark[133]
    left_eye_top = face_landmarks.landmark[159]
    left_eye_bottom = face_landmarks.landmark[145]
    left_iris_center = face_landmarks.landmark[468]
    
    # 오른쪽 눈 랜드마크
    right_eye_left = face_landmarks.landmark[362]
    right_eye_right = face_landmarks.landmark[263]
    right_eye_top = face_landmarks.landmark[386]
    right_eye_bottom = face_landmarks.landmark[374]
    right_iris_center = face_landmarks.landmark[473]
    
    # 왼쪽 눈 - 좌우 비율
    left_eye_width = abs(left_eye_right.x - left_eye_left.x)
    left_iris_x_from_left = abs(left_iris_center.x - left_eye_left.x)
    left_ratio_x = left_iris_x_from_left / left_eye_width if left_eye_width > 0 else 0.5
    
    # 왼쪽 눈 - 상하 비율
    left_eye_height = abs(left_eye_bottom.y - left_eye_top.y)
    left_iris_y_from_top = abs(left_iris_center.y - left_eye_top.y)
    left_ratio_y = left_iris_y_from_top / left_eye_height if left_eye_height > 0 else 0.5
    
    # 오른쪽 눈 - 좌우 비율
    right_eye_width = abs(right_eye_right.x - right_eye_left.x)
    right_iris_x_from_left = abs(right_iris_center.x - right_eye_left.x)
    right_ratio_x = right_iris_x_from_left / right_eye_width if right_eye_width > 0 else 0.5
    
    # 오른쪽 눈 - 상하 비율
    right_eye_height = abs(right_eye_bottom.y - right_eye_top.y)
    right_iris_y_from_top = abs(right_iris_center.y - right_eye_top.y)
    right_ratio_y = right_iris_y_from_top / right_eye_height if right_eye_height > 0 else 0.5
    
    # 양쪽 눈 평균
    avg_ratio_x = (left_ratio_x + right_ratio_x) / 2
    avg_ratio_y = (left_ratio_y + right_ratio_y) / 2
    
    return avg_ratio_x, avg_ratio_y


# ==============================
# 메인 작동
# ==============================
while cap.isOpened():
    success, image = cap.read()
    image = cv2.flip(image, 1)
    if not success:
        print("카메라 프레임을 읽을 수 없습니다.")
        break

    h, w, _ = image.shape
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    pose_result = pose.process(rgb)
    face_result = face_mesh.process(rgb)

    # --------------------------
    # Draw Pose
    # --------------------------
    if pose_result.pose_landmarks:
        mp_draw.draw_landmarks(
            image,
            pose_result.pose_landmarks,
            mp_pose.POSE_CONNECTIONS
        )

    # --------------------------
    # Face / Gaze / Head Pose
    # --------------------------
    if face_result.multi_face_landmarks:
        face = face_result.multi_face_landmarks[0]

        yaw, pitch = calc_head_pose(face, w, h)
        gaze_x, gaze_y = calc_gaze_ratio(face)
        eyes_open, ear_value = is_eye_open(face)

        current_time = time.time()

        # ---------- Calibration ----------
        if not baseline_done:
            if current_time - start_time < CALIB_TIME:
                baseline_data.append([yaw, pitch, gaze_x, gaze_y])
                cv2.putText(
                    image,
                    "Calibrating... Look at the book",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (0, 255, 255),
                    2
                )
            else:
                baseline = np.mean(baseline_data, axis=0)
                base_yaw, base_pitch, base_gx, base_gy = baseline
                baseline_done = True
                print(f"Baseline set: Yaw={base_yaw:.2f}, Pitch={base_pitch:.2f}, GazeX={base_gx:.4f}, GazeY={base_gy:.4f}")
        else:
            # ---------- 눈 깜빡임 체크 ----------
            if not eyes_open:
                # 눈 감았을 때는 이전 상태 유지 (타이머 멈추지 않음)
                cv2.putText(image, "BLINKING (ignored)", (20, 40),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 165, 0), 2)
                cv2.putText(image, f"Reward: {reward}", (20, 80),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)
                
                # Focus 진행 상황은 계속 표시
                if focus_start is not None:
                    elapsed = current_time - focus_start
                    
                    # 눈 감았어도 시간은 계속 흐름
                    if elapsed >= FOCUS_TIME:
                        reward += 1
                        focus_start = current_time
                        print(f'🎉 Reward earned! Total: {reward}')
                    
                    progress = min(elapsed / FOCUS_TIME, 1.0)
                    bar_width = int(400 * progress)
                    cv2.rectangle(image, (20, 110), (420, 130), (50, 50, 50), -1)
                    cv2.rectangle(image, (20, 110), (20 + bar_width, 130), (255, 165, 0), -1)
                    cv2.putText(image, f"{elapsed:.1f}s / {FOCUS_TIME}s", (430, 125),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # 눈 상태 표시
                cv2.putText(image, f"Eyes: CLOSED (EAR:{ear_value:.3f})", 
                           (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)
            else:
                # ---------- Focus 판단 (눈 떠있을 때만) ----------
                yaw_diff = abs(yaw - base_yaw)
                pitch_diff = abs(pitch - base_pitch)
                gaze_x_diff = abs(gaze_x - base_gx)
                gaze_y_diff = abs(gaze_y - base_gy)
                
                head_ok = (yaw_diff < HEAD_YAW_TH and pitch_diff < HEAD_PITCH_TH)
                gaze_ok = (gaze_x_diff < GAZE_RATIO_TH and gaze_y_diff < GAZE_RATIO_TH)

                # 시선만으로 집중 판단 (고개 각도는 무관)
                focused = gaze_ok
                
                # 집중 유형 판별 (화면 표시용)
                if head_ok and gaze_ok:
                    focus_type = "FULL"  # 머리도 정면, 시선도 정면
                elif gaze_ok:
                    focus_type = "GAZE"  # 머리는 돌렸지만 시선은 화면
                else:
                    focus_type = "NONE"  # 시선이 벗어남
                
                # 디버그 출력
                if not focused:
                    print(f'❌ NOT FOCUSED - Gaze(X:{gaze_x_diff:.3f}/{GAZE_RATIO_TH} Y:{gaze_y_diff:.3f}/{GAZE_RATIO_TH}) | Head(Y:{yaw_diff:.1f} P:{pitch_diff:.1f})')
                
                if focused:
                    if focus_start is None:
                        focus_start = current_time
                        print(f'✓ Focus started ({focus_type})')
                    else:
                        elapsed = current_time - focus_start
                        
                        if elapsed >= FOCUS_TIME:
                            reward += 1
                            focus_start = current_time
                            print(f'🎉 Reward earned! Total: {reward}')
                else:
                    if focus_start is not None:
                        print('✗ Focus lost - timer reset')
                    focus_start = None

                # ---------- UI ----------
                # 집중 상태에 따른 표시
                if focus_type == "FULL":
                    status = "FOCUSED (Full)"
                    color = (0, 255, 0)  # 초록색
                elif focus_type == "GAZE":
                    status = "FOCUSED (Gaze Only)"
                    color = (0, 200, 255)  # 하늘색
                else:
                    status = "NOT FOCUSED"
                    color = (0, 0, 255)  # 빨간색

                cv2.putText(image, status, (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
                cv2.putText(image, f"Reward: {reward}", (20, 80),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)
                
                # Focus 진행 상황 표시
                if focus_start is not None:
                    elapsed = current_time - focus_start
                    progress = min(elapsed / FOCUS_TIME, 1.0)
                    bar_width = int(400 * progress)
                    cv2.rectangle(image, (20, 110), (420, 130), (50, 50, 50), -1)
                    cv2.rectangle(image, (20, 110), (20 + bar_width, 130), color, -1)
                    cv2.putText(image, f"{elapsed:.1f}s / {FOCUS_TIME}s", (430, 125),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                # 상세 디버그 정보
                head_color = (0, 255, 0) if head_ok else (100, 100, 100)  # 회색으로 (참고용)
                gaze_color = (0, 255, 0) if gaze_ok else (0, 0, 255)
                
                cv2.putText(image, f"Head: {'OK' if head_ok else 'NG'} (Y:{yaw_diff:.1f}/{HEAD_YAW_TH} P:{pitch_diff:.1f}/{HEAD_PITCH_TH}) [REF]", 
                           (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.5, head_color, 1)
                cv2.putText(image, f"Gaze: {'OK' if gaze_ok else 'NG'} (X:{gaze_x_diff:.3f}/{GAZE_RATIO_TH} Y:{gaze_y_diff:.3f}/{GAZE_RATIO_TH}) [MAIN]", 
                           (20, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.6, gaze_color, 2)
                
                # 실시간 시선 비율 표시 (0.5 -> 중앙)
                cv2.putText(image, f"Gaze Ratio: X={gaze_x:.3f} Y={gaze_y:.3f} (0.5=center)", 
                           (20, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                
                # 눈 상태 표시
                cv2.putText(image, f"Eyes: OPEN (EAR:{ear_value:.3f})", 
                           (20, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                
                # 집중 판단 기준 표시
                cv2.putText(image, "Focus Criteria: GAZE ONLY", 
                           (20, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

    cv2.imshow("Focus Detection System", image)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()