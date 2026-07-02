# choisproject

AutoStock(https://github.com/seism00/AutoStock) 요청을 참고해, 웹에서 종목 관련 정보를 조회할 수 있는 프로젝트입니다.

## 실행 방법

```bash
npm install
npm start
```

브라우저에서 `http://localhost:3000` 접속 후 종목 심볼을 입력해 조회합니다.  
예: `AAPL`, `TSLA`, `069500.KS`

## 기능

- `/api/stock/:symbol` API로 주식 관련 정보 조회
- 웹 페이지에서 심볼 입력 후 실시간 시세/거래량/고저가 확인

## GitHub 공개(Public) 전환 및 웹 접속

1. GitHub 저장소 `Settings > General > Danger Zone > Change repository visibility`에서 Public으로 변경
2. 웹 접속 공개가 필요하면 Render/Railway/Fly.io 같은 서비스에 배포
3. 배포 시 시작 명령은 `npm start`, 포트는 플랫폼의 `PORT` 환경변수 사용