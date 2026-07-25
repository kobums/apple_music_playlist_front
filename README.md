# Apple Music playlist — 프론트엔드

곡 목록을 붙여넣으면 Apple Music 라이브러리에 플레이리스트를 만들어 주는 웹 앱입니다.

백엔드는 [`apple-music-playlist`](../apple-music-playlist)에 있습니다.

- React 19 + TypeScript, 번들러는 Vite
- 라우팅은 `react-router` v8
- 디자인은 [`design.md`](./design.md)의 Atlassian 토큰 매니페스트를 따릅니다

## 화면 흐름

```
/login     Apple Music 인증
/playlist  플레이리스트 선택 → 곡 목록 입력 → 결과 확인
```

**로그인** — 백엔드에서 개발자 토큰을 받아 MusicKit을 준비한 뒤 버튼이 활성화됩니다. 버튼을 눌러야
Apple 로그인 팝업이 뜹니다. "서버에 연결할 수 없습니다"는 Apple이 아니라 **우리 API**에 못 붙는다는
뜻입니다.

**입력** — 기존 플레이리스트를 드롭다운에서 고르거나 새로 만듭니다. 목록에서 고르면 서버가 ID로
직접 지정하므로, 오타로 엉뚱한 플레이리스트가 생기거나 같은 이름 중 어느 쪽인지 헷갈릴 일이
없습니다.

**결과** — 곡마다 상태가 표시됩니다.

| 상태 | 의미 | 화면 동작 |
| --- | --- | --- |
| 추가됨 | 들어갔습니다 | 매칭된 곡명 표시 |
| 이미 있음 | 그 플레이리스트에 이미 있어 건너뜀 | 매칭된 곡명 표시 |
| 추가 예정 | 확신되는 매칭, 저장 대기 중 | 미리 선택된 상태 |
| 확인 필요 | 사람이 골라야 함 | 후보를 아트워크·미리듣기와 함께 표시 |
| 못 찾음 | 후보 없음 | 직접 검색창 제공 |

`확인 필요`나 `못 찾음`이 하나라도 있으면 **아무것도 저장되지 않고** 전부 대기합니다. Apple Music은
곡을 뒤에만 붙일 수 있어서, 나눠 넣으면 나중에 고른 곡이 맨 뒤로 가기 때문입니다. 버튼을 누르면
적어 준 순서 그대로 한 번에 저장됩니다.

전부 확신되는 경우에는 예전처럼 클릭 한 번으로 바로 저장됩니다.

## 개발

```bash
npm install
cp .env.example .env      # API 주소를 바꾸려면
npm run dev               # http://localhost:9002
```

`VITE_API_BASE_URL`을 설정하지 않으면 `https://playlistapi.gowoobro.com`을 씁니다.

로컬 백엔드를 함께 띄운다면 `.env`에 아래를 넣으세요. **없으면 브라우저가 프로덕션 API로 요청하고
CORS에 막힙니다** — 이때 화면에는 "서버에 연결할 수 없습니다"만 보여서 원인을 찾기 어렵습니다
(curl로는 200이 나옵니다. CORS는 브라우저만 강제하니까요).

```
VITE_API_BASE_URL=http://localhost:8002
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (9002 포트) |
| `npm run build` | 타입 체크 후 `build/`에 프로덕션 번들 생성 |
| `npm run preview` | 빌드 결과를 로컬에서 서빙 |
| `npm run typecheck` | `tsc --noEmit` |

## 구조

```
src/
  main.tsx              진입점, 전역 스타일 로드
  App.tsx               라우팅, 인증 가드
  auth/AuthContext.tsx  토큰 보관(세션 스토리지), 로그아웃 사유 전달
  lib/
    api.ts              백엔드 호출, 세션 만료 판별
    musickit.ts         MusicKit v3 로더(싱글턴), 인증 해제
  screens/
    MusicKitAuth.tsx    로그인
    PlaylistForm.tsx    플레이리스트 선택 + 곡 목록 입력
    ResultPage.tsx      결과, 후보 선택, 직접 검색, 일괄 저장
  components/           Lozenge, SectionMessage, Spinner, Tooltip, TrackOption, Celebration
  styles/               tokens.css(디자인 토큰), base.css(리셋·공용), 화면별 CSS
```

## 토큰과 세션

개발자 토큰과 Music User Token은 **세션 스토리지**에 둡니다. 메모리에만 두면 새로고침으로 사라져
빈 토큰으로 API를 호출하게 됩니다.

서버가 401(`code: "unauthorized"`)을 주면 재시도해도 소용없으므로, 저장된 토큰과 **MusicKit이 자체
보관하는 토큰까지** 비우고 로그인 화면으로 보냅니다. MusicKit은 이미 인증된 상태에서 `authorize()`를
부르면 프롬프트 없이 캐시된 토큰을 그대로 돌려주기 때문에, 이걸 지우지 않으면 죽은 토큰으로 무한
반복됩니다.

이 상황은 MusicKit 키를 다른 Apple Developer 팀으로 옮길 때 전원에게 한 번에 발생합니다. 사용자
토큰은 발급한 팀에 묶여 있습니다.

## 디자인

`design.md`의 YAML 토큰이 `src/styles/tokens.css`에 CSS 변수로 그대로 옮겨져 있습니다. 컴포넌트
CSS는 이 변수만 참조하고 hex·px 간격·px radius를 직접 쓰지 않습니다.

주요 규칙 몇 가지:

- 페이지 배경은 `surface`(흰색). 카드는 테두리로 구분하고 배경을 어둡게 하지 않습니다
- 곡 상태는 아이콘이 있는 Lozenge로 표시해 **색상만으로 상태를 전달하지 않습니다**
- 입력 검증은 필드 옆 메시지로, 페이지 단위 실패는 SectionMessage로
- 포커스 링은 2px, 컴포넌트 radius + 2px
- `prefers-reduced-motion` 대응

## 배포

`dockerfile`은 멀티스테이지입니다. 1단계에서 번들을 만들고, 2단계 nginx가 정적 파일을 서빙합니다.
`nginx.conf`에 SPA fallback이 있어 `/playlist`에서 새로고침해도 404가 나지 않습니다.

```bash
make docker   # 이미지 빌드
make push     # 레지스트리 푸시
```

`.dockerignore`가 `node_modules`를 제외합니다. 이게 없으면 호스트의 macOS 네이티브 바이너리
(`lightningcss-darwin-arm64` 등)가 리눅스 이미지 안으로 복사되어 빌드가 깨집니다.

**백엔드와 함께 배포하세요.** 응답 형식(`status` 값, `deferred`, `playlistId`)을 공유하므로 한쪽만
올리면 결과 화면이 동작하지 않습니다.
