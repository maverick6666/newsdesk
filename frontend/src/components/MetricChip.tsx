import { cn } from '@/lib/utils'

interface MetricChipProps {
  label: string
  value: string
  change?: string
  sentiment: string
}

const CHANGE_COLOR: Record<string, string> = {
  positive: 'text-signal-up',
  negative: 'text-signal-down',
  neutral: 'text-signal-flat',
}

export default function MetricChip({
  label,
  value,
  change,
  sentiment,
}: MetricChipProps) {
  return (
    <div className="rounded-lg bg-surface-3 border border-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-txt-muted">
        {label}
      </div>
      <div className="text-sm font-body font-semibold text-txt-primary mt-0.5">
        {value}
      </div>
      {change && (
        <div
          className={cn(
            'text-[11px] font-mono mt-0.5',
            CHANGE_COLOR[sentiment] ?? CHANGE_COLOR.neutral,
          )}
        >
          {change}
        </div>
      )}
    </div>
  )
}
