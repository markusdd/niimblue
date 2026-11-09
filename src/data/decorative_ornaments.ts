/** Original printable vector ornaments. Each element is independent of a frame. */
export interface DecorativeOrnament {
  id: string;
  name: string;
  keywords: string;
  viewBox: string;
  svg: string;
}

const path = (d: string, filled = false) => `<path d="${d}"${filled ? ' fill="#000" stroke-width="0.7"' : ""}/>`;
const mirror = (drawing: string, width = 240) =>
  drawing + `<g transform="translate(${width} 0) scale(-1 1)">${drawing}</g>`;
const entry = (
  id: string,
  name: string,
  width: number,
  height: number,
  drawing: string,
  words: string,
): DecorativeOrnament => ({
  id,
  name,
  keywords: `${words} ornament decoration flourish scroll vintage ornate schnörkel schnoerkel verzierung dekor`,
  viewBox: `0 0 ${width} ${height}`,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`,
});

const scrollWing = path(
  "M 12 45 C 38 65 61 14 91 32 C 112 45 95 62 86 48 C 82 41 88 35 94 39 M 22 47 C 48 49 65 18 91 27 M 58 37 C 57 23 42 18 39 28 C 37 36 46 38 49 31",
);
const acanthusCorner =
  path(
    "M 10 109 L 10 10 L 109 10 M 17 103 L 17 17 L 103 17 M 20 94 C 41 76 24 46 43 30 C 58 17 79 26 75 41 C 72 53 57 51 59 41 C 61 34 69 36 68 41 M 26 75 C 48 74 65 65 65 53 M 31 53 C 32 33 46 20 57 22",
  ) +
  path(
    "M 24 85 C 44 89 52 76 52 65 C 43 68 37 71 35 78 C 35 63 29 55 22 51 C 25 65 23 72 24 85 Z M 44 29 C 43 17 57 17 62 20 C 53 23 52 28 44 29 Z M 80 24 C 89 23 95 29 94 37 C 85 37 80 32 80 24 Z",
    true,
  );
const rose = path(
  "M 59 23 C 47 10 36 17 39 29 C 23 24 20 39 32 45 C 19 55 29 68 42 60 C 45 75 61 69 61 56 C 75 63 84 47 71 40 C 81 27 68 16 59 23 Z M 49 32 C 38 34 39 47 48 51 C 57 57 66 47 61 39 C 57 32 49 37 49 43 C 49 47 55 48 57 44 M 36 31 C 35 41 38 47 44 49 M 63 26 C 69 33 67 38 64 41 M 35 57 C 45 58 48 56 50 53",
);
const knot = path(
  "M 120 40 C 96 4 70 11 77 32 C 84 52 117 49 139 29 C 166 5 181 17 170 35 C 153 61 119 27 102 21 C 79 13 77 39 99 43 C 126 50 144 17 160 21 M 120 40 C 129 48 129 57 120 63 C 111 57 111 48 120 40",
);

export const DECORATIVE_ORNAMENTS: DecorativeOrnament[] = [
  entry(
    "acanthus-corner",
    "Acanthus corner",
    120,
    120,
    acanthusCorner,
    "corner asymmetric leaf ecke asymmetrisch akanthus blatt",
  ),
  entry(
    "rose-corner",
    "Rose corner",
    120,
    120,
    path(
      "M 12 108 C 11 69 19 40 46 23 M 12 108 C 52 109 86 92 108 67 M 20 87 C 34 87 41 79 46 66 M 46 101 C 48 88 60 80 72 77",
    ) +
      `<g transform="translate(10 5) scale(.9)">${rose}</g>` +
      path("M 21 79 C 9 65 15 51 26 46 C 34 57 31 72 21 79 Z M 61 93 C 64 75 80 72 91 76 C 84 89 72 94 61 93 Z", true),
    "corner asymmetric rose floral ecke asymmetrisch blume rose",
  ),
  entry(
    "lyre-corner",
    "Lyre corner",
    120,
    120,
    path(
      "M 12 108 L 12 12 L 108 12 M 21 100 L 21 21 L 100 21 M 28 85 C 61 87 93 66 88 41 C 84 21 61 26 64 41 C 66 50 77 49 76 41 M 27 66 C 39 69 47 57 42 48 C 35 37 25 44 29 52 M 48 28 C 51 38 49 46 44 50",
    ) + path("M 28 28 C 36 25 42 29 44 36 C 36 39 30 36 28 28 Z", true),
    "corner lyre geometric ecke asymmetrisch leier",
  ),
  entry(
    "vine-corner",
    "Climbing vine corner",
    120,
    120,
    path(
      "M 13 108 C 26 97 20 78 30 62 C 40 44 66 44 79 28 C 90 16 103 17 109 24 M 29 63 C 12 56 13 39 24 38 C 35 37 35 49 28 48 M 68 39 C 65 22 49 17 43 26 C 38 35 49 39 52 31 M 43 82 C 47 64 64 62 67 72 C 70 83 58 87 56 79",
    ) +
      path("M 25 85 C 36 88 44 82 46 71 C 34 70 28 75 25 85 Z M 77 29 C 75 17 85 9 96 10 C 93 21 86 27 77 29 Z", true),
    "corner vine climbing asymmetric ecke ranke asymmetrisch",
  ),
  entry(
    "quill-sweep",
    "Asymmetric quill sweep",
    200,
    90,
    path(
      "M 12 77 C 56 72 81 35 124 29 C 148 26 162 41 151 52 C 143 61 131 53 135 45 C 138 39 144 42 143 46 M 30 75 C 61 78 86 62 101 46 M 87 48 C 78 26 98 10 113 14 M 108 34 C 126 10 154 12 166 23 M 148 29 C 166 19 188 32 187 44 C 187 52 177 53 174 47",
    ) +
      path("M 42 65 C 47 48 58 37 74 35 C 69 48 60 57 42 65 Z M 90 43 C 77 38 78 22 84 17 C 91 25 94 33 90 43 Z", true),
    "asymmetric sweep quill feather side asymmetrisch feder seite",
  ),
  entry(
    "trailing-scroll",
    "Trailing side scroll",
    90,
    200,
    path(
      "M 21 188 C 49 168 17 145 30 120 C 46 89 73 99 70 76 C 68 58 45 65 50 79 C 53 87 61 83 60 77 M 29 145 C 53 143 64 126 54 116 C 46 106 32 116 39 125 M 40 110 C 23 92 21 66 33 43 C 45 19 67 20 72 35 C 76 48 60 53 58 42 M 32 43 C 21 42 16 32 21 25 M 38 33 C 40 21 47 13 58 10",
    ) +
      path(
        "M 28 164 C 13 153 15 140 23 134 C 29 144 33 154 28 164 Z M 33 57 C 44 54 53 58 55 67 C 44 72 36 66 33 57 Z",
        true,
      ),
    "asymmetric tall side scroll hanging asymmetrisch seite hoch",
  ),
  entry(
    "shell-spray",
    "Asymmetric shell spray",
    180,
    100,
    path(
      "M 12 87 C 44 84 54 60 80 56 C 105 51 120 68 110 78 C 101 86 91 76 97 70 M 53 70 C 47 50 57 26 77 22 C 95 19 101 39 88 44 C 79 47 75 36 83 33 M 78 55 C 96 22 125 23 137 32 C 150 42 140 55 132 48 M 118 58 C 139 61 151 54 168 38",
    ) +
      path(
        "M 60 51 C 40 47 37 32 42 22 C 56 29 62 38 60 51 Z M 107 33 C 102 18 114 9 127 12 C 123 24 117 30 107 33 Z",
        true,
      ),
    "asymmetric shell spray acanthus asymmetrisch muschel akanthus",
  ),
  entry(
    "ribbon-flourish",
    "Ribbon flourish",
    240,
    70,
    mirror(scrollWing),
    "divider symmetric ribbon trennlinie schleife symmetrisch",
  ),
  entry(
    "calligraphy-knot",
    "Calligraphy knot divider",
    240,
    76,
    knot + mirror(path("M 12 38 H 68 M 12 38 C 5 29 12 21 18 27 C 24 34 15 46 9 43 M 20 38 C 34 54 48 55 58 45")),
    "divider calligraphy knot trennlinie kalligrafie knoten",
  ),
  entry(
    "fleur-divider",
    "Fleur-de-lis divider",
    240,
    70,
    mirror(path("M 12 42 H 89 C 104 42 103 27 95 27 C 87 27 87 36 94 36 M 22 42 L 16 36 M 22 42 L 16 48")) +
      path(
        "M 120 50 C 109 36 110 22 120 10 C 130 22 131 36 120 50 Z M 117 43 C 100 40 101 20 109 24 C 117 27 113 36 117 43 Z M 123 43 C 140 40 139 20 131 24 C 123 27 127 36 123 43 Z M 115 50 L 120 60 L 125 50 Z",
        true,
      ) +
      path("M 111 47 H 129"),
    "divider fleur lily heraldic trennlinie lilie heraldisch",
  ),
  entry(
    "laurel-divider",
    "Laurel divider",
    240,
    76,
    mirror(
      path("M 12 42 H 72 C 88 43 104 53 120 61") +
        path(
          "M 81 43 C 77 31 83 22 91 21 C 94 31 90 39 81 43 Z M 94 47 C 93 34 100 28 108 29 C 109 39 104 46 94 47 Z M 101 53 C 90 57 82 53 80 46 C 90 43 96 46 101 53 Z M 114 59 C 103 67 93 64 91 57 C 101 52 109 54 114 59 Z",
          true,
        ),
    ),
    "divider laurel olive leaves trennlinie lorbeer blätter",
  ),
  entry(
    "heart-scroll",
    "Heart scroll divider",
    240,
    76,
    mirror(
      path(
        "M 12 45 C 35 64 62 20 88 32 C 103 39 97 58 85 52 C 77 48 82 39 88 42 M 120 62 C 96 47 104 16 116 23 C 122 27 118 35 114 33 M 21 47 C 42 48 57 24 72 21",
      ),
    ),
    "divider heart wedding love trennlinie herz hochzeit liebe",
  ),
  entry(
    "crown-finial",
    "Crown finial",
    120,
    80,
    path("M 25 53 L 17 23 L 36 37 L 43 17 L 60 35 L 77 17 L 84 37 L 103 23 L 95 53 Z M 27 59 H 93 M 29 65 H 91") +
      path("M 31 49 L 27 34 L 39 44 L 44 29 L 57 44 L 60 40 L 63 44 L 76 29 L 81 44 L 93 34 L 89 49 Z", true) +
      '<circle cx="17" cy="20" r="3" fill="#000"/><circle cx="43" cy="13" r="3" fill="#000"/><circle cx="77" cy="13" r="3" fill="#000"/><circle cx="103" cy="20" r="3" fill="#000"/>',
    "crown royal finial krone königlich abschluss",
  ),
  entry(
    "rose-medallion",
    "Rose medallion",
    120,
    100,
    `<g transform="translate(10 4)">${rose}</g>` +
      mirror(
        path(
          "M 60 84 C 49 76 29 79 15 67 M 37 77 C 32 64 22 60 13 61 C 18 72 25 78 37 77 Z M 49 81 C 42 92 30 93 23 87 C 32 80 40 78 49 81 Z",
        ),
        120,
      ),
    "rose medallion flower rosette rose medaillon blume",
  ),
];
