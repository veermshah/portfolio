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
- Selected work is marked by size alone. Hover and focus underline a frame's title; the pager outlines the current project in ink.
- The portrait is the hero's main element: head and shoulders at 4:5, full content width on phones, a 30rem column on desktop, no frame, a deep shadow.
- Header: a VS monogram block and the name. Clear over the home hero, solid after it. Nav links draw an underline on hover and keep it on the current page or section. Below 48rem the links live in a full-screen menu (a modal dialog) behind a hamburger.
- Frames sit edge to edge with 3px gutters on film black.

## Motion
One authored moment: the dot name forming in the hero. Parallax is CSS scroll-driven animation on transform only (background photos, portrait, Selected work images), with no JavaScript. No generic scroll reveals. Reduced motion turns off the crossfade, the dots and the parallax.

## Bans kept
No eyebrow or kicker labels, no section numbers, no pills or status dots, no glass, no gradient text, no hard offset shadows, no emoji or glyph icons.
