import { useMemo } from 'react'
import { Color } from 'three'
import { fixtures, greenWalls, hedges, paintings, plants, type GreenWall, type Painting, type Plant } from '../data'
import { boxGeo, coneGeo, gemGeo, potGeo, prismGeo, toScene } from './geometry'
import { facesCamera, floorHeightAt } from './layout'
import { art, clay, leaf, timber } from './palette'
import { noRaycast } from './shading'
import Solid from './Solid'

/**
 * What makes the room Jenny's rather than a diagram of it: the trees and pots
 * she drew in the Court Yard, the hedges along the fence, the planters on the
 * Deck rail and a few paintings on the walls.
 *
 * Same grammar as everything else in the scene — faceted, flat-shaded, three
 * values a solid. A tree is two stacked cones, a bush is a cut gem, a pot is an
 * eight-sided taper. Nothing here is clickable and nothing casts a shadow: decor
 * should never compete with a table for attention.
 */
export default function Decor({ quarter }: { quarter: number }) {
  const planters = fixtures.filter((f) => f.kind === 'planter')
  return (
    <group>
      {plants.map((p, i) => (
        <PlantMesh key={i} plant={p} />
      ))}
      {hedges.map((h, i) => (
        <HedgeMesh key={i} x={h.x} y={h.y} w={h.w} d={h.d} />
      ))}
      {greenWalls.map((g, i) => (
        <GreenWallMesh key={i} wall={g} quarter={quarter} />
      ))}
      {planters.map((f) => {
        // A row of little bushes along the top of each planter box.
        const count = Math.max(2, Math.round(f.w / 0.45))
        return Array.from({ length: count }, (_, i) => {
          const x = f.x - f.w / 2 + (f.w / count) * (i + 0.5)
          return (
            <PlantMesh
              key={`${f.id}-${i}`}
              plant={{ x, y: f.y, size: 0.16, kind: 'pot' }}
              base={f.h + 0.05}
              potless
            />
          )
        })
      })}
      {paintings.map((p, i) => (
        <PaintingMesh key={i} painting={p} quarter={quarter} />
      ))}
    </group>
  )
}

