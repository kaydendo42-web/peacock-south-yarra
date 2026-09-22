import { Color } from 'three'

/**
 * Palette and the three-value face system (art direction §2, §3).
 *
 * There are no lights in this scene, so light is assigned rather than
 * computed: every solid gets exactly three lightnesses of one hue, and the
 * dark side is the same side for every object in the room.
 *
 * A note on axes. The art direction names the mid face "camera-left (−X)" and
 * the dark face "camera-right (+Z)". With the mandated camera at [20, 20, 20]
 * those letters are the wrong way round — screen-right is world (+X, −Z), so
 * +Z is the camera-left face and +X is the camera-right one. The words and the
 * reference images agree with each other; only the axis letters slipped. We
 * follow the words: camera-left = mid, camera-right = darkest.
 */

export const TOP = 0
export const MID = 1
export const DARK = 2

export type Tone = { top: Color; mid: Color; dark: Color }

const c = (hex: string) => new Color(hex)

/**
 * Hues come from the website's palette in `src/app/globals.css` — mint for the
 * sky, paper for the stone the room is cut from, pink where coral used to be,
 * forest for ink and for the one accent. The *relationships* are untouched: the
 * case still sits a shade lighter than the sky behind it, the three faces of a
 * solid still step down by the same lightness intervals, and the accent is
 * still the only value that does not belong to a three-face tone.
 */
export const hex = {
  skyTop: '#A6DCCF',
  skyBottom: '#8BD3C4',
  fog: '#96D7C9',
  ink: '#244D3D',
  marker: '#3D7D65',
  accent: '#244D3D',
  accentDark: '#17382C',
} as const

/** Available table / active architecture — the site's pink. */
export const coral: Tone = { top: c('#F7D3DC'), mid: c('#EFB8C4'), dark: c('#D2909F') }
/** Booked / background architecture — the site's pale sage, drained. */
export const drained: Tone = { top: c('#DFE3D4'), mid: c('#D2D7C5'), dark: c('#C2C8B4') }
/** Floors, platforms, stairs — the site's paper. */
export const stone: Tone = { top: c('#FFF9ED'), mid: c('#F2EAD6'), dark: c('#E0D7BF') }
/** The display case — the site's mint, a shade up from the sky behind it. */
export const sky: Tone = { top: c('#B4E2D7'), mid: c('#A6DCCF'), dark: c('#97D5C7') }

/**
 * Drop a tone's saturation to a fraction of itself and carry its lightness part
 * of the way toward another tone. §4 asks for "coral at 55% saturation, sitting
 * between coral and drained" — which is a saturation instruction, not a blend,
 * and lerping the two tones together leaves it far too saturated to recede.
 */
function desaturateToward(from: Tone, toward: Tone, keepSaturation: number, lightness: number): Tone {
  const a = { h: 0, s: 0, l: 0 }
  const b = { h: 0, s: 0, l: 0 }
  const out = {} as Tone
  for (const key of ['top', 'mid', 'dark'] as const) {
    from[key].getHSL(a)
    toward[key].getHSL(b)
    out[key] = new Color().setHSL(a.h, a.s * keepSaturation, a.l + (b.l - a.l) * lightness)
  }
  return out
}

/** Pull the three values toward their mean lightness — flattens a solid out. */
function compress(tone: Tone, keep: number): Tone {
  const hsl = { h: 0, s: 0, l: 0 }
  const ls: number[] = []
  for (const k of ['top', 'mid', 'dark'] as const) {
    tone[k].getHSL(hsl)
    ls.push(hsl.l)
  }
  const mean = (ls[0] + ls[1] + ls[2]) / 3
  const out = {} as Tone
  ;(['top', 'mid', 'dark'] as const).forEach((k, i) => {
    tone[k].getHSL(hsl)
    out[k] = new Color().setHSL(hsl.h, hsl.s, mean + (ls[i] - mean) * keep)
  })
  return out
}

/** The available tone at 55% saturation, sitting between it and drained (§4). */
export const partly: Tone = desaturateToward(coral, drained, 0.55, 0.45)

/** Fully booked: drained, with the face contrast halved so it lies flat. */
export const booked: Tone = compress(drained, 0.5)

/** Selected: top face takes the accent, sides stay pink (§4). */
export const selected: Tone = { top: c(hex.accent), mid: coral.mid, dark: coral.dark }

/** Ornament sits within 12% lightness of the surface under it (§7). */
export function ornamentOf(base: Color): Color {
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  return new Color().setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.075))
}
