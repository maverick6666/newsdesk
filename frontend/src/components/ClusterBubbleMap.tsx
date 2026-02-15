import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  forceSimulation,
  forceCenter,
  forceCollide,
  forceManyBody,
  forceX,
  forceY,
} from 'd3-force'
import { scaleSqrt } from 'd3-scale'
import type { ClusterData } from '@/services/api'
import { getSignalConfig } from '@/lib/utils'

/* ─── Sentiment Color ───────────────────────────── */
const STOPS = [
  { p: 0, r: 239, g: 68, b: 68 },
  { p: 25, r: 249, g: 115, b: 22 },
  { p: 50, r: 234, g: 179, b: 8 },
  { p: 75, r: 34, g: 197, b: 94 },
  { p: 100, r: 16, g: 185, b: 129 },
]

function sentRGB(score: number): [number, number, number] {
  const s = Math.max(0, Math.min(100, score))
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (s >= STOPS[i].p && s <= STOPS[i + 1].p) {
      lo = STOPS[i]; hi = STOPS[i + 1]; break
    }
  }
  const t = (s - lo.p) / (hi.p - lo.p || 1)
  return [
    Math.round(lo.r + t * (hi.r - lo.r)),
    Math.round(lo.g + t * (hi.g - lo.g)),
    Math.round(lo.b + t * (hi.b - lo.b)),
  ]
}

/* ─── Types ──────────────────────────────────────── */
interface BubbleNode {
  id: number
  title: string
  sentiment: number
  newsCount: number
  isTeamRelated: boolean
  summary: string
  signalDirection?: string
  tldr?: string
  radius: number
  rgb: [number, number, number]
  x: number
  y: number
}

interface Props {
  clusters: ClusterData[]
  onClusterClick: (id: number) => void
}

/* ─── Helpers ────────────────────────────────────── */
const FLOAT_CLASSES = ['bubble-float-a', 'bubble-float-b', 'bubble-float-c']

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

