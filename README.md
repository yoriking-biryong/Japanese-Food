# 일식 연습장

일식조리기능사 실기 19개 메뉴를 공부하는 정적 웹사이트입니다. Pretendard 글꼴과 사진을 함께 제공합니다. 별도 설치나 빌드 없이 GitHub Pages에서 실행합니다.

## GitHub에 올려 사이트 열기

1. GitHub에 저장소를 만듭니다.
2. **이 폴더 안의 파일과 폴더 전체**를 저장소 최상위에 올립니다. `index.html`이 바로 보여야 합니다. ZIP 파일 자체를 업로드하는 방식이 아닙니다.
3. 저장소 **Settings → Pages → Build and deployment → Source: Deploy from a branch**를 선택합니다.
4. **Branch: main / 폴더: /(root)**로 저장합니다. 업로드한 브랜치 이름이 다르면 그 브랜치를 고릅니다.
5. 배포가 끝나면 Pages 화면의 **Visit site**를 엽니다.

이미지까지 함께 올리려면 GitHub Desktop에서 이 폴더를 저장소로 추가하거나 Git을 사용하세요. 저장소 주소는 본인 주소로 바꿉니다.

```sh
git init -b main
git add .
git commit -m "Add Japanese cooking study site"
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

[GitHub 공식 Pages 설정 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 시험장에서 먼저 떠올리기 수정

**메뉴 도감 → 메뉴 → 요약 수정**에서 준비·타이밍·마무리를 직접 고칩니다. `→`로 연결하고 `**내용**`으로 굵게 표시할 수 있습니다. 저장하면 메뉴 카드와 상세 요약에 같이 반영됩니다. **기본 요약 불러오기 → 저장**으로 원래 요약을 복원합니다.

저장한 요약은 **현재 기기·브라우저·접속 주소**에만 남습니다. 소스 파일이나 GitHub 저장소를 자동으로 수정하지 않습니다. 기존 로컬 주소에서 편집창의 **다른 기기·GitHub 사이트로 수정 요약 옮기기 → 수정 요약 전체 내보내기**를 누르고, GitHub 사이트에서 파일을 가져오세요. 가져오기 전에 메뉴별 내용을 확인할 수 있습니다. 이 파일은 요약 전용이며 메모·형광펜·성적은 포함하지 않습니다.

공개 기본 요약 자체를 바꾸려면 `data.js`의 메뉴별 `focus` 내용을 고칩니다. 수정 요약 JSON에는 개인 작성 내용이 들어가므로 배포 파일에 자동 포함하지 않으며 `.gitignore`로 제외합니다.

## 주요 기능

- 두 메뉴 재료 분류, 이미지 조리대, 순서 떠올리기·직접 쓰고 비교
- 메뉴별 수업 레시피, 소스·용량·치수 묶음 비교와 빈칸 퀴즈
- 형광펜 복습, 핵심 카드게임, 마지막 그릇 선택, 3D 썰기 연습
- 개인 시험일·메모·학습 기록, 사진 비교, 저장한 자료 오프라인 열기

## 직접 쓰고 비교 · 분홍 표시 유지 (2026-11-03)

- 왼쪽 **내가 쓴 글**, 오른쪽 **전체 수업 단계**를 반반으로 보고 각각 스크롤합니다. 연결하지 못한 단계도 수업 순서대로 표시합니다.
- 두 칸은 드래그를 반복해도 **분홍색**입니다. 표시를 더블클릭하면 그 구절의 표시만 지웁니다.
- 내용이 바뀌지 않으면 다시 비교해도 화면과 스크롤을 유지합니다. 비교한 글과 분홍 표시는 같은 브라우저·주소에서 새로고침하거나 다시 열어도 유지합니다.
- 같은 메뉴·같은 쪽의 동일한 문장에만 표시를 복원합니다. 새로 쓰거나 수정한 문장에는 이전 표시가 잘못 붙지 않습니다. 순서가 이동해도 그대로인 문장의 표시는 유지합니다.
- 분홍 표시는 ilsik-study:comparison-pink:v1에 따로 저장하며 학습 노트·빈칸 복습에 섞지 않습니다. 직접 쓴 글의 저장 키는 유지합니다.
- 핵심 확인 항목·레시피·정리표의 노란 형광펜과 보라색 덧칠, 기존 학습 노트와 메모는 유지합니다.

## 큐넷 일정

GitHub Pages에는 Node 서버가 없으므로 **공식 공고 저장 일정과 큐넷 링크**를 표시합니다. 최신 일정 자동 조회로 표시하지 않습니다. 일정 데이터의 기준일은 화면에 나옵니다.

Node 서버로 운영할 때만 `site-config.js`의 `qnetEndpoint`를 `'/api/qnet-schedule'`로 바꾸면 동봉한 `qnet-server.mjs`를 통한 조회를 사용할 수 있습니다. GitHub Pages에서는 빈 문자열을 유지하세요.

## 내 컴퓨터에서 확인

Node.js 20 이상에서 아래 명령을 실행합니다. 의존성 설치는 필요 없습니다.

```sh
npm run check
npm start
```

`http://127.0.0.1:4186/`으로 접속합니다. 이미 같은 포트를 사용하는 사이트가 있으면 새 서버를 실행하지 마세요. 다른 포트는 환경변수 `PORT`로 지정할 수 있습니다.

