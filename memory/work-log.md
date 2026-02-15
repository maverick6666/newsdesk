# 작업 이력
> 최신이 위, 시간순 기록. 상세 내용은 solutions/ 참조.

---

## 2026-02-15 | 시각적 폴리싱 — "눈에 잘 안들어옴" 피드백 반영
- **사용자 피드백**: "그냥 무엇보다 눈에 잘 안들어옴" → 시각적 대비 및 시그널 색상 강화
- **핵심 원칙**: "시그널 색상은 작은 배지에 갇혀있으면 안됨 — 카드 전체에 번져야 함"
- **index.css**:
  - glass-card-medium: opacity 0.035→0.045, border 0.07→0.09, inset highlight 추가
  - glass-card-compact: opacity 0.02→0.03, hover에 box-shadow 추가
  - bg-mesh-v2: 그라디언트 강도 2-3배 증가 (cyan 0.09→0.18, purple 0.07→0.14), 5번째 그라디언트 추가
  - glass-panel: 더 강한 backdrop + box-shadow
  - 신규: signal-tint-bullish/bearish/neutral (카드 배경 그라디언트 틴트)
  - 신규: glow-bar-bullish/bearish/neutral/cautious (글로우 액센트 바)
- **MorningBrief.tsx**:
  - HeroStoryCard: signal-tint 배경, glow-bar 액센트(w-1→w-[3px]), 헤드라인 text-hero-sm→text-hero(40px), So What 표시, 불릿 닷 글로우
  - MediumStoryCard: signal-tint 배경, 좌측 glow-bar(2px), 타이틀 크기 증가, line-clamp-1→2
  - CompactStoryRow: 시그널 아이콘 글로우(textShadow), font-medium→font-semibold
  - Medium 카드 수: 3개→6개, 그리드 sm:2열→lg:3열
- **SignalDashboard.tsx**:
  - SummaryStrip: 카운터 text-lg→text-2xl, 분포 바 h-1.5→h-3 + glow shadow
  - SignalClusterCard: signal-tint 배경, confidence text-xs→text-lg, 타이틀 text-sm→text-[15px], headline 우선
  - Column header: 아이콘 text-base→text-xl + textShadow glow, 라벨 text-sm→text-base, 구분선 추가
- **Header.tsx**: 액센트 바 2px→3px + glow shadow, 감성 숫자 text-lg→text-2xl, 감성 도트 glow, 전체 숫자 크기 증가
- **SignalBadge.tsx**: lg 변형 confidence text-2xl→text-3xl, 아이콘 text-base→text-lg + glow, 글로우 boxShadow 추가
- **검증 완료**: Morning Brief ✅, Bubble Map ✅, Signal Dashboard ✅, 슬라이드 패널 ✅, 에러 0개

---

## 2026-02-15 | 프론트엔드 전면 재설계 (Phase 0~7) 완료
- **배경**: 사용자가 "UX/UI가 씹창" 진단 → 전면 재설계 결정
- **핵심 문제**: 가치 높은 데이터(투자 시그널, TL;DR)가 상세 페이지에만 존재, 시각 계층 부재, 버블 클릭 시 맥락 단절
- **Phase 0**: 백엔드 API 확장 — `_get_newsdesk()`에서 ai_article JSON 파싱하여 headline, tldr, investmentSignal, keyMetrics, soWhat 필드 추가
- **Phase 1**: 데이터 레이어 + 디자인 토큰 — api.ts 타입 확장, Zustand 스토어 (viewMode, panelClusterId, panelTab), tailwind signal 색상, glass-card 티어, bg-mesh-v2
- **Phase 2**: SignalBadge (sm/md/lg 변형) + MetricChip 컴포넌트
- **Phase 3**: ClusterPanel 슬라이드오버 — 우측에서 슬라이드 인, 3탭 (분석 요약/관계 맵/기사 목록), Escape 닫기, 배경 오버레이
- **Phase 4**: MorningBrief 뷰 — 중요도 정렬 (newsCount×2 + confidence), hero/medium/compact 3단계 카드
- **Phase 5**: SignalDashboard 뷰 — bullish/neutral/bearish 3열, 분포 바, 섹터 감성 개요
- **Phase 6**: MainPage 재작성 (3-뷰 탭, BubbleMapLayout+사이드바), Header 재설계 (액센트 바, 커맨드 센터)
- **Phase 7**: 호환성 + 폴리싱 — 버블맵 시그널 아이콘(▲/●/▼), 강화 그라디언트(0.55/0.25), 툴팁에 시그널+TL;DR, ClusterDetailPage "맥락에서 보기" 버튼, bg-mesh-v2, 키보드 단축키(1/2/3 뷰 전환)
- **검증 완료**: Morning Brief ✅, Bubble Map ✅, Signal Dashboard ✅, 슬라이드 패널 (Overview/Flow/Articles) ✅, Escape 닫기 ✅, /cluster/:id 직접 접속 ✅, 맥락에서 보기 ✅

