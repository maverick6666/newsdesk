import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn, sentimentColor, isEnglish } from '@/lib/utils'

export interface ClusterNodeData {
  title: string
  sentiment: number
  newsCount: number
  isTeamRelated: boolean
  summary: string
  [key: string]: unknown
}

function sentimentHex(score: number): string {
  if (score < 25) return '#ef4444'
  if (score < 40) return '#f97316'
  if (score < 60) return '#eab308'
  if (score < 75) return '#22c55e'
  return '#10b981'
}

function sentimentBarWidth(score: number): string {
  return `${Math.max(10, score)}%`
}

function ClusterMapNode({ data }: NodeProps) {
  const d = data as ClusterNodeData
  const color = sentimentHex(d.sentiment)
  const isEn = isEnglish(d.title)

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-3 !h-3" />
      <div
        className={cn(
          'relative rounded-xl cursor-pointer transition-all duration-300',
          'hover:scale-[1.03] hover:z-10',
          d.isTeamRelated ? 'glass-card-gold' : 'glass-card',
        )}
        style={{
          width: 240,
          padding: '14px 16px',
          boxShadow: `0 0 ${Math.min(d.newsCount, 20)}px ${color}15, 0 4px 20px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Sentiment bar at top */}
        <div className="w-full h-[3px] rounded-full bg-white/5 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: sentimentBarWidth(d.sentiment), backgroundColor: color }}
          />
        </div>

        {/* Header: sentiment score + count */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs font-mono font-bold', sentimentColor(d.sentiment))}>
              {d.sentiment.toFixed(0)}
            </span>
            {isEn && (
              <span className="text-[8px] font-mono text-sky-400/80 bg-sky-400/10 px-1 rounded">EN</span>
            )}
          </div>
          <span className="text-[10px] font-mono text-txt-muted">{d.newsCount}건</span>
        </div>

        {/* Title */}
        <p className="text-[13px] font-display font-semibold text-txt-primary leading-snug line-clamp-2 mb-2">
          {d.title}
        </p>

        {/* Summary snippet */}
        {d.summary && (
          <p className="text-[10px] text-txt-muted leading-relaxed line-clamp-2">
            {d.summary}
          </p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-3 !h-3" />
    </>
  )
}

export default memo(ClusterMapNode)