function PlantMesh({ plant, base = 0, potless = false }: { plant: Plant; base?: number; potless?: boolean }) {
  const { size, kind } = plant
  const floor = floorHeightAt(plant.x, plant.y) + base
  const [sx, sz] = toScene(plant.x, plant.y)

  const potH = +(size * 0.55).toFixed(3)
  const pot = useMemo(() => potGeo(+(size * 0.42).toFixed(3), +(size * 0.3).toFixed(3), potH), [size, potH])
  const trunkH = +(size * 0.8).toFixed(3)
  const trunk = useMemo(() => boxGeo(0.08, trunkH, 0.08), [trunkH])
  const lower = useMemo(() => coneGeo(+size.toFixed(3), +(size * 1.05).toFixed(3), 6), [size])
  const upper = useMemo(() => coneGeo(+(size * 0.68).toFixed(3), +(size * 0.85).toFixed(3), 6), [size])
  const gem = useMemo(() => gemGeo(+(size * (kind === 'pot' ? 0.75 : 0.85)).toFixed(3), 0.8), [size, kind])

  const blade = useMemo(() => coneGeo(+(size * 0.22).toFixed(3), +(size * 1.4).toFixed(3), 4), [size])
  const line = useMemo(() => boxGeo(0.02, 0.3, 0.02), [])
  const post = useMemo(() => boxGeo(0.1, 2.75, 0.1), [])
  const arm = useMemo(() => boxGeo(0.42, 0.07, 0.07), [])
  const trail = useMemo(() => gemGeo(+(size * 0.6).toFixed(3), 1.6), [size])

  if (kind === 'tuft') {
    // Three blades, no pot: grass along a fence line.
    return (
      <group position={[sx, floor, sz]}>
        {[
          [0, 0],
          [size * 0.3, size * 0.15],
          [-size * 0.25, size * 0.2],
        ].map(([dx, dz], i) => (
          <Solid key={i} geometry={blade} toneKey="leaf" tone={leaf} position={[dx, size * 0.7 * (1 - i * 0.12), dz]} />
        ))}
      </group>
    )
  }

  if (kind === 'hanging') {
    // A veranda post with an arm, and a basket on a short line from the arm,
    // foliage trailing below it. The post is what stops it reading as a
    // basket floating in the air.
    const basketY = 2.25
    return (
      <group position={[sx, floor, sz]}>
        <Solid geometry={post} toneKey="timber" tone={timber} position={[-0.21, 2.75 / 2, 0]} />
        <Solid geometry={arm} toneKey="timber" tone={timber} position={[0, 2.62, 0]} />
        <mesh geometry={line} position={[0.12, basketY + potH + 0.12, 0]} raycast={noRaycast}>
          <meshBasicMaterial color={lineColour} />
        </mesh>
        <Solid geometry={pot} toneKey="clay" tone={clay} position={[0.12, basketY + potH / 2, 0]} />
        <Solid geometry={trail} toneKey="leaf" tone={leaf} position={[0.12, basketY - size * 0.25, 0]} />
      </group>
    )
  }

  const potTop = potless ? 0 : potH
  return (
    <group position={[sx, floor, sz]}>
      {potless ? null : <Solid geometry={pot} toneKey="clay" tone={clay} position={[0, potH / 2, 0]} />}
      {kind === 'tree' ? (
        <>
          <Solid geometry={trunk} toneKey="timber" tone={timber} position={[0, potTop + trunkH / 2, 0]} />
          <Solid
            geometry={lower}
            toneKey="leaf"
            tone={leaf}
            position={[0, potTop + trunkH * 0.7 + size * 0.525, 0]}
          />
          <Solid
            geometry={upper}
            toneKey="leaf"
            tone={leaf}
            position={[0, potTop + trunkH * 0.7 + size * 1.2, 0]}
          />
        </>
      ) : (
        <Solid geometry={gem} toneKey="leaf" tone={leaf} position={[0, potTop + size * 0.45, 0]} />
      )}
    </group>
  )
}

const lineColour = new Color('#3D7D65')

/**
 * A planted wall: a tall green panel with cut-gem foliage bulging from its
 * face. Stands on the far fences; when the room turns and it would stand
 * between the camera and the tables, it drops out like the house walls do.
 */
function GreenWallMesh({ wall, quarter }: { wall: GreenWall; quarter: number }) {
  const floor = floorHeightAt(wall.x, wall.y)
  const [sx, sz] = toScene(wall.x, wall.y)
  const panel = useMemo(() => boxGeo(wall.w, wall.h, wall.d), [wall.w, wall.d, wall.h])
  const bump = useMemo(() => gemGeo(0.22, 1), [])
  // Facing is in venue axes; scene z runs opposite to venue y.
  const facing: [number, number] = [wall.facing[0], -wall.facing[1]]
  const visible = !facesCamera([-facing[0], -facing[1]], quarter)
  const long = wall.w > wall.d ? 'x' : 'z'
  const span = Math.max(wall.w, wall.d)
  const count = Math.max(2, Math.round(span / 0.55))
  return (
    <group position={[sx, floor, sz]} visible={visible}>
      <Solid geometry={panel} toneKey="leaf" tone={leaf} position={[0, wall.h / 2, 0]} />
      {Array.from({ length: count }, (_, i) => {
        const t = -span / 2 + (span / count) * (i + 0.5)
        const y = 0.35 + ((i * 7) % 5) * 0.22
        const out = (long === 'x' ? wall.d : wall.w) / 2 + 0.06
        return (
          <Solid
            key={i}
            geometry={bump}
            toneKey="leaf"
            tone={leaf}
            position={long === 'x' ? [t, y, facing[1] * out] : [facing[0] * out, y, t]}
          />
        )
      })}
    </group>
  )
}