---

## 2026-02-15 | 클러스터 버블맵 + 기사 플로우맵 전면 재설계 완료
- **사용자 2차 피드백 반영**: 그리드 카드 맵 → 버블맵 + 플로우맵 드릴다운
- **ClusterBubbleMap.tsx**: d3-force 시뮬레이션, SVG 렌더링, 감성 색상 보간, 글로우 효과, CSS float 애니메이션 3종, 호버 스케일, 팀 관련 골드 링, 범례 오버레이
- **ArticleFlowView.tsx**: React Flow 기사 인과관계 플로우맵, 위상정렬 레이어 레이아웃, NEWS/INSIGHT 커스텀 노드, 원인/대응/결과/관련 색상 엣지, TL;DR 스트립, 뒤로가기
- **MainPage.tsx 재설계**: 버블맵 기본뷰(bubble/grid 토글), 드릴다운 상태 관리, AnimatePresence 뷰 전환
- **d3-force + d3-scale 설치**: 버블 물리 시뮬레이션 + 크기 스케일링
- **CSS 추가**: bubble-float-a/b/c 키프레임, hover 스케일, 골드 링 회전, flow-news-node/flow-insight-node 스타일
- **검증 완료**: 31 클러스터 버블맵 렌더링, 클릭 드릴다운 (엔비디아 HBM4 54건, 환율 12건), 뒤로가기 모두 정상

---

## 2026-02-14 | 전면 UX 재설계 + AI 콘텐츠 개선 완료
- **insight_agent.py 전면 재작성**: Bloomberg 3-bullet 포맷 (무슨 일/왜 중요/다음은)
  - 구조화 JSON 출력: headline, tldr, so_what, key_metrics, scenarios, affected_sectors, investment_signal, narrative
  - Ollama structured output (json_schema) 활용
  - 31개 클러스터 전부 100% JSON 파싱 성공
- **프론트엔드 상세 페이지 재설계** (ClusterDetailPage.tsx):
  - InfographicView: 투자 시그널 배지, 핵심 메트릭 카드, "So What?" 하이라이트, 시나리오 분석(긍정/부정), 영향 섹터, AI 내러티브
  - MarkdownFallbackView: 기존 마크다운 데이터 호환
  - 원문 기사 접혀있음 (기본값)
- **관계맵 카드 노드 개선** (ClusterMapNode.tsx): 240px 카드, 감성 바, 제목+요약
- **관계맵 레이아웃 개선** (ClusterMap.tsx): 5열 그리드, 연결노드 인접배치
- **파이프라인 재실행**: 31개 클러스터 생성, 모든 콘텐츠 한국어, 구조화 JSON 100%
- 사용자 피드백 기반: "콘텐츠도 UI도 별로, UX 최악" → 인포그래픽 중심 투자자 관점 분석

## 2026-02-14 | AI 활용 심층 리서치
- 5개 영역 리서치: 프롬프트 전략, 뉴스 포맷, 구조화 출력, 로컬 LLM 최적화, 참고 서비스
- 핵심 발견: Bloomberg 3-bullet ("무슨 일/왜 중요/다음은"), FinCoT (금융 도메인 CoT), Two-Step Thinking+JSON
- 주요 제안: insight_agent 전면 재설계 (4개 하위 에이전트 분리), 시나리오 분석 추가
- 구조화 출력 스키마 설계: key_metrics, scenarios, affected_stocks, timeline, investment_signal
- 참고: MarketSenseAI (125.9% 수익률 달성), TradingAgents (Bullish/Bearish 토론)

