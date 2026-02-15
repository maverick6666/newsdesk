import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { ClusterData, SectorData } from '@/services/api'
import { cn, getSignalConfig } from '@/lib/utils'

/* ─── Types ────────────────────────────────────────── */

interface SignalDashboardProps {
  clusters: ClusterData[]
  sectors: SectorData[]
  onClusterClick: (id: number) => void
}

type SignalGroup = 'bullish' | 'neutral' | 'bearish'

/* ─── Signal Classification ────────────────────────── */

function classifySignal(cluster: ClusterData): SignalGroup {
  const dir = cluster.investmentSignal?.direction
  if (!dir) return 'neutral'
  if (dir === 'bullish' || dir === 'cautious_positive') return 'bullish'
  if (dir === 'bearish' || dir === 'cautious_negative') return 'bearish'
  return 'neutral'
}

/* ─── Score-to-Color (matches SectorChart) ─────────── */

function scoreToColor(score: number): string {
  if (score < 30) return '#ef4444'
  if (score < 45) return '#f97316'
  if (score < 55) return '#eab308'
  if (score < 70) return '#22c55e'
  return '#10b981'
}

/* ─── Column Config ────────────────────────────────── */

const COLUMNS: {
  key: SignalGroup
  icon: string
  label: string
  color: string
  borderColor: string
  bgAccent: string
}[] = [
  {
    key: 'bullish',
    icon: '▲',
    label: '강세 시그널',
    color: 'text-emerald-400',
    borderColor: 'border-l-emerald-400',
    bgAccent: 'bg-emerald-400/8',
  },
  {
    key: 'neutral',
    icon: '●',
    label: '중립',
    color: 'text-slate-400',
    borderColor: 'border-l-slate-400',
    bgAccent: 'bg-slate-400/8',
  },
  {
    key: 'bearish',
    icon: '▼',
    label: '약세 시그널',
    color: 'text-red-400',
    borderColor: 'border-l-red-400',
    bgAccent: 'bg-red-400/8',
  },
]

/* ─── Stagger Animation Variants ───────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

/* ─── Sub-Components ───────────────────────────────── */

function SignalSummaryStrip({
  bullishCount,
  neutralCount,
  bearishCount,
}: {
  bullishCount: number
  neutralCount: number
  bearishCount: number
}) {
  const total = bullishCount + neutralCount + bearishCount
  const bullishPct = total > 0 ? (bullishCount / total) * 100 : 0
  const neutralPct = total > 0 ? (neutralCount / total) * 100 : 0
  const bearishPct = total > 0 ? (bearishCount / total) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 mb-6"
    >
      {/* Counters — large and commanding */}
      <div className="flex items-center gap-8 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-lg font-semibold" style={{ textShadow: '0 0 8px rgba(34,197,94,0.4)' }}>▲</span>
          <span className="text-emerald-400 text-sm font-display font-semibold">
            강세
          </span>
          <span className="text-emerald-400 text-2xl font-mono font-bold ml-1">
            {bullishCount}
          </span>
        </div>
        <div className="h-6 w-px bg-glass-border" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-lg font-semibold">●</span>
          <span className="text-slate-400 text-sm font-display font-semibold">
            중립
          </span>
          <span className="text-slate-400 text-2xl font-mono font-bold ml-1">
            {neutralCount}
          </span>
        </div>
        <div className="h-6 w-px bg-glass-border" />
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-lg font-semibold" style={{ textShadow: '0 0 8px rgba(239,68,68,0.4)' }}>▼</span>
          <span className="text-red-400 text-sm font-display font-semibold">
            약세
          </span>
          <span className="text-red-400 text-2xl font-mono font-bold ml-1">
            {bearishCount}
          </span>
        </div>
      </div>

      {/* Distribution bar — thick with glow */}
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-3" style={{ boxShadow: '0 0 12px rgba(0,0,0,0.3)' }}>
        {bullishPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bullishPct}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-emerald-400 rounded-l-full"
            style={{ minWidth: bullishPct > 0 ? '2px' : 0, boxShadow: '0 0 8px rgba(34,197,94,0.3)' }}
          />
        )}
        {neutralPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${neutralPct}%` }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="bg-slate-500"
          />
        )}
        {bearishPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bearishPct}%` }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-red-400 rounded-r-full"
            style={{ minWidth: bearishPct > 0 ? '2px' : 0, boxShadow: '0 0 8px rgba(239,68,68,0.3)' }}
          />
        )}
      </div>
    </motion.div>
  )
}

