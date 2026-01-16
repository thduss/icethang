### React-native-cli 버전을 깔아보자
#### 노션에 본문 있음 (이미지 생략)


파워쉘에서 다음 명령어 실행 (새로 프로젝트 만들 때!)

npx 쓰는 이유는 프젝마다 버전 다를때 알아서 가져와서 실행해주기 때문

```powershell
	npx @react-native-community/cli init 프젝이름
```
이렇게 나와야댐 

**그리고 환경 변수 설정해주자**

사용자 변수에서

**ANDROID_HOME 이름으로 하고**

C:\Users\SSAFY\AppData\Local\Android\Sdk (설치한 경로)

그리고 

Path에 C:\Users\SSAFY\AppData\Local\Android\Sdk\platform-tools도 추가

```
C:\Users\SSAFY\AppData\Local\Android\Sdk\platform-tools
```

그리고 cd 프로젝트 폴더로 이동한 다음에 

안드로이드 에뮬레이터(Android Studio에서 설정한 가상 기기)를 미리 실행해 두거나, 

스마트폰을 USB로 연결한 상태에서 아래 명령어 실행하면

```powershell
npx react-native run-android
```

일단 없이 실행했을때 실행되는 모습 

### 아맞다 안드로이드 에뮬레이터(가상 휴대폰) 설정법!!


여기 메인 화면에서 밑에 있는 
**Virtual Device Manager 선택 (세번째꺼)**
**+눌러서 Create 버츄얼 디바이스**

우린 태블릿 개발할거니까 타블렛 고르고 맨 밑에 있는 **NEXT**
추천 되어있는거 걍 누르고 왼쪽에 별 바로 옆에 다운로드 어쩌고 받으면 됨 (느리다)


그다음 피니쉬 누름
이제 추가된거 오른쪽에 재생버튼 누르면 

**렉이 엄청 걸리고 실행이 된다** 

근데 리액트 네이티브 앱은 저 위에서 실행 안됌
환경 변수 인식해야 한대 

기달리기 싫을땐

```powershell
	$env:Path += ";C:\Users\SSAFY\AppData\Local\Android\Sdk\platform-tools”
```

```powershell
adb devices
```
 드디어 인식함
## 진짜 실행 해본다

```powershell
npx react-native run-android
```

최신 버전 네이티브 받아서 오류났다네...

### 방법 1: Android Studio에서 NDK 다시 설치 (가장 추천)

1. **Android Studio**를 엽니다.
2. **Settings** (또는 `File` > `Settings`) -> **Languages & Frameworks** -> **Android SDK**로 이동합니다.
3. **SDK Tools** 탭을 클릭합니다.
4. 우측 하단의 **[Show Package Details]** 체크박스를 반드시 체크하세요.
5. **NDK (Side by side)** 항목을 찾아 하위 목록을 펼칩니다.
6. 에러 메시지에 적힌 버전(**27.1.12297006**)이 체크되어 있다면 체크를 해제하고 `Apply`를 눌러 삭제한 뒤, 다시 체크하고 `Apply`를 눌러 재설치하세요.
    - 만약 해당 버전이 없다면, 현재 프로젝트가 요구하는 최신 버전을 설치해 주세요.


실행됐다

…

와~~ 

참고로 아까 만든 프젝 들어가면 vue 프로젝트 같은 꼴의 프젝이 생김

거기서 vs 코드 실행하면 코드 수정 가능가능