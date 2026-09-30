import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { Color } from 'three'
import {
  HOUSE_FLOOR,
  ZONE_ELEVATIONS,
  fixtures,
  floors,
  room,
  stairs,
  steps,
  walls,
  zones,
  type Fixture,
  type Step,
  type Wall,
} from '../data'
import { boxGeo, inlayGeo, orientedBoxGeo, parapetGeo, slabGeo, toScene, wallGeo, type Hole } from './geometry'
import {
  PARAPET_BASE,
  PARAPET_MERLON,
  PLATFORM_THICK,
  facesCamera,
  floorHeightAt,
  platformD,
  platformW,
} from './layout'
import { hex, ornamentOf, plinth, stone, timber } from './palette'
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
  // A parapet stands on the floor it edges: sample that floor a little way in
  // from the run, toward the side it encloses, not on the seam itself.
  const [mvx, mvy] = [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2]
  const toward = Math.hypot(wall.inside[0] - mvx, wall.inside[1] - mvy) || 1
  const [vx, vy] = [mvx + ((wall.inside[0] - mvx) / toward) * 0.3, mvy + ((wall.inside[1] - mvy) / toward) * 0.3]
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

  const slabs = useMemo(
    () => floors.map((f) => ({ id: f.id, tone: f.tone, geo: slabGeo(f.id, f.outline, f.height) })),
    [],
  )

  /** The street stairs, each tread a box stepping down toward River St. */
  const treads = useMemo(() => {
    const run = stairs.x1 - stairs.x0
    const step = run / stairs.treads
    const top = ZONE_ELEVATIONS.deck
    const rise = top / stairs.treads
    const depth = stairs.y1 - stairs.y0
    return Array.from({ length: stairs.treads - 1 }, (_, i) => {
      const from = stairs.x0 + step * i
      const w = stairs.x1 - from
      const h = top - rise * (i + 1)
      const [sx, sz] = toScene(from + w / 2, stairs.y0 + depth / 2)
      return { geo: boxGeo(+w.toFixed(3), +h.toFixed(3), +depth.toFixed(3)), x: sx, z: sz, h }
    })
  }, [])

  return (
    <group>
      {/* The site, cut from one slab with the recessed rim every reference platform has (§7) */}
      <Solid geometry={platform} toneKey="stone" tone={stone} position={[0, -PLATFORM_THICK / 2, 0]} />
      <Ornament width={platformW} depth={platformD} y={0.008} base={floorOrnament} inset={0.16} />

      {/* Each level is its own slab, so its riser faces show where the floor
          changes height: Deck, one step up to the house, one down to the yard. */}
      {slabs.map((s) =>
        s.tone === 'timber' ? (
          <Solid key={s.id} geometry={s.geo} toneKey="timber" tone={timber} />
        ) : (
          <Solid key={s.id} geometry={s.geo} toneKey="plinth" tone={plinth} />
        ),
      )}
      {steps.map((s) => (
        <StepTread key={s.id} step={s} />
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

/** One tread, from the ground up to half a riser below the floor it leads to. */
function StepTread({ step }: { step: Step }) {
  const [sx, sz] = toScene(step.x, step.y)
  // Scene direction of the wall: venue y runs the other way to scene z.
  const theta = Math.atan2(step.along[1], step.along[0])
  const geo = useMemo(
    () => orientedBoxGeo(step.w, +step.top.toFixed(3), step.d, theta),
    [step.w, step.d, step.top, theta],
  )
  return <Solid geometry={geo} toneKey="plinth" tone={plinth} position={[sx, step.top / 2, sz]} />
}

/**
 * A glazed run: a sill to just above the house floor, broken at the doorways,
 * and slim posts up to the head. Reads as a window wall without hiding the
 * room behind it or the steps outside it.
 */
function GlassRun({ run }: { run: Run }) {
  const { wall, len } = run
  const sillH = HOUSE_FLOOR + 0.35
  const postH = H * 0.8 + HOUSE_FLOOR
  const pieces = useMemo(() => {
    const doors = (wall.arches ?? []).map((a) => [a.at - a.width / 2, a.at + a.width / 2] as const)
    const cuts = [0, ...doors.flat(), len]
    const sills: { from: number; to: number }[] = []
    for (let i = 0; i < cuts.length; i += 2) if (cuts[i + 1] - cuts[i] > 0.05) sills.push({ from: cuts[i], to: cuts[i + 1] })
    const posts: number[] = [0, len, ...doors.flat()]
    for (const s of sills) {
      const n = Math.max(1, Math.round((s.to - s.from) / 1.1))
      for (let k = 1; k < n; k++) posts.push(s.from + ((s.to - s.from) / n) * k)
    }
    return { sills, posts }
  }, [wall, len])

  // Unit direction of the run in scene space, from its quarter-turns.
  const theta = run.turns * (Math.PI / 2)
  const [ux, uz] = [Math.cos(theta), -Math.sin(theta)]
  const at = (t: number): [number, number] => [run.x + ux * (t - len / 2), run.z + uz * (t - len / 2)]

  return (
    <group>
      {pieces.sills.map((p, i) => {
        const [x, z] = at((p.from + p.to) / 2)
        const geo = orientedBoxGeo(+(p.to - p.from).toFixed(3), +sillH.toFixed(3), T, theta)
        return <Solid key={`s${i}`} geometry={geo} toneKey="stone" tone={stone} position={[x, sillH / 2, z]} />
      })}
      {pieces.posts.map((t, i) => {
        const [x, z] = at(t)
        const geo = orientedBoxGeo(0.12, +postH.toFixed(3), T, theta)
        return <Solid key={`p${i}`} geometry={geo} toneKey="stone" tone={stone} position={[x, postH / 2, z]} />
      })}
    </group>
  )
}

function WallRun({ run, quarter }: { run: Run; quarter: number }) {
  if (run.wall.kind === 'glass') return <GlassRun run={run} />
  return <SolidRun run={run} quarter={quarter} />
}

function SolidRun({ run, quarter }: { run: Run; quarter: number }) {
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
