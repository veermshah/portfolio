# Design

The site is a photographer's contact sheet: Veer's projects and photos are full-colour frames laid edge to edge, with his picks shown larger. The direction contract is in `.impeccable/direction.md`.

## Colour
A neutral black and white interface with no accent colour. Photographs and project images stay in full colour.
- Light: `--bg #ffffff`, `--ink #0a0a0a`, `--muted #525252`, `--rule #e5e5e5`, `--accent-soft #f2f2f2`
- Dark: `--bg #0a0a0a`, `--ink #f5f5f5`, `--muted #a3a3a3`, `--rule #262626`, `--accent-soft #1a1a1a`
- `--accent` is the ink colour. No image is desaturated.

## Type
One face, Atkinson Hyperlegible Next. Display 800 weight, tracking no tighter than -0.04em, at most 6rem (`--step-display`). No monospace outside code.

## Shapes and parts
- Square corners (`--radius: 2px`). Buttons are flat rectangles with a 1px ink border that invert on hover.
- Selected work is marked by size alone. Hover and focus underline a frame's title; the current item is an ink outline (pager) or a white edge (hero strip).
- The portrait is head and shoulders at 4:5 with a thin white edge.
- Frames sit edge to edge with 3px gutters on film black.

## Motion
One authored moment: the dot name forming in the hero. No generic scroll reveals. Reduced motion turns off the crossfade and the dots.

## Bans kept
No eyebrow or kicker labels, no section numbers, no pills or status dots, no glass, no gradient text, no hard offset shadows, no emoji or glyph icons.
