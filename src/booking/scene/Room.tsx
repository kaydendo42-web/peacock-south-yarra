import { useMemo } from 'react'
import { Color } from 'three'
import { fixtures, room, type Fixture } from '../data'
import { boxGeo, inlayGeo, parapetGeo, toScene, wallGeo } from './geometry'
import {
  COURTYARD_DOOR_H,
  COURTYARD_DOOR_W,
  COURTYARD_DOOR_X,
  COURTYARD_Y,
  FRONT_DOOR_H,
  FRONT_DOOR_W,
  FRONT_DOOR_X,
  PARAPET_BASE,
  PARAPET_MERLON,
  PLATFORM_THICK,
  STREET_GAP_W,
  STREET_GAP_X,
  TERRACE_H,
  TREAD_DEPTH,
  TREAD_H,
  VERANDAH_Y,
  facesCamera,
  halfX,
  halfZ,
  platformD,
  platformW,
} from './layout'
import { hex, ornamentOf, stone } from './palette'
import { noRaycast } from './shading'
import Ornament from './Ornament'
import Solid from './Solid'

const T = room.wallThickness
const H = room.wallHeight

/**
 * The room: three equal slices across its depth.
 *
 * Only the middle one is a building. The verandah at the street and the
 * courtyard at the back are open to the sky, so they get the crenellated
 * parapet §5 asks for rather than a wall, and the four full-height walls stop
 * at the partitions either side of the middle third. That is what gives the
 * case its silhouette: a solid block with an open porch at one end and an open
 * yard at the other, rather than one long box.
 *
 * Compass directions here are the ones the isometric view reads, not the ones
 * a surveyor would use: with the camera at equal XYZ, screen-right is world
 * (+x, -z), so the left corner of the diamond is west and the lower-right face
 * of the block is its south-east wall. The coffee station sits in the western
 * corner of the middle third; the bathrooms are a slice of the middle of that
 * south-east wall.
 */

/** Venue y of the two partitions, as scene z. */
const verandahZ = halfZ - VERANDAH_Y
const courtyardZ = halfZ - COURTYARD_Y

/** The enclosed third, centred. */
const insideDepth = COURTYARD_Y - VERANDAH_Y
const insideZ = (verandahZ + courtyardZ) / 2

const verandahDepth = VERANDAH_Y
const courtyardDepth = room.depth - COURTYARD_Y

/** A partition runs the full width plus the two side walls it meets. */
const endLen = room.width + T * 2

/** Wall-local x for a venue x: the slab starts at venue -T. */
const alongWall = (venueX: number) => venueX + T

