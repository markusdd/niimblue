import type { DecorativeOrnament } from "./decorative_ornaments";

type Collection = "artdeco" | "cyber";
type GeometricOrnament = DecorativeOrnament & { collection: Collection };

const ornament = (
  id: string,
  name: string,
  collection: Collection,
  width: number,
  height: number,
  drawing: string,
  keywords: string,
): GeometricOrnament => ({
  id,
  name,
  collection,
  keywords: `${keywords} ornament geometric geometrisch ${collection} ${collection === "artdeco" ? "art deco dekor" : "cyber scifi hud technik"}`,
  viewBox: `0 0 ${width} ${height}`,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`,
});

const line = (d: string) => `<path d="${d}"/>`;
const ink = (d: string) => `<path d="${d}" fill="#000" stroke-width="1"/>`;
const dot = (x: number, y: number, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" stroke="none"/>`;
const fanHalf = line(
  "M 18 79 C 64 73 91 55 110 22 M 35 80 C 67 76 94 63 110 37 M 56 81 C 82 77 101 68 110 51 M 79 81 C 95 79 104 73 110 66",
);

export const GEOMETRIC_ORNAMENTS: GeometricOrnament[] = [
  ornament(
    "deco-sunburst",
    "Deco sunburst",
    "artdeco",
    180,
    150,
    line(
      "M 17 117 L 38 117 L 38 100 L 54 100 L 54 83 L 70 83 L 70 66 L 86 66 L 86 49 L 102 49 L 102 66 L 118 66 L 118 83 L 134 83 L 134 100 L 150 100 L 150 117 L 163 117",
    ) +
      line("M 23 129 H 157 M 43 137 H 137") +
      ink("M 86 108 L 91 87 L 96 108 Z M 77 105 L 66 88 L 82 99 Z M 100 99 L 116 88 L 105 105 Z") +
      line(
        "M 91 79 V 34 M 75 80 L 58 44 M 107 80 L 124 44 M 60 90 L 36 63 M 122 90 L 146 63 M 48 106 L 25 91 M 134 106 L 157 91",
      ),
    "sun radial rays skyline sunrise fan stepped sonne strahlen sonnenaufgang fächer stufen",
  ),
  ornament(
    "deco-fan-sweep",
    "Deco fan sweep",
    "artdeco",
    220,
    100,
    fanHalf +
      `<g transform="translate(220 0) scale(-1 1)">${fanHalf}</g>` +
      line("M 18 87 H 202 M 43 93 H 177") +
      ink("M 110 13 L 115 22 L 110 31 L 105 22 Z"),
    "fan shell sweep arc scallop divider fächer muschel bogen trennlinie",
  ),
  ornament(
    "deco-stepped-wing",
    "Stepped wing",
    "artdeco",
    210,
    120,
    line(
      "M 16 88 H 44 V 73 H 69 V 58 H 92 V 43 H 114 V 28 H 137 V 15 H 194 M 16 98 H 51 V 83 H 76 V 68 H 99 V 53 H 121 V 38 H 144 V 25 H 194 M 16 108 H 58 V 93 H 83 V 78 H 106 V 63 H 128 V 48 H 151 V 35 H 194",
    ),
    "wing stepped stair flight rays ascending flügel stufen treppe aufsteigend",
  ),
  ornament(
    "deco-orbit-pendant",
    "Orbit pendant",
    "artdeco",
    120,
    180,
    line(
      "M 60 13 V 38 M 49 18 H 71 M 60 38 C 40 54 35 74 60 91 C 85 74 80 54 60 38 Z M 60 49 V 80 M 45 64 H 75 M 48 53 L 72 75 M 72 53 L 48 75 M 60 91 C 37 108 34 131 60 155 C 86 131 83 108 60 91 Z M 60 103 V 143 M 46 121 H 74 M 50 110 L 70 132 M 70 110 L 50 132 M 43 158 H 77 M 49 166 H 71",
    ) + ink("M 60 84 L 54 91 L 60 98 L 66 91 Z M 60 148 L 50 157 L 60 166 L 70 157 Z"),
    "pendant orbit jewel elongated vertical diamond anhänger juwel raute senkrecht",
  ),
  ornament(
    "deco-diamond-cascade",
    "Diamond cascade",
    "artdeco",
    150,
    190,
    line(
      "M 75 14 L 105 44 L 75 74 L 45 44 Z M 75 25 L 94 44 L 75 63 L 56 44 Z M 75 74 V 94 M 75 94 L 101 120 L 75 146 L 49 120 Z M 75 103 L 92 120 L 75 137 L 58 120 Z M 75 146 V 164 M 75 164 L 95 184 L 115 164 L 95 144 Z M 75 164 L 55 184 L 35 164 L 55 144 Z",
    ) + ink("M 75 31 L 88 44 L 75 57 L 62 44 Z M 75 109 L 86 120 L 75 131 L 64 120 Z"),
    "diamond cascade jewel drop angular vertical raute kaskade juwel tropfen",
  ),
  ornament(
    "deco-speed-lines",
    "Deco speed lines",
    "artdeco",
    240,
    100,
    line("M 15 27 H 71 M 15 37 H 99 M 15 47 H 127 M 15 57 H 155 M 15 67 H 183 M 15 77 H 211 M 62 87 H 225") +
      [0, 1, 2].map((i) => line(`M ${122 + i * 14} ${23 - i * 8} l 36 24 h 32`)).join("") +
      ink("M 190 51 L 220 51 L 234 61 L 220 71 L 190 71 Z M 201 55 L 218 55 L 225 61 L 218 67 L 201 67 Z"),
    "speed motion stripes streamline racing horizontal geschwindigkeit streifen bewegung waagerecht",
  ),
  ornament(
    "cyber-reticle",
    "Cyber reticle",
    "cyber",
    170,
    170,
    line(
      "M 82 15 V 45 M 82 125 V 155 M 15 82 H 45 M 125 82 H 155 M 31 31 L 51 51 M 113 113 L 133 133 M 133 31 L 113 51 M 51 113 L 31 133 M 61 61 L 103 103 M 103 61 L 61 103",
    ) +
      `<circle cx="82" cy="82" r="39"/><circle cx="82" cy="82" r="23"/>` +
      ink("M 82 68 L 96 82 L 82 96 L 68 82 Z") +
      dot(82, 15) +
      dot(155, 82) +
      dot(82, 155) +
      dot(15, 82),
    "reticle target crosshair radar aim fadenkreuz ziel radar",
  ),
  ornament(
    "cyber-signal-spine",
    "Signal spine",
    "cyber",
    100,
    210,
    line(
      "M 50 12 V 194 M 50 35 H 26 V 54 H 13 M 50 66 H 73 V 84 H 87 M 50 97 H 31 V 114 H 14 M 50 129 H 70 V 147 H 87 M 50 160 H 28 V 178 H 13",
    ) +
      [
        dot(50, 35),
        dot(50, 66),
        dot(50, 97),
        dot(50, 129),
        dot(50, 160),
        dot(13, 54),
        dot(87, 84),
        dot(14, 114),
        dot(87, 147),
        dot(13, 178),
      ].join("") +
      line(
        "M 41 22 H 59 M 41 188 H 59 M 23 48 L 29 54 L 23 60 M 77 78 L 83 84 L 77 90 M 23 108 L 29 114 L 23 120 M 77 141 L 83 147 L 77 153 M 22 172 L 28 178 L 22 184",
      ),
    "signal spine branching traces nodes vertical signal achse verzweigung knoten senkrecht",
  ),
  ornament(
    "cyber-circuit-spray",
    "Circuit spray",
    "cyber",
    190,
    150,
    line(
      "M 15 121 H 55 L 71 105 V 77 L 92 56 V 25 M 60 116 L 82 138 H 112 V 119 L 132 99 H 173 M 72 103 H 105 L 125 83 V 51 H 151 M 92 57 L 72 37 H 43 V 17 M 125 82 L 145 62 H 174 V 44",
    ) +
      [
        dot(55, 121),
        dot(71, 105),
        dot(92, 56),
        dot(82, 138),
        dot(112, 119),
        dot(132, 99),
        dot(105, 103),
        dot(125, 83),
        dot(151, 51),
        dot(72, 37),
        dot(43, 17),
        dot(145, 62),
        dot(174, 44),
      ].join("") +
      `<rect x="84" y="70" width="16" height="16" transform="rotate(45 92 78)"/>`,
    "circuit spray branch electronic trace nodes schaltkreis leiterbahn elektronik verzweigung",
  ),
  ornament(
    "cyber-data-stripe",
    "Data stripe",
    "cyber",
    220,
    110,
    line(
      "M 15 27 H 75 L 90 42 H 163 M 15 39 H 69 L 84 54 H 196 M 15 51 H 63 L 78 66 H 145 M 15 63 H 57 L 72 78 H 187 M 15 75 H 51 L 66 90 H 163 M 15 87 H 45 L 60 102 H 205",
    ) + ink("M 90 35 H 151 L 158 42 H 97 Z M 113 59 H 176 L 183 66 H 120 Z M 83 83 H 145 L 152 90 H 90 Z"),
    "data stripe barcode dash stream digital daten streifen datenstrom digital",
  ),
  ornament(
    "cyber-orbit-array",
    "Orbit array",
    "cyber",
    190,
    150,
    line(
      "M 21 75 C 42 27 137 22 169 66 C 142 113 56 128 21 75 Z M 22 75 C 61 93 121 83 169 66 M 42 43 C 75 67 115 80 150 103 M 46 106 C 72 76 107 54 144 41 M 95 31 V 119 M 54 48 L 137 101",
    ) +
      `<circle cx="95" cy="75" r="19"/><circle cx="57" cy="51" r="7"/><circle cx="142" cy="100" r="6"/>` +
      dot(21, 75, 3) +
      dot(169, 66, 3) +
      dot(95, 31, 3) +
      dot(95, 119, 3) +
      ink("M 95 67 L 103 75 L 95 83 L 87 75 Z"),
    "orbit array satellite network constellation umlaufbahn satellit netzwerk",
  ),
  ornament(
    "cyber-chevron-trail",
    "Chevron trail",
    "cyber",
    230,
    90,
    line(
      "M 15 16 H 61 L 85 45 L 61 74 H 15 M 47 16 H 93 L 117 45 L 93 74 H 47 M 79 16 H 125 L 149 45 L 125 74 H 79 M 111 16 H 157 L 181 45 L 157 74 H 111 M 143 16 H 189 L 213 45 L 189 74 H 143",
    ) +
      ink(
        "M 18 21 H 58 L 78 45 L 58 69 H 18 L 38 45 Z M 82 21 H 122 L 142 45 L 122 69 H 82 L 102 45 Z M 146 21 H 186 L 206 45 L 186 69 H 146 L 166 45 Z",
      ),
    "chevron trail arrow repeated forward motion pfeil spur vorwärts bewegung",
  ),
];
