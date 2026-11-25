# Design

The site is a photographer's contact sheet: Veer's projects and photos are frames on a proof sheet, and his picks are circled by hand in grease pencil. The direction contract is in `.impeccable/direction.md`.

## Colour
Black and white only. Colour on the page comes from photographs and project images, never from the interface.
- Light: `--bg #ffffff`, `--ink #0a0a0a`, `--muted #525252`, `--rule #e5e5e5`, `--accent-soft #f2f2f2`
- Dark: `--bg #0a0a0a`, `--ink #f5f5f5`, `--muted #a3a3a3`, `--rule #262626`, `--accent-soft #1a1a1a`
- `--accent` is the ink colour. Hero photos are greyscale; project frames on the home sheet are greyscale until hovered, focused or scrolled into the middle of a phone screen.

## Type
One face, Atkinson Hyperlegible Next. Display 800 weight, tracking no tighter than -0.04em, at most 6rem (`--step-display`). No monospace outside code.

## Shapes and parts
- Square corners (`--radius: 2px`). Buttons are flat rectangles with a 1px ink border that invert on hover.
- `src/components/GreaseLoop.astro`: the hand-drawn loop. It draws on hover or focus of a `.loop-host` ancestor, or stays drawn with `selected`. An underlay in the page colour keeps it readable on any image.
- Frames sit edge to edge with 3px gutters on film black.

## Motion
One authored moment per surface: the dot name forming in the hero, and the loop drawing round a frame. No generic scroll reveals. Reduced motion turns off the crossfade, the dots and the loop drawing.

## Bans kept
No eyebrow or kicker labels, no section numbers, no pills or status dots, no glass, no gradient text, no hard offset shadows, no emoji or glyph icons.
