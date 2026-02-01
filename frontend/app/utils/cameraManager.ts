// 전역에서 단 하나의 카메라만 실행되도록

class CameraManager {
  private static currentScreen: string | null = null;
  private static forceReleaseTimeout: NodeJS.Timeout | null = null;
  
  static requestCamera(screenName: string): boolean {
    if (this.forceReleaseTimeout) {
      clearTimeout(this.forceReleaseTimeout);
      this.forceReleaseTimeout = null;
    }

    if (this.currentScreen && this.currentScreen !== screenName) {
      console.log(`❌ 카메라 사용 거부: ${this.currentScreen}에서 이미 사용 중`);
      console.log(`🔧 강제 해제 시도 중...`);
      
      this.forceRelease();
      
      this.currentScreen = screenName;
      console.log(`✅ 강제 해제 후 카메라 허가: ${screenName}`);
      return true;
    }
    
    console.log(`✅ 카메라 허가: ${screenName}`);
    this.currentScreen = screenName;
    return true;
  }
  
  static releaseCamera(screenName: string): void {
    if (this.currentScreen === screenName) {
      console.log(`🔓 카메라 해제: ${screenName}`);
      this.currentScreen = null;
    }
  }
  
  static forceRelease(): void {
    console.log(`🚨 카메라 강제 해제: ${this.currentScreen}`);
    this.currentScreen = null;
  }
  
  static getCurrentOwner(): string | null {
    return this.currentScreen;
  }

  static reset(): void {
    console.log(`🔄 CameraManager 리셋`);
    this.currentScreen = null;
    if (this.forceReleaseTimeout) {
      clearTimeout(this.forceReleaseTimeout);
      this.forceReleaseTimeout = null;
    }
  }
}

export default CameraManager;