import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'motion/react'
import { newsdeskApi, type ClusterDetail, type RelationNode, type RelationEdge, parseInsight } from '@/services/api'

/* ─── Edge Colors by Relationship Type ───────────── */
const EDGE_THEME: Record<string, { color: string; label: string }> = {
  '원인': { color: '#f59e0b', label: '원인' },
  '대응': { color: '#3b82f6', label: '대응' },
  '결과': { color: '#22c55e', label: '결과' },
  '관련': { color: '#6b7280', label: '관련' },
}

/* ─── Custom Nodes ───────────────────────────────── */
function NewsNode({ data }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div className="flow-news-node">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-mono text-accent-light/80 bg-accent/10 px-1.5 py-0.5 rounded tracking-wider">
            NEWS
          </span>
        </div>
        <p className="text-[12.5px] text-txt-primary font-display font-medium leading-snug">
          {data.label as string}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  )
}

function InsightNode({ data }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-2 !h-2" />
      <div className="flow-insight-node">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded tracking-wider">
            INSIGHT
          </span>
        </div>
        <p className="text-[12.5px] text-gold-light font-display font-semibold leading-snug">
          {data.label as string}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-2 !h-2" />
    </>
  )
}

const nodeTypes: NodeTypes = {
  newsNode: memo(NewsNode),
  insightNode: memo(InsightNode),
}

/* ─── Layout Algorithm (Topological Sort) ────────── */
function buildFlowLayout(
  relNodes: RelationNode[],
  relEdges: RelationEdge[],
): { nodes: Node[]; edges: Edge[] } {
  // Build graph
  const inDeg = new Map<string, number>()
  const adj = new Map<string, string[]>()
  for (const n of relNodes) {
    inDeg.set(n.id, 0)
    adj.set(n.id, [])
  }
  for (const e of relEdges) {
    inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
    adj.get(e.source)?.push(e.target)
  }

  // BFS layering
  const layers: string[][] = []
  let queue = relNodes
    .filter(n => (inDeg.get(n.id) || 0) === 0)
    .map(n => n.id)
  const visited = new Set<string>()

  while (queue.length > 0) {
    const layer: string[] = []
    const nextQ: string[] = []
    for (const id of queue) {
      if (visited.has(id)) continue
      visited.add(id)
      layer.push(id)
      for (const next of adj.get(id) || []) {
        inDeg.set(next, (inDeg.get(next) || 0) - 1)
        if ((inDeg.get(next) || 0) <= 0 && !visited.has(next)) {
          nextQ.push(next)
        }
      }
    }
    if (layer.length > 0) layers.push(layer)
    queue = nextQ
  }

  // Add any unvisited nodes
  for (const n of relNodes) {
    if (!visited.has(n.id)) {
      if (layers.length === 0) layers.push([])
      layers[layers.length - 1].push(n.id)
    }
  }

  // Position nodes
  const NODE_W = 260
  const GAP_X = 50
  const GAP_Y = 110
  const nodeMap = new Map(relNodes.map(n => [n.id, n]))

  const flowNodes: Node[] = []
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li]
    const totalW = layer.length * NODE_W + (layer.length - 1) * GAP_X
    const startX = -totalW / 2 + NODE_W / 2
    for (let ni = 0; ni < layer.length; ni++) {
      const rn = nodeMap.get(layer[ni])
      if (!rn) continue
      flowNodes.push({
        id: rn.id,
        type: rn.type === 'insight' ? 'insightNode' : 'newsNode',
        position: {
          x: startX + ni * (NODE_W + GAP_X),
          y: li * (80 + GAP_Y),
        },
        data: { label: rn.label, type: rn.type },
      })
    }
  }

  // Edges
  const flowEdges: Edge[] = relEdges.map(e => {
    const theme = EDGE_THEME[e.label] || EDGE_THEME['관련']
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: e.label !== '관련',
      label: theme.label,
      style: {
        stroke: theme.color,
        strokeWidth: 2,
      },
      labelStyle: {
        fill: theme.color,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'Outfit', system-ui, sans-serif",
      },
      labelBgStyle: {
        fill: '#0b0f1a',
        fillOpacity: 0.92,
      },
      labelBgPadding: [5, 8] as [number, number],
      labelBgBorderRadius: 6,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: theme.color,
        width: 12,
        height: 12,
      },
    }
  })

  return { nodes: flowNodes, edges: flowEdges }
}

