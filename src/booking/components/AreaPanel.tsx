'use client'
import { areas, type AreaId, type AreaState } from '../data'
import type { GateValue } from './Gate'

const STATE_LINE: Record<AreaState, string> = {
  available: 'Available',
  full: 'Full at this time',
  'too-big': 'Too small for your group',
}

/**
 * The same choice as the room, as a list: for a phone where the room is a
 * strip, and for anyone not using a pointer. Picking here lights the area in
 * the room, and the other way round.
 */
export default function AreaPanel({
  gate,
  stateOf,
  selected,
  onSelect,
  onContinue,
}: {
  gate: GateValue
  stateOf: (area: AreaId) => AreaState
  selected: AreaId | null
  onSelect: (area: AreaId) => void
  onContinue: () => void
}) {
  const open = areas.filter((a) => stateOf(a.id) === 'available')
  return (
    <div className="dock__body enter">
      <header className="dock__head">
        <span className="display t-16">Where would you like to sit?</span>
        <span className="t-13 ink-60">
          For {gate.partySize} {gate.partySize === 1 ? 'guest' : 'guests'} at {gate.time}. Tap an area in the room
          or choose below; our team sets your table.
        </span>
      </header>

      <div className="stack-8" role="radiogroup" aria-label="Area">
        {areas.map((a) => {
          const state = stateOf(a.id)
          const out = state !== 'available'
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={selected === a.id}
              className={`btn area-btn${selected === a.id ? ' is-selected' : ''}`}
              disabled={out}
              onClick={() => onSelect(a.id)}
            >
              <span className="area-btn__name">{a.name}</span>
              <span className="area-btn__blurb t-13 ink-60">{a.blurb}</span>
              <span className={`area-btn__state t-11 display${out ? ' ink-45' : ''}`}>{STATE_LINE[state]}</span>
            </button>
          )
        })}
      </div>

      {!open.length ? (
        <p className="t-13 ink-60">
          Every area is full at {gate.time}. Try another time, or call us and we’ll see what we can do.
        </p>
      ) : null}

      <div className="dock__actions">
        <button type="button" className="btn btn--primary" disabled={!selected} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
