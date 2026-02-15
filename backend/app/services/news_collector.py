"""
뉴스 수집기: MarketAux + 네이버 + CryptoCompare
각 API에서 해당 날짜의 금융/경제/크립토 뉴스를 수집한다.
"""
import html
import re
from datetime import datetime, date, timezone
from email.utils import parsedate_to_datetime

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models.raw_news import RawNews


class NewsCollector:
    def __init__(self, db: Session):
        self.db = db
        self.seen_urls: set[str] = set()

    @staticmethod
    def _clean_html(text: str | None) -> str:
        if not text:
            return ""
        text = re.sub(r"<[^>]+>", "", text)
        text = html.unescape(text)
        return text.strip()

    def _is_duplicate(self, url: str, target_date: date) -> bool:
        if url in self.seen_urls:
            return True
        exists = (
            self.db.query(RawNews.id)
            .filter(RawNews.url == url, RawNews.newsdesk_date == target_date)
            .first()
            is not None
        )
        if exists:
            self.seen_urls.add(url)
        return exists

    # ── MarketAux ──────────────────────────────────────────────
    #
    # 무료 플랜: 일 100요청, 요청당 3건
    # 전략:
    #   - must_have_entities=true → 금융 엔티티 있는 기사만
    #   - entity_types=equity,index,etf → 주식/지수/ETF 관련
    #   - industries 필터로 금융 핵심 산업만
    #   - entity_match_score 순 정렬 → 관련도 높은 기사 우선
    #   - 후처리: 엔티티 매치 스코어 낮은 기사 제외

    MARKETAUX_INDUSTRIES = ",".join([
        "Technology", "Financial Services", "Healthcare",
        "Energy", "Industrials", "Consumer Cyclical",
        "Basic Materials", "Communication Services",
        "Real Estate", "Utilities",
    ])

    async def collect_marketaux(self, target_date: date) -> dict:
        if not settings.marketaux_api_key:
            return {"source": "marketaux", "collected": 0, "message": "API key not configured"}

        collected = 0
        skipped_low_relevance = 0
        requests_used = 0
        page = 1

        async with httpx.AsyncClient(timeout=30.0) as client:
            while True:
                try:
                    resp = await client.get(
                        "https://api.marketaux.com/v1/news/all",
                        params={
                            "api_token": settings.marketaux_api_key,
                            "published_on": target_date.isoformat(),
                            "language": "en",
                            "must_have_entities": "true",
                            "entity_types": "equity,index,etf",
                            "industries": self.MARKETAUX_INDUSTRIES,
                            "group_similar": "true",
                            "sort": "entity_match_score",
                            "sort_order": "desc",
                            "limit": 3,
                            "page": page,
                        },
                    )
                    requests_used += 1

                    if resp.status_code == 429:
                        print(f"[MarketAux] Rate limit after {requests_used} requests")
                        break
                    if resp.status_code != 200:
                        print(f"[MarketAux] Error {resp.status_code}: {resp.text[:200]}")
                        break

                    data = resp.json()
                    articles = data.get("data", [])
                    if not articles:
                        break

                    for article in articles:
                        url = article.get("url", "")
                        if not url or self._is_duplicate(url, target_date):
                            continue

                        # 엔티티 매치 스코어 필터 — 낮은 관련도 제외
                        entities_raw = article.get("entities", [])
                        if entities_raw:
                            max_match = max(
                                (e.get("match_score", 0) or 0 for e in entities_raw),
                                default=0,
                            )
                            if max_match < 5:  # 10점 만점 기준 5 미만 제외
                                skipped_low_relevance += 1
                                continue

                        pub_date = None
                        if article.get("published_at"):
                            try:
                                raw = article["published_at"]
                                pub_date = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                            except Exception:
                                pass

                        entities = self._extract_marketaux_entities(article)

                        news = RawNews(
                            source="marketaux",
                            title=article.get("title", ""),
                            description=article.get("description", ""),
                            url=url,
                            published_at=pub_date,
                            newsdesk_date=target_date,
                            entities=entities,
                        )
                        self.db.add(news)
                        self.seen_urls.add(url)
                        collected += 1

                    meta = data.get("meta", {})
                    total_found = meta.get("found", 0)
                    returned = meta.get("returned", 0)

                    if returned < 3 or (page * 3) >= total_found:
                        break
                    if requests_used >= 90:
                        print(f"[MarketAux] Nearing daily limit ({requests_used})")
                        break

                    page += 1

                except httpx.TimeoutException:
                    print(f"[MarketAux] Timeout on page {page}")
                    break
                except Exception as e:
                    print(f"[MarketAux] Error page {page}: {e}")
                    break

        self.db.commit()
        print(f"[MarketAux] {collected} collected, {skipped_low_relevance} skipped (low relevance), {requests_used} requests")
        return {
            "source": "marketaux",
            "collected": collected,
            "skipped": skipped_low_relevance,
            "requests_used": requests_used,
        }

    @staticmethod
    def _extract_marketaux_entities(article: dict) -> dict | None:
        entities = {}
        for ent in article.get("entities", []):
            if ent.get("symbol"):
                entities.setdefault("tickers", []).append({
                    "symbol": ent["symbol"],
                    "name": ent.get("name", ""),
                    "type": ent.get("type", ""),
                    "industry": ent.get("industry", ""),
                    "sentiment": ent.get("sentiment_score"),
                    "match_score": ent.get("match_score"),
                })
            if ent.get("industry"):
                entities.setdefault("industries", set()).add(ent["industry"])
        if "industries" in entities:
            entities["industries"] = list(entities["industries"])
        return entities if entities else None

    # ── CryptoCompare ──────────────────────────────────────────
    #
    # 무료: 50회/시간, API 키 없이 기본 호출 가능
    # 호출당 ~50건 반환, 본문(body) 포함

    async def collect_crypto(self, target_date: date) -> dict:
        collected = 0
        # target_date의 시작/끝 타임스탬프 (UTC)
        day_start = datetime.combine(target_date, datetime.min.time(), tzinfo=timezone.utc)
        day_end = datetime.combine(target_date, datetime.max.time(), tzinfo=timezone.utc)
        ts_end = int(day_end.timestamp())

        async with httpx.AsyncClient(timeout=15.0) as client:
            # 최대 3번 호출 (각 ~50건 = ~150건)
            lts = ts_end
            for _ in range(3):
                try:
                    resp = await client.get(
                        "https://min-api.cryptocompare.com/data/v2/news/",
                        params={"lang": "EN", "lTs": lts},
                    )
                    if resp.status_code != 200:
                        print(f"[Crypto] Error {resp.status_code}")
                        break

                    articles = resp.json().get("Data", [])
                    if not articles:
                        break

                    oldest_ts = lts
                    for article in articles:
                        pub_ts = article.get("published_on", 0)
                        pub_date = datetime.fromtimestamp(pub_ts, tz=timezone.utc)

                        # 날짜 범위 확인
                        if pub_date < day_start:
                            oldest_ts = min(oldest_ts, pub_ts)
                            continue
                        if pub_date > day_end:
                            continue

                        url = article.get("guid") or article.get("url", "")
                        if not url or self._is_duplicate(url, target_date):
                            continue

                        news = RawNews(
                            source="cryptocompare",
                            title=article.get("title", ""),
                            description=article.get("body", ""),
                            url=url,
                            published_at=pub_date,
                            newsdesk_date=target_date,
                            entities={
                                "categories": article.get("categories", ""),
                                "tags": article.get("tags", "").split("|") if article.get("tags") else [],
                                "source": article.get("source", ""),
                            },
                        )
                        self.db.add(news)
                        self.seen_urls.add(url)
                        collected += 1
                        oldest_ts = min(oldest_ts, pub_ts)

                    # 다음 페이지: 가장 오래된 기사 이전으로
                    if oldest_ts >= lts:
                        break
                    lts = oldest_ts
                    # target_date보다 이전 기사에 도달했으면 중단
                    if datetime.fromtimestamp(oldest_ts, tz=timezone.utc) < day_start:
                        break

                except Exception as e:
                    print(f"[Crypto] Error: {e}")
                    break

        self.db.commit()
        print(f"[Crypto] {collected} articles collected")
        return {"source": "cryptocompare", "collected": collected}

    # ── 네이버 ─────────────────────────────────────────────────
    #
    # 검색 API: display 최대 100건
    # 넓은 경제 쿼리 8개로 한국 금융 뉴스 수집

    NAVER_QUERIES = [
        "증시 코스피 코스닥",
        "금리 환율 경제",
        "반도체 AI 엔비디아",
        "전기차 배터리 2차전지",
        "바이오 신약 제약",
        "부동산 아파트 분양",
        "원전 에너지 방산",
        "IPO 공모주 M&A",
    ]

    async def collect_naver(self, target_date: date) -> dict:
        if not settings.naver_client_id or not settings.naver_client_secret:
            return {"source": "naver", "collected": 0, "message": "API credentials not configured"}

        collected = 0
        headers = {
            "X-Naver-Client-Id": settings.naver_client_id,
            "X-Naver-Client-Secret": settings.naver_client_secret,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            for query in self.NAVER_QUERIES:
                try:
                    resp = await client.get(
                        "https://openapi.naver.com/v1/search/news.json",
                        headers=headers,
                        params={"query": query, "display": 100, "sort": "date"},
                    )
                    if resp.status_code != 200:
                        print(f"[Naver] Error {resp.status_code} for '{query}'")
                        continue

                    for item in resp.json().get("items", []):
                        link = item.get("originallink") or item.get("link", "")
                        if not link or self._is_duplicate(link, target_date):
                            continue

                        pub_date = None
                        if item.get("pubDate"):
                            try:
                                pub_date = parsedate_to_datetime(item["pubDate"])
                            except Exception:
                                pass

                        if pub_date and pub_date.date() != target_date:
                            continue

                        news = RawNews(
                            source="naver",
                            title=self._clean_html(item.get("title", "")),
                            description=self._clean_html(item.get("description", "")),
                            url=link,
                            published_at=pub_date,
                            newsdesk_date=target_date,
                        )
                        self.db.add(news)
                        self.seen_urls.add(link)
                        collected += 1

                except Exception as e:
                    print(f"[Naver] Error for '{query}': {e}")
                    continue

        self.db.commit()
        print(f"[Naver] {collected} articles collected")
        return {"source": "naver", "collected": collected}

    # ── 전체 수집 ──────────────────────────────────────────────

    async def collect_all(self, target_date: date | None = None) -> dict:
        if target_date is None:
            target_date = date.today()

        existing = (
            self.db.query(RawNews.url)
            .filter(RawNews.newsdesk_date == target_date)
            .all()
        )
        self.seen_urls = {row[0] for row in existing}

        marketaux = await self.collect_marketaux(target_date)
        crypto = await self.collect_crypto(target_date)
        naver = await self.collect_naver(target_date)

        db_total = self.db.query(RawNews).filter(
            RawNews.newsdesk_date == target_date
        ).count()

        return {
            "date": target_date.isoformat(),
            "sources": [marketaux, crypto, naver],
            "db_total": db_total,
        }
