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
