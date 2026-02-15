import { useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNewsdeskStore, type PanelTab } from '@/stores/useNewsdeskStore'
import { parseInsight, type InsightAnalysis } from '@/services/api'
import { cn, getSignalConfig } from '@/lib/utils'
import SignalBadge from '@/components/SignalBadge'
import MetricChip from '@/components/MetricChip'
import ArticleFlowView from '@/components/ArticleFlowView'

/* ─── Tab Definitions ──────────────────────────────── */

const TABS: { key: PanelTab; label: string }[] = [
  { key: 'overview', label: '분석 요약' },
  { key: 'flow', label: '관계 맵' },
  { key: 'articles', label: '기사 목록' },
]

/* ─── Shimmer ──────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="px-6 py-5 space-y-5 animate-fade-in">
      <div className="shimmer h-6 w-3/4 rounded-md" />
      <div className="shimmer h-4 w-full rounded-md" />
      <div className="shimmer h-4 w-5/6 rounded-md" />
      <div className="flex gap-3 mt-4">
        <div className="shimmer h-16 w-28 rounded-lg" />
        <div className="shimmer h-16 flex-1 rounded-lg" />
      </div>
      <div className="space-y-2.5 mt-4">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-11/12 rounded" />
        <div className="shimmer h-3 w-4/5 rounded" />
      </div>
    </div>
  )
}

/* ─── Overview Tab ──────────────────────────────────── */

