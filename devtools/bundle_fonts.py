#!/usr/bin/env python3
"""Build small, renamed WOFF2 font subsets from local source font files.

Requires FontTools and Brotli (``python -m pip install fonttools brotli``).
Source paths are local examples; edit SOURCES when rebuilding on another host.
"""

from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.subset import Options, Subsetter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/assets/fonts"
UNICODE_RANGES = (
    (0x0000, 0x024F),  # Latin and IPA
    (0x0300, 0x036F),  # Combining marks
    (0x0400, 0x052F),  # Cyrillic
    (0x1E00, 0x1EFF),  # Latin Extended Additional
    (0x2000, 0x206F),  # General punctuation
    (0x20A0, 0x20CF),  # Currency symbols
    (0x2116, 0x2116),
    (0x2122, 0x2122),
)

# (family alias, style, filename, source file). Missing source styles are
# deliberately omitted; the build report lists them below.
SOURCES = [
    ("NiimBlue Modern", "Regular", "niimblue-modern-regular.woff2", "/usr/share/fonts/redhat/RedHatDisplay-Regular.otf"),
    ("NiimBlue Modern", "Italic", "niimblue-modern-italic.woff2", "/usr/share/fonts/redhat/RedHatDisplay-Italic.otf"),
    ("NiimBlue Modern", "Bold", "niimblue-modern-bold.woff2", "/usr/share/fonts/redhat/RedHatDisplay-Bold.otf"),
    ("NiimBlue Modern", "Bold Italic", "niimblue-modern-bolditalic.woff2", "/usr/share/fonts/redhat/RedHatDisplay-BoldItalic.otf"),
    ("NiimBlue Rounded", "Regular", "niimblue-rounded-regular.woff2", "/usr/share/fonts/aajohan-comfortaa-fonts/Comfortaa-Regular.otf"),
    ("NiimBlue Rounded", "Bold", "niimblue-rounded-bold.woff2", "/usr/share/fonts/aajohan-comfortaa-fonts/Comfortaa-Bold.otf"),
    ("NiimBlue Mono", "Regular", "niimblue-mono-regular.woff2", "/usr/share/fonts/adobe-source-code-pro-fonts/SourceCodePro-Regular.otf"),
    ("NiimBlue Mono", "Italic", "niimblue-mono-italic.woff2", "/usr/share/fonts/adobe-source-code-pro-fonts/SourceCodePro-It.otf"),
    ("NiimBlue Mono", "Bold", "niimblue-mono-bold.woff2", "/usr/share/fonts/adobe-source-code-pro-fonts/SourceCodePro-Bold.otf"),
    ("NiimBlue Mono", "Bold Italic", "niimblue-mono-bolditalic.woff2", "/usr/share/fonts/adobe-source-code-pro-fonts/SourceCodePro-BoldIt.otf"),
    ("NiimBlue Condensed", "Regular", "niimblue-condensed-regular.woff2", "/usr/share/fonts/google-noto/NotoSans-Condensed.ttf"),
    ("NiimBlue Condensed", "Italic", "niimblue-condensed-italic.woff2", "/usr/share/fonts/google-noto/NotoSans-CondensedItalic.ttf"),
    ("NiimBlue Condensed", "Bold", "niimblue-condensed-bold.woff2", "/usr/share/fonts/google-noto/NotoSans-CondensedBold.ttf"),
    ("NiimBlue Condensed", "Bold Italic", "niimblue-condensed-bolditalic.woff2", "/usr/share/fonts/google-noto/NotoSans-CondensedBoldItalic.ttf"),
    ("NiimBlue Book", "Regular", "niimblue-book-regular.woff2", "/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Regular.ttf"),
    ("NiimBlue Book", "Italic", "niimblue-book-italic.woff2", "/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Italic.ttf"),
    ("NiimBlue Book", "Bold", "niimblue-book-bold.woff2", "/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Bold.ttf"),
    ("NiimBlue Book", "Bold Italic", "niimblue-book-bolditalic.woff2", "/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-BoldItalic.ttf"),
    ("NiimBlue Humanist", "Regular", "niimblue-humanist-regular.woff2", "/usr/share/fonts/abattis-cantarell-fonts/Cantarell-Regular.otf"),
    ("NiimBlue Humanist", "Bold", "niimblue-humanist-bold.woff2", "/usr/share/fonts/abattis-cantarell-fonts/Cantarell-Bold.otf"),
    ("NiimBlue Serif", "Bold", "niimblue-serif-bold.woff2", "/usr/share/fonts/google-noto/NotoSerif-Bold.ttf"),
    ("NiimBlue Serif", "Bold Italic", "niimblue-serif-bolditalic.woff2", "/usr/share/fonts/google-noto/NotoSerif-BoldItalic.ttf"),
]

