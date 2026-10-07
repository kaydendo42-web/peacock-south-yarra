'use client'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  areaOfZone,
  areaStateAt,
  areas,
  at,
  createBooking,
  dateLabel,
  heldTables,
  listBookings,
  sittingFor,
  tables,
  timeLabel,
  venueDateKey,
  type AreaId,
  type Booking,
  BookingRejected,
} from '../data'
import FloorPlan from '../scene/FloorPlanLazy'
import type { PlanBand } from '../scene/FloorPlan'
import Gate, { type GateValue } from './Gate'
import AreaPanel from './AreaPanel'
import AreaRail, { RailBar } from './AreaRail'
import BookingForm, { type GuestDetails } from './BookingForm'
import Dock, { useDockScroll, useIsPhone } from './Dock'

type Stage = 'browse' | 'details' | 'done'

/** How long a phone shows the room before it turns into the plan. */
const ESTABLISH_MS = 1400

const areaName = (id: AreaId | null | undefined) => areas.find((a) => a.id === id)?.name ?? ''

/**
 * When, then where. The guest gives party, date and time, then picks an area
 * of the room (Front Deck, Inside, Courtyard), not a table: Jenny moves people
 * between tables, so the table is hers to set. The server allocates it.
 */
export default function BookingFlow({
  onComplete,
  onExit,
  exitLabel = 'Back',
}: {
  onComplete?: (booking: Booking) => void
  onExit?: () => void
  exitLabel?: string
}) {
  const [gate, setGate] = useState<GateValue | null>(null)
  const [gateOpen, setGateOpen] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [area, setArea] = useState<AreaId | null>(null)
  const [stage, setStage] = useState<Stage>('browse')
  const [confirmed, setConfirmed] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dockOpen, setDockOpen] = useState(false)
  const { dock, scene, revealDock, revealScene } = useDockScroll()
  const phone = useIsPhone()
  // A phone opens on the room, then sets it down as a plan to choose from.
  const [planView, setPlanView] = useState(false)
  const [bands, setBands] = useState<PlanBand[] | null>(null)

  const chosenAt = useMemo(() => (gate ? at(gate.date, gate.time) : null), [gate])

  const refresh = useCallback(async (date: string) => {
    setBookings(await listBookings(date))
  }, [])

  useEffect(() => {
    if (gate) void refresh(gate.date)
  }, [gate, refresh])

  const areaState = useCallback(
    (id: AreaId) => (gate && chosenAt ? areaStateAt(id, chosenAt, gate.partySize, bookings) : 'available'),
    [gate, chosenAt, bookings],
  )

  const selectArea = useCallback(
    (id: AreaId) => {
      if (areaState(id) !== 'available') return
      setArea(id)
      setStage('browse')
      setError(null)
      setDockOpen(true)
      revealDock()
    },
    [areaState, revealDock],
  )

  const picking = phone && !!gate && !gateOpen && stage === 'browse'

  useEffect(() => {
    if (!picking || planView) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = window.setTimeout(() => setPlanView(true), reduced ? 0 : ESTABLISH_MS)
    return () => window.clearTimeout(t)
  }, [picking, planView])

  const applyGate = (value: GateValue) => {
    setPlanView(false)
    setGate(value)
    setGateOpen(false)
    setArea(null)
    setStage('browse')
    setConfirmed(null)
    setDockOpen(false)
  }

  const confirm = async (details: GuestDetails) => {
    if (!area || !chosenAt || !gate) return
    setBusy(true)
    setError(null)
    try {
      const booking = await createBooking({
        area,
        tableId: null,
        startsAt: chosenAt.toISOString(),
        durationMin: sittingFor(gate.partySize),
        partySize: gate.partySize,
        guestName: details.guestName.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        notes: details.notes.trim() || undefined,
      })
      setConfirmed(booking)
      setStage('done')
      setDockOpen(true)
      await refresh(gate.date)
      onComplete?.(booking)
    } catch (e) {
      // The adapter rejects with the reason; a guest deserves to see it rather
      // than a shrug — most often the area filled while they were typing.
      setError(e instanceof BookingRejected ? e.message : 'Something went wrong. Please try again.')
      await refresh(gate.date)
    } finally {
      setBusy(false)
    }
  }

  // What the collapsed phone bar says. Never rendered on a computer.
  const dockSummary =
    stage === 'done'
      ? 'Booking confirmed'
      : stage === 'details' && area
        ? `${areaName(area)} — your details`
        : area
          ? `${areaName(area)} · ${gate?.time ?? ''}`
          : 'Choose where to sit'

  const startAgain = () => {
    setConfirmed(null)
    setArea(null)
    setStage('browse')
    setGateOpen(true)
    setDockOpen(false)
  }

  const panel: ReactNode =
    stage === 'done' && confirmed ? (
      <Confirmation booking={confirmed} onDone={startAgain} />
    ) : stage === 'details' && area && gate ? (
      <BookingForm
        place={areaName(area)}
        gate={gate}
        slot={chosenAt!}
        busy={busy}
        error={error}
        onBack={() => setStage('browse')}
        onConfirm={confirm}
      />
    ) : gate ? (
      <AreaPanel
        gate={gate}
        stateOf={areaState}
        selected={area}
        onSelect={selectArea}
        onContinue={() => setStage('details')}
      />
    ) : null

  return (
    <>
      {gate && !gateOpen ? (
        <div className="summary-row">
          <button type="button" className="summary" onClick={() => setGateOpen(true)}>
            <span className="t-13">
              {gate.partySize} {gate.partySize === 1 ? 'guest' : 'guests'}
            </span>
            <span className="summary__dot" aria-hidden="true" />
            <span className="t-13">{dateLabel(gate.date)}</span>
            <span className="summary__dot" aria-hidden="true" />
            <span className="t-13">{gate.time}</span>
            <span className="display t-11 ink-45 summary__change">Change</span>
          </button>
          {onExit ? (
            <button type="button" className="btn btn--quiet summary-row__exit" onClick={onExit}>
              {exitLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      {!gate || gateOpen ? (
        <main className="app__body gate-wrap">
          <Gate
            value={gate}
            onSubmit={applyGate}
            onDismiss={gate ? () => setGateOpen(false) : onExit}
          />
        </main>
      ) : picking ? (
        <main className={`app__body pick${planView ? ' is-plan' : ''}`}>
          {/* A tap on the room skips straight to the plan. */}
          <div className="pick__scene" onPointerDown={() => setPlanView(true)}>
            <FloorPlan
              tables={tables}
              area={{ stateOf: areaState, selected: area, onSelect: selectArea }}
              view={planView ? 'plan' : 'iso'}
              chrome={false}
              onPlanBands={setBands}
            />
          </div>
          <AreaRail stateOf={areaState} selected={area} onSelect={selectArea} bands={bands} />
          <RailBar stateOf={areaState} selected={area} onContinue={() => setStage('details')} />
        </main>
      ) : phone ? (
        <main className="app__body">
          <aside className="dock is-open dock--solo">{panel}</aside>
        </main>
      ) : (
        <main className="app__body">
          <div className="guest__scene" ref={scene}>
            <FloorPlan
              tables={tables}
              area={{ stateOf: areaState, selected: area, onSelect: selectArea }}
            />
          </div>

          {/* The column is always here, so opening a panel never resizes the scene. */}
          <Dock
            summary={dockSummary}
            open={dockOpen}
            onToggle={() => setDockOpen((v) => !v)}
            onBackToRoom={revealScene}
            innerRef={dock}
          >
            {panel}
          </Dock>
        </main>
      )}
    </>
  )
}

function Confirmation({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const zone = tables.find((t) => t.id === heldTables(booking)[0])?.zone
  const where = areaName(booking.area ?? (zone ? areaOfZone(zone) : null))
  const start = new Date(booking.startsAt)
  return (
    <div className="dock__body enter">
      <header className="dock__head">
        <span className="display t-22">You’re booked!</span>
        <span className="t-13 ink-60">See you then.</span>
      </header>

      <hr className="rule" />

      <span className="label">Reference</span>
      <p className="display t-16">{booking.id}</p>

      <hr className="rule" />

      <dl className="summary-list">
        <dt className="t-11 display ink-45">Where</dt>
        <dd className="t-13">{where}</dd>
        <dt className="t-11 display ink-45">When</dt>
        <dd className="t-13">
          {dateLabel(venueDateKey(start))} at {timeLabel(start)}
        </dd>
        <dt className="t-11 display ink-45">Party</dt>
        <dd className="t-13">
          {booking.partySize} {booking.partySize === 1 ? 'guest' : 'guests'}
        </dd>
        <dt className="t-11 display ink-45">Name</dt>
        <dd className="t-13">{booking.guestName}</dd>
        {booking.notes ? (
          <>
            <dt className="t-11 display ink-45">Notes</dt>
            <dd className="t-13">{booking.notes}</dd>
          </>
        ) : null}
      </dl>

      <button type="button" className="btn dock__cta" onClick={onDone}>
        Book another table
      </button>
    </div>
  )
}
