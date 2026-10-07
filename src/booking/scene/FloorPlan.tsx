'use client'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { Fog, Group, Matrix4, OrthographicCamera as Ortho, Quaternion, Vector3 } from 'three'
import { areaOfZone, type AreaId, type AreaState, type Table, type TableState } from '../data'
import AreaHits from './AreaHits'
import Case from './Case'
import Room from './Room'
import Shadows from './Shadows'
import TableMesh from './TableMesh'
import { applyQuarterToAll } from './geometry'
import { PLAN_MS, ROTATE_MS, standardEase } from './ease'
import {
  CASE_HEIGHT,
  CASE_SECTION,
  CASE_THICK,
  FOG_FAR,
  FOG_NEAR,
  PLATFORM_THICK,
  ZOOM_MAX,
  ZOOM_MIN,
  caseD,
  caseW,
} from './layout'
import { hex } from './palette'

const SQRT2 = Math.SQRT2
const SQRT6 = Math.sqrt(6)

/**
 * True isometric projection worked out by hand: a camera at equal XYZ gives
 * 35.264° elevation at 45° azimuth, and these two formulas are where a world
 * point lands on screen under it. Used to frame the room, never to draw.
 */
function project(x: number, y: number, z: number) {
  return { sx: (x - z) / SQRT2, su: (2 * y - x - z) / SQRT6 }
}

/**
 * The case's projected bounding box. Fixed geometry, so it is measured once
 * rather than on every resize. Both footprint orientations are folded in, which
 * is what keeps the framing from jumping as the room turns.
 */
const caseSpan = (() => {
  const yLo = -(PLATFORM_THICK + CASE_THICK)
  const yHi = CASE_HEIGHT - PLATFORM_THICK + CASE_SECTION
  let minSx = Infinity
  let maxSx = -Infinity
  let minSu = Infinity
  let maxSu = -Infinity

  for (const [ex, ez] of [
    [caseW / 2, caseD / 2],
    [caseD / 2, caseW / 2],
  ]) {
    for (const x of [-ex, ex]) {
      for (const z of [-ez, ez]) {
        for (const y of [yLo, yHi]) {
          const { sx, su } = project(x, y, z)
          minSx = Math.min(minSx, sx)
          maxSx = Math.max(maxSx, sx)
          minSu = Math.min(minSu, su)
          maxSu = Math.max(maxSu, su)
        }
      }
    }
  }

  return { spanX: maxSx - minSx, spanU: maxSu - minSu, midSu: (maxSu + minSu) / 2 }
})()

/**
 * Width-to-height ratio of that box — about 1.25:1, wider than it is tall.
 *
 * The phone breakpoint sizes the scene to this ratio rather than to a flat
 * fraction of the viewport. fit() below frames by whichever axis is tighter, so
 * a box of any other shape spends the surplus on empty sky: a flat 52dvh box on
 * a portrait phone left the width binding and roughly a third of the box empty
 * above and below the case. Matching the ratio fills both axes to the same 92%
 * the computer build gets, without enlarging the room past its frame.
 */
export const SCENE_ASPECT = caseSpan.spanX / caseSpan.spanU

/**
 * Zoom that frames the whole case with generous margins, and the target height
 * that centres it.
 */
function fit(width: number, height: number) {
  // Reference 2 is the composition brief: the object takes a small fraction of
  // the frame and the empty space does the work.
  const base = Math.min(width / caseSpan.spanX, height / caseSpan.spanU) * 0.92
  return { base, targetY: (caseSpan.midSu * SQRT6) / 2 }
}

/**
 * Measures the element R3F sizes its canvas to. R3F's own `size` can be a stale
 * first measurement — the framing then sticks at whatever the layout happened to
 * be mid-mount, which is how the deployed build ended up smaller than dev. An
 * observer on the real element always self-corrects.
 */
