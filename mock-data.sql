INSERT INTO newsdesk_snapshots (snapshot_date, snapshot_time, overall_sentiment, total_clusters, total_news, keywords, sectors, status)
VALUES ('2026-02-15', '06:00', 52.3, 8, 87,
  '[{"word":"AI","count":15,"sentiment":68},{"word":"반도체","count":12,"sentiment":45},{"word":"Fed","count":10,"sentiment":38},{"word":"삼성","count":9,"sentiment":55},{"word":"NVIDIA","count":8,"sentiment":72}]',
  '[{"name":"Technology","score":68},{"name":"Finance","score":42},{"name":"Energy","score":55},{"name":"Healthcare","score":61}]',
  'completed');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', 'NVIDIA Blackwell 칩 수요 폭증, AI 인프라 투자 가속화', 78, 18, true,
  '["NVDA","MSFT","GOOG","TSM"]',
  'NVIDIA의 차세대 Blackwell GPU에 대한 주문이 예상을 크게 상회하며 AI 인프라 투자 사이클이 가속화되고 있다.',
  '{"headline":"NVIDIA Blackwell 수주 사상 최대 — AI 인프라 슈퍼사이클 확인","tldr":"Blackwell GPU 선주문 120% 초과 달성 | 주요 클라우드 사업자 전량 확보 경쟁 | AI 데이터센터 CapEx 2026년 40% 증가 전망","so_what":"AI 반도체 수요가 공급을 압도하는 구조적 불균형이 확인되었으며, 이는 NVIDIA뿐 아니라 전체 AI 밸류체인에 긍정적 시그널","investment_signal":{"direction":"bullish","confidence":85,"timeframe":"6-12개월"},"key_metrics":[{"label":"Blackwell 선주문","value":"$47B","change":"+120% YoY","sentiment":"positive"},{"label":"AI CapEx 전망","value":"$280B","change":"+40%","sentiment":"positive"}],"scenarios":[{"title":"AI 슈퍼사이클 지속","outcome":"반도체·클라우드 섹터 추가 상승","probability":"65%","impact":"bullish"},{"title":"공급 병목 심화","outcome":"가격 프리미엄 확대, 마진 개선","probability":"25%","impact":"positive"}],"affected_sectors":[{"name":"반도체","direction":"up","reason":"직접 수혜"},{"name":"클라우드","direction":"up","reason":"AI 인프라 확대"}],"narrative":"NVIDIA의 Blackwell 아키텍처가 시장 예상을 크게 상회하는 수주를 기록하면서, 2026년 AI 인프라 투자 사이클의 강도가 재확인되고 있다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', 'Fed 인플레이션 경고, 금리 인하 지연 시사', 28, 14, false,
  '["SPY","TLT","JPM"]',
  '연준 위원들이 인플레이션 재가속 우려를 표명하며 금리 인하 시점이 더 늦춰질 수 있음을 시사했다.',
  '{"headline":"Fed 매파적 전환 — 금리 인하 기대 후퇴","tldr":"1월 CPI 예상 상회, 4.2% YoY | 다수 연준 위원 인하 시점 연기 발언 | 시장 금리 인하 기대 9월에서 12월로 후퇴","so_what":"금리 인하 지연은 성장주에 밸류에이션 압박으로 작용하며, 특히 고배율 기술주와 소형주에 불리","investment_signal":{"direction":"bearish","confidence":72,"timeframe":"3-6개월"},"key_metrics":[{"label":"CPI YoY","value":"4.2%","change":"+0.3%p","sentiment":"negative"},{"label":"금리 인하 시점","value":"12월","change":"3개월 후퇴","sentiment":"negative"}],"scenarios":[{"title":"인플레 재가속","outcome":"추가 긴축 가능성, 시장 하락","probability":"30%","impact":"bearish"},{"title":"점진적 둔화","outcome":"하반기 인하 가능, 완만한 회복","probability":"50%","impact":"neutral"}],"affected_sectors":[{"name":"기술","direction":"down","reason":"밸류에이션 압박"},{"name":"금융","direction":"up","reason":"NIM 유지"}],"narrative":"연준의 매파적 스탠스 전환이 시장에 충격을 주고 있다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', '삼성전자 HBM4 양산 앞당겨, NVIDIA 공급사 진입 기대', 65, 11, true,
  '["005930.KS","NVDA","SKH"]',
  '삼성전자가 HBM4 양산 시점을 Q3에서 Q2로 앞당기며 NVIDIA 공급사 재진입에 대한 기대가 높아지고 있다.',
  '{"headline":"삼성전자 HBM4 양산 가속 — NVIDIA 벤더 재진입 기대","tldr":"HBM4 양산 Q3에서 Q2로 앞당김 | NVIDIA 인증 테스트 진행 중 | SK하이닉스 독점 구도 변화 가능","so_what":"삼성전자의 HBM4 공급 능력이 입증되면, AI 메모리 시장에서의 점유율 회복이 가능","investment_signal":{"direction":"cautious_positive","confidence":62,"timeframe":"6-12개월"},"key_metrics":[{"label":"HBM4 양산","value":"Q2 2026","change":"1분기 단축","sentiment":"positive"},{"label":"목표가 상향","value":"78000원","change":"+15%","sentiment":"positive"}],"scenarios":[],"affected_sectors":[{"name":"반도체","direction":"up","reason":"HBM 경쟁 심화로 공급 확대"}],"narrative":"삼성전자의 HBM4 양산 일정 앞당김은 긍정적이나, NVIDIA 인증 결과가 핵심 변수다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', '유럽 에너지 전환 가속, 재생에너지 투자 확대', 52, 8, false,
  '["ENPH","FSLR","NEE"]',
  'EU가 2030 재생에너지 목표를 상향 조정하며 태양광 풍력 섹터 투자가 확대되고 있다.',
  '{"headline":"EU 재생에너지 목표 상향 — 그린 인프라 투자 확대","tldr":"EU 2030 재생에너지 목표 45%에서 55%로 상향 | 태양광 설치 전년비 30% 증가 | 미국 IRA 보조금과 경쟁 심화","so_what":"재생에너지 정책 강화는 장기적으로 관련 섹터에 긍정적이나, 단기 과잉투자 우려도 존재","investment_signal":{"direction":"neutral","confidence":55,"timeframe":"12개월+"},"key_metrics":[{"label":"EU 목표","value":"55%","change":"+10%p","sentiment":"positive"}],"scenarios":[],"affected_sectors":[{"name":"에너지","direction":"up","reason":"재생에너지 투자 확대"}],"narrative":"유럽의 에너지 전환 정책이 가속화되고 있다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', '미중 반도체 갈등 재점화, 추가 수출 규제 예고', 22, 12, false,
  '["ASML","LRCX","AMAT"]',
  '미국이 중국에 대한 반도체 장비 수출 규제를 추가 강화할 방침을 발표하며 관련주가 급락했다.',
  '{"headline":"미중 칩워 재점화 — 반도체 장비 추가 규제 예고","tldr":"미국, 반도체 장비 수출 규제 범위 확대 예고 | ASML 어플라이드 등 장비주 급락 | 중국 자체 개발 가속화 우려","so_what":"수출 규제 강화는 반도체 장비 업체에 직접적 매출 타격이며, 글로벌 공급망 분절 리스크를 높임","investment_signal":{"direction":"bearish","confidence":68,"timeframe":"3-6개월"},"key_metrics":[{"label":"ASML 하락","value":"-6.2%","sentiment":"negative"},{"label":"규제 대상","value":"14nm 이상","change":"확대","sentiment":"negative"}],"scenarios":[],"affected_sectors":[{"name":"반도체 장비","direction":"down","reason":"수출 규제 직격"}],"narrative":"미중 반도체 갈등이 다시 격화되고 있다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', '글로벌 부동산 시장 둔화 지속, 상업용 부동산 부실 우려', 35, 9, false,
  '["VNQ","O","SPG"]',
  '글로벌 상업용 부동산 시장의 가치 하락이 지속되며 은행권 부실 채권 우려가 재부각되고 있다.',
  '{"headline":"상업용 부동산 부실 확대 — 은행 리스크 재부각","tldr":"글로벌 CRE 가치 15% 추가 하락 | 미국 지역은행 CRE 익스포저 우려 | 오피스 공실률 사상 최고","so_what":"상업용 부동산 부실은 은행 시스템 리스크로 전이될 수 있어, 금융 섹터 전반에 경계 필요","investment_signal":{"direction":"cautious_negative","confidence":60,"timeframe":"6-12개월"},"key_metrics":[{"label":"CRE 가치 하락","value":"-15%","sentiment":"negative"},{"label":"오피스 공실률","value":"22%","change":"사상 최고","sentiment":"negative"}],"scenarios":[],"affected_sectors":[{"name":"부동산","direction":"down","reason":"가치 하락 지속"},{"name":"금융","direction":"down","reason":"CRE 부실 전이"}],"narrative":"상업용 부동산 위기가 지속 심화되고 있다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', 'AI 신약 개발 최초 FDA 승인, 바이오텍 새 시대', 82, 8, false,
  '["ISRG","MRNA","LLY"]',
  'AI 기반으로 개발된 신약이 최초로 FDA 승인을 획득하며 바이오텍 섹터에 새로운 전기를 마련했다.',
  '{"headline":"AI 신약 최초 FDA 승인 — 바이오텍 혁명의 시작","tldr":"Insilico Medicine AI 설계 신약 FDA 승인 | 개발 기간 3년 단축, 비용 60% 절감 | 대형 제약사 AI 파이프라인 투자 급증","so_what":"AI 신약 개발의 상업적 가능성이 입증되면서, 바이오텍 섹터의 밸류에이션 재평가가 예상됨","investment_signal":{"direction":"bullish","confidence":75,"timeframe":"12개월+"},"key_metrics":[{"label":"개발 기간","value":"3년 단축","sentiment":"positive"},{"label":"비용 절감","value":"60%","sentiment":"positive"}],"scenarios":[],"affected_sectors":[{"name":"바이오텍","direction":"up","reason":"AI 신약 개발 상업화"}],"narrative":"AI 신약 개발의 상업적 성공이 첫 발을 내디뎠다."}');

INSERT INTO news_clusters (newsdesk_date, title, sentiment, news_count, is_team_related, related_stocks, summary, ai_article)
VALUES ('2026-02-15', '유가 안정세, OPEC+ 감산 유지 결정', 48, 7, false,
  '["XOM","CVX","COP"]',
  'OPEC+가 현행 감산 규모를 유지하기로 결정하면서 유가가 안정적 흐름을 이어가고 있다.',
  '{"headline":"OPEC+ 감산 유지 — 유가 안정세 지속","tldr":"OPEC+ 현행 감산 규모 유지 결정 | WTI 72달러 수준 안정 | 수요 증가 전망은 하향 조정","so_what":"유가 안정은 인플레이션 압력 완화에 기여하나, 에너지 섹터 업사이드도 제한적","investment_signal":{"direction":"neutral","confidence":58,"timeframe":"3-6개월"},"key_metrics":[{"label":"WTI","value":"$72.3","change":"+0.5%","sentiment":"neutral"}],"scenarios":[],"affected_sectors":[{"name":"에너지","direction":"neutral","reason":"유가 안정"}],"narrative":"원유 시장은 당분간 안정적 흐름을 보일 전망이다."}');