소스를 고친 뒤 **`npm run build:offline` → `npm run check`**를 실행하고 변경 파일을 GitHub에 올립니다. `.nojekyll`을 포함해 파일 구조를 유지해야 합니다. HTTPS에서도 오프라인 캐시가 준비됩니다.

## 파일 구성

| 위치 | 내용 |
| --- | --- |
| index.html / app.js / styles.css | 화면·이동·연습 상태 |
| data.js / classroom-data.js / lesson-study-data.js | 메뉴·두 메뉴 수업 순서·계량 정리 |
| summary-editor.js / summary-editor.css | 요약 편집·저장·내보내기·가져오기 |
| menu-practice*.js / lesson-study*.js | 개별 메뉴 공부·문장 비교·카드게임 |
| home-summary* / summary-* / stock-summary* | 메인 묶음 정리·퀴즈 |
| recipe-highlights* / recipe-marks* / recipe-review* | 형광펜·학습 노트 |
| comparison-highlights.js | 직접 쓴 문장·수업 비교·핵심 확인 형광펜 |
| lab/ | 공통 치수·그릇·3D 연습 |
| assets/ / fonts/ | 사진·재료 이미지·Pretendard 글꼴과 라이선스 |
| offline-*.js / offline-assets.mjs | 오프라인 저장과 목록 생성 |
| site-config.js / qnet-* | 일정 표시 및 선택적 서버 조회 |
| preview.mjs / scripts/ | 로컬 실행·검사 |

작업 백업·개인 기록·캐시·임시 스크린샷·Windows 자동 시작 설정·변경 이력 문서는 업로드용 폴더에서 제외했습니다. 사진은 기존 사이트에서 사용하는 파일을 유지했습니다.

## 자료와 글꼴

수업 메모와 [큐넷 일식 공개과제](https://www.q-net.or.kr/cst006.do?artlSeq=5250948&brdId=Q006&code=1204&id=cst00602)를 바탕으로 한 개인 학습용 자료입니다. 지급량과 수업 배합량은 구분해서 표시합니다. 사진의 사용 기록은 `assets/ASSETS.md`, Pretendard 라이선스는 `fonts/OFL.txt`에 있습니다.

## 형광펜 덧칠과 지우기 (2026-11-03)

- 첫 드래그: 레시피·정리표는 노란색으로 저장, 반반 비교 화면은 분홍색으로 따로 저장.
- 노란 형광펜 위를 다시 드래그: 더 넓고 진한 보라색으로 강조. 반반 비교 화면은 반복해도 분홍색 유지.
- 표시를 더블클릭: 그 구절의 기본 형광펜과 보라색 덧칠을 함께 삭제. 다른 구절과 메모는 유지.
- 저장 형광펜의 보라색 덧칠도 새로고침 후 유지하며, 학습 노트에는 같은 구절을 중복 추가하지 않습니다. 비교 화면의 분홍 표시는 별도로 저장하며, 내용이 같은 문장에만 복원합니다.
