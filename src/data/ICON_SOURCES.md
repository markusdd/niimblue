# Additional label icon collections

The picker bundles 32 selected Tabler icons and nine selected Health Icons.
Collections load locally on demand; searching and insertion use no remote API.

## Sources

SVG bodies were retrieved on 2026-10-13 from the Iconify icon-set snapshots:

- https://raw.githubusercontent.com/iconify/icon-sets/master/json/tabler.json
- https://raw.githubusercontent.com/iconify/icon-sets/master/json/healthicons.json

These JSON files contain optimized versions of the original projects' artwork:

- Tabler: https://github.com/tabler/tabler-icons (MIT, Paweł Kuna).
- Health Icons: https://github.com/resolvetosavelives/healthicons.
  The official site dedicates the icon artwork to CC0:
  https://healthicons.org/about. The repository and Iconify metadata also contain
  an MIT notice; that notice is retained in the bundled distribution as well.

The selected bodies and any per-icon dimensions are preserved in
`tabler_icons.json` and `health_icons.json`. Wrappers add the SVG namespace,
viewBox, and black paint for monochrome printing. Tabler defaults to 24 × 24;
Health Icons defaults to 48 × 48 with explicit 24 × 24 overrides where supplied.
Icon bodies have not been redrawn. English/German search terms are local additions.

License notices are included in `public/licenses`, which Vite copies into the
built app. Updates must retain source notices and verify each upstream license.