function SignalClusterCard({
  cluster,
  group,
  onClusterClick,
}: {
  cluster: ClusterData
  group: SignalGroup
  onClusterClick: (id: number) => void
}) {
  const signalConfig = getSignalConfig(cluster.investmentSignal?.direction)
  const confidence = cluster.investmentSignal?.confidence
  const displayText = cluster.soWhat || cluster.summary

  const borderColorMap: Record<SignalGroup, string> = {
    bullish: 'border-l-emerald-400',
    neutral: 'border-l-slate-400',
    bearish: 'border-l-red-400',
  }

  const signalTint = group === 'bullish' ? 'signal-tint-bullish' : group === 'bearish' ? 'signal-tint-bearish' : 'signal-tint-neutral'

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClusterClick(cluster.id)}
      className={cn(
        'glass-card-compact cursor-pointer group border-l-2',
        borderColorMap[group],
        signalTint,
      )}
    >
      <div className="p-4">
        {/* Signal icon + confidence — confidence is BIG */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className={cn('text-sm leading-none', signalConfig.color)}
            style={{ textShadow: group !== 'neutral' ? '0 0 6px currentColor' : 'none' }}
          >
            {signalConfig.icon}
          </span>
          {confidence != null && (
            <span className={cn(
              'text-lg font-mono font-bold',
              signalConfig.color,
            )}>
              {confidence}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="font-display text-[15px] font-bold text-txt-primary leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition-colors">
          {cluster.headline || cluster.title}
        </h4>

        {/* soWhat or summary */}
        {displayText && (
          <p className="text-xs text-txt-secondary leading-relaxed line-clamp-2 mb-3">
            {displayText}
          </p>
        )}

        {/* Bottom: newsCount + stock tickers */}
        <div className="flex items-center justify-between pt-2.5 border-t border-glass-border/50">
          <span className="text-[10px] font-mono text-txt-muted">
            {cluster.newsCount}건
          </span>
          {cluster.relatedStocks.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end">
              {cluster.relatedStocks.slice(0, 3).map((stock) => (
                <span
                  key={stock}
                  className="text-[10px] font-mono text-accent-light bg-accent/10 px-1.5 py-0.5 rounded"
                >
                  {stock}
                </span>
              ))}
              {cluster.relatedStocks.length > 3 && (
                <span className="text-[10px] text-txt-muted">
                  +{cluster.relatedStocks.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SectorOverview({ sectors }: { sectors: SectorData[] }) {
  const sorted = useMemo(
    () => [...sectors].sort((a, b) => b.score - a.score),
    [sectors],
  )

  if (sorted.length === 0) return null

  const maxScore = 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card p-5 mt-6"
    >
      <h3 className="text-xs uppercase tracking-widest text-txt-muted mb-4 font-display">
        섹터 감성 개요
      </h3>
      <div className="space-y-2.5">
        {sorted.map((sector, i) => (
          <motion.div
            key={sector.name}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.4 + i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex items-center gap-3"
          >
            <span className="text-xs font-display text-txt-secondary w-24 shrink-0 truncate text-right">
              {sector.name}
            </span>
            <div className="flex-1 h-3 rounded-full bg-surface-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(sector.score / maxScore) * 100}%` }}
                transition={{
                  duration: 0.7,
                  delay: 0.5 + i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: scoreToColor(sector.score) }}
              />
            </div>
            <span
              className="text-[11px] font-mono font-semibold w-8 text-right"
              style={{ color: scoreToColor(sector.score) }}
            >
              {sector.score}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Main Component ───────────────────────────────── */

export default function SignalDashboard({
  clusters,
  sectors,
  onClusterClick,
}: SignalDashboardProps) {
  const grouped = useMemo(() => {
    const groups: Record<SignalGroup, ClusterData[]> = {
      bullish: [],
      neutral: [],
      bearish: [],
    }

    for (const cluster of clusters) {
      const group = classifySignal(cluster)
      groups[group].push(cluster)
    }

    // Sort each group by confidence descending
    for (const key of Object.keys(groups) as SignalGroup[]) {
      groups[key].sort(
        (a, b) =>
          (b.investmentSignal?.confidence ?? 0) -
          (a.investmentSignal?.confidence ?? 0),
      )
    }

    return groups
  }, [clusters])

  return (
    <div className="w-full">
      {/* 1. Summary Strip */}
      <SignalSummaryStrip
        bullishCount={grouped.bullish.length}
        neutralCount={grouped.neutral.length}
        bearishCount={grouped.bearish.length}
      />

      {/* 2. Three-column Signal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((col, colIdx) => (
          <motion.div
            key={col.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1 + colIdx * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Column Header — bold and signal-colored */}
            <div className={cn('flex items-center gap-2.5 mb-5 pb-3 border-b', col.key === 'bullish' ? 'border-emerald-400/20' : col.key === 'bearish' ? 'border-red-400/20' : 'border-slate-400/15')}>
              <span
                className={cn('text-xl leading-none', col.color)}
                style={{ textShadow: col.key !== 'neutral' ? '0 0 10px currentColor' : 'none' }}
              >
                {col.icon}
              </span>
              <h3 className={cn(
                'text-base font-display font-bold',
                col.color,
              )}>
                {col.label}
              </h3>
              <span className={cn('text-sm font-mono font-bold ml-auto', col.color)}>
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {grouped[col.key].length > 0 ? (
                grouped[col.key].map((cluster) => (
                  <SignalClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    group={col.key}
                    onClusterClick={onClusterClick}
                  />
                ))
              ) : (
                <div className={cn(
                  'glass-card-compact p-6 text-center',
                  'border-l-2',
                  col.borderColor,
                )}>
                  <span className={cn('text-2xl mb-2 block opacity-30', col.color)}>
                    {col.icon}
                  </span>
                  <p className="text-xs text-txt-muted">
                    해당 시그널 없음
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* 3. Sector Overview */}
      <SectorOverview sectors={sectors} />
    </div>
  )
}
