import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { ClusterData } from '@/services/api'
import { cn, getSignalConfig, clusterImportanceScore } from '@/lib/utils'
import SignalBadge from '@/components/SignalBadge'
import MetricChip from '@/components/MetricChip'

/* ─── Types ─────────────────────────────────────────── */

interface MorningBriefProps {
  clusters: ClusterData[]
  onClusterClick: (id: number) => void
}

/* ─── Helpers ───────────────────────────────────────── */

function parseTldr(tldr: string): string[] {
  return tldr.split('|').map((s) => s.trim()).filter(Boolean)
}

function signalTintClass(direction?: string): string {
  switch (direction) {
    case 'bullish':
    case 'cautious_positive':
      return 'signal-tint-up'
    case 'bearish':
    case 'cautious_negative':
      return 'signal-tint-down'
    default:
      return ''
  }
}

/* ─── Confidence Pulse ──────────────────────────────── */
/* Signature element: a thin bar at the card bottom that fills
   proportionally to AI confidence. Wider = more certain. */

function ConfidencePulse({ confidence, direction }: { confidence?: number; direction?: string }) {
  if (confidence == null) return null

  const config = getSignalConfig(direction)

  return (
    <div
      className="confidence-pulse"
      style={{
        width: `${confidence}%`,
        backgroundColor: config.barColor,
        opacity: 0.6,
      }}
    />
  )
}

/* ─── Stock Tickers ─────────────────────────────────── */

function StockPills({ stocks, max = 4 }: { stocks: string[]; max?: number }) {
  if (stocks.length === 0) return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {stocks.slice(0, max).map((ticker) => (
        <span
          key={ticker}
          className="text-[10px] font-mono text-amber-light bg-amber-subtle rounded px-1.5 py-0.5"
        >
          {ticker}
        </span>
      ))}
      {stocks.length > max && (
        <span className="text-[10px] text-txt-muted">+{stocks.length - max}</span>
      )}
    </div>
  )
}

/* ─── Section Divider ───────────────────────────────── */

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4">
      <span className="text-[11px] text-txt-muted font-body font-medium">
        {label}
      </span>
      <span className="text-[11px] font-mono text-txt-faint">
        {count}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

/* ─── HeroStoryCard ─────────────────────────────────── */

