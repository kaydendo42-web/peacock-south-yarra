import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import { sizeOf, type Table, type TableState } from '../data'
import { boxGeo, prismGeo, toScene } from './geometry'
import { HOVER_LIFT, PLINTH_HEIGHT, TABLE_HEIGHT, floorHeightAt } from './layout'
import { HOVER_MS, standardEase } from './ease'
import { booked, coral, partly, selected as selectedTone, stone, type Tone } from './palette'
import { materialsFor } from './shading'

/** Booking state is read as atmospheric depth, not as a colour legend (§4). */
function toneFor(state: TableState, isSelected: boolean): { key: string; tone: Tone } {
  const base =
    state === 'available'
      ? { key: 'coral', tone: coral }
      : state === 'partly'
        ? { key: 'partly', tone: partly }
        : // Fully booked and too-small both recede into the background city.
          { key: 'booked', tone: booked }

  if (!isSelected) return base
  // Selection lifts the top face to the accent and leaves the sides alone. On an
  // available table that means coral sides, exactly as §4 describes; on a booked
  // or too-small one the sides stay drained, so selecting a table you cannot have
  // never makes it advance out of the background.
  return {
    key: `selected-${base.key}`,
    tone: { top: selectedTone.top, mid: base.tone.mid, dark: base.tone.dark },
  }
}

type Props = {
  table: Table
  state: TableState
  selected: boolean
  onSelect?: (table: Table) => void
  onHover?: (table: Table | null) => void
  label?: ReactNode
  /** Lifted by its area rather than by its own hover (area booking). */
  lifted?: boolean
}

export default function TableMesh({ table, state, selected, onSelect, onHover, label, lifted }: Props) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const lift = useRef(0)
  const from = useRef(0)
  const startedAt = useRef(-1)

  // The footprint as it stands, so the geometry is built already turned and
  // the group never rotates — a rotated mesh would shade its faces against
  // local normals and put its dark side on the wrong edge (§2).
  const { w, d } = sizeOf(table)
  const shape = table.shape
  const bodyH = TABLE_HEIGHT - PLINTH_HEIGHT

  const body = useMemo(() => {
    // A four-sided prism is a square set on its points: a diamond table.
    if (shape === 'diamond') return prismGeo(table.w / Math.SQRT2, bodyH, 4)
    if (shape === 'round') return prismGeo(w / 2, bodyH, 12)
    return boxGeo(w, bodyH, d)
  }, [shape, table.w, w, d, bodyH])
  const plinth = useMemo(() => {
    if (shape === 'diamond') return prismGeo(table.w / Math.SQRT2 + 0.1, PLINTH_HEIGHT, 4)
    if (shape === 'round') return prismGeo(w / 2 + 0.1, PLINTH_HEIGHT, 12)
    return boxGeo(w + 0.2, PLINTH_HEIGHT, d + 0.2)
  }, [shape, table.w, w, d])

  const { key, tone } = toneFor(state, selected)
  const bodyMats = useMemo(() => materialsFor(key, tone), [key, tone])
  const plinthMats = useMemo(() => materialsFor('stone', stone), [])

  const [sx, sz] = toScene(table.x, table.y)
  const floorY = floorHeightAt(table.x, table.y)

  // Hover lifts the table 0.06 over 160ms. No colour change, no outline, no glow (§4).
  useFrame(() => {
    const g = group.current
    if (!g) return
    const target = floorY + ((lifted ?? hovered) ? HOVER_LIFT : 0)
    if (lift.current !== target && startedAt.current < 0) {
      from.current = g.position.y
      startedAt.current = performance.now()
      lift.current = target
    }
    if (startedAt.current >= 0) {
      const t = Math.min(1, (performance.now() - startedAt.current) / HOVER_MS)
      g.position.y = from.current + (target - from.current) * standardEase(t)
      if (t >= 1) startedAt.current = -1
    }
  })

  // A tap fires pointerover with no matching pointerout, which would leave the
  // table stuck in its lifted state on a phone. Only a real pointer hovers.
  const enter = (pointerType: string) => {
    if (pointerType !== 'mouse' && pointerType !== 'pen') return
    setHovered(true)
    onHover?.(table)
    document.body.style.cursor = 'pointer'
  }
  const leave = () => {
    setHovered(false)
    onHover?.(null)
    document.body.style.cursor = ''
  }

  return (
    <group ref={group} position={[sx, floorY, sz]}>
      <mesh
        geometry={plinth}
        material={plinthMats}
        position={[0, PLINTH_HEIGHT / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          enter(e.pointerType)
        }}
        onPointerOut={leave}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(table)
        }}
      />
      <mesh
        geometry={body}
        material={bodyMats}
        position={[0, PLINTH_HEIGHT + bodyH / 2, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          enter(e.pointerType)
        }}
        onPointerOut={leave}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(table)
        }}
      />
      {label ? (
        <Html
          position={[0, TABLE_HEIGHT + 0.34, 0]}
          center
          zIndexRange={[8, 0]}
          // The label is a caption, not a target: its wrapper must not eat the
          // click meant for the table underneath it.
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </Html>
      ) : null}
    </group>
  )
}
