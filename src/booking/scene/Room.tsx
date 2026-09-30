import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { Color } from 'three'
import {
  HOUSE_FLOOR,
  fixtures,
  floors,
  room,
  stairs,
  walls,
  zones,
  type Fixture,
  type Wall,
} from '../data'
import { boxGeo, inlayGeo, parapetGeo, slabGeo, toScene, wallGeo, type Hole } from './geometry'
import {
  PARAPET_BASE,
  PARAPET_MERLON,
  PLATFORM_THICK,
  facesCamera,
  floorHeightAt,
  platformD,
  platformW,
} from './layout'
import { hex, ornamentOf, stone, timber } from './palette'
import { noRaycast } from './shading'
import Decor from './Decor'
import Ornament from './Ornament'
import Solid from './Solid'

const T = room.wallThickness
const H = room.wallHeight

/**
 * The Peacock, as Jenny drew it: a weatherboard house on stumps with the Court
 * Yard at grade beside it and the Deck level with the house. Every wall, floor
 * and fitting is data in `src/booking/data/venue.ts`; this file only builds
 * them.
 *
 * The house walls are full height and drop out when they face the camera, so
 * each of the four quarter-turns looks into the rooms rather than at the back of
 * a slab. The Court Yard and the Deck are open to the sky and get the low
 * crenellated parapet, which never needs hiding.
 */

type Run = {
  wall: Wall
  len: number
  /** Scene midpoint. */
  x: number
  z: number
  /** Quarter-turns about Y that lay the slab along the run. */
  turns: number
  /** Outward normal in scene x/z. */
  normal: [number, number]
  base: number
}

function toRun(wall: Wall): Run {
  const [ax, az] = toScene(...wall.from)
  const [bx, bz] = toScene(...wall.to)
  const dx = bx - ax
  const dz = bz - az
  const len = Math.hypot(dx, dz)
  // rotateY(θ) takes +x to (cos θ, −sin θ); solve for the run's direction.
  const theta = Math.atan2(-dz, dx)
  const [ix, iz] = toScene(...wall.inside)
  const mx = (ax + bx) / 2
  const mz = (az + bz) / 2
  let n: [number, number] = [dz / len, -dx / len]
  if (n[0] * (ix - mx) + n[1] * (iz - mz) > 0) n = [-n[0], -n[1]]
  const [vx, vy] = [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2]
  return {
    wall,
    len,
    x: mx,
    z: mz,
    turns: theta / (Math.PI / 2),
    normal: n,
    // A parapet stands on whatever floor it edges; a house wall goes to the ground.
    base: wall.kind === 'parapet' ? floorHeightAt(vx, vy) : 0,
  }
}

