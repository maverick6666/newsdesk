import { motion } from 'motion/react'
import { sentimentColor, sentimentLabel, classifySignal } from '@/lib/utils'
import type { ClusterData } from '@/services/api'

interface HeaderProps {
  date: string
  overallSentiment: number
  totalClusters: number
  totalNews: number
  lastUpdate: string | null
  status: string
  clusters?: ClusterData[]
}

export default function Header({
  date,
  overallSentiment,
  totalClusters,
  totalNews,
  lastUpdate,
  status,
  clusters = [],
}: HeaderProps) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  // Signal distribution counts
  const signalCounts = clusters.reduce(
    (acc, c) => {
      const group = classifySignal(c)
      acc[group]++
      return acc
    },
    { bullish: 0, neutral: 0, bearish: 0 },
  )

  const total = signalCounts.bullish + signalCounts.neutral + signalCounts.bearish

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 bg-surface-1 border-b border-border"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Left: Brand + Date */}
        <div className="flex items-center gap-4">
          <h1 className="font-display text-lg font-semibold text-txt-primary tracking-tight">
            NewsDesk
          </h1>
          <span className="text-xs text-txt-muted font-body">{formattedDate}</span>
        </div>

        {/* Right: Signal pulse + stats */}
        <div className="flex items-center gap-5">
          {/* Signal distribution — the day's pulse at a glance */}
          {total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-signal-up text-xs">▲</span>
                <span className="text-signal-up text-sm font-mono font-medium">
                  {signalCounts.bullish}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-signal-flat text-[10px]">●</span>
                <span className="text-signal-flat text-sm font-mono font-medium">
                  {signalCounts.neutral}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-signal-down text-xs">▼</span>
                <span className="text-signal-down text-sm font-mono font-medium">
                  {signalCounts.bearish}
                </span>
              </div>
            </div>
          )}

          <div className="w-px h-5 bg-border" />

          {/* Overall sentiment */}
          <div className="flex items-center gap-2">
            <span className={`font-mono text-base font-semibold ${sentimentColor(overallSentiment)}`}>
              {overallSentiment.toFixed(0)}
            </span>
            <span className="text-[10px] text-txt-muted">
              {sentimentLabel(overallSentiment)}
            </span>
          </div>

          <div className="w-px h-5 bg-border" />

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-txt-muted font-mono">
            <span>{totalClusters} stories</span>
            <span>{totalNews} articles</span>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'completed' ? 'bg-signal-up' :
                status === 'running' ? 'bg-amber animate-pulse' :
                'bg-txt-muted'
              }`}
            />
            <span className="text-[10px] text-txt-faint font-mono">
              {lastUpdate
                ? new Date(lastUpdate).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Signal distribution bar — thin horizontal strip */}
      {total > 0 && (
        <div className="flex h-[2px] w-full">
          {signalCounts.bullish > 0 && (
            <div
              className="bg-signal-up"
              style={{ width: `${(signalCounts.bullish / total) * 100}%` }}
            />
          )}
          {signalCounts.neutral > 0 && (
            <div
              className="bg-signal-flat"
              style={{ width: `${(signalCounts.neutral / total) * 100}%` }}
            />
          )}
          {signalCounts.bearish > 0 && (
            <div
              className="bg-signal-down"
              style={{ width: `${(signalCounts.bearish / total) * 100}%` }}
            />
          )}
        </div>
      )}
    </motion.header>
  )
}
