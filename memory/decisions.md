# 기술적 결정 & 환경 변경 이력

---

## 2026-02-14 | 아키텍처: 독립 API 서버 (옵션 A)
- **결정**: newsdesk center는 독립 FastAPI 서버로 운영
- **이유**: fundmessage와 분리하여 장기적 확장성 확보, SaaS 전환 가능
- **영향**: newsdesk → fundmessage 방향으로 API 제공, 포트폴리오 정보는 fundmessage에서 전달받음

## 2026-02-14 | LLM 모델: Qwen3-14B Q4_K_M (수정)
- **Before**: Qwen3-8B Q4_K_M (첫 번째 리서치)
- **After**: Qwen3-14B Q4_K_M (VRAM ~10.7GB, 컨텍스트 8-16K)
- **이유**: KV 캐시 q8_0 양자화로 14B가 12GB VRAM에 통째로 들어감 (오프로드 불필요)
- **핵심**: Flash Attention + q8_0 KV 캐시 = 16K 컨텍스트까지 GPU에서 처리
- **속도**: ~50-60 tok/s (오프로드 없어서 8B와 비슷한 속도)
- **보조**: Qwen3-30B-A3B (MoE 전문가 오프로드, 12-20 tok/s, 품질 최우선 시)

## 2026-02-14 | 클러스터링: 점진적 방식 (우체국 직원)
- **결정**: 200개 뉴스를 10개씩 배치로 나눠 점진적 클러스터링
- **방식**: 배치 → LLM에 뉴스 10개 + 기존 클러스터 요약 전달 → 배정/신규생성
- **이유**: 컨텍스트 윈도우 제한 해결, 호출당 ~5K 토큰으로 8K 컨텍스트에 여유
- **영향**: 대형 컨텍스트 모델 불필요, 14B 모델로 충분

## 2026-02-14 | 프로젝트 구조: 완전 독립 풀스택 (수정)
- **Before**: 옵션 C (백엔드만 독립, 프론트는 fundmessage에 통합)
- **After**: 완전 독립 풀스택 프로젝트 (자체 프론트엔드 + 백엔드 + DB)
- **이유**: fundmessage 없이도 단독 실행/디버깅/개선 가능해야 함
- **구조**: F:\newsdesk (FastAPI + React + PostgreSQL, 모두 Docker)
- **연동**: 최종적으로 fundmessage도 업데이트하여 newsdesk API 호출
- **환경**: Docker Compose (frontend + backend + postgres), Ollama는 호스트
- **DB**: PostgreSQL

## 2026-02-14 | 개발 환경 확인 완료
- Docker Desktop: 실행 중
- NVIDIA Driver: 576.88, CUDA 12.9
- GPU: RTX 5070 12,227MiB
- Ollama: 설치됨
- MarketAux API 키: 확보 (.env에만 저장)
- 네이버 API: 미정 (선택)

## 2026-02-14 | MarketAux API: 무료 플랜 + 로컬 뉴스 DB
- **결정**: 무료 플랜 일일 한도 꽉 채워서 로컬 뉴스 DB 구축
- **이유**: 비용 절감, 로컬 데이터 축적이 장기적 자산

## 2026-02-14 | 프론트엔드 기술 스택
- **그래프**: React Flow (@xyflow/react v12) — 뉴스 관계 맵, 커스텀 JSX 노드
- **차트**: ECharts (echarts-for-react) — 감성 게이지, 레이더, 히트맵, 버블
- **애니메이션**: Motion v12 (메인) + GSAP (텍스트/SVG 특수효과, 무료화)
- **UI 컴포넌트**: shadcn/ui (Nova/Mira) + Aceternity UI + Magic UI (글래스모피즘)
- **마크다운**: react-markdown + remark-gfm (기존) + Shiki (코드 하이라이팅)
- **레이아웃**: CSS Grid + Motion layout (벤토 그리드)
- **보조**: AutoAnimate (리스트 자동 애니메이션)
- **새로 구성**: Tailwind CSS, Zustand (독립 프로젝트이므로 자체 설치)

## 2026-02-14 | UX/UI 최우선 원칙
- **프론트엔드 작업 시 반드시 frontend-design 스킬 호출**
- 디자인 품질이 기능보다 우선
- 디자인 참고: Bloomberg Terminal × Obsidian × Apple

## 2026-02-14 | 인퍼런스 서버: Ollama
- **결정**: Ollama 사용
- **이유**: Windows 네이티브 지원, JSON 스키마 강제 출력 내장, 설치 간편

## 2026-02-14 | 장애 대응: 이전 스냅샷 유지
- **결정**: GPU 서버 다운 시 마지막 성공 스냅샷 표시
- **이유**: OpenAI 폴백보다 단순하고 비용 없음

## 2026-02-15 | 시각화: 버블맵 + 기사 플로우맵 (전면 교체)
- **Before**: React Flow 5열 그리드 카드 맵 (ClusterMap.tsx + ClusterMapNode.tsx)
- **After**: D3 force 버블맵 (메인뷰) + React Flow 기사 플로우맵 (드릴다운)
- **이유**: 사용자 피드백 "바둑판, 뭘 봐야할지 모르겠음" → 크기로 중요도 직관적 파악
- **핵심**: 클러스터 = 떠다니는 원(크기=기사수, 색상=감성), 클릭→기사 인과관계 플로우

---