function HeroStoryCard({
  cluster,
  onClick,
}: {
  cluster: ClusterData
  onClick: () => void
}) {
  const signal = cluster.investmentSignal
  const config = getSignalConfig(signal?.direction)
  const bullets = cluster.tldr
    ? parseTldr(cluster.tldr)
    : cluster.summary
      ? [cluster.summary]
      : []

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn('nd-card-hero cursor-pointer group', signalTintClass(signal?.direction))}
    >
      {/* Left signal bar */}
      <div
        className="absolute left-0 top-0 w-[2px] h-full rounded-l-xl"
        style={{ backgroundColor: config.barColor, opacity: 0.7 }}
      />

      <div className="p-7 pl-8">
        {/* Portfolio badge */}
        {cluster.isTeamRelated && (
          <span className="inline-block text-[10px] font-mono font-medium text-amber-light bg-amber-subtle border border-amber/15 rounded px-2 py-0.5 mb-3">
            Portfolio
          </span>
        )}

        {/* Headline */}
        <h2 className="font-display text-hero text-txt-primary leading-tight group-hover:text-white transition-colors duration-200">
          {cluster.headline || cluster.title}
        </h2>

        {/* So What — impact statement */}
        {cluster.soWhat && (
          <p className={cn('text-base font-medium mt-3 leading-snug', config.color)}>
            {cluster.soWhat}
          </p>
        )}

        {/* TL;DR bullets */}
        {bullets.length > 0 && (
          <ul className="mt-4 space-y-2">
            {bullets.slice(0, 3).map((point, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-txt-secondary leading-relaxed">
                <span
                  className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: config.barColor, opacity: 0.6 }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Key metrics */}
        {cluster.keyMetrics && cluster.keyMetrics.length > 0 && (
          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            {cluster.keyMetrics.map((m) => (
              <MetricChip
                key={m.label}
                label={m.label}
                value={m.value}
                change={m.change}
                sentiment={m.sentiment}
              />
            ))}
          </div>
        )}

        {/* Bottom: signal badge + news count + stocks */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            {signal && (
              <SignalBadge
                direction={signal.direction}
                confidence={signal.confidence}
                size="md"
              />
            )}
            <span className="text-xs text-txt-muted font-mono">
              {cluster.newsCount}건
            </span>
          </div>
          <StockPills stocks={cluster.relatedStocks} max={5} />
        </div>
      </div>

      {/* Confidence pulse — signature */}
      <ConfidencePulse confidence={signal?.confidence} direction={signal?.direction} />
    </motion.article>
  )
}

/* ─── MediumStoryCard ───────────────────────────────── */

function MediumStoryCard({
  cluster,
  index,
  onClick,
}: {
  cluster: ClusterData
  index: number
  onClick: () => void
}) {
  const signal = cluster.investmentSignal
  const config = getSignalConfig(signal?.direction)
  const firstBullet = cluster.tldr
    ? parseTldr(cluster.tldr)[0]
    : cluster.summary || undefined

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={onClick}
      className={cn('nd-card cursor-pointer group', signalTintClass(signal?.direction))}
    >
      {/* Left signal bar */}
      <div
        className="absolute left-0 top-0 w-[2px] h-full rounded-l-xl"
        style={{ backgroundColor: config.barColor, opacity: 0.5 }}
      />

      <div className="p-5 pl-6">
        {/* Signal badge + portfolio */}
        <div className="flex items-center justify-between mb-2.5">
          {signal ? (
            <SignalBadge direction={signal.direction} confidence={signal.confidence} size="md" />
          ) : (
            <span className="text-xs font-mono text-txt-muted">
              {cluster.sentiment.toFixed(0)}
            </span>
          )}
          {cluster.isTeamRelated && (
            <span className="text-[9px] font-mono text-amber-light bg-amber-subtle rounded px-1.5 py-0.5">
              Portfolio
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-card-title text-txt-primary line-clamp-2 group-hover:text-white transition-colors duration-200">
          {cluster.headline || cluster.title}
        </h3>

        {/* First TL;DR segment */}
        {firstBullet && (
          <p className="text-sm text-txt-secondary line-clamp-2 mt-2 leading-relaxed">
            {firstBullet}
          </p>
        )}

        {/* Bottom: news count + stocks */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-[11px] text-txt-muted font-mono">
            {cluster.newsCount}건
          </span>
          <StockPills stocks={cluster.relatedStocks} max={3} />
        </div>
      </div>

      {/* Confidence pulse */}
      <ConfidencePulse confidence={signal?.confidence} direction={signal?.direction} />
    </motion.article>
  )
}

/* ─── CompactStoryRow ───────────────────────────────── */

function CompactStoryRow({
  cluster,
  index,
  onClick,
}: {
  cluster: ClusterData
  index: number
  onClick: () => void
}) {
  const signal = cluster.investmentSignal
  const config = getSignalConfig(signal?.direction)

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
      }}
      onClick={onClick}
      className="flex items-center gap-3 py-3 px-3 border-b border-border cursor-pointer hover:bg-surface-2 rounded-lg transition-colors duration-150 group"
    >
      {/* Signal icon */}
      <span className={cn('text-xs leading-none shrink-0', config.color)}>
        {signal ? config.icon : '●'}
      </span>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-body font-medium text-txt-primary truncate group-hover:text-white transition-colors duration-200">
          {cluster.headline || cluster.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-txt-muted font-mono">
            {cluster.newsCount}건
          </span>
          {signal?.confidence != null && (
            <span className={cn('text-[11px] font-mono', config.color)}>
              {signal.confidence}%
            </span>
          )}
        </div>
      </div>

      {/* Stocks + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        <StockPills stocks={cluster.relatedStocks} max={2} />
        <svg
          className="w-3.5 h-3.5 text-txt-faint opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.article>
  )
}

/* ─── MorningBrief (Main Component) ─────────────────── */

export default function MorningBrief({
  clusters,
  onClusterClick,
}: MorningBriefProps) {
  const sorted = useMemo(
    () => [...clusters].sort((a, b) => clusterImportanceScore(b) - clusterImportanceScore(a)),
    [clusters],
  )

  const hero = sorted[0] as ClusterData | undefined
  const mediums = sorted.slice(1, 7)
  const compacts = sorted.slice(7)

  if (!hero) return null

  return (
    <div>
      {/* Hero */}
      <HeroStoryCard
        cluster={hero}
        onClick={() => onClusterClick(hero.id)}
      />

      {/* Medium stories */}
      {mediums.length > 0 && (
        <>
          <SectionDivider label="주요 뉴스" count={mediums.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediums.map((cluster, i) => (
              <MediumStoryCard
                key={cluster.id}
                cluster={cluster}
                index={i}
                onClick={() => onClusterClick(cluster.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Compact stories */}
      {compacts.length > 0 && (
        <>
          <SectionDivider label="기타 뉴스" count={compacts.length} />
          <div>
            {compacts.map((cluster, i) => (
              <CompactStoryRow
                key={cluster.id}
                cluster={cluster}
                index={i}
                onClick={() => onClusterClick(cluster.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
