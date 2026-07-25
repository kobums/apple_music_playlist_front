# Apple Music playlist — 프론트엔드

곡 목록을 붙여넣으면 Apple Music 라이브러리에 플레이리스트를 만들어 주는 웹 앱입니다.

- React 19 + TypeScript, 번들러는 Vite
- 라우팅은 `react-router` v8
- 디자인은 [`design.md`](./design.md)의 Atlassian 토큰 매니페스트를 따릅니다

## 개발

```bash
npm install
cp .env.example .env      # API 주소를 바꾸려면
npm run dev               # http://localhost:9002
```

`VITE_API_BASE_URL`을 설정하지 않으면 `https://playlistapi.gowoobro.com`을 씁니다.
로컬 백엔드를 함께 띄운다면 `.env`에 `VITE_API_BASE_URL=http://localhost:8002`을 넣으세요.

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (9002 포트) |
| `npm run build` | 타입 체크 후 `build/`에 프로덕션 번들 생성 |
| `npm run preview` | 빌드 결과를 로컬에서 서빙 |
| `npm run typecheck` | `tsc --noEmit` |

## 배포

`dockerfile`은 멀티스테이지 빌드입니다. 1단계에서 번들을 만들고, 2단계 nginx 이미지가
정적 파일을 서빙합니다. `nginx.conf`에 SPA fallback이 들어 있어 `/playlist`에서 새로고침해도
404가 나지 않습니다.

```bash
make docker   # 이미지 빌드
make push     # 레지스트리 푸시
```

## 디자인 규칙

`design.md`의 YAML 토큰이 `src/styles/tokens.css`에 CSS 변수로 그대로 옮겨져 있습니다.
컴포넌트 CSS는 이 변수만 참조하고, hex·px 간격·px radius를 직접 쓰지 않습니다.
