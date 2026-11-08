# Original design collections

The botanical collection contains six compositions, each with deliberate
landscape (50 × 30 mm), portrait (40 × 60 mm), and round (Ø 40 mm) layouts.
Ordinary current labels from 25–100 mm with moderate aspect ratios also get
an option for their existing physical size. Multi-panel, cable-tail, split and
mirrored stock require their own compositions and are not offered as the
current-size shortcut. Choosing a catalogue size explicitly changes the label size.

The catalogue and scene descriptions live in `design_templates.ts`. The preview
and Fabric factory consume the same scene. Text stays as editable TextboxExt
objects; ornaments and dividers are separate named vector layers. Designs can
be saved, exported and undone through the existing editor workflows. Template
application retains the roll's ink/paper colours and feed direction.

`botanical_ornaments.ts` and the additional frames are original SVG artwork,
provided under this repository's MIT license. The screenshot supplied as style
inspiration is not bundled or traced. Noto Serif is included under SIL OFL 1.1;
see `src/assets/fonts/README.md` and the distributed license notice.

To add later technical/modern collections, add catalogue entries, example copy
and deliberate scene compositions rather than stretching a finished label image.
Text scene elements can select any bundled `family` and `weight`; the preview
and factory load those exact faces before measuring. The built-in font collection
is documented in `src/assets/fonts/README.md`.

The first collection does not include script fonts or black-filled backgrounds:
its serif type and line art keep ink coverage modest on small thermal labels.
All compositions still need physical print review on the target printer,
especially thin leaf veins and the smallest captions.

The rosemary composition uses a dedicated `rosemary-sprig` ornament with paired
needle leaves and connected branching stems. The citrus illustration has spaced
pointed leaves and two lemons attached at their calyxes; fruit and foliage keep
clear silhouettes. Both are available as standalone botanical clipart as well
as in the templates. Previously saved templates keep their embedded artwork.

Checks: `node tests/design_templates.test.mjs` validates scene bounds, SVG parsing,
text escaping, and real Fabric object serialization/reloading in all 18 combinations.
Canvas glyph measurement is mocked in that test; it does not substitute for
checking the actual bundled fonts and print output.

## Vintage collection

Four editable designs (spice cabinet, atelier scent, homemade preserves, and
keepsake) use the original vintage cartouche frames. The six standalone frames
are available in the frame picker as cartouche, baroque, cameo, rococo, bowed
plaque, and scroll plaque. `vintage_frames.ts` owns their SVG geometry;
`vintage_templates.ts` owns example copy and type-led compositions, using the
bundled Book, Serif and Condensed faces. The same scene still drives previews
and editable objects. Botanical and Vintage are separate collections in the
menu. Frame geometry is evaluated for the actual width/height and stock shape;
round stock gets a circular medallion treatment rather than a stretched rectangle.

## Art Deco collection

Eight original geometric frames add layered mitres, open terminal corners,
diamond links, corner fans, a stepped marquee, linked corner squares, spires,
and rounded arcade rails. The earlier Deco frame is included in the same
frame-picker filter. Botanical, Vintage and Technical filters remain available.
Geometry is generated at the real design size with independent line widths;
corner motifs retain proportions and round stock gets ring-based adaptations.
White terminal/diamond interiors are paper cutouts, following the standard
colour preview and monochrome print-mask behavior.

Four designs in `deco_templates.ts` pair these frames with the bundled Modern,
Condensed, Serif and Mono faces: Reserve, Atelier edition, Catalogue No. 07,
and Celebration. Each has English/German copy and landscape, portrait and round
compositions. All fourteen designs across the three collections now undergo
Fabric serialization/reload tests in all three formats; new frame paths are
also checked for painted bounds on rectangular, rounded and circular paper.
Physical print review is still needed for fine strokes and the smallest captions.

### Curved and architectural additions

The Art Deco collection now contains sixteen frames. Eight further variants
in `art_deco_architecture.ts` add quarter-circle sunrays, interlocking arc
corners, a scalloped crest, quarter-circle portals, a hexagonal pavilion,
stepped crowns, bowtie canopies and fluted sidewalls. Motif sizes follow the
shorter paper side, and circle stock gets perimeter adaptations. The centre
remains available for text; white terminal masks use the real paper colour in
the editor and remain unprinted in the printer bitmap.

Nocturne boutique, Grand Salon and Archive Studio bring Art Deco to seven
editable compositions (seventeen designs overall). Round Nocturne captions
have narrower text boxes so they stay clear of the inner quadrant arcs. The
menu keeps its controls visible while the larger grid scrolls. All existing
English/German and three-format serialization tests cover the additions.

## Cyber collection

Six original monochrome frames in `cyber_frames.ts` add HUD panels, instrument
ticks, directional chevrons, armour tabs, telemetry rails and module housings.
Details follow the shorter label side; round stock uses segmented instrument
rings. All filled accents use the ribbon colour, with transparent centres.
The frames appear in both Cyber and Technical frame filters.

Four compositions in `cyber_templates.ts` cover module identification, inventory,
project samples and an orbital log. Each includes English/German copy and
landscape, portrait and round layouts, using bundled Modern, Condensed and Mono
fonts. Text, field values and dividers remain independently editable. Explicit
text alignment is shared by the SVG preview and Fabric factory, with existing
templates retaining their centred default. The catalogue now has 21 designs.

The supplied reference is inspiration only; no screenshot artwork is bundled.
Geometry, preview alignment and saved editable objects are checked in the
template test suite. Fine ticks and captions still need physical print review.

### Second Cyber series

Six additional frames explore open docking brackets, signal rails, reactor
panels, vector housings, terminal headers and rounded aperture brackets. Each
has a circular instrument-ring adaptation. Docking, Signal, Reactor and Vector
add four editable English/German compositions, including a centred reactor
badge. Cyber now contains twelve frames and eight templates (25 designs across
all collections). The original module housing's right rail is straight between
its corner and lower edge, with a regression check for intermediate kinks.