function OverviewTab({ insight, rawMarkdown }: { insight: InsightAnalysis | null; rawMarkdown: string }) {
  if (!insight) {
    return (
      <div className="px-6 py-5">
        <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-txt-primary prose-p:text-txt-secondary prose-a:text-amber-light prose-strong:text-txt-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {rawMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    )
  }

  const tldrItems = insight.tldr.split('|').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="px-6 py-5 space-y-6">
      {/* 1. Headline + Signal */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-txt-primary leading-snug flex-1">
          {insight.headline}
        </h2>
        {insight.investment_signal && (
          <div className="shrink-0">
            <SignalBadge
              direction={insight.investment_signal.direction}
              confidence={insight.investment_signal.confidence}
              timeframe={insight.investment_signal.timeframe}
              size="lg"
            />
          </div>
        )}
      </div>

      {/* 2. TL;DR */}
      {tldrItems.length > 0 && (
        <ul className="space-y-2">
          {tldrItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-txt-secondary leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* 3. Key Metrics */}
      {insight.key_metrics && insight.key_metrics.length > 0 && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-3">
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {insight.key_metrics.map((m, i) => (
              <MetricChip key={i} label={m.label} value={m.value} change={m.change} sentiment={m.sentiment} />
            ))}
          </div>
        </section>
      )}

      {/* 4. So What */}
      {insight.so_what && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-3">
            So What?
          </h3>
          <div className="border-l-2 border-amber bg-amber-subtle rounded-r-lg px-4 py-3">
            <p className="text-sm text-txt-primary leading-relaxed font-body">
              {insight.so_what}
            </p>
          </div>
        </section>
      )}

      {/* 5. Scenarios */}
      {insight.scenarios && insight.scenarios.length > 0 && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-3">
            Scenarios
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insight.scenarios.map((s, i) => {
              const isPositive = s.impact === 'positive' || s.impact === 'bullish'
              const isNegative = s.impact === 'negative' || s.impact === 'bearish'
              const borderColor = isPositive
                ? 'border-l-signal-up'
                : isNegative
                  ? 'border-l-signal-down'
                  : 'border-l-signal-flat'

              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border border-border bg-surface-2 px-4 py-3 border-l-[3px]',
                    borderColor,
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-body font-semibold text-txt-primary">
                      {s.title}
                    </span>
                    {s.probability && (
                      <span className="text-[10px] font-mono text-txt-muted">
                        {s.probability}
                      </span>
                    )}
                  </div>
                  {s.condition && (
                    <p className="text-[11px] text-txt-muted mb-1 italic">{s.condition}</p>
                  )}
                  <p className="text-xs text-txt-secondary leading-relaxed">{s.outcome}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 6. Affected Sectors */}
      {insight.affected_sectors && insight.affected_sectors.length > 0 && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-3">
            Affected Sectors
          </h3>
          <div className="flex flex-wrap gap-2">
            {insight.affected_sectors.map((sec, i) => {
              const arrow = sec.direction === 'up' || sec.direction === 'positive' ? '▲'
                : sec.direction === 'down' || sec.direction === 'negative' ? '▼' : '●'
              const arrowColor = arrow === '▲' ? 'text-signal-up' : arrow === '▼' ? 'text-signal-down' : 'text-signal-flat'

              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md bg-surface-3 border border-border px-3 py-1.5 text-xs text-txt-secondary"
                  title={sec.reason}
                >
                  <span className={cn('text-[10px]', arrowColor)}>{arrow}</span>
                  {sec.name}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* 7. Narrative */}
      {insight.narrative && (
        <section>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-txt-muted mb-3">
            Narrative
          </h3>
          <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-txt-primary prose-p:text-txt-secondary prose-a:text-amber-light prose-strong:text-txt-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {insight.narrative}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  )
}

/* ─── Flow Map Tab ──────────────────────────────────── */

function FlowMapTab({ clusterId }: { clusterId: number }) {
  const handleBack = useCallback(() => {}, [])

  return (
    <div className="h-[calc(100vh-140px)]">
      <ArticleFlowView clusterId={clusterId} onBack={handleBack} />
    </div>
  )
}

/* ─── Articles Tab ──────────────────────────────────── */

function ArticlesTab({ news }: { news: { id: number; source: string; title: string; description: string; url: string; publishedAt: string | null }[] }) {
  if (!news || news.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-txt-muted text-sm">
        기사가 없습니다
      </div>
    )
  }

  return (
    <div className="px-5 py-4 space-y-2">
      {news.map((n) => (
        <a
          key={n.id}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block nd-card px-4 py-3 group"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono text-amber-light bg-amber-subtle px-1.5 py-0.5 rounded tracking-wider uppercase">
              {n.source}
            </span>
            {n.publishedAt && (
              <span className="text-[9px] font-mono text-txt-muted">
                {new Date(n.publishedAt).toLocaleDateString('ko-KR', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </div>
          <p className="text-sm text-txt-primary font-body font-medium leading-snug group-hover:text-white transition-colors">
            {n.title}
          </p>
          {n.description && (
            <p className="text-[11px] text-txt-muted leading-relaxed mt-1.5 line-clamp-2">
              {n.description}
            </p>
          )}
        </a>
      ))}
    </div>
  )
}

/* ─── Main Panel ────────────────────────────────────── */

export default function ClusterPanel() {
  const panelClusterId = useNewsdeskStore((s) => s.panelClusterId)
  const selectedCluster = useNewsdeskStore((s) => s.selectedCluster)
  const isPanelLoading = useNewsdeskStore((s) => s.isPanelLoading)
  const panelTab = useNewsdeskStore((s) => s.panelTab)
  const closePanel = useNewsdeskStore((s) => s.closePanel)
  const setPanelTab = useNewsdeskStore((s) => s.setPanelTab)

  const isOpen = panelClusterId !== null

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closePanel])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const insight = useMemo(
    () => selectedCluster ? parseInsight(selectedCluster.aiArticle) : null,
    [selectedCluster],
  )

  const signalDirection = useMemo(() => {
    if (insight?.investment_signal) return insight.investment_signal.direction
    if (selectedCluster?.investmentSignal) return selectedCluster.investmentSignal.direction
    return undefined
  }, [insight, selectedCluster])

  const signalConfidence = useMemo(() => {
    if (insight?.investment_signal) return insight.investment_signal.confidence
    if (selectedCluster?.investmentSignal) return selectedCluster.investmentSignal.confidence
    return undefined
  }, [insight, selectedCluster])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="nd-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closePanel}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.aside
            className="nd-panel-sheet flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="클러스터 상세"
          >
            {/* Header */}
            <header className="shrink-0 px-5 pt-5 pb-3 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {signalDirection && (
                    <SignalBadge direction={signalDirection} confidence={signalConfidence} size="md" />
                  )}
                  {selectedCluster?.isTeamRelated && (
                    <span className="text-[10px] font-mono text-amber-light bg-amber-subtle rounded px-2 py-0.5">
                      포트폴리오
                    </span>
                  )}
                </div>
                <button
                  onClick={closePanel}
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-surface-3 hover:bg-surface-4 border border-border text-txt-muted hover:text-txt-primary transition-colors"
                  aria-label="닫기"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h2 className="font-display text-lg font-bold text-txt-primary leading-snug mb-3">
                {isPanelLoading
                  ? <span className="shimmer inline-block h-5 w-56 rounded-md" />
                  : selectedCluster?.title ?? '...'}
              </h2>

              {/* Tab bar */}
              <nav className="flex gap-1" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={panelTab === tab.key}
                    onClick={() => setPanelTab(tab.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors',
                      panelTab === tab.key
                        ? 'bg-amber-muted text-amber-light'
                        : 'text-txt-muted hover:text-txt-secondary hover:bg-surface-3',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {isPanelLoading ? (
                <LoadingSkeleton />
              ) : selectedCluster ? (
                <>
                  {panelTab === 'overview' && (
                    <OverviewTab insight={insight} rawMarkdown={selectedCluster.aiArticle || ''} />
                  )}
                  {panelTab === 'flow' && panelClusterId !== null && (
                    <FlowMapTab clusterId={panelClusterId} />
                  )}
                  {panelTab === 'articles' && (
                    <ArticlesTab news={selectedCluster.news} />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-txt-muted text-sm">
                  데이터를 불러올 수 없습니다
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedCluster && !isPanelLoading && (
              <footer className="shrink-0 px-5 py-2.5 border-t border-border flex items-center justify-between">
                <span className="text-[10px] font-mono text-txt-faint">
                  #{panelClusterId}
                </span>
                <span className="text-[10px] font-mono text-txt-muted">
                  {selectedCluster.news?.length ?? 0}건의 기사
                </span>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