export default function Room({ quarter }: { quarter: number }) {
  const platform = useMemo(() => boxGeo(platformW, PLATFORM_THICK, platformD), [])
  const runs = useMemo(() => walls.map(toRun), [])
  const floorOrnament = useMemo(() => ornamentOf(stone.top), [])
  const marker = useMemo(() => new Color(hex.marker), [])

  const slabs = useMemo(() => floors.map((f) => ({ id: f.id, geo: slabGeo(f.id, f.outline, f.height) })), [])

  /** The street stairs, each tread a box stepping down toward River St. */
  const treads = useMemo(() => {
    const run = stairs.x1 - stairs.x0
    const step = run / stairs.treads
    const rise = HOUSE_FLOOR / stairs.treads
    const depth = stairs.y1 - stairs.y0
    return Array.from({ length: stairs.treads - 1 }, (_, i) => {
      const from = stairs.x0 + step * i
      const w = stairs.x1 - from
      const h = HOUSE_FLOOR - rise * (i + 1)
      const [sx, sz] = toScene(from + w / 2, stairs.y0 + depth / 2)
      return { geo: boxGeo(+w.toFixed(3), +h.toFixed(3), +depth.toFixed(3)), x: sx, z: sz, h }
    })
  }, [])

  return (
    <group>
      {/* The site, cut from one slab with the recessed rim every reference platform has (§7) */}
      <Solid geometry={platform} toneKey="stone" tone={stone} position={[0, -PLATFORM_THICK / 2, 0]} />
      <Ornament width={platformW} depth={platformD} y={0.008} base={floorOrnament} inset={0.16} />

      {slabs.map((s) => (
        <Solid key={s.id} geometry={s.geo} toneKey="stone" tone={stone} />
      ))}
      {treads.map((t, i) => (
        <Solid key={i} geometry={t.geo} toneKey="stone" tone={stone} position={[t.x, t.h / 2, t.z]} />
      ))}

      {runs.map((r) => (
        <WallRun key={r.wall.id} run={r} quarter={quarter} />
      ))}

      {fixtures.map((f) => (
        <FixtureBlock key={f.id} fixture={f} marker={marker} />
      ))}

      <Decor quarter={quarter} />

      {/* The section names, where Jenny wrote them on her plan. A caption, not a
          target: the wrapper must never take a click meant for a table. */}
      {zones.map((z) => {
        const [sx, sz] = toScene(...z.labelAt)
        return (
          <Html
            key={z.id}
            position={[sx, z.floor + 0.05, sz]}
            center
            zIndexRange={[4, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <span className="zone-tag">{z.name}</span>
          </Html>
        )
      })}
    </group>
  )
}

function WallRun({ run, quarter }: { run: Run; quarter: number }) {
  const { wall, len } = run
  const geo = useMemo(() => {
    if (wall.kind === 'parapet') {
      return parapetGeo(+len.toFixed(3), PARAPET_BASE, PARAPET_MERLON, T, 0.62, 0.34, run.turns)
    }
    const holes: Hole[] = [
      ...(wall.arches ?? []).map((a) => ({ kind: 'arch' as const, x: a.at, width: a.width, height: a.height + HOUSE_FLOOR })),
      ...(wall.slits ?? []).map((x) => ({ kind: 'slit' as const, x, y: 1.5 + HOUSE_FLOOR, width: 0.16 })),
    ]
    return wallGeo(+len.toFixed(3), H + HOUSE_FLOOR, T, holes, run.turns)
  }, [wall, len, run.turns])

  const visible = wall.kind === 'parapet' || !facesCamera(run.normal, quarter)
  return <Solid geometry={geo} toneKey="stone" tone={stone} position={[run.x, run.base, run.z]} visible={visible} />
}

/**
 * A fitting. Rooms and the toilet block are solid volumes with a marker strip
 * where their doors are; counters and benches are timber-topped boxes.
 */
function FixtureBlock({ fixture, marker }: { fixture: Fixture; marker: Color }) {
  const { w, d, h, kind } = fixture
  const floor = floorHeightAt(fixture.x, fixture.y)
  const [sx, sz] = toScene(fixture.x, fixture.y)
  const body = useMemo(() => boxGeo(w, h, d), [w, h, d])
  const top = useMemo(() => boxGeo(w + 0.04, 0.05, d + 0.04), [w, d])
  const door = useMemo(() => boxGeo(0.55, Math.min(2.05, h - 0.3), 0.05), [h])
  const inlay = useMemo(() => inlayGeo(0.16), [])

  const timbered = kind === 'counter' || kind === 'bench' || kind === 'planter'

  return (
    <group position={[sx, floor, sz]}>
      <Solid geometry={body} toneKey="stone" tone={stone} position={[0, h / 2, 0]} />
      {timbered ? (
        <Solid geometry={top} toneKey="timber" tone={timber} position={[0, h + 0.025, 0]} />
      ) : null}
      {kind === 'bathroom'
        ? [-0.45, 0.45].map((offset) => (
            // The toilet doors face Main, which is the camera side of the block.
            <mesh
              key={offset}
              geometry={door}
              position={[offset, Math.min(2.05, h - 0.3) / 2, d / 2 + 0.025]}
              raycast={noRaycast}
            >
              <meshBasicMaterial color={marker} />
            </mesh>
          ))
        : null}
      {kind === 'room'
        ? // A row of flush inlays across the roof: back of house, not a place to sit.
          [-0.3, 0, 0.3].map((offset) => (
            <mesh key={offset} geometry={inlay} position={[offset * Math.min(w, 2), h + 0.006, 0]} raycast={noRaycast}>
              <meshBasicMaterial color={marker} />
            </mesh>
          ))
        : null}
    </group>
  )
}