function useContainerSize() {
  const el = useThree((s) => s.gl.domElement)
  const [size, setSize] = useState(() => ({
    width: el.clientWidth || 1,
    height: el.clientHeight || 1,
  }))

  useLayoutEffect(() => {
    const target = el.parentElement ?? el
    const measure = () => {
      const { width, height } = target.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setSize((s) => (s.width === width && s.height === height ? s : { width, height }))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(target)
    return () => observer.disconnect()
  }, [el])

  return size
}

/**
 * The two ways the camera looks at the room. Iso is the camera at equal XYZ.
 * Plan looks straight down with the room's long side running up the screen,
 * which is the shape of a portrait phone. The camera is still orthographic and
 * still never tilts away from one of these two: it only eases between them.
 */
const ISO_DIR = new Vector3(1, 1, 1).normalize()
const ISO_Q = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(ISO_DIR, new Vector3(), new Vector3(0, 1, 0)))
const PLAN_UP = new Vector3(-1, 0, 0)
const PLAN_Q = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(0, 1, 0), new Vector3(), PLAN_UP))
/** Distance from the target. Plan sits closer so the fog leaves the floor alone. */
const ISO_DIST = 20 * Math.sqrt(3)
const PLAN_DIST = 14

/** Zoom that frames the case from above, its length up the screen. */
function fitPlan(width: number, height: number) {
  return Math.min(width / caseD, height / caseW) * 0.94
}

/**
 * OrthographicCamera, iso or plan. The ratio is never altered — only zoom,
 * within ZOOM_MIN–ZOOM_MAX of the fitted base (§1), and a pan that slides the
 * camera across the screen plane without ever tilting it. Going to plan eases
 * the orientation, the zoom and the distance together over PLAN_MS.
 */
function IsoCamera({
  zoomMul,
  pan,
  plan,
  reduced,
}: {
  zoomMul: number
  pan: { x: number; y: number }
  plan: boolean
  reduced: boolean
}) {
  const size = useContainerSize()
  const cam = useRef<Ortho>(null)
  const { base, targetY } = useMemo(() => fit(size.width, size.height), [size.width, size.height])
  const planBase = useMemo(() => fitPlan(size.width, size.height), [size.width, size.height])
  const blend = useRef({ from: 0, to: 0, start: -1, value: 0 })

  useEffect(() => {
    const b = blend.current
    const to = plan ? 1 : 0
    if (reduced) {
      blend.current = { from: to, to, start: -1, value: to }
      return
    }
    blend.current = { from: b.value, to, start: performance.now(), value: b.value }
  }, [plan, reduced])

  const q = useMemo(() => new Quaternion(), [])
  const v = useMemo(() => ({ right: new Vector3(), up: new Vector3(), back: new Vector3() }), [])

  useFrame(() => {
    const c = cam.current
    if (!c) return
    const b = blend.current
    if (b.start >= 0) {
      const t = Math.min(1, (performance.now() - b.start) / PLAN_MS)
      b.value = b.from + (b.to - b.from) * standardEase(t)
      if (t >= 1) b.start = -1
    }
    const e = b.value

    q.copy(ISO_Q).slerp(PLAN_Q, e)
    const zoom = base * zoomMul * (1 - e) + planBase * e
    // The pan is held in screen pixels; a pixel is 1/zoom world units. Plan
    // fits the room whole, so the pan fades out on the way there.
    const r = (pan.x * (1 - e)) / zoom
    const u = (pan.y * (1 - e)) / zoom
    v.right.set(1, 0, 0).applyQuaternion(q)
    v.up.set(0, 1, 0).applyQuaternion(q)
    v.back.set(0, 0, 1).applyQuaternion(q)
    const dist = ISO_DIST * (1 - e) + PLAN_DIST * e
    const ty = targetY * (1 - e)
    c.position.set(
      v.right.x * r + v.up.x * u + v.back.x * dist,
      ty + v.right.y * r + v.up.y * u + v.back.y * dist,
      v.right.z * r + v.up.z * u + v.back.z * dist,
    )
    c.quaternion.copy(q)
    if (c.zoom !== zoom) {
      c.zoom = zoom
      c.updateProjectionMatrix()
    }
  })

  return <OrthographicCamera ref={cam} makeDefault position={[20, 20, 20]} near={-100} far={200} />
}