/* ─── Component ──────────────────────────────────── */
interface Props {
  clusterId: number
  onBack: () => void
}

export default function ArticleFlowView({ clusterId, onBack }: Props) {
  const [cluster, setCluster] = useState<ClusterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Fetch cluster detail
  useEffect(() => {
    setLoading(true)
    newsdeskApi.getCluster(clusterId).then(({ data }) => {
      setCluster(data)
      if (data.relationMap && data.relationMap.nodes.length > 0) {
        const layout = buildFlowLayout(data.relationMap.nodes, data.relationMap.edges)
        setNodes(layout.nodes)
        setEdges(layout.edges)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [clusterId, setNodes, setEdges])

  // Parse insight for header
  const insight = useMemo(
    () => cluster ? parseInsight(cluster.aiArticle) : null,
    [cluster],
  )

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="shimmer h-32 w-48 rounded-2xl" />
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center">
        <p className="text-txt-muted text-sm">클러스터를 찾을 수 없습니다</p>
      </div>
    )
  }

  const hasRelation = nodes.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-[calc(100vh-140px)] flex flex-col"
    >
      {/* Header bar */}
      <div className="flex items-center gap-4 px-2 py-3 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-txt-muted hover:text-txt-primary text-xs font-mono transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          버블맵으로
        </button>
        <div className="h-4 w-px bg-glass-border" />
        <h2 className="font-display text-base font-semibold text-txt-primary truncate">
          {cluster.title}
        </h2>
        <span className="text-[10px] font-mono text-txt-muted bg-glass px-2 py-0.5 rounded-full shrink-0">
          {cluster.newsCount}건
        </span>
      </div>

      {/* Insight summary strip */}
      {insight && (
        <div className="mx-2 mb-3 px-4 py-2.5 rounded-xl bg-gold/5 border border-gold/15">
          <p className="text-[11px] text-gold-light/90 font-display leading-relaxed">
            <span className="font-semibold text-gold mr-1.5">TL;DR</span>
            {insight.tldr}
          </p>
        </div>
      )}

      {/* Flow map */}
      {hasRelation ? (
        <div className="flex-1 rounded-xl overflow-hidden border border-glass-border">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'transparent' }}
          >
            <Background
              color="rgba(255,255,255,0.012)"
              gap={40}
              size={1}
            />
            <Controls
              className="!bg-surface-2 !border-glass-border !rounded-xl !shadow-glass [&>button]:!bg-surface-3 [&>button]:!border-glass-border [&>button]:!text-txt-secondary [&>button:hover]:!bg-glass-hover [&>button>svg]:!fill-txt-secondary"
            />
          </ReactFlow>
        </div>
      ) : (
        /* Fallback: article list when no relation map */
        <div className="flex-1 overflow-y-auto px-2 space-y-3">
          <p className="text-xs text-txt-muted font-mono mb-2">
            관계 분석 데이터가 없습니다. 기사 목록:
          </p>
          {cluster.news.map((n, i) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-card px-4 py-3 hover:border-accent/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-accent-light/70 bg-accent/10 px-1.5 py-0.5 rounded">
                  {n.source}
                </span>
                {n.publishedAt && (
                  <span className="text-[9px] font-mono text-txt-muted">
                    {new Date(n.publishedAt).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
              <p className="text-sm text-txt-primary font-display font-medium leading-snug">
                {n.title}
              </p>
              {n.description && (
                <p className="text-[11px] text-txt-muted leading-relaxed mt-1 line-clamp-2">
                  {n.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}

      {/* Edge legend */}
      {hasRelation && (
        <div className="flex items-center gap-5 px-3 py-2 text-[10px] font-mono text-txt-muted/50">
          {Object.entries(EDGE_THEME).map(([key, { color, label }]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