export default function Room({ quarter }: { quarter: number }) {
  const platform = useMemo(() => boxGeo(platformW, PLATFORM_THICK, platformD), [])
  const terrace = useMemo(() => boxGeo(room.width, TERRACE_H, courtyardDepth), [])
  // The step up is only at the way through; the rest of the courtyard edge is
  // behind a wall, where nobody can walk into it.
  const tread = useMemo(() => boxGeo(COURTYARD_DOOR_W + 0.4, TREAD_H, TREAD_DEPTH), [])
  const inlay = useMemo(() => inlayGeo(0.18), [])

  // --- the enclosed third -------------------------------------------------

  const sideWall = useMemo(
    () =>
      wallGeo(
        insideDepth,
        H,
        T,
        [
          { kind: 'slit', x: insideDepth * 0.28, y: 1.35, width: 0.16 },
          { kind: 'slit', x: insideDepth * 0.5, y: 1.35, width: 0.16 },
          { kind: 'slit', x: insideDepth * 0.72, y: 1.35, width: 0.16 },
        ],
        1,
      ),
    [],
  )
  // The west wall carries the coffee gantry, so it is left blank.
  const coffeeWall = useMemo(() => wallGeo(insideDepth, H, T, [], 1), [])

  const doorWall = useMemo(
    () =>
      wallGeo(endLen, H, T, [
        { kind: 'arch', x: alongWall(FRONT_DOOR_X), width: FRONT_DOOR_W, height: FRONT_DOOR_H },
        { kind: 'slit', x: alongWall(1.8), y: 1.5, width: 0.16 },
        { kind: 'slit', x: alongWall(4.2), y: 1.5, width: 0.16 },
      ]),
    [],
  )

  const backWall = useMemo(
    () =>
      wallGeo(endLen, H, T, [
        {
          kind: 'arch',
          x: alongWall(COURTYARD_DOOR_X),
          width: COURTYARD_DOOR_W,
          height: COURTYARD_DOOR_H,
        },
        { kind: 'slit', x: alongWall(1.6), y: 1.5, width: 0.16 },
        { kind: 'slit', x: alongWall(9.4), y: 1.5, width: 0.16 },
      ]),
    [],
  )

  // --- the two open thirds -------------------------------------------------

  const verandahRail = useMemo(
    () => parapetGeo(verandahDepth, PARAPET_BASE, PARAPET_MERLON, T, 0.62, 0.34, 1),
    [],
  )
  const courtyardRail = useMemo(
    () => parapetGeo(courtyardDepth, PARAPET_BASE, PARAPET_MERLON, T, 0.62, 0.34, 1),
    [],
  )
  const backParapet = useMemo(() => parapetGeo(endLen, PARAPET_BASE, PARAPET_MERLON, T), [])

  /** The street edge, in two runs with the entry between them. */
  const streetRuns = useMemo(() => {
    const gapFrom = STREET_GAP_X - STREET_GAP_W / 2
    const gapTo = STREET_GAP_X + STREET_GAP_W / 2
    return [
      [-T, gapFrom],
      [gapTo, room.width + T],
    ].map(([from, to]) => ({
      len: to - from,
      x: (from + to) / 2 - halfX,
    }))
  }, [])

  const streetParapets = useMemo(
    () => streetRuns.map((r) => parapetGeo(r.len, PARAPET_BASE, PARAPET_MERLON, T)),
    [streetRuns],
  )

  // --- fittings -------------------------------------------------------------

  const floorOrnament = useMemo(() => ornamentOf(stone.top), [])
  const marker = useMemo(() => new Color(hex.marker), [])

  const counters = fixtures.filter((f) => f.kind === 'counter')
  const bathrooms = fixtures.filter((f) => f.kind === 'bathroom')

  /** The back-bar relief, behind the long leg of the coffee station. */
  const machine = counters.find((f) => f.rail === 'y') ?? counters[0]
  const gantry = useMemo(() => {
    if (!machine) return null
    const len = machine.d + 0.5
    return wallGeo(
      len,
      2.1,
      0.14,
      [
        { kind: 'slit', x: len * 0.3, y: 0.9, width: 0.13 },
        { kind: 'slit', x: len * 0.5, y: 0.9, width: 0.13 },
        { kind: 'slit', x: len * 0.7, y: 0.9, width: 0.13 },
      ],
      1,
    )
  }, [machine])

  // Zone thresholds, marked with small square inlays set flush into the floor
  // (§5). They sit in the doorways now that the thresholds are walls.
  const thresholds = useMemo(() => {
    const doors = [
      { x: FRONT_DOOR_X, y: VERANDAH_Y + 0.45 },
      { x: COURTYARD_DOOR_X, y: COURTYARD_Y - 0.45 },
    ]
    return doors.flatMap(({ x, y }) => {
      const [, sz] = toScene(0, y)
      return [-0.6, -0.2, 0.2, 0.6].map((offset) => {
        const [sx] = toScene(x + offset, 0)
        return [sx, sz] as [number, number]
      })
    })
  }, [])

  const showWest = !facesCamera([-1, 0], quarter)
  const showSouthEast = !facesCamera([1, 0], quarter)
  const showFront = !facesCamera([0, 1], quarter)
  const showBack = !facesCamera([0, -1], quarter)

  return (
    <group>
      {/* Floor slab, with the recessed rim border every reference platform has (§7) */}
      <Solid
        geometry={platform}
        toneKey="stone"
        tone={stone}
        position={[0, -PLATFORM_THICK / 2, 0]}
      />
      <Ornament width={platformW} depth={platformD} y={0.008} base={floorOrnament} inset={0.16} />

      {/* The courtyard is a raised terrace, reached by a tread at the way
          through, each cut as its own box so the ribs read in profile (§5) */}
      <Solid
        geometry={terrace}
        toneKey="stone"
        tone={stone}
        position={[0, TERRACE_H / 2, courtyardZ - courtyardDepth / 2]}
      />
      <Solid
        geometry={tread}
        toneKey="stone"
        tone={stone}
        position={[
          toScene(COURTYARD_DOOR_X, 0)[0],
          TREAD_H / 2,
          courtyardZ + TREAD_DEPTH / 2,
        ]}
      />

      {thresholds.map(([x, z], i) => (
        <mesh key={i} geometry={inlay} position={[x, 0.012, z]} raycast={noRaycast}>
          <meshBasicMaterial color={marker} />
        </mesh>
      ))}

      {/* --- the enclosed middle third ------------------------------------ */}
      <Solid
        geometry={coffeeWall}
        toneKey="stone"
        tone={stone}
        position={[-halfX - T / 2, 0, insideZ]}
        visible={showWest}
      />
      <Solid
        geometry={sideWall}
        toneKey="stone"
        tone={stone}
        position={[halfX + T / 2, 0, insideZ]}
        visible={showSouthEast}
      />
      <Solid
        geometry={doorWall}
        toneKey="stone"
        tone={stone}
        position={[0, 0, verandahZ + T / 2]}
        visible={showFront}
      />
      <Solid
        geometry={backWall}
        toneKey="stone"
        tone={stone}
        position={[0, 0, courtyardZ - T / 2]}
        visible={showBack}
      />

      {/* --- the verandah: open to the street, parapet instead of wall ----- */}
      <Solid
        geometry={verandahRail}
        toneKey="stone"
        tone={stone}
        position={[-halfX - T / 2, 0, halfZ - verandahDepth / 2]}
      />
      <Solid
        geometry={verandahRail}
        toneKey="stone"
        tone={stone}
        position={[halfX + T / 2, 0, halfZ - verandahDepth / 2]}
      />
      {streetParapets.map((geometry, i) => (
        <Solid
          key={i}
          geometry={geometry}
          toneKey="stone"
          tone={stone}
          position={[streetRuns[i].x, 0, halfZ + T / 2]}
        />
      ))}

      {/* --- the courtyard: open to the sky, on its terrace ---------------- */}
      <Solid
        geometry={courtyardRail}
        toneKey="stone"
        tone={stone}
        position={[-halfX - T / 2, TERRACE_H, courtyardZ - courtyardDepth / 2]}
      />
      <Solid
        geometry={courtyardRail}
        toneKey="stone"
        tone={stone}
        position={[halfX + T / 2, TERRACE_H, courtyardZ - courtyardDepth / 2]}
      />
      <Solid
        geometry={backParapet}
        toneKey="stone"
        tone={stone}
        position={[0, TERRACE_H, -halfZ - T / 2]}
      />

      {/* --- the coffee station, in the western corner --------------------- */}
      {counters.map((f) => (
        <Counter key={f.id} fixture={f} marker={marker} />
      ))}
      {gantry && machine ? (
        <Solid
          geometry={gantry}
          toneKey="stone"
          tone={stone}
          position={[-halfX + 0.07, 0, toScene(0, machine.y)[1]]}
          visible={showWest}
        />
      ) : null}

      {/* --- the bathrooms, against the middle of the south-east wall ------ */}
      {bathrooms.map((f) => (
        <Bathroom key={f.id} fixture={f} marker={marker} />
      ))}
    </group>
  )
}