/** 90°-snapped rotation with easing. Never a free orbit, never any tilt (§1). */
function Turntable({
  quarter,
  onShadeQuarter,
  reduced,
  children,
}: {
  quarter: number
  onShadeQuarter: (q: number) => void
  reduced: boolean
  children: ReactNode
}) {
  const group = useRef<Group>(null)
  const anim = useRef({ from: 0, to: 0, start: -1 })
  const shade = useRef(-1)

  useEffect(() => {
    const g = group.current
    if (!g) return
    const to = (-quarter * Math.PI) / 2
    if (reduced) {
      g.rotation.y = to
      anim.current = { from: to, to, start: -1 }
      return
    }
    anim.current = { from: g.rotation.y, to, start: performance.now() }
  }, [quarter, reduced])

  useFrame(() => {
    const g = group.current
    if (!g) return
    const a = anim.current
    if (a.start >= 0) {
      const t = Math.min(1, (performance.now() - a.start) / ROTATE_MS)
      g.rotation.y = a.from + (a.to - a.from) * standardEase(t)
      if (t >= 1) a.start = -1
    }
    // The dark side is fixed on screen, so the face grouping flips as the room
    // passes each 45° mark — the least visible moment in the turn.
    const q = ((Math.round(g.rotation.y / (Math.PI / 2)) % 4) + 4) % 4
    if (q !== shade.current) {
      shade.current = q
      applyQuarterToAll(q)
      onShadeQuarter(q)
    }
  })

  return <group ref={group}>{children}</group>
}

/**
 * R3F sizes its canvas from `react-use-measure`, which drops its first
 * ResizeObserver callback when that callback lands before the hook's own
 * mounted-flag effect has run — and under concurrent rendering it often does.
 * On a static layout nothing ever resizes again, so the observer never fires a
 * second time, the measured size stays 0×0, and the Canvas silently never
 * initialises: no error, just an empty page.
 *
 * Watching the wrapper ourselves fixes it for good. Our own observer is
 * guaranteed a callback after `observe()`, by which point the mounted flag is
 * set, so dispatching a resize there always lands. We stop as soon as the
 * canvas has a real size, and R3F leaves it at the intrinsic 300×150 until it
 * has measured, which is the signal we watch for.
 */
function useCanvasMeasureFix(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let timer = 0
    let settled = false
    const deadline = Date.now() + 2000

    const nudge = () => {
      if (settled) return true
      const canvas = el.querySelector('canvas')
      if (canvas && canvas.width > 300) {
        settled = true
        return true
      }
      window.dispatchEvent(new Event('resize'))
      return false
    }

    // Passive effects run child-first, so R3F's own resize listener is already
    // attached by the time this parent effect runs and the first nudge lands.
    // The retries are for the cases where it is not — and they are timers, not
    // animation frames, because a tab opened in the background never paints and
    // would otherwise sit at 300x150 forever.
    const tick = () => {
      if (nudge() || Date.now() > deadline) return
      timer = window.setTimeout(tick, 60)
    }
    tick()

    const observer = new ResizeObserver(nudge)
    observer.observe(el)
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [ref])
}

/**
 * Booking by area: the room's sections are what a guest picks. Tables stop
 * being targets of their own and take their area's state, and a tap on any
 * table or any patch of floor chooses that table's area.
 */
export type AreaMode = {
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  onSelect: (area: AreaId) => void
}

