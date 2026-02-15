import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNewsdeskStore } from '@/stores/useNewsdeskStore'
import { cn, sentimentColor, sentimentBg, isEnglish } from '@/lib/utils'
import { parseInsight, type InsightAnalysis } from '@/services/api'

const SIGNAL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  bullish: { label: '강세', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  cautious_positive: { label: '조심스런 낙관', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  neutral: { label: '중립', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30' },
  cautious_negative: { label: '조심스런 비관', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  bearish: { label: '약세', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' },
}

export default function ClusterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedCluster, fetchCluster, openPanel } = useNewsdeskStore()
  const [showSources, setShowSources] = useState(false)

  useEffect(() => {
    if (id) fetchCluster(Number(id))
  }, [id, fetchCluster])

  const handleViewInContext = useCallback(() => {
    if (id) {
      openPanel(Number(id))
      navigate('/')
    }
  }, [id, openPanel, navigate])

  if (!selectedCluster) {
    return (
      <div className="bg-mesh-v2 noise-overlay min-h-screen flex items-center justify-center">
        <div className="shimmer h-64 w-96 rounded-2xl" />
      </div>
    )
  }

  const c = selectedCluster
  const insight = parseInsight(c.aiArticle)

  return (
    <div className="bg-mesh-v2 noise-overlay min-h-screen">
      {/* Top bar */}
      <div className="glass-panel sticky top-0 z-40 px-8 py-3">
        <div className="max-w-[1200px] mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-txt-secondary hover:text-txt-primary transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            뒤로
          </button>
          <div className="w-px h-5 bg-glass-border" />
          <button
            onClick={handleViewInContext}
            className="flex items-center gap-1.5 text-accent-light/70 hover:text-accent-light transition-colors text-xs font-mono"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            맥락에서 보기
          </button>
          <div className="w-px h-5 bg-glass-border" />
          <h1 className="font-display text-sm font-semibold text-txt-primary truncate">
            {insight?.headline || c.title}
          </h1>
          {isEnglish(c.title) && (
            <span className="text-[10px] font-mono text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded border border-sky-400/20 shrink-0">
              EN
            </span>
          )}
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-8 py-6 space-y-6">
        {insight ? (
          <InfographicView cluster={c} insight={insight} />
        ) : (
          <MarkdownFallbackView cluster={c} />
        )}

        {/* Source News (접기/펼치기) */}
        {c.news.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-xs uppercase tracking-widest text-txt-muted font-display">
                원문 기사 ({c.news.length}건)
              </h3>
              <svg
                className={cn('w-4 h-4 text-txt-muted transition-transform', showSources && 'rotate-180')}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSources && (
              <div className="mt-4 space-y-2">
                {c.news.map((n) => (
                  <a
                    key={n.id}
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-glass hover:bg-glass-hover border border-transparent hover:border-glass-border transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-txt-primary group-hover:text-white transition-colors line-clamp-1">
                          {n.title}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-txt-muted shrink-0">
                        {n.source}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}

/* ─── Infographic View (v2 구조화 데이터) ─── */

function InfographicView({ cluster, insight }: { cluster: any; insight: InsightAnalysis }) {
  const signal = SIGNAL_CONFIG[insight.investment_signal.direction] || SIGNAL_CONFIG.neutral

  return (
    <>
      {/* 헤드라인 + 투자 시그널 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-txt-primary mb-3">
              {insight.headline}
            </h2>
            <div className="space-y-1.5">
              {insight.tldr.split('|').map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-accent-light mt-0.5 text-xs">●</span>
                  <p className="text-sm text-txt-secondary">{line.trim()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className={cn('px-4 py-3 rounded-xl border', signal.bg)}>
              <div className={cn('text-2xl font-display font-bold tabular-nums', signal.color)}>
                {insight.investment_signal.confidence}
              </div>
              <div className={cn('text-xs font-semibold mt-0.5', signal.color)}>
                {signal.label}
              </div>
              <div className="text-[10px] text-txt-muted mt-1">
                {insight.investment_signal.timeframe}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      {insight.key_metrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {insight.key_metrics.slice(0, 4).map((m, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-txt-muted mb-1">{m.label}</p>
              <p className="text-lg font-display font-bold text-txt-primary">{m.value}</p>
              {m.change && (
                <p className={cn(
                  'text-xs font-mono font-semibold mt-0.5',
                  m.sentiment === 'positive' ? 'text-emerald-400' :
                  m.sentiment === 'negative' ? 'text-red-400' : 'text-slate-400'
                )}>
                  {m.change}
                </p>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* So What? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-xl bg-accent/5 border border-accent/20 p-5"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
        <div className="flex items-start gap-3 pl-3">
          <span className="text-lg">💡</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-accent-light font-semibold mb-1">
              핵심 인사이트 — So What?
            </p>
            <p className="text-sm text-txt-primary leading-relaxed font-medium">
              {insight.so_what}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 시나리오 분석 */}
      {insight.scenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-xs uppercase tracking-widest text-txt-muted font-display mb-3">
            시나리오 분석
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insight.scenarios.map((s, i) => {
              const isPositive = s.impact === 'positive'
              const isNegative = s.impact === 'negative'
              return (
                <div
                  key={i}
                  className={cn(
                    'glass-card p-5 border-l-2',
                    isPositive ? 'border-l-emerald-500' :
                    isNegative ? 'border-l-red-500' : 'border-l-slate-500'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-txt-primary">{s.title}</h4>
                    {s.probability && (
                      <span className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded-full',
                        s.probability === 'high' ? 'bg-amber-400/10 text-amber-400' :
                        s.probability === 'medium' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-slate-400/10 text-slate-400'
                      )}>
                        {s.probability === 'high' ? '높음' : s.probability === 'medium' ? '중간' : '낮음'}
                      </span>
                    )}
                  </div>
                  {s.condition && (
                    <p className="text-xs text-txt-muted mb-1.5">
                      조건: {s.condition}
                    </p>
                  )}
                  <p className={cn(
                    'text-sm font-medium',
                    isPositive ? 'text-emerald-300' :
                    isNegative ? 'text-red-300' : 'text-txt-secondary'
                  )}>
                    → {s.outcome}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* 영향 섹터 */}
      {insight.affected_sectors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h3 className="text-xs uppercase tracking-widest text-txt-muted font-display mb-3">
            영향 섹터
          </h3>
          <div className="flex flex-wrap gap-3">
            {insight.affected_sectors.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-glass rounded-lg px-3 py-2">
                <span className={cn(
                  'text-sm font-bold',
                  s.direction === 'up' ? 'text-emerald-400' :
                  s.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                )}>
                  {s.direction === 'up' ? '▲' : s.direction === 'down' ? '▼' : '●'}
                </span>
                <div>
                  <span className="text-sm font-semibold text-txt-primary">{s.name}</span>
                  <p className="text-[10px] text-txt-muted">{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 분석 기사 (짧은 내러티브) */}
      {insight.narrative && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <h3 className="text-xs uppercase tracking-widest text-txt-muted font-display mb-4">
            AI 상세 분석
          </h3>
          <article className="prose prose-invert prose-sm max-w-none
            prose-headings:font-display prose-headings:text-txt-primary
            prose-p:text-txt-secondary prose-p:leading-relaxed
            prose-strong:text-txt-primary
            prose-li:text-txt-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {insight.narrative}
            </ReactMarkdown>
          </article>
        </motion.div>
      )}
    </>
  )
}

/* ─── Markdown Fallback (기존 데이터) ─── */

function MarkdownFallbackView({ cluster }: { cluster: any }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-txt-primary mb-2">{cluster.title}</h2>
            <p className="text-txt-secondary">{cluster.summary}</p>
          </div>
          <div className={cn(
            'sentiment-badge text-base px-4 py-2',
            sentimentBg(cluster.sentiment),
            sentimentColor(cluster.sentiment),
          )}>
            {cluster.sentiment.toFixed(0)}
          </div>
        </div>
      </motion.div>

      {cluster.aiArticle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8"
        >
          <h3 className="text-xs uppercase tracking-widest text-txt-muted font-display mb-4">AI 분석</h3>
          <article className="prose prose-invert prose-sm max-w-none
            prose-headings:font-display prose-headings:text-txt-primary
            prose-p:text-txt-secondary prose-p:leading-relaxed
            prose-strong:text-txt-primary
            prose-li:text-txt-secondary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cluster.aiArticle}
            </ReactMarkdown>
          </article>
        </motion.div>
      )}
    </>
  )
}