## 2026-02-14 | React Flow 관계맵 + UI 한국어화
- UI 전체 한국어화 (Header, MainPage, Sidebar, DetailPage, EmptyState, 감성 라벨)
- EN 태그 추가 (ClusterCard, DetailPage, isEnglish 유틸)
- AI 에이전트 한국어 출력 강제 (clustering, relation, insight, sentiment 에이전트 프롬프트 수정)
- React Flow 클러스터 관계맵 구현
  - 백엔드: /api/v1/newsdesk/map/{date} 엔드포인트 (키워드 Jaccard 유사도)
  - 프론트엔드: ClusterMap.tsx + ClusterMapNode.tsx (글래스모피즘 노드)
  - 메인 페이지 그리드/관계맵 뷰 토글
  - 34노드 13엣지 렌더링 확인
  - 문제 발견: earnings call 클러스터 가짜 연결 (stop words 부족)
  - stop words 대폭 확장 완료, 레이아웃 개선 진행 중

## 2026-02-14 | Phase 9: 통합 테스트 완료
- Playwright로 프론트엔드 스크린샷 확인
- 메인 페이지: 34개 클러스터 카드, 감성 게이지(65), 섹터 차트, 핫 키워드 정상 렌더링
- 클러스터 상세 페이지: AI 분석 기사(한국어), 소스 기사 9개 정상 표시
- ClusterCard forwardRef 적용으로 AnimatePresence ref 경고 수정
- 콘솔 에러 0개 확인

## 2026-02-14 | Phase 4: AI 파이프라인 실행 완료
- Qwen3-14B Q4_K_M 모델 다운로드 완료 (9.3GB)
- 파이프라인 실행: 315뉴스 → 32배치 → 34클러스터
- 클러스터링 → 관계분석 → 인사이트(한국어 기사) → 감성분석 모두 성공
- DB 저장 확인: 34 clusters + snapshot
- 중복 파이프라인 실행 이슈 발견 및 해결 (백엔드 재시작)

## 2026-02-14 | Phase 6-8: 프론트엔드 구현
- "Cinematic Intelligence" 디자인 시스템 (글래스모피즘 다크테마)
- Tailwind 커스텀 테마: surface, glass, accent, gold, sentiment, txt 색상 체계
- 컴포넌트: Header, ClusterCard, SentimentGauge(ECharts), SectorChart, HotKeywords
- 페이지: MainPage(필터링+스켈레톤), ClusterDetailPage(AI기사+소스뉴스)
- motion/react 패키지 미설치 이슈 해결 (컨테이너 내 npm install)

## 2026-02-14 | Phase 3: 뉴스 수집기 완성
- MarketAux: published_on 날짜 필터, must_have_entities, match_score >= 5
- CryptoCompare: 무료 API, 페이지네이션(lTs), 3회 호출 max
- 네이버 검색: 8개 쿼리, 100건씩, NAVER_CLIENT_ID/SECRET 적용
- 총 315건 수집 (MarketAux 41 + CryptoCompare 95 + 네이버 179)

## 2026-02-14 | Phase 1-2: 인프라 + DB
- Docker Compose 3서비스 (postgres:17, backend, frontend)
- 포트 충돌 해결: 5432→5433, 8000→8001 (fundmessage와 분리)
- PYTHONPATH=/app 추가 (Alembic 모듈 임포트 해결)
- DB 모델: raw_news, news_clusters, newsdesk_snapshots
- Alembic 마이그레이션 성공

## 2026-02-14 | 프로젝트 초기 기획
- 뉴스데스크 센터 기획서 v1.0 브레인스토밍
- RTX 5070 로컬 LLM 모델 리서치 → Qwen3-14B Q4_K_M 선정
- 아키텍처 결정: 독립 FastAPI 서버 → fundmessage에 데이터 제공
- 장애 대응: 이전 스냅샷 유지 방식 확정
- 메모리 시스템 초기화

---
