import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useNavigate } from 'react-router-dom'
import { newsdeskApi, type ClusterMapData } from '@/services/api'
import ClusterMapNode from './ClusterMapNode'

const nodeTypes: NodeTypes = {
  cluster: ClusterMapNode,
}

function sentimentHex(score: number): string {
  if (score < 25) return '#ef4444'
  if (score < 40) return '#f97316'
  if (score < 60) return '#eab308'
  if (score < 75) return '#22c55e'
  return '#10b981'
}

const CARD_W = 260
const CARD_H = 140
const GAP_X = 40
const GAP_Y = 30
const COLS = 5

function layoutNodes(mapData: ClusterMapData): { nodes: Node[]; edges: Edge[] } {
  const { nodes: rawNodes, edges: rawEdges } = mapData

  // 감성 점수 내림차순 정렬 (높은 감성 → 왼쪽 상단)
  const sorted = [...rawNodes].sort((a, b) => b.sentiment - a.sentiment)

  // 연결 맵 생성 (어떤 노드가 연결되어 있는지)
  const connMap = new Map<string, Set<string>>()
  for (const e of rawEdges) {
    if (!connMap.has(e.source)) connMap.set(e.source, new Set())
    if (!connMap.has(e.target)) connMap.set(e.target, new Set())
    connMap.get(e.source)!.add(e.target)
    connMap.get(e.target)!.add(e.source)
  }

  // 그리드 배치 + 연결 노드는 같은 열에 가까이
  const placed = new Map<string, { x: number; y: number }>()
  const remaining = [...sorted]
  let row = 0
  let col = 0

  while (remaining.length > 0) {
    const node = remaining.shift()!
    const x = col * (CARD_W + GAP_X)
    const y = row * (CARD_H + GAP_Y)
    placed.set(node.id, { x, y })

    // 연결된 노드가 아직 배치 안 됐으면 바로 다음에 배치
    const connected = connMap.get(node.id)
    if (connected) {
      for (const connId of connected) {
        const idx = remaining.findIndex((n) => n.id === connId)
        if (idx >= 0) {
          // 연결 노드를 remaining 앞으로 이동 (다음에 배치)
          const [connNode] = remaining.splice(idx, 1)
          remaining.unshift(connNode)
        }
      }
    }

    col++
    if (col >= COLS) {
      col = 0
      row++
    }
  }

  const nodes: Node[] = sorted.map((n) => {
    const pos = placed.get(n.id) || { x: 0, y: 0 }
    return {
      id: n.id,
      type: 'cluster',
      position: pos,
      data: {
        title: n.title,
        sentiment: n.sentiment,
        newsCount: n.newsCount,
        isTeamRelated: n.isTeamRelated,
        summary: n.summary,
      },
    }
  })

  const edges: Edge[] = rawEdges.map((e) => {
    const sourceNode = rawNodes.find((n) => n.id === e.source)
    const color = sourceNode ? sentimentHex(sourceNode.sentiment) : '#6366f1'

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.strength > 0.15,
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: Math.max(1.5, e.strength * 8),
        opacity: Math.max(0.4, e.strength),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 10,
        height: 10,
      },
      label: e.keywords.slice(0, 2).join(', '),
      labelStyle: {
        fill: '#94a3b8',
        fontSize: 10,
        fontFamily: 'JetBrains Mono',
      },
      labelBgStyle: {
        fill: '#0b0f1a',
        fillOpacity: 0.85,
      },
      labelBgPadding: [4, 6] as [number, number],
      labelBgBorderRadius: 4,
    }
  })

  return { nodes, edges }
}

interface ClusterMapProps {
  date: string
}

export default function ClusterMap({ date }: ClusterMapProps) {
  const navigate = useNavigate()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    newsdeskApi.getMap(date).then(({ data }) => {
      if (cancelled) return
      const { nodes: n, edges: e } = layoutNodes(data)
      setNodes(n)
      setEdges(e)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [date, setNodes, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    navigate(`/cluster/${node.id}`)
  }, [navigate])

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="shimmer h-32 w-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-glass-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          color="rgba(255,255,255,0.015)"
          gap={50}
          size={1}
        />
        <Controls
          className="!bg-surface-2 !border-glass-border !rounded-xl !shadow-glass [&>button]:!bg-surface-3 [&>button]:!border-glass-border [&>button]:!text-txt-secondary [&>button:hover]:!bg-glass-hover [&>button>svg]:!fill-txt-secondary"
        />
      </ReactFlow>
    </div>
  )
}
