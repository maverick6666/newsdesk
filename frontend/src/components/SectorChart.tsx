import ReactEChartsCore from 'echarts-for-react'
import { motion } from 'motion/react'
import type { SectorData } from '@/services/api'

interface SectorChartProps {
  sectors: SectorData[]
}

function scoreToColor(score: number): string {
  if (score < 30) return '#ef4444'
  if (score < 45) return '#f97316'
  if (score < 55) return '#eab308'
  if (score < 70) return '#22c55e'
  return '#10b981'
}

export default function SectorChart({ sectors }: SectorChartProps) {
  if (!sectors.length) return null

  const sorted = [...sectors].sort((a, b) => b.score - a.score)

  const option = {
    grid: {
      left: 100,
      right: 40,
      top: 8,
      bottom: 8,
    },
    xAxis: {
      type: 'value' as const,
      min: 0,
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((s) => s.name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontFamily: 'DM Sans',
      },
    },
    series: [{
      type: 'bar',
      data: sorted.map((s) => ({
        value: s.score,
        itemStyle: {
          color: scoreToColor(s.score),
          borderRadius: [0, 4, 4, 0],
        },
      })).reverse(),
      barWidth: 12,
      label: {
        show: true,
        position: 'right' as const,
        color: '#94a3b8',
        fontSize: 10,
        fontFamily: 'JetBrains Mono',
        formatter: '{c}',
      },
    }],
  }

  const height = Math.max(sectors.length * 32, 120)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card p-6"
    >
      <h3 className="text-xs uppercase tracking-widest text-txt-muted mb-3 font-display">
        섹터 감성
      </h3>
      <ReactEChartsCore
        option={option}
        style={{ height }}
        opts={{ renderer: 'svg' }}
      />
    </motion.div>
  )
}
