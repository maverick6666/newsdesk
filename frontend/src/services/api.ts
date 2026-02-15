import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
})

export interface InvestmentSignal {
  direction: string   // bullish | cautious_positive | neutral | cautious_negative | bearish
  confidence: number  // 0-100
  timeframe: string
}

export interface MetricItem {
  label: string
  value: string
  change?: string
  sentiment: string
}

export interface ClusterData {
  id: number
  title: string
  sentiment: number
  newsCount: number
  isTeamRelated: boolean
  relatedStocks: string[]
  summary: string
  // Insight fields (from enhanced API)
  headline?: string
  tldr?: string
  investmentSignal?: InvestmentSignal
  keyMetrics?: MetricItem[]
  soWhat?: string
}

export interface KeywordData {
  word: string
  count: number
  sentiment: number
}

export interface SectorData {
  name: string
  score: number
}

export interface NewsDeskData {
  date: string
  lastUpdate: string | null
  snapshotTime: string | null
  overallSentiment: number
  totalClusters: number
  totalNews: number
  teamRelatedCount: number
  clusters: ClusterData[]
  keywords: KeywordData[]
  sectors: SectorData[]
  status: string
}

export interface NewsItem {
  id: number
  source: string
  title: string
  description: string
  url: string
  publishedAt: string | null
}

export interface RelationNode {
  id: string
  type: string
  label: string
}

export interface RelationEdge {
  id: string
  source: string
  target: string
  label: string
}

export interface ClusterDetail extends ClusterData {
  connectedClusters: number[]
  aiArticle: string
  relationMap: { nodes: RelationNode[]; edges: RelationEdge[] } | null
  news: NewsItem[]
}

// v2 구조화 AI 분석
export interface InsightAnalysis {
  headline: string
  tldr: string
  so_what: string
  key_metrics: { label: string; value: string; change?: string; sentiment: string }[]
  scenarios: { title: string; condition?: string; outcome: string; probability?: string; impact: string }[]
  affected_sectors: { name: string; direction: string; reason: string }[]
  investment_signal: { direction: string; confidence: number; timeframe: string }
  narrative: string
}

export function parseInsight(aiArticle: string | null | undefined): InsightAnalysis | null {
  if (!aiArticle) return null
  try {
    const parsed = JSON.parse(aiArticle)
    if (parsed.headline && parsed.tldr) return parsed as InsightAnalysis
    return null
  } catch {
    return null
  }
}

export interface MapNode {
  id: string
  title: string
  sentiment: number
  newsCount: number
  isTeamRelated: boolean
  summary: string
}

export interface MapEdge {
  id: string
  source: string
  target: string
  strength: number
  keywords: string[]
}

export interface ClusterMapData {
  nodes: MapNode[]
  edges: MapEdge[]
}

export const newsdeskApi = {
  getToday: () => api.get<NewsDeskData>('/newsdesk/today'),
  getByDate: (date: string) => api.get<NewsDeskData>(`/newsdesk/${date}`),
  getHistory: (days: number) => api.get('/newsdesk/history/recent', { params: { days } }),
  getCluster: (id: number) => api.get<ClusterDetail>(`/newsdesk/clusters/${id}`),
  getMap: (date: string) => api.get<ClusterMapData>(`/newsdesk/map/${date}`),
}

export const collectApi = {
  run: (date?: string) => api.post('/collect/run', null, { params: date ? { target_date: date } : {} }),
  status: () => api.get('/collect/status'),
}

export const pipelineApi = {
  run: (date?: string) => api.post('/pipeline/run', null, {
    params: date ? { target_date: date } : {},
    timeout: 600000,  // 10분 — AI 파이프라인은 오래 걸림
  }),
  status: () => api.get('/pipeline/status'),
}

export default api
