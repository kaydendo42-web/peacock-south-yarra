import { floorAt, room } from '../data'

/** Scene composition constants, all in metres. Derived from the venue footprint. */

export const PLATFORM_MARGIN = 0.55
export const PLATFORM_THICK = 0.36
export const CASE_MARGIN = 0.8
export const CASE_THICK = 0.42
export const CASE_HEIGHT = 5.4
export const CASE_SECTION = 0.26

export const platformW = room.width + PLATFORM_MARGIN * 2
export const platformD = room.depth + PLATFORM_MARGIN * 2
export const caseW = platformW + CASE_MARGIN * 2
export const caseD = platformD + CASE_MARGIN * 2

export const halfX = room.width / 2
export const halfZ = room.depth / 2

export const PARAPET_BASE = 0.72
export const PARAPET_MERLON = 0.2

/** Floor height under a point, in metres: the house and Deck are raised, the Court Yard is not. */
export function floorHeightAt(venueX: number, venueY: number): number {
  return floorAt(venueX, venueY)
}

/**
 * Is a face pointing between the room and the camera? Used to drop the two near
 * walls and the two near rails of the case, so every one of the four snapped
 * views looks into the room rather than at the back of a slab.
 */
export function facesCamera(normal: [number, number], quarter: number): boolean {
  const [x, z] = normal
  const q = ((quarter % 4) + 4) % 4
  const w: [number, number] =
    q === 1 ? [z, -x] : q === 2 ? [-x, -z] : q === 3 ? [-z, x] : [x, z]
  return w[0] + w[1] > 0.1
}

export const TABLE_HEIGHT = 0.75
export const PLINTH_HEIGHT = 0.08
export const HOVER_LIFT = 0.06

/** Shadows are one flat polygon per object, offset in a single global direction (§6). */
export const SHADOW_OFFSET: [number, number] = [0.42, 0.18]
export const SHADOW_OPACITY = 0.1

export const FOG_NEAR = 27
export const FOG_FAR = 68

export const ZOOM_MIN = 0.6
/** The real plan is long and shallow, so a phone needs to get closer than the synthetic room did. */
export const ZOOM_MAX = 3
