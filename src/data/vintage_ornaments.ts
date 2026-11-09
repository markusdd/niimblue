import type { DecorativeOrnament } from "./decorative_ornaments";

/** Original engraved, postal and haberdashery motifs, independent of label frames. */
const path = (d: string, fill = "none") => `<path d="${d}" fill="${fill}"/>`;
const entry = (
  id: string,
  name: string,
  width: number,
  height: number,
  drawing: string,
  keywords: string,
): DecorativeOrnament => ({
  id,
  name,
  collection: "vintage",
  keywords: `vintage antique engraved ornament antik gravur verzierung ${keywords}`,
  viewBox: `0 0 ${width} ${height}`,
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`,
});
const ring = (cx: number, cy: number, radius: number) => `<circle cx="${cx}" cy="${cy}" r="${radius}"/>`;
const point = (value: number) => Math.round(value * 1000) / 1000;
const rosette = (radius: number, wave: number, turns: number, phase = 0) =>
  path(
    Array.from({ length: 361 }, (_, i) => {
      const angle = (i * Math.PI) / 180;
      const reach = radius + Math.sin(angle * turns + phase) * wave;
      return `${i ? "L" : "M"} ${point(60 + Math.cos(angle) * reach)} ${point(60 + Math.sin(angle) * reach)}`;
    }).join(" ") + " Z",
  );

export const VINTAGE_ORNAMENTS: DecorativeOrnament[] = [
  entry(
    "vintage-postmark",
    "Postal cancellation",
    180,
    100,
    ring(51, 50, 37) +
      ring(51, 50, 31) +
      path("M 30 50 H 72 M 39 43 H 63 M 39 57 H 63 M 27 28 L 31 32 M 71 68 L 75 72 M 27 72 L 31 68 M 71 32 L 75 28") +
      [26, 42, 58, 74]
        .map((y) => path(`M 96 ${y} C 109 ${y - 11} 122 ${y + 11} 135 ${y} S 159 ${y - 11} 172 ${y}`))
        .join(""),
    "postal cancellation stamp waves travel briefmarke poststempel wellen reise",
  ),
  entry(
    "vintage-wax-seal",
    "Wax seal",
    120,
    120,
    path("M 33 76 L 23 111 L 40 104 L 50 115 L 58 83 M 63 84 L 74 115 L 82 103 L 98 108 L 86 75") +
      path(
        Array.from({ length: 97 }, (_, i) => {
          const angle = (i * Math.PI) / 48;
          const reach = 38 + Math.cos(angle * 12) * 3;
          return `${i ? "L" : "M"} ${point(60 + Math.cos(angle) * reach)} ${point(49 + Math.sin(angle) * reach)}`;
        }).join(" ") + " Z",
      ) +
      ring(60, 49, 29) +
      ring(60, 49, 25) +
      path(
        "M 60 68 C 56 56 43 58 43 47 C 43 38 53 38 56 46 C 57 35 55 28 60 23 C 65 28 63 35 64 46 C 67 38 77 38 77 47 C 77 58 64 56 60 68 Z M 48 57 H 72",
        "#000",
      ),
    "wax seal ribbon heraldic siegel wachssiegel band wappen",
  ),
  entry(
    "vintage-engravers-sweep",
    "Engraver's swash",
    210,
    110,
    path(
      "M 11 94 C 58 90 71 21 117 19 C 153 17 150 57 126 60 C 104 63 102 37 119 34 C 130 33 136 46 126 49 M 25 92 C 59 98 95 72 127 76 C 154 80 167 98 186 78 C 196 66 187 52 176 58 C 169 62 174 70 180 65 M 20 87 C 51 72 72 20 103 13 M 57 69 C 50 51 55 33 70 32 C 81 32 82 46 73 49 C 64 53 61 43 67 40",
    ) +
      path(
        "M 21 85 C 46 63 56 35 82 22 C 61 39 57 62 34 81 Z M 120 77 C 144 75 157 91 172 86 C 153 99 143 83 120 77 Z",
        "#000",
      ) +
      [0, 1, 2, 3, 4, 5].map((i) => path(`M ${85 + i * 5} ${22 - i * 0.7} L ${88 + i * 5} ${27 - i * 0.7}`)).join(""),
    "calligraphy swash flourish pen asymmetrical kalligrafie schnörkel feder asymmetrisch",
  ),
  entry(
    "vintage-guilloche-rosette",
    "Guilloché rosette",
    120,
    120,
    rosette(41, 10, 10) +
      rosette(37, 10, 10, Math.PI) +
      ring(60, 60, 27) +
      ring(60, 60, 23) +
      path("M 60 43 L 64 56 L 77 60 L 64 64 L 60 77 L 56 64 L 43 60 L 56 56 Z", "#000"),
    "guilloche rosette banknote medallion star guilloché rosette banknote medaillon stern",
  ),
  entry(
    "vintage-tassel",
    "Silk tassel",
    80,
    180,
    path(
      "M 40 12 C 18 13 17 37 32 41 C 45 45 54 27 44 24 C 38 21 34 29 38 33 M 40 12 C 60 21 56 41 44 46 M 33 44 C 22 61 47 71 34 91 M 45 45 C 58 59 32 74 45 92 M 34 48 C 48 62 25 76 34 91 M 44 48 C 32 61 55 75 45 91 M 29 94 Q 40 87 51 94 L 52 104 Q 40 110 28 104 Z M 29 105 C 27 123 19 147 12 164 Q 40 177 68 164 C 61 147 53 123 51 105 M 33 110 C 32 131 26 149 23 166 M 39 112 L 37 169 M 45 111 C 47 135 51 151 55 167 M 31 98 H 49",
    ),
    "tassel silk braid hanging side textile quaste seide kordel hängend seite textil",
  ),
  entry(
    "vintage-ticket-stub",
    "Admission ticket",
    170,
    105,
    path(
      "M 18 12 H 152 V 28 C 137 28 137 46 152 46 V 59 C 137 59 137 77 152 77 V 93 H 18 V 77 C 33 77 33 59 18 59 V 46 C 33 46 33 28 18 28 Z M 37 22 H 133 M 37 83 H 133 M 62 38 H 119 M 62 49 H 111 M 62 61 H 116 M 62 72 H 99",
    ) +
      [28, 38, 48, 58, 68, 78].map((y) => path(`M 48 ${y} V ${y + 3}`)).join("") +
      path("M 130 53 L 134 57 L 130 61 L 126 57 Z", "#000"),
    "ticket admission stub perforated ephemera eintrittskarte fahrschein abriss perforation",
  ),
];
