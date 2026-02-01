import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Star } from "lucide-react-native";
import { giveStudentXp, getStudentXp } from "../../services/studentService";

interface ExpModalProps {
  visible: boolean;
  onClose: () => void;
  studentName: string;
  studentId: number;
  classId: number;
}

const ExpModal = ({
  visible,
  onClose,
  studentName,
  studentId,
  classId,
}: ExpModalProps) => {
  const [amount, setAmount] = useState("");
  const [inputReason, setInputReason] = useState("");

  const [currentXp, setCurrentXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [lastReason, setLastReason] = useState<string | null>(null);

  const maxExp = 3000;
  const progressPercent = Math.min((currentXp / maxExp) * 100, 100);

  // 경험치 & 레벨 조회
  const fetchXpInfo = async () => {
    if (!classId || !studentId) return;

    try {
      const data = await getStudentXp(classId, studentId);
      setCurrentXp(data.currentXp);
      setCurrentLevel(data.currentLevel);
      setLastReason(data.reason);
    } catch (e) {
      console.error("XP 조회 실패:", e);
    }
  };

  useEffect(() => {
    if (!visible || !classId || !studentId) return;

    setAmount("");
    setInputReason("");
    fetchXpInfo();
  }, [visible, classId, studentId]);

  // 경험치 부여
  const handleGiveXp = async () => {
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      alert("경험치는 1 이상 입력해주세요");
      return;
    }

    if (!inputReason.trim()) {
      alert("경험치 부여 사유를 입력해주세요");
      return;
    }

    try {
      await giveStudentXp(
        classId,
        studentId,
        parsedAmount,
        inputReason.trim()
      );

      await fetchXpInfo();
      onClose();
    } catch (e) {
      console.error("XP 부여 실패:", e);
      alert("경험치 부여 실패");
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>경험치 관리</Text>
            <Star size={16} color="#FFF" fill="#FFF" />
          </View>

          <View style={styles.contentBody}>
            {/* 좌측 */}
            <View style={styles.leftPanel}>
              <View style={styles.studentBadge}>
                <Text style={styles.studentText}>
                  학생 : {studentName} | Lv.{currentLevel}
                </Text>
              </View>

              <View style={styles.formBox}>
                <Text style={styles.formLabel}>
                  관리자 작업: 경험치 부여
                </Text>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>경험치 :</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="경험치를 입력하세요"
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>이유 :</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="사유를 입력하세요"
                      value={inputReason}
                      onChangeText={setInputReason}
                    />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.grantButton}
                    onPress={handleGiveXp}
                  >
                    <Text style={styles.grantButtonText}>
                      경험치 부여
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 우측 */}
            <View style={styles.rightPanel}>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTracker}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                  <Text style={styles.progressText}>
                    {currentXp} / {maxExp} 경험치
                  </Text>
                </View>
                <Star
                  size={20}
                  color="#7FA864"
                  fill="#7FA864"
                  style={{ marginLeft: 5 }}
                />
              </View>

              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>
                    최근 경험치 사유
                  </Text>
                </View>

                <View style={styles.historyItem}>
                  <Text style={styles.historyDesc}>
                    {lastReason ?? "기록된 사유가 없습니다."}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 푸터 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.footerButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExpModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "85%",
    maxWidth: 700,
    backgroundColor: "#F7F3E6",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#D7C8B6",
    overflow: "hidden",
    elevation: 10,
  },

  header: {
    backgroundColor: "#8D7B68",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },

  contentBody: {
    flexDirection: "row",
    padding: 20,
    gap: 15,
    height: 320,
  },

  leftPanel: {
    flex: 1,
    gap: 10,
  },

  studentBadge: {
    backgroundColor: "#EAE0D5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
  },

  studentText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3E2723",
  },

  formBox: {
    flex: 1,
    backgroundColor: "#FDFBF8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 15,
    justifyContent: "center",
  },

  formLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5D4037",
    marginBottom: 15,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  inputLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: "600",
    color: "#3E2723",
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 35,
    paddingHorizontal: 8,
    justifyContent: "center",
  },

  textInput: {
    fontSize: 13,
    color: "#000",
  },

  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },

  grantButton: {
    backgroundColor: "#7FA864",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  grantButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },

  rightPanel: {
    flex: 1.2,
    gap: 10,
  },

  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressBarTracker: {
    flex: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#7FA864",
  },

  progressText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },

  historyContainer: {
    flex: 1,
    backgroundColor: "#FDFBF8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 10,
  },

  historyHeader: {
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  historyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5D4037",
  },

  historyItem: {
    paddingVertical: 8,
  },

  historyDesc: {
    fontSize: 13,
    color: "#3E2723",
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#D7C8B6",
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#9fa1a6",
  },

  footerButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});
