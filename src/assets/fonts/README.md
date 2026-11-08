# Bundled editor fonts

The editor bundles subsets for eight family aliases. Font files retain their
original copyright and license metadata. Family, full-name, and PostScript name
records use the NiimBlue aliases so the modified fonts do not use upstream
Reserved Font Names. Outlines are unchanged.

| CSS family | Included styles | Source | License |
| --- | --- | --- | --- |
| `Noto Sans Variable` | Variable weight 100–900, normal | Noto Sans, Noto Project Authors; installed from the locked `@fontsource-variable/noto-sans` package | SIL OFL 1.1; [notice](../../../public/licenses/noto-sans-OFL.txt) |
| `NiimBlue Serif` | Regular, Italic, Bold, Bold Italic | Noto Serif, Noto Project Authors | SIL OFL 1.1; [notice](../../../public/licenses/noto-serif-OFL.txt) |
| `NiimBlue Modern` | Regular, Italic, Bold, Bold Italic | Red Hat Display, Red Hat Project Authors | SIL OFL 1.1; [notice](../../../public/licenses/red-hat-display-OFL.txt) |
| `NiimBlue Rounded` | Regular, Bold | Comfortaa, Comfortaa Project Authors | SIL OFL 1.1; [notice](../../../public/licenses/comfortaa-OFL.txt) |
| `NiimBlue Mono` | Regular, Italic, Bold, Bold Italic | Source Code Pro, Adobe | SIL OFL 1.1; [notice](../../../public/licenses/source-code-pro-OFL.txt) |
| `NiimBlue Condensed` | Regular, Italic, Bold, Bold Italic | Noto Sans Condensed, Noto Project Authors | SIL OFL 1.1; [notice](../../../public/licenses/noto-sans-OFL.txt) |
| `NiimBlue Book` | Regular, Italic, Bold, Bold Italic | Caladea, Huerta Tipografia | Apache License 2.0; [notice](../../../public/licenses/caladea-Apache-2.0.txt) |
| `NiimBlue Humanist` | Regular, Bold | Cantarell, Cantarell Project Authors | SIL OFL 1.1; [notice](../../../public/licenses/cantarell-OFL.txt) |

Italic and bold italic Cantarell files are not installed on the source system;
they are omitted rather than synthesized. Comfortaa is bundled in the two
available requested weights. The Noto Serif Regular and Italic files predate
the additional family options and retain their existing subsets.

`devtools/bundle_fonts.py` rebuilds the styles with local FontTools and Brotli.
Its source paths are listed at the top of the script and may need adjustment on
another machine. Each generated subset preserves supported characters from
these ranges: `0000–024F, 0300–036F, 0400–052F, 1E00–1EFF, 2000–206F,
20A0–20CF, 2116, 2122`. Glyph closure is retained by FontTools; characters not
present in a source face are not added.