# These two subsets already ship in the repository. Their glyph subsets and
# copyright/license metadata are preserved; only their family identity changes.
EXISTING = [
    ("NiimBlue Serif", "Regular", "niimblue-serif-regular.woff2"),
    ("NiimBlue Serif", "Italic", "niimblue-serif-italic.woff2"),
]

REQUESTED_STYLES = {
    "NiimBlue Modern": ("Regular", "Italic", "Bold", "Bold Italic"),
    "NiimBlue Rounded": ("Regular", "Bold"),
    "NiimBlue Mono": ("Regular", "Italic", "Bold", "Bold Italic"),
    "NiimBlue Condensed": ("Regular", "Italic", "Bold", "Bold Italic"),
    "NiimBlue Book": ("Regular", "Italic", "Bold", "Bold Italic"),
    "NiimBlue Humanist": ("Regular", "Italic", "Bold", "Bold Italic"),
    "NiimBlue Serif": ("Regular", "Italic", "Bold", "Bold Italic"),
}


def rename(font: TTFont, family: str, style: str) -> None:
    """Rename identifying name IDs while retaining copyright/license metadata."""
    full_name = f"{family} {style}"
    postscript_name = f"{family.replace(' ', '')}-{style.replace(' ', '')}"
    version = next(
        (record.toUnicode() for record in font["name"].names if record.nameID == 5),
        "Unknown version",
    )
    replacements = {
        1: family,
        2: style,
        3: f"{postscript_name}; {version}",
        4: full_name,
        6: postscript_name,
        16: family,
        17: style,
        18: full_name,
        21: family,
        22: style,
    }
    name_table = font["name"]
    for name_id, value in replacements.items():
        records = [record for record in name_table.names if record.nameID == name_id]
        if not records:
            name_table.setName(value, name_id, 3, 1, 0x409)
        else:
            encodings = {(record.platformID, record.platEncID, record.langID) for record in records}
            for platform_id, encoding_id, language_id in encodings:
                name_table.setName(value, name_id, platform_id, encoding_id, language_id)

    if "CFF " in font:
        cff = font["CFF "].cff
        cff.fontNames = [postscript_name]
        for top_dict in cff.topDictIndex:
            top_dict.FamilyName = family
            top_dict.FullName = full_name


def subset_font(source: Path, destination: Path, family: str, style: str) -> None:
    font = TTFont(source)
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    # Keep upstream copyright and license name records alongside family names.
    options.name_IDs = ["*"]
    subsetter = Subsetter(options=options)
    subsetter.populate(unicodes={codepoint for start, end in UNICODE_RANGES for codepoint in range(start, end + 1)})
    subsetter.subset(font)
    rename(font, family, style)
    font.flavor = "woff2"
    destination.parent.mkdir(parents=True, exist_ok=True)
    font.save(destination)


def main() -> None:
    generated = set()
    missing = []
    for family, style, filename in EXISTING:
        destination = OUTPUT / filename
        if destination.is_file():
            font = TTFont(destination)
            rename(font, family, style)
            font.flavor = "woff2"
            font.save(destination)
            generated.add((family, style))
            print(f"{destination.name}: {destination.stat().st_size:,} bytes (existing subset)")
        else:
            missing.append(f"{family} {style}: expected existing subset {destination}")

    for family, style, filename, source_name in SOURCES:
        source = Path(source_name)
        if not source.is_file():
            missing.append(f"{family} {style}: {source}")
            continue
        destination = OUTPUT / filename
        subset_font(source, destination, family, style)
        generated.add((family, style))
        print(f"{destination.name}: {destination.stat().st_size:,} bytes")

    for family, styles in REQUESTED_STYLES.items():
        for style in styles:
            if (family, style) not in generated:
                print(f"Missing style: {family} {style}")
    for item in missing:
        print(f"Missing source: {item}")


if __name__ == "__main__":
    main()
