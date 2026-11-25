# Direction contract (site-wide, Experience mode)

THESIS: The site is a photographer's contact sheet. Veer's work (projects and photos) is laid out as frames on a proof sheet, and his picks are circled by hand in grease pencil. It refuses the category default: a hero headline with a pill badge, a row of same-size rounded cards, section numbers, mono labels, an accent colour.

OWN-WORLD: Black and white only (white paper #fff / film black #0a0a0a, greys #525252 and #a3a3a3, rules #e5e5e5 / #262626). Colour comes only from photographs and project images. Square corners. One face, Atkinson Hyperlegible Next, set heavy and tight for display (max 6rem, tracking no tighter than -0.04em), plain for text. No mono except for code. Frames sit edge to edge with thin gutters like a contact strip; hand-drawn grease-pencil loops (src/components/GreaseLoop.astro, stroke currentColor) mark selects. Buttons are flat black or white rectangles with a 1px border that invert on hover.

STORY: In one viewport the visitor sees Veer's own photo full bleed in black and white, his name forming out of dots, his portrait and a two-line bio, and one plain action (Email me). Scrolling, they see his selected projects circled on the sheet, then every project as a frame, then experience, education and skills as set text. They open a project, read it, and move to the next frame.

FIRST VIEWPORT: Full-bleed greyscale photo crossfade behind everything. Round portrait (5.5rem phone, 7rem desktop) top left, the dot name below it at display size, the bio full width under it, then Email me and the profile links. Credit line bottom right.

FORM: seed: none (pinned) "keep everything black and white", "i like having both combined" (photos + dot name), "make the website just more memorable overall".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
