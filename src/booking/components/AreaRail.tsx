'use client'
import type { CSSProperties } from 'react'
import { areas, type AreaId, type AreaState } from '../data'
import type { PlanBand } from '../scene/FloorPlan'

/** Top to bottom as the plan lies on a phone: the Courtyard at the back, the Deck on the street. */
const PLAN_ORDER: AreaId[] = ['courtyard', 'inside', 'deck']
const inPlanOrder = [...areas].sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id))

const OUT: Record<AreaState, string> = {
  available: '',
  full: 'Full',
  'too-big': 'Too small',
}

/** Space between neighbouring buttons, in pixels. */
const GAP = 6

/**
 * The phone's area choice: three names down the side of the plan, each button
 * as tall as its area is long and level with it, so the rail reads as a key to
 * the plan beside it. No blurbs. Picking here washes that part of the floor,
 * the same as tapping the floor does. Until the plan has been measured the
 * buttons simply share the height.
 */
export default function AreaRail({
  stateOf,
  selected,
  onSelect,
  bands,
}: {
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  onSelect: (area: AreaId) => void
  bands: PlanBand[] | null
}) {
  const place = (id: AreaId): CSSProperties | undefined => {
    const b = bands?.find((x) => x.area === id)
    if (!b) return undefined
    return { position: 'absolute', top: b.top + GAP / 2, height: Math.max(44, b.bottom - b.top - GAP) }
  }
  return (
    <div className={`rail${bands ? ' is-placed' : ''}`} role="radiogroup" aria-label="Where would you like to sit?">
      {inPlanOrder.map((a) => {
        const state = stateOf(a.id)
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected === a.id}
            className={`btn rail__btn${selected === a.id ? ' is-selected' : ''}`}
            style={place(a.id)}
            disabled={state !== 'available'}
            onClick={() => onSelect(a.id)}
          >
            {a.name}
            {OUT[state] ? <small>{OUT[state]}</small> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Under the plan: Continue, or why there is nothing to continue to. */
export function RailBar({
  stateOf,
  selected,
  onContinue,
}: {
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  onContinue: () => void
}) {
  const open = areas.some((a) => stateOf(a.id) === 'available')
  return (
    <div className="rail-bar">
      {!open ? <p className="t-11 ink-60">All full at this time. Try another time, or call us.</p> : null}
      <button type="button" className="btn btn--primary rail-bar__go" disabled={!selected} onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
