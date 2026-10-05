/** Domain types. Spatial values are metres from the venue origin — never pixels. */

/** A diamond is a square table turned 45°, as several are on the Peacock plan. */
export type TableShape = 'round' | 'rect' | 'diamond'

export type Table = {
  id: string
  label: string
  /** Most it seats. */
  seats: number
  /** Fewest it is offered for. */
  min: number
  /** Jenny's booking priority, 1–10: higher is offered first. */
  priority: number
  shape: TableShape
  x: number // metres from origin
  y: number // metres from origin
  rot: number // degrees; 0 or 90 (a diamond carries its 45° in its shape)
  zone: string
  /** Footprint in metres, before `rot`. Round and diamond tables use `w` only. */
  w: number
  d: number
}

export type AreaId = 'deck' | 'inside' | 'courtyard'

export type BookingStatus = 'confirmed' | 'seated' | 'cancelled' | 'no_show'

export type Booking = {
  id: string
  /** The table, or the first of a joined set. Null until the venue places it. */
  tableId: string | null
  /** Every table the booking holds, when it is more than one (joined tables). */
  tableIds?: string[]
  /** The area the guest chose, when they booked by area. */
  area?: AreaId
  startsAt: string // ISO
  durationMin: number
  partySize: number
  guestName: string
  phone: string
  email: string
  notes?: string
  status: BookingStatus
}

/** Everything a caller supplies when making a booking. */
export type NewBooking = Omit<Booking, 'id' | 'status'> & {
  status?: BookingStatus
}

export type DateKey = string // 'YYYY-MM-DD', venue-local

export interface DataAdapter {
  listTables(): Promise<Table[]>
  listBookings(date: DateKey): Promise<Booking[]>
  createBooking(input: NewBooking): Promise<Booking>
}