/** A counter, with the rail along its open lip. */
function Counter({ fixture, marker }: { fixture: Fixture; marker: Color }) {
  const { w, d, h } = fixture
  const body = useMemo(() => boxGeo(w, h, d), [w, h, d])
  // A rail along y lies on the +x face; a rail along x lies on the +y face,
  // which is -z in scene coordinates.
  const alongY = fixture.rail === 'y'
  const rail = useMemo(
    () => (alongY ? boxGeo(0.1, 0.035, d - 0.24) : boxGeo(w - 0.24, 0.035, 0.1)),
    [alongY, w, d],
  )
  const [sx, sz] = toScene(fixture.x, fixture.y)

  return (
    <group>
      <Solid geometry={body} toneKey="stone" tone={stone} position={[sx, h / 2, sz]} />
      {fixture.rail ? (
        <mesh
          geometry={rail}
          position={[
            alongY ? sx + w / 2 - 0.07 : sx,
            h + 0.017,
            alongY ? sz : sz - d / 2 + 0.07,
          ]}
          raycast={noRaycast}
        >
          <meshBasicMaterial color={marker} />
        </mesh>
      ) : null}
    </group>
  )
}

/**
 * The bathrooms: a block against the south-east wall, with its two doors marked
 * the way every other functional inlay in the room is. Not a wall, so it is
 * never culled — it is a volume standing inside the room, and the view looks
 * past the wall behind it.
 *
 * The doors go on the end facing the entrance rather than the long side facing
 * the middle of the room. Both are somewhere a door could reasonably be; only
 * one of them is a face the camera can see without turning the room, and a
 * blank slab is not worth the accuracy.
 */
function Bathroom({ fixture, marker }: { fixture: Fixture; marker: Color }) {
  const { w, d, h } = fixture
  const doorH = h - 0.35
  const body = useMemo(() => boxGeo(w, h, d), [w, h, d])
  const door = useMemo(() => boxGeo(0.5, doorH, 0.05), [doorH])
  const [sx, sz] = toScene(fixture.x, fixture.y)

  return (
    <group>
      <Solid geometry={body} toneKey="stone" tone={stone} position={[sx, h / 2, sz]} />
      {[-0.3, 0.3].map((offset) => (
        <mesh
          key={offset}
          geometry={door}
          position={[sx + offset, doorH / 2, sz + d / 2 + 0.025]}
          raycast={noRaycast}
        >
          <meshBasicMaterial color={marker} />
        </mesh>
      ))}
    </group>
  )
}