export type FloorPlanProps = {
  tables: Table[]
  /** Per-table state; unused in area mode, where the area decides. */
  stateOf?: (table: Table) => TableState
  selectedId?: string | null
  onSelect?: (table: Table) => void
  onHover?: (table: Table | null) => void
  labelFor?: (table: Table) => ReactNode
  area?: AreaMode
  /** Iso (the default) or straight down. Plan fits the room whole: no pan, zoom or turning. */
  view?: 'iso' | 'plan'
  /** The rotate buttons and the area names floating in the room. */
  chrome?: boolean
}

export default function FloorPlan({
  tables,
  stateOf,
  selectedId,
  onSelect,
  onHover,
  labelFor,
  area,
  view = 'iso',
  chrome = true,
}: FloorPlanProps) {
  const plan = view === 'plan'
  const planRef = useRef(plan)
  planRef.current = plan
  const [hoverArea, setHoverArea] = useState<AreaId | null>(null)
  const [quarter, setQuarter] = useState(0)
  const [shadeQuarter, setShadeQuarter] = useState(0)
  const [zoomMul, setZoomMul] = useState(1)
  const [pinching, setPinching] = useState(false)
  // A gesture needs the zoom it started from, which a state closure would only
  // ever report as it was on the render the gesture began in.
  const zoomRef = useRef(1)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchFrom = useRef<{ gap: number; zoom: number } | null>(null)

  const [pan, setPanState] = useState({ x: 0, y: 0 })
  const panRef = useRef({ x: 0, y: 0 })
  /** One pointer down, and where it and the pan were when it went down. */
  const drag = useRef<{ id: number; x: number; y: number; pan: { x: number; y: number } } | null>(null)
  /** Set once a press travels far enough to be a drag; the tap that ends it selects nothing. */
  const dragged = useRef(false)

  /**
   * Keep the pan inside what the zoom has pushed off screen, so the room can
   * never be dragged away entirely. At the fitted zoom there is nothing to pan.
   */
  const setPan = useCallback((next: { x: number; y: number }, zoom = zoomRef.current) => {
    const el = wrapper.current
    const w = el?.clientWidth ?? 0
    const h = el?.clientHeight ?? 0
    const spare = Math.max(0, zoom - 1)
    const p = {
      x: Math.max(-w * 0.5 * spare, Math.min(w * 0.5 * spare, next.x)),
      y: Math.max(-h * 0.5 * spare, Math.min(h * 0.5 * spare, next.y)),
    }
    panRef.current = p
    setPanState(p)
  }, [])

  const setZoom = useCallback(
    (next: number) => {
      const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next))
      zoomRef.current = z
      setZoomMul(z)
      setPan(panRef.current, z)
    },
    [setPan],
  )
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyQuarterToAll(0)
  }, [])

  // Plan is drawn the one way round, long side up the screen.
  useEffect(() => {
    if (plan) setQuarter(0)
  }, [plan])

  useCanvasMeasureFix(wrapper)

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (planRef.current) return
      setZoom(zoomRef.current * (e.deltaY > 0 ? 0.92 : 1.087))
    },
    [setZoom],
  )

  /**
   * Two fingers are the touch equivalent of the wheel, clamped to the same
   * 0.6x-1.8x of base (§1). A pinch only ever starts on the *second* pointer, so
   * single-finger tap-to-select reaches the tables untouched — and while one is
   * running the canvas takes touch-action: none, otherwise the browser would
   * pan the page down at the same time as the room zooms.
   */
  const gap = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragged.current = false
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pan: panRef.current }
    if (e.pointerType !== 'touch') return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      // A second finger turns the press into a pinch; it is no longer a drag.
      drag.current = null
      pinchFrom.current = { gap: gap(), zoom: zoomRef.current }
      setPinching(true)
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (planRef.current) return
      const d = drag.current
      if (d && d.id === e.pointerId && zoomRef.current > 1) {
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        // Eight pixels before a press counts as a drag, so a slightly wobbly
        // tap on a table still selects it.
        if (dragged.current || Math.hypot(dx, dy) > 8) {
          dragged.current = true
          setPan({ x: d.pan.x - dx, y: d.pan.y + dy })
        }
      }
      if (e.pointerType !== 'touch' || !pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const from = pinchFrom.current
      if (!from || from.gap === 0 || pointers.current.size !== 2) return
      setZoom(from.zoom * (gap() / from.gap))
    },
    [setZoom, setPan],
  )

  const onPointerEnd = useCallback((e: React.PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null
    if (e.pointerType !== 'touch') return
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) {
      pinchFrom.current = null
      setPinching(false)
    }
  }, [])

  /** A press that became a drag ends on whatever is under it; that is not a choice. */
  const select = useCallback(
    (table: Table) => {
      if (dragged.current) return
      if (area) {
        const a = areaOfZone(table.zone)
        if (a) area.onSelect(a)
        return
      }
      onSelect?.(table)
    },
    [onSelect, area],
  )
  const isDrag = useCallback(() => dragged.current, [])

  /** In area mode a table reads as its area does: chosen, open, or out. */
  const tableLook = (t: Table): { state: TableState; selected: boolean; lifted?: boolean } => {
    if (!area) return { state: stateOf?.(t) ?? 'available', selected: selectedId === t.id }
    const a = areaOfZone(t.zone)
    if (!a) return { state: 'full', selected: false }
    const open = area.stateOf(a) === 'available'
    return { state: open ? 'available' : 'full', selected: open && area.selected === a, lifted: hoverArea === a }
  }

  // A portrait phone frames the long plan by its width and leaves the room a
  // strip across the middle. Start closer there; the pan reaches the ends.
  useEffect(() => {
    const el = wrapper.current
    if (el && el.clientWidth < 600 && el.clientHeight > el.clientWidth) setZoom(chrome ? 1.9 : 1.3)
  }, [setZoom, chrome])

  return (
    <div
      className={pinching ? 'scene is-pinching' : 'scene'}
      ref={wrapper}
      style={{ '--mv-scene-aspect': SCENE_ASPECT } as CSSProperties}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          // Fog dissolves the far edge of the room into the background (§6).
          state.scene.fog = new Fog(hex.fog, FOG_NEAR, FOG_FAR)
        }}
      >
        <IsoCamera zoomMul={zoomMul} pan={pan} plan={plan} reduced={reduced} />
        <Turntable quarter={quarter} onShadeQuarter={setShadeQuarter} reduced={reduced}>
          <Case quarter={shadeQuarter} />
          <Room quarter={shadeQuarter} tags={!area} />
          <Shadows tables={tables} quarter={shadeQuarter} />
          {area ? (
            <AreaHits
              tags={plan ? 'short' : chrome}
              stateOf={area.stateOf}
              selected={area.selected}
              hovered={hoverArea}
              onHover={setHoverArea}
              onSelect={area.onSelect}
              isDrag={isDrag}
            />
          ) : null}
          {tables.map((t) => {
            const look = tableLook(t)
            return (
              <TableMesh
                key={t.id}
                table={t}
                state={look.state}
                selected={look.selected}
                lifted={look.lifted}
                onSelect={select}
                onHover={area ? (h) => setHoverArea(h ? (areaOfZone(h.zone) ?? null) : null) : onHover}
                label={labelFor?.(t)}
              />
            )
          })}
        </Turntable>
      </Canvas>

      {chrome && !plan ? (
      <div className="scene__controls">
        <button
          type="button"
          className="btn btn--quiet scene__turn"
          onClick={() => setQuarter((q) => q - 1)}
          aria-label="Rotate the room left"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          className="btn btn--quiet scene__turn"
          onClick={() => setQuarter((q) => q + 1)}
          aria-label="Rotate the room right"
        >
          <Chevron dir="right" />
        </button>
      </div>
      ) : null}
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  const d = dir === 'left' ? 'M9 3 4 8l5 5' : 'M7 3l5 5-5 5'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
