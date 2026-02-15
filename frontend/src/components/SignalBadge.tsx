import { cn, getSignalConfig } from '@/lib/utils'

interface SignalBadgeProps {
  direction?: string
  confidence?: number
  timeframe?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SignalBadge({
  direction,
  confidence,
  timeframe,
  size = 'md',
}: SignalBadgeProps) {
  const config = getSignalConfig(direction)

  if (size === 'sm') {
    return (
      <span
        className={cn('inline-block text-sm leading-none', config.color)}
        title={`${config.label}${confidence != null ? ` ${confidence}` : ''}`}
      >
        {config.icon}
      </span>
    )
  }

  if (size === 'md') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono',
          config.bgClass,
        )}
      >
        <span className={cn('leading-none text-[10px]', config.color)}>{config.icon}</span>
        <span className={config.color}>{config.label}</span>
        {confidence != null && (
          <span className={cn('opacity-70', config.color)}>{confidence}</span>
        )}
      </span>
    )
  }

  // lg — used in detail panel
  return (
    <div className={cn('rounded-lg px-4 py-3', config.bgClass)}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('text-base leading-none', config.color)}>
          {config.icon}
        </span>
        <span className={cn('text-sm font-semibold', config.color)}>
          {config.label}
        </span>
      </div>
      {confidence != null && (
        <div className={cn('text-2xl font-mono font-bold', config.color)}>
          {confidence}
        </div>
      )}
      {timeframe && (
        <div className="text-[11px] font-mono text-txt-muted mt-1">
          {timeframe}
        </div>
      )}
    </div>
  )
}
