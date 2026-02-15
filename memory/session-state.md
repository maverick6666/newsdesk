# 현재 세션 상태
> 마지막 업데이트: 2026-02-15

## 개발 환경
- OS: Windows 10 Home
- Python: 3.14.2 (컨테이너: python:3.13-slim)
- Node: 22 (컨테이너: node:22-alpine)
- GPU: RTX 5070 (12GB GDDR7)
- LLM 서버: Ollama (호스트에서 실행, 컨테이너에서 host.docker.internal로 접근)
- LLM 모델: Qwen3-14B Q4_K_M (9.3GB, 다운로드 완료, 로드 확인)
- Docker Compose: frontend(5173) + backend(8001) + postgres(5433)
- 프론트엔드: React 18 + Vite + Tailwind CSS + Zustand + ECharts + Motion + React Flow + d3-force

## 완료된 Phase
- [x] Phase 1-9: 기본 스캐폴딩 ~ 통합 테스트 완료
- [x] insight_agent v2: 구조화 JSON, Bloomberg 3-bullet, 시나리오 분석
- [x] 인포그래픽 상세 페이지: 시그널/메트릭/시나리오/섹터
- [x] 클러스터 버블맵 (d3-force + SVG) — 2026-02-15 완료
- [x] 기사 플로우맵 드릴다운 (React Flow) — 2026-02-15 완료
- [x] **프론트엔드 전면 재설계 (Phase 0~7)** — 2026-02-15 완료
  - 3-뷰 아키텍처: Morning Brief + Bubble Map + Signal Dashboard
  - 슬라이드오버 패널 (페이지 이동 없이 인라인 상세)
  - 백엔드 API 확장 (투자 시그널/TL;DR/메트릭을 메인 리스트에 서피싱)
  - 디자인 시스템 V2 (glass-card-hero/medium/compact, bg-mesh-v2, signal 색상)
  - 버블맵 시그널 아이콘(▲/●/▼) + 강화된 그라디언트
  - 키보드 단축키 (1/2/3 뷰 전환, Escape 패널 닫기)
  - ClusterDetailPage "맥락에서 보기" 버튼
- [x] **시각적 폴리싱** — 2026-02-15 완료
  - 시그널 색상이 카드 배경에 번짐 (signal-tint-bullish/bearish/neutral)
  - 글로우 액센트 바 (glow-bar 클래스)
  - 배경 메시 3배 강화 (cyan 0.18, purple 0.14)
  - 히어로 헤드라인 40px, 신뢰도 숫자 3xl, 분포 바 두꺼움
  - 전체적으로 대비 증가, 글로우 효과 추가

## 사용자 비전 (이전 피드백 요약)
1. 클러스터 = 떠다니는 버블 (크기=기사수, 색상=감성) ✅ 구현 완료
2. 클릭 → 인라인 슬라이드 패널 (페이지 이동 없이) ✅ 구현 완료
3. 3초 만에 상황 파악 가능한 Morning Brief ✅ 구현 완료
4. 투자 시그널 기반 Signal Dashboard ✅ 구현 완료
5. 인사이트 마이닝 (숨겨진 연결고리) — 미구현
6. LLM 더 많이 활용 — 부분 구현

## 현재 진행중 작업
- 없음 (시각적 폴리싱 완료)

## 미완료 Phase
- [ ] Phase 10: 스케줄러 (APScheduler로 자동 수집/파이프라인)
- [ ] Phase 11: fundmessage 연동 API
- [ ] 인사이트 마이닝 에이전트 (relation_agent 강화)

## 알려진 이슈
- MarketAux 노이즈 ~15% (AI 파이프라인에서 자연 필터링됨)
- favicon.ico 404 (사소한 이슈)
- React Router Future Flag Warning 2개 (기능에 영향 없음)
- 현재 DB 데이터: 2026-02-14, 31 클러스터, 315 뉴스
- insight_agent JSON에 간헐적 LLM 아티팩트 (key_metrics 값에 JSON 파편)
- package.json에 d3-force/d3-scale 중복 키 (빌드에 영향 없음, 경고만)

## 핵심 파일 경로
- 백엔드 메인: backend/app/main.py
- AI 에이전트: backend/app/services/agents/ (clustering, relation, insight, sentiment)
- API 라우터: backend/app/api/ (crawl, pipeline, newsdesk)
- 프론트 메인: frontend/src/pages/MainPage.tsx (3-뷰 탭 시스템)
- 프론트 상세: frontend/src/pages/ClusterDetailPage.tsx (직접 링크용)
- **슬라이드 패널**: frontend/src/components/ClusterPanel.tsx
- **모닝 브리프**: frontend/src/components/MorningBrief.tsx
- **시그널 대시보드**: frontend/src/components/SignalDashboard.tsx
- **시그널 배지**: frontend/src/components/SignalBadge.tsx
- **메트릭 칩**: frontend/src/components/MetricChip.tsx
- 버블맵: frontend/src/components/ClusterBubbleMap.tsx
- 기사 플로우맵: frontend/src/components/ArticleFlowView.tsx
- 디자인 시스템: frontend/tailwind.config.js + frontend/src/index.css
- Zustand 스토어: frontend/src/stores/useNewsdeskStore.ts
- API 서비스: frontend/src/services/api.ts
- 유틸리티: frontend/src/lib/utils.ts (SIGNAL_CONFIG, 중요도 티어링)
