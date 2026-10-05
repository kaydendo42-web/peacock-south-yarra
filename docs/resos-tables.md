# Jenny's table setup in Resos

Read from Resos (Settings → Tables) on 6 Oct 2026, read-only. This is how she
runs the floor today, and what the area-based booking should reproduce.
Format: `table[min–max seats pPriority]`. All tables and combinations are
bookable online.

Priority is Resos's "booking priority" (1–10). **To confirm with Jenny:** we
assume a higher number is offered first.

## FRONT DECK (outside), area priority 1

> A light-filled, undercover outdoor deck with cozy seating, lush greenery.
> Perfect for relaxing rain or shine (pls note - this area is not heated)

- Tables: 31[1–2 p5] 32[1–2 p5] 41[1–2 p5] 42[1–4 p5] 51[1–5 p5] 52[1–2 p5] 53[1–4 p5]
- Combinations: 41+51[2–7] 42+52[2–6] 42+52+53[3–10] (all p5)

## PEACOCK (inside), area priority 5

> A bright, stylish sanctuary filled with trailing greenery, wooden accents,
> and natural light. An intimate space for memorable dining.

- Tables: 5[1–6 p8] 6[1–3 p8]
- Combinations: none

## COURTYARD (outside), area priority 7

> A plant filled open-air courtyard ideal for casual coffee and easygoing
> dining, also features a covered heated dining space in the cooler months.

- Tables: Lawn[1–2 p5] 13[1–4 p9] 14[1–2 p9] 16[1–2 p4] Tree 2[1–3 p7]
  Deck 1[1–6 p4] Deck 3[1–4 p7] Deck 5[1–2 p2] Peacock[1–2 p6] 2[1–3 p7]
  3[1–3 p7] 4[1–6 p7]
- Combinations: 13+14[2–6] 2+3[1–5] 3+4[2–7] 2+3+4[3–12] (all p5)

## INSIDE, area priority 9

> Surround yourself with lush indoor plants and warm, natural light. A
> beautifully styled space perfect for cozy coffees and relaxed meals

- Tables: 20[1–4 p7] 21[1–2 p7] 22[1–2 p7] 23[1–2 p7] 24[1–2 p7] 25[1–3 p10]
  26[1–3 p9] 28[1–4 p2] 29[1–2 p2] 30[1–2 p2]
- Combinations: 20+21[2–6] 20+21+22[3–8] 20+21+22+23[4–10]
  20+21+22+23+24[5–14] 23+24[2–5] 23+24+25[3–7] 23+24[2–4] (duplicate in
  Resos) 25+26[2–8] (all p5)

## Names that differ from our floor plan

Our plan (`src/booking/data/venue.ts`) labels some courtyard tables
differently. Likely mapping, **to confirm with Jenny**:

| Resos | Ours |
| --- | --- |
| Lawn | L1 |
| Tree 2 | T1 |
| Deck 1 / Deck 3 / Deck 5 | D1 / D3 / D4 |
| Peacock (courtyard table) | ? (our 1, the round table?) |

Resos's INSIDE is our Main section (20–30); PEACOCK is our Peacock section
(5, 6). Jenny's three guest-facing choices map to: Front Deck = Deck;
Inside = Main + Peacock; Courtyard = Court Yard.
