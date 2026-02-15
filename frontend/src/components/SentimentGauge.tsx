import ReactEChartsCore from 'echarts-for-react'
import { motion } from 'motion/react'
import { sentimentLabel } from '@/lib/utils'

interface SentimentGaugeProps {
  score: number
}

function scoreToColor(score: number): string {
  if (score < 25) return '#ef4444'
  if (score < 40) return '#f97316'
  if (score < 60) return '#eab308'
  if (score < 75) return '#22c55e'
  return '#10b981'
}

export default function SentimentGauge({ score }: SentimentGaugeProps) {
  const color = scoreToColor(score)

  const option = {
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      center: ['50%', '60%'],
      radius: '90%',
      progress: {
        show: true,
        width: 14,
        itemStyle: { color },
      },
      pointer: { show: false },
      axisLine: {
        lineStyle: {
          width: 14,
          color: [[1, 'rgba(255,255,255,0.04)']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 32,
        fontFamily: 'Outfit',
        fontWeight: 700,
        color: '#e2e8f0',
        offsetCenter: [0, '-10%'],
        formatter: '{value}',
      },
      data: [{ value: score }],
    }],
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="text-xs uppercase tracking-widest text-txt-muted mb-2 font-display">
        시장 감성
      </h3>
      <ReactEChartsCore
        option={option}
        style={{ height: 200 }}
        opts={{ renderer: 'svg' }}
      />
      <p className="text-center text-sm font-medium mt-[-8px]" style={{ color }}>
        {sentimentLabel(score)}
      </p>
    </motion.div>
  )
}
