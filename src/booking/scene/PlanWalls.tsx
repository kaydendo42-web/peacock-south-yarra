import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshBasicMaterial, PlaneGeometry } from 'three'
import { walls, type Wall } from '../data'
import { toScene } from './geometry'
import { hex } from './palette'
import { CASE_HEIGHT } from './layout'

/**
 * The walls as a plan draws them: a forest line along every run, so seen from
 * straight above the room still reads as rooms. From above a wall is only its
 * thin top, the same paper as the floor. Flat, unlit, drawn over everything,
 * and faded in only as the camera arrives at the plan.
 */

const WIDTH: Record<Wall['kind'], number> = { wall: 0.11, parapet: 0.07, glass: 0.05 }
/** Peak opacity: a guide under the tables, not a border round them. */
const SOLID_MAX = 0.5
const GLASS_MAX = 0.225
const FADE_MS = 400

export default function PlanWalls({ show }: { show: boolean }) {
  const runs = useMemo(
    () =>
      walls.map((w) => {
        const [ax, az] = toScene(...w.from)
        const [bx, bz] = toScene(...w.to)
        const len = Math.hypot(bx - ax, bz - az)
        const geo = new PlaneGeometry(len + WIDTH[w.kind], WIDTH[w.kind])
        geo.rotateX(-Math.PI / 2)
        return { id: w.id, geo, x: (ax + bx) / 2, z: (az + bz) / 2, angle: Math.atan2(-(bz - az), bx - ax), kind: w.kind }
      }),
    [],
  )
  const solid = useMemo(() => {
    const m = new MeshBasicMaterial({ color: hex.accent, transparent: true, opacity: 0, depthTest: false, depthWrite: false })
    m.userData.max = SOLID_MAX
    return m
  }, [])
  // Glass is a lighter line, as the plan would hatch it.
  const glass = useMemo(() => {
    const m = solid.clone()
    m.userData.max = GLASS_MAX
    return m
  }, [solid])
  const group = useRef<import('three').Group>(null)

  useFrame((_, dt) => {
    const step = (dt * 1000) / FADE_MS
    for (const m of [solid, glass]) {
      const max = m.userData.max as number
      const to = show ? max : 0
      m.opacity = m.opacity < to ? Math.min(to, m.opacity + step * max) : Math.max(to, m.opacity - step * max)
    }
    if (group.current) group.current.visible = solid.opacity > 0
  })

  return (
    <group ref={group} visible={false}>
      {runs.map((r) => (
        <mesh
          key={r.id}
          geometry={r.geo}
          material={r.kind === 'glass' ? glass : solid}
          position={[r.x, CASE_HEIGHT + 0.5, r.z]}
          rotation={[0, r.angle, 0]}
          renderOrder={10}
          raycast={() => null}
        />
      ))}
    </group>
  )
}