function HedgeMesh({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  const h = 0.55
  const body = useMemo(() => boxGeo(w, h, d), [w, d])
  const floor = floorHeightAt(x, y)
  const [sx, sz] = toScene(x, y)
  return <Solid geometry={body} toneKey="leaf" tone={leaf} position={[sx, floor + h / 2, sz]} />
}

/**
 * A framed canvas on a wall face. Canvases are flat colour — a picture has no
 * sides worth shading — and each one borrows the arch and circle motifs the
 * rest of the room is built from.
 */
function PaintingMesh({ painting, quarter }: { painting: Painting; quarter: number }) {
  const { w, h, palette } = painting
  const colours = useMemo(() => art[palette].map((c) => new Color(c)), [palette])
  const frameColour = useMemo(() => new Color(art.frame), [])

  const frame = useMemo(() => boxGeo(+(w + 0.08).toFixed(3), +(h + 0.08).toFixed(3), 0.04), [w, h])
  const canvas = useMemo(() => boxGeo(w, h, 0.012), [w, h])
  const disc = useMemo(() => prismGeo(+(Math.min(w, h) * 0.28).toFixed(3), 0.01, 12), [w, h])
  const ring = useMemo(() => prismGeo(+(Math.min(w, h) * 0.17).toFixed(3), 0.01, 12), [w, h])
  const stripe = useMemo(() => boxGeo(+(w * 0.16).toFixed(3), +(h * 0.8).toFixed(3), 0.01), [w, h])
  const archBody = useMemo(() => boxGeo(+(w * 0.34).toFixed(3), +(h * 0.42).toFixed(3), 0.01), [w, h])

  const facing = painting.facing === 'south' ? 1 : -1
  // A canvas is seen when it faces the camera; turned away, it is a frame's back.
  const visible = facesCamera([0, facing], quarter)
  const [sx, sz] = toScene(painting.x, painting.y)
  const y = painting.floor + 1.55
  const front = (n: number) => facing * (0.02 + 0.007 * n)
  const flat = [Math.PI / 2, 0, 0] as [number, number, number]

  return (
    <group position={[sx, y, sz]} visible={visible}>
      <mesh geometry={frame} raycast={noRaycast}>
        <meshBasicMaterial color={frameColour} />
      </mesh>
      <mesh geometry={canvas} position={[0, 0, front(1)]} raycast={noRaycast}>
        <meshBasicMaterial color={colours[0]} />
      </mesh>
      {palette === 'peacock' ? (
        // A peacock's eye: dark ring, pink centre, a gold fleck.
        <>
          <mesh geometry={disc} rotation={flat} position={[0, h * 0.05, front(2)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[1]} />
          </mesh>
          <mesh geometry={ring} rotation={flat} position={[0, h * 0.05, front(3)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[2]} />
          </mesh>
          <mesh geometry={stripe} scale={[0.35, 0.18, 1]} position={[0, h * 0.05, front(4)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[3]} />
          </mesh>
        </>
      ) : palette === 'pink' ? (
        // An arch standing in a doorway, the room's own motif.
        <>
          <mesh geometry={archBody} position={[0, -h * 0.12, front(2)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[2]} />
          </mesh>
          <mesh geometry={disc} rotation={flat} scale={[0.6, 1, 0.6]} position={[0, h * 0.09, front(2)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[2]} />
          </mesh>
        </>
      ) : (
        // Three stripes, like the awning.
        [-1, 0, 1].map((n) => (
          <mesh key={n} geometry={stripe} position={[n * w * 0.26, 0, front(2)]} raycast={noRaycast}>
            <meshBasicMaterial color={colours[n === 0 ? 2 : 1]} />
          </mesh>
        ))
      )}
    </group>
  )
}
