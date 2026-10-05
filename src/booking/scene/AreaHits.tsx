import { useEffect, useMemo, useState } from 'react'
import { Html } from '@react-three/drei'
import { DoubleSide, MeshBasicMaterial, Shape, ShapeGeometry } from 'three'
import { PLATFORM_RISE, areas, zones, type AreaId, type AreaState } from '../data'
import { toScene } from './geometry'
import { hex } from './palette'

/**
 * The areas as things you can point at. Each section's floor carries a flat,
 * unlit wash just above it: invisible until its area is hovered or chosen,
 * then the site's forest at a whisper. The wash is the target, so a tap
 * anywhere on the floor of the Courtyard means "the Courtyard", not "the
 * nearest table". Unlit and shadowless, like everything else in the room.
 */

const WASH = { hover: 0.16, selected: 0.32 } as const

function washGeo(outline: [number, number][]): ShapeGeometry {
  const s = new Shape()
  outline.forEach(([x, y], i) => {
    const [sx, sz] = toScene(x, y)
    if (i === 0) s.moveTo(sx, -sz)
    else s.lineTo(sx, -sz)
  })
  const g = new ShapeGeometry(s)
  g.rotateX(-Math.PI / 2)
  return g
}

/** The pointer cursor over a pickable area. Event-time only, never during render. */
const setCursor = (cursor: string) => {
  document.body.style.cursor = cursor
}

const areaOf = (zone: string) => areas.find((a) => a.zones.includes(zone))!

const STATE_WORDS: Record<AreaState, string> = {
  available: '',
  full: 'Full at this time',
  'too-big': 'Too small for your group',
}

export default function AreaHits({
  stateOf,
  selected,
  hovered,
  onHover,
  onSelect,
  isDrag,
}: {
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  hovered: AreaId | null
  onHover: (area: AreaId | null) => void
  onSelect: (area: AreaId) => void
  /** True while a press is really a pan; that release chooses nothing. */
  isDrag: () => boolean
}) {
  const shapes = useMemo(
    () =>
      zones.map((z) => ({
        zone: z,
        area: areaOf(z.id).id,
        geo: washGeo(z.outline),
        // Far enough above the slab (and the Court Yard's raised platform) that
        // the depth buffer can tell them apart; 1.5 cm was not.
        y: z.floor + (z.id === 'courtyard' ? PLATFORM_RISE : 0) + 0.04,
      })),
    [],
  )
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: hex.accent,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  )
  // One material per area so each can carry its own opacity.
  const [mats] = useState(() => new Map(areas.map((a) => [a.id, material.clone()])))
  // Three.js materials live outside React, so their opacity is set after render.
  useEffect(() => {
    for (const a of areas) {
      mats.get(a.id)!.opacity = selected === a.id ? WASH.selected : hovered === a.id ? WASH.hover : 0
    }
  }, [mats, selected, hovered])

  // A tap fires pointerover without a pointerout; only a real pointer hovers.
  const enter = (area: AreaId, pointerType: string) => {
    if (pointerType !== 'mouse' && pointerType !== 'pen') return
    onHover(area)
    setCursor('pointer')
  }
  const leave = () => {
    onHover(null)
    setCursor('')
  }

  return (
    <group>
      {shapes.map((s) => (
        <mesh
          key={s.zone.id}
          geometry={s.geo}
          material={mats.get(s.area)}
          position={[0, s.y, 0]}
          renderOrder={2}
          onPointerOver={(e) => {
            e.stopPropagation()
            enter(s.area, e.pointerType)
          }}
          onPointerOut={leave}
          onClick={(e) => {
            e.stopPropagation()
            if (!isDrag()) onSelect(s.area)
          }}
        />
      ))}

      {/* Each area's name where Jenny wrote its section's, with its state for
          this party and time. A caption, not a target. */}
      {shapes.map((s) => {
        const [sx, sz] = toScene(...s.zone.labelAt)
        const state = stateOf(s.area)
        const name = s.area === 'inside' ? `Inside · ${s.zone.name}` : areaOf(s.zone.id).name
        return (
          <Html
            key={`tag-${s.zone.id}`}
            position={[sx, s.y + 0.04, sz]}
            center
            zIndexRange={[4, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span
              className={`zone-tag area-tag${selected === s.area ? ' is-selected' : ''}${state !== 'available' ? ' is-out' : ''}`}
            >
              {name}
              {STATE_WORDS[state] ? <small>{STATE_WORDS[state]}</small> : null}
            </span>
          </Html>
        )
      })}
    </group>
  )
}