/* ─── Component ──────────────────────────────────── */
export default function ClusterBubbleMap({ clusters, onClusterClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<BubbleNode[]>([])
  const [dim, setDim] = useState({ w: 1200, h: 700 })
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width > 0 && height > 0) setDim({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Build force layout
  useEffect(() => {
    if (clusters.length === 0) return
    const { w, h } = dim
    const counts = clusters.map(c => c.newsCount)
    const minC = Math.min(...counts)
    const maxC = Math.max(...counts)

    const rScale = scaleSqrt()
      .domain([minC, Math.max(maxC, minC + 1)])
      .range([26, 82])

    // Create sim nodes with initial scattered positions
    const simNodes = clusters.map(c => ({
      id: c.id,
      title: c.title,
      sentiment: c.sentiment,
      newsCount: c.newsCount,
      isTeamRelated: c.isTeamRelated,
      summary: c.summary,
      signalDirection: c.investmentSignal?.direction,
      tldr: c.tldr,
      radius: rScale(c.newsCount),
      rgb: sentRGB(c.sentiment),
      x: w / 2 + (Math.random() - 0.5) * w * 0.5,
      y: h / 2 + (Math.random() - 0.5) * h * 0.5,
    }))

    const sim = forceSimulation(simNodes as any)
      .force('center', forceCenter(w / 2, h / 2))
      .force('charge', forceManyBody().strength(-8))
      .force('collide', forceCollide<any>()
        .radius((d: any) => d.radius + 10)
        .strength(0.9)
        .iterations(3))
      .force('x', forceX(w / 2).strength(0.04))
      .force('y', forceY(h / 2).strength(0.04))
      .stop()

    // Run to completion
    for (let i = 0; i < 300; i++) sim.tick()

    // Clamp positions within bounds
    setNodes(simNodes.map(n => ({
      ...n,
      x: Math.max(n.radius + 10, Math.min(w - n.radius - 10, (n as any).x)),
      y: Math.max(n.radius + 10, Math.min(h - n.radius - 10, (n as any).y)),
    })))
  }, [clusters, dim])

  const handleClick = useCallback((id: number) => {
    onClusterClick(id)
  }, [onClusterClick])

  const hovered = useMemo(
    () => hoveredId !== null ? nodes.find(n => n.id === hoveredId) : null,
    [hoveredId, nodes],
  )

  return (
    <div ref={containerRef} className="w-full h-[calc(100vh-140px)] relative overflow-hidden">
      <svg
        width={dim.w}
        height={dim.h}
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        className="w-full h-full"
      >
        {/* Defs: radial gradients per bubble + glow filter */}
        <defs>
          {nodes.map(n => {
            const [r, g, b] = n.rgb
            return (
              <radialGradient key={`g-${n.id}`} id={`bg-${n.id}`} cx="38%" cy="35%">
                <stop offset="0%" stopColor={`rgba(${r},${g},${b},0.55)`} />
                <stop offset="55%" stopColor={`rgba(${r},${g},${b},0.25)`} />
                <stop offset="100%" stopColor={`rgba(${r},${g},${b},0.06)`} />
              </radialGradient>
            )
          })}
          <filter id="bubble-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render bubbles */}
        {nodes.map((node, i) => {
          const [r, g, b] = node.rgb
          const floatClass = FLOAT_CLASSES[i % 3]
          const floatDur = 7 + (i % 5) * 1.2
          const floatDelay = i * 0.25

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
            >
              {/* Float animation layer */}
              <g
                className={floatClass}
                style={{
                  '--float-dur': `${floatDur}s`,
                  '--float-delay': `${floatDelay}s`,
                } as React.CSSProperties}
              >
                {/* Hover scale layer */}
                <g
                  className="bubble-hover-target"
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleClick(node.id)}
                >
                  {/* Outer glow */}
                  <circle
                    r={node.radius + 18}
                    fill={`rgba(${r},${g},${b},${hoveredId === node.id ? 0.14 : 0.06})`}
                    style={{ transition: 'fill 0.3s ease' }}
                  />

                  {/* Main bubble */}
                  <circle
                    r={node.radius}
                    fill={`url(#bg-${node.id})`}
                    stroke={`rgba(${r},${g},${b},${hoveredId === node.id ? 0.5 : 0.25})`}
                    strokeWidth={hoveredId === node.id ? 1.8 : 1}
                    style={{ transition: 'stroke 0.3s ease, stroke-width 0.3s ease' }}
                  />

                  {/* Glass highlight (top-left) */}
                  <ellipse
                    cx={-node.radius * 0.22}
                    cy={-node.radius * 0.28}
                    rx={node.radius * 0.4}
                    ry={node.radius * 0.25}
                    fill="rgba(255,255,255,0.04)"
                  />

                  {/* Team-related gold ring */}
                  {node.isTeamRelated && (
                    <circle
                      r={node.radius + 5}
                      fill="none"
                      stroke="rgba(245,166,35,0.5)"
                      strokeWidth={1.8}
                      strokeDasharray="6 4"
                      className="gold-ring-spin"
                    />
                  )}

                  {/* Title text (large bubbles only) */}
                  {node.radius >= 38 && (
                    <text
                      y={node.radius > 55 ? -8 : -4}
                      textAnchor="middle"
                      fill="rgba(226,232,240,0.92)"
                      fontSize={node.radius > 55 ? 11.5 : 10}
                      fontFamily="'Outfit', system-ui, sans-serif"
                      fontWeight={600}
                      className="pointer-events-none select-none"
                    >
                      {truncate(node.title, node.radius > 60 ? 16 : 10)}
                    </text>
                  )}

                  {/* News count */}
                  <text
                    y={node.radius >= 38 ? (node.radius > 55 ? 14 : 12) : 5}
                    textAnchor="middle"
                    fill={`rgba(${r},${g},${b},0.95)`}
                    fontSize={node.radius > 55 ? 20 : node.radius >= 38 ? 16 : 13}
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight={700}
                    className="pointer-events-none select-none"
                  >
                    {node.newsCount}
                  </text>

                  {/* Signal direction icon for medium+ bubbles */}
                  {node.radius >= 38 && node.signalDirection && (() => {
                    const sc = getSignalConfig(node.signalDirection)
                    const iconColor = node.signalDirection === 'bullish' || node.signalDirection === 'cautious_positive'
                      ? 'rgba(34,197,94,0.9)'
                      : node.signalDirection === 'bearish' || node.signalDirection === 'cautious_negative'
                        ? 'rgba(239,68,68,0.9)'
                        : 'rgba(148,163,184,0.7)'
                    return (
                      <text
                        y={node.radius > 55 ? 30 : 26}
                        textAnchor="middle"
                        fill={iconColor}
                        fontSize={node.radius > 55 ? 11 : 9}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight={700}
                        className="pointer-events-none select-none"
                      >
                        {sc.icon}
                      </text>
                    )
                  })()}
                </g>
              </g>
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={`tip-${hovered.id}`}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: Math.min(hovered.x + hovered.radius + 18, dim.w - 290),
              top: Math.max(hovered.y - 50, 12),
            }}
          >
            <div className="bg-surface-2/95 backdrop-blur-xl border border-glass-border rounded-xl px-4 py-3 shadow-glass max-w-[300px]">
              <div className="flex items-center gap-2 mb-1.5">
                {hovered.isTeamRelated && (
                  <span className="text-[9px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                    PORTFOLIO
                  </span>
                )}
                {hovered.signalDirection && (() => {
                  const sc = getSignalConfig(hovered.signalDirection)
                  return (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sc.bgClass} ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                  )
                })()}
              </div>
              <p className="text-[13px] font-display font-semibold text-txt-primary leading-snug mb-1">
                {hovered.title}
              </p>
              {hovered.tldr ? (
                <p className="text-[11px] text-txt-secondary leading-relaxed line-clamp-2 mb-2">
                  {hovered.tldr.split('|')[0]?.trim()}
                </p>
              ) : (
                <p className="text-[11px] text-txt-muted leading-relaxed line-clamp-2 mb-2">
                  {hovered.summary}
                </p>
              )}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span style={{ color: `rgb(${hovered.rgb.join(',')})` }}>
                  감성 {hovered.sentiment.toFixed(0)}
                </span>
                <span className="text-txt-muted">
                  {hovered.newsCount}건
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend overlay (bottom-left) */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] font-mono text-txt-muted/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-sentiment-fear" />
          공포
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-sentiment-neutral" />
          중립
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-sentiment-greed" />
          탐욕
        </span>
        <span className="text-txt-muted/40 ml-2">
          크기 = 기사 수
        </span>
      </div>
    </div>
  )
}
