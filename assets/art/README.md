# StoryVerse AI — artwork slots

Drop images here named exactly after a slot, then run `npm run art`
(it also runs automatically on `npm start`). Accepted: `.webp` (preferred), `.jpg`, `.png`.
Any slot without a file falls back to the built-in vector art, so the app never breaks.

Only add artwork you created or are licensed to ship in an app.

| Slot | Size / ratio | Used on |
|---|---|---|
| `home-hero` | 1080×1600, 2:3 portrait | Home hero (full-bleed, top 74% of the screen) |
| `world-<id>` ×8 | 960×720, 4:3 | World Selection cards |
| `hero-<archetype>` ×6 | 900×1200, 3:4 portrait | Character Creation portrait stage |

World ids: `lost-island`, `enchanted-forest`, `ancient-kingdom`, `cyberpunk-city`,
`desert-secrets`, `space-frontier`, `haunted-mansion`, `underwater-kingdom`.

Archetype ids: `warrior`, `mage`, `explorer`, `detective`, `sailor`, `inventor`.

## Composition tips

- **home-hero**: keep the top ~35% darker and simple (the logo sits there) and the bottom ~25% dark
  (CTAs sit there). Put the character and glowing orb in the middle band.
- **world-***: subject centered; the bottom 30% is faded into the card's info bar.
- **hero-***: head and shoulders in the upper half, so the face isn't covered by the nameplate at the bottom.
- Keep one consistent style across all images: painterly cinematic fantasy, navy night palette,
  warm gold/orange rim light.

Per-slot subject suggestions are in `src/assets/slots.json`.
