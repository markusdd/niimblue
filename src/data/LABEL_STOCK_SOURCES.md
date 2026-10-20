# Stock label formats

Checked 2026-10-20 against NIIMBOT's regional product listings. The offline list
describes manufactured formats, not current stock, prices, or availability in
every country. Entries intentionally do not promise compatibility with all
printers in a series. Select consumables made for the actual printer model.

- M-series thermal-transfer sizes: [White industrial labels](https://niimbot.com.ph/collections/white-industrial).
  The [40×30 mm product](https://niimbot.com.ph/products/white-labels-40-30mm-225-pcs-m-series)
  explicitly lists M2_H/M3 and thermal-transfer media. The catalogue groups these
  apart from B-series direct-thermal rolls even where dimensions coincide.
- B-series sizes have individual product URLs in `label_stock.ts`. The round
  product URL/SKU says 31×31, but its current title and Dimensions field specify
  **30×30 mm**, which is the nominal format used here. It is separate from the
  30×30 square format.
- [D11 label sizes](https://www.niimbotlabel.com/products/niimbot-d11-label-maker)
  list 12×30, 12×40 and 14×40 mm; the
  [D110 labels page](https://www.niimbotlabel.com/pages/niimbot-d110-labels-stickers)
  lists 15×30 mm. These are shown in the editor's landscape convention: 40×12 mm
  means a 12 mm roll across the head, 40 mm along the feed, printing from the left.
  This matches the existing D-series editor presets. M/B formats use printing
  from the top, with width across the head.

Non-round stock starts with rectangular geometry; the existing shape selector
can set rounded corners to match the actual roll.
Additional finishes/SKUs sharing a format do not need duplicate entries.

## Round, multi-up and shaped stock

- [NIIMBOT M2/M3 refills](https://niimbots.com/collections/label-paper-for-m2/products/thermal-transfer-label-printer-labels-for-m2)
  enumerate additional rectangles, round 20/31/50 mm labels, cable 25×78 mm,
  and two-up 14 mm circles on 34×17 mm, 12 mm on 28×15 mm, and 10 mm on 24×13 mm.
  [NIIMBOT Singapore M-series stock](https://niimbot.com.sg/products/niimbot-m2-thermal-transfer-label-paper)
  also explicitly lists 30 and 50 mm round labels for M2/M3.
- [B-series double round labels](https://niimbot.com.ph/products/transparent-thermal-labels-42-21-mm-320-pcs-b-series)
  use a 42×21 mm carrier and 20 mm circles. Sources specify individual die-cut
  and carrier dimensions but not precise gutters/margins. We initially centre
  one die cut in each equal-width column; **this is a layout convention, not a
  measured gutter**. The column-gap field adjusts spacing while keeping the
  whole row and die-cut diameters unchanged. Save the adjusted layout in a preset.
- Cable stock [25×38+40 mm](https://niimbot.com.ph/products/green-wrap-cable-labels-25-38-40mm-100-pcs-b-series)
  has a 25×38 mm printable body and 40 mm tail. The M2 product diagram on its
  refill page shows the body split into two 12.5 mm wide halves. Both M/B cable
  entries use that body/tail arrangement, with a fold guide but no implicit copying.
- [B-series jewellery 30×25+45 mm](https://niimbot.com.au/products/niimbot-thermal-label-white-jewel-25-30-45mm-for-b21-b1-b3s-b31)
  and [M2/M3 jewellery stock](https://communets.com/product/niimbot-labels-30x25-45mm-95pcs-white-labels-removable-white-compatible-with-m2-m3)
  describe a 30×25 mm body and 45 mm tail: 30×70 mm overall. Product-title order
  is inconsistent (25×30+45 versus 30×25+45); the SKU/compound dimensions and
  30×70 total define our editor convention.

Printable panels are stored as fractions of the full label extent, independent
of raster DPI. Multi-up labels are separate die cuts, not fold/mirror segments.
They render separately; ink in their gutters and in unprinted tails is masked in
the print bitmap. New artwork starts in the first die cut. Users may copy that
design to the other die cuts or place independent artwork there. Panel geometry
survives preset saving, export/import, canvas rotation and roll memory.

Rectangular two-row formats include the M-series 24×14 mm listing and B-series
30×15 mm listing. These publish only the whole-row dimensions, so their initial
two equal rectangular cells are explicitly a **nominal starting layout**. The UI
asks for individual cut-label width/height and offers the column-gap control.
No undocumented individual dimensions or gutters are presented as manufacturer
specifications. The calibrated cells can be saved with a user's own preset.
