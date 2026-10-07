'use client'
import { areas, type AreaId, type AreaState } from '../data'

/** Top to bottom as the plan lies on a phone: the Courtyard at the back, the Deck on the street. */
const PLAN_ORDER: AreaId[] = ['courtyard', 'inside', 'deck']
const inPlanOrder = [...areas].sort((a, b) => PLAN_ORDER.indexOf(a.id) - PLAN_ORDER.indexOf(b.id))

const OUT: Record<AreaState, string> = {
  available: '',
  full: 'Full',
  'too-big': 'Too small',
}

/**
 * The phone's area choice: three names down the side of the plan, and
 * Continue. No blurbs; the plan beside it shows where each one is, and picking
 * here washes that part of the floor, the same as tapping the floor does.
 */
export default function AreaRail({
  stateOf,
  selected,
  onSelect,
  onContinue,
}: {
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  onSelect: (area: AreaId) => void
  onContinue: () => void
}) {
  const open = areas.some((a) => stateOf(a.id) === 'available')
  return (
    <nav className="rail" aria-label="Where would you like to sit?">
      <span className="rail__head t-11 display ink-45">Sit</span>
      <div className="rail__list" role="radiogroup" aria-label="Area">
        {inPlanOrder.map((a) => {
          const state = stateOf(a.id)
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected === a.id}
              className={`btn rail__btn${selected === a.id ? ' is-selected' : ''}`}
              disabled={state !== 'available'}
              onClick={() => onSelect(a.id)}
            >
              {a.name}
              {OUT[state] ? <small>{OUT[state]}</small> : null}
            </button>
          )
        })}
      </div>
      {!open ? <p className="rail__note t-11 ink-60">All full at this time. Try another time or call us.</p> : null}
      <button type="button" className="btn btn--primary rail__go" disabled={!selected} onClick={onContinue}>
        Continue
      </button>
    </nav>
  )
}
