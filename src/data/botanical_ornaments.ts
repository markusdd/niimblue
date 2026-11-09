/**
 * Original botanical line ornaments drawn for niimblue.
 * These vectors are original artwork and may be used and adapted with this project.
 */

export type BotanicalOrnament = {
  id: string;
  name: string;
  keywords: string;
  viewBox: string;
  svg: string;
};

const ornament = (id: string, name: string, drawing: string): BotanicalOrnament => ({
  id,
  name,
  keywords:
    {
      "olive-sprig": "olive olives olive branch twig botanical olive zweig olivenzweig pflanze blatt",
      "lavender-stem": "lavender lavender stem botanical lavendel stiel blume pflanze",
      "rosemary-sprig": "rosemary rosmarin herb needle leaves sprig kräuter nadeln zweig",
      "citrus-branch": "citrus lemon orange fruit branch zitrus zitrone orange frucht zweig",
      "wildflower-spray": "wildflower meadow flowers floral spray wildblume wiese blumen blüten blumenstrauß",
      "floral-corner": "floral corner flowers ornament blumenecke blumen ecke ornament",
      "artisan-leaf": "leaf branch botanical artisan leaves blatt zweig botanisch blätter",
      "fern-frond": "fern frond botanical fiddlehead farn wedel pflanze",
      "eucalyptus-stem": "eucalyptus stem leaves eucalyptus eukalyptus blätter zweig",
      "berry-branch": "berry branch berries botanical beeren zweig beere",
      "poppy-stem": "poppy flower stem botanical mohn mohnblume stiel",
      "chamomile-sprig": "chamomile daisy flower wildflower kamille margerite blüte",
      "fern-corner": "fern corner botanical farn ecke wedel ornament",
      "asymmetric-side-spray": "asymmetric side sprig botanical floral seitenzweig blatt",
      "laurel-arc": "laurel branch leaves wreath lorbeer kranz blätter",
      "cosmos-stem": "cosmos flower stem wildflower kosmee blume stiel",
      "seedhead-grass": "seedhead grass botanical meadow samenstand gras wiese",
    }[id] ?? "botanical plant pflanze floral blume",
  viewBox: "0 0 124 160",
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 160" fill="none" stroke="#000" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`,
});

export const BOTANICAL_ORNAMENTS: BotanicalOrnament[] = [
  ornament(
    "olive-sprig",
    "Olive sprig",
    `
    <path d="M59 148C58 126 63 111 60 93C57 74 48 56 34 39"/>
    <path d="M60 105C70 91 82 83 96 78M58 91C48 80 38 73 26 68M60 121C72 111 82 106 94 104M57 77C67 66 76 60 86 57M51 65C43 53 35 47 26 43"/>
    <path d="M93 78C83 74 76 77 72 86C81 88 89 85 93 78ZM27 68C35 63 42 65 47 73C39 77 31 75 27 68ZM92 104C84 99 77 101 72 109C79 113 88 111 92 104ZM85 57C77 52 70 54 66 62C73 66 81 64 85 57ZM27 43C35 40 41 43 44 51C37 54 30 51 27 43Z" fill="#fff"/>
    <path d="M74 84C79 82 85 80 91 79M30 69C35 69 40 71 44 73M74 108C79 106 85 105 90 104M68 61C73 59 78 58 83 57M30 45C35 46 39 48 42 50"/>
    <ellipse cx="48" cy="57" rx="2.2" ry="3.2" transform="rotate(-35 48 57)" fill="#fff"/>
    <ellipse cx="67" cy="70" rx="2.2" ry="3.2" transform="rotate(33 67 70)" fill="#fff"/>
    <ellipse cx="67" cy="96" rx="2.2" ry="3.2" transform="rotate(28 67 96)" fill="#fff"/>
  `,
  ),

  ornament(
    "lavender-stem",
    "Lavender stem",
    `
    <path d="M58 149C62 121 57 95 61 68C63 52 67 37 72 22"/>
    <path d="M59 125C50 117 43 110 38 101M60 112C68 105 74 98 78 89M60 96C51 89 46 82 43 74M62 81C69 75 74 68 77 61"/>
    <path d="M72 24C66 20 66 15 71 11C76 14 77 19 72 24ZM68 32C61 30 59 25 63 20C69 22 71 27 68 32ZM74 39C68 35 69 30 74 27C79 31 79 36 74 39ZM66 47C60 43 61 38 66 35C72 38 72 43 66 47ZM72 54C66 51 67 45 72 43C77 46 77 51 72 54ZM63 61C58 57 59 52 64 49C69 53 68 58 63 61ZM70 68C64 66 64 60 69 58C75 61 75 65 70 68Z" fill="#fff"/>
    <path d="M70 22L72 16M65 29L65 24M73 37L74 32M64 44L65 39M71 52L72 47M62 58L63 54M69 66L70 62"/>
    <path d="M39 102C43 105 47 110 50 115M77 90C73 95 68 100 63 104M44 75C48 79 52 84 55 88M76 62C73 67 69 71 64 75"/>
    <path d="M50 115C42 114 37 109 38 101C46 103 50 108 50 115ZM63 104C64 96 70 91 78 89C78 97 72 102 63 104ZM55 88C47 87 43 82 43 74C51 76 55 81 55 88ZM64 75C65 68 70 63 77 61C77 68 72 73 64 75Z" fill="#fff"/>
  `,
  ),

  ornament(
    "rosemary-sprig",
    "Rosemary sprig",
    `
    <g stroke-width="1.3"><path d="M52 148C62 115 57 62 70 17"/><path d="M58.073 111.094C45 96 32 74 27 51"/><path d="M59.682 89.753C79 80 94 59 100 40"/><path d="M59.78 88.38C58.24 83.91 52.52 78.46 49.63 76.36C52.14 81.45 56.90 86.69 59.78 88.38Z" fill="#fff"/><path d="M59.89 86.72C64.32 85.06 69.61 79.19 71.63 76.25C66.61 78.90 61.50 83.80 59.89 86.72Z" fill="#fff"/><path d="M60.59 77.26C58.70 72.32 52.33 66.00 49.16 63.52C52.11 69.20 57.45 75.22 60.59 77.26Z" fill="#fff"/><path d="M60.72 75.58C65.61 73.56 71.77 67.02 74.16 63.79C68.56 66.89 62.68 72.39 60.72 75.58Z" fill="#fff"/><path d="M61.55 65.99C60.22 61.61 54.80 56.23 52.04 54.17C54.31 59.16 58.78 64.32 61.55 65.99Z" fill="#fff"/><path d="M61.71 64.29C66.06 62.85 71.30 57.30 73.30 54.49C68.36 56.88 63.31 61.48 61.71 64.29Z" fill="#fff"/><path d="M62.76 54.65C61.79 50.56 56.95 45.62 54.44 43.74C56.26 48.39 60.21 53.14 62.76 54.65Z" fill="#fff"/><path d="M62.97 52.95C67.03 51.88 71.85 46.93 73.68 44.38C69.07 46.31 64.41 50.37 62.97 52.95Z" fill="#fff"/><path d="M64.31 43.32C62.99 38.50 57.44 32.14 54.61 29.61C56.89 35.20 61.47 41.22 64.31 43.32Z" fill="#fff"/><path d="M64.58 41.63C69.38 40.20 75.62 34.51 78.08 31.63C72.54 34.03 66.62 38.74 64.58 41.63Z" fill="#fff"/><path d="M66.32 32.10C65.12 27.07 59.69 20.18 56.89 17.41C59.04 23.29 63.50 29.76 66.32 32.10Z" fill="#fff"/><path d="M66.67 30.43C71.68 29.13 78.45 23.56 81.16 20.71C75.33 22.98 68.95 27.57 66.67 30.43Z" fill="#fff"/><path d="M68.52 22.44C68.02 18.14 63.74 12.40 61.45 10.12C62.74 15.11 66.15 20.53 68.52 22.44Z" fill="#fff"/><path d="M68.95 20.80C73.24 20.22 78.89 15.83 81.13 13.49C76.17 14.88 70.82 18.38 68.95 20.80Z" fill="#fff"/><path d="M47.28 96.92C43.78 94.59 36.78 93.90 33.61 94.02C38.14 96.26 44.34 97.33 47.28 96.92Z" fill="#fff"/><path d="M46.84 96.25C49.09 92.69 49.62 85.68 49.42 82.51C47.29 87.09 46.36 93.32 46.84 96.25Z" fill="#fff"/><path d="M42.23 88.86C38.36 86.17 30.49 84.80 26.91 84.61C31.94 87.30 38.89 88.98 42.23 88.86Z" fill="#fff"/><path d="M41.81 88.14C44.41 84.21 45.60 76.32 45.71 72.74C43.14 77.82 41.61 84.81 41.81 88.14Z" fill="#fff"/><path d="M37.57 80.28C34.52 77.56 27.89 76.08 24.84 75.84C28.88 78.57 34.69 80.34 37.57 80.28Z" fill="#fff"/><path d="M37.19 79.52C39.84 76.41 41.17 69.75 41.35 66.69C38.71 70.80 37.06 76.64 37.19 79.52Z" fill="#fff"/><path d="M33.45 71.27C30.92 68.49 25.02 66.80 22.24 66.46C25.67 69.28 30.81 71.24 33.45 71.27Z" fill="#fff"/><path d="M33.12 70.48C35.84 67.90 37.41 61.96 37.69 59.18C34.94 62.67 33.10 67.84 33.12 70.48Z" fill="#fff"/><path d="M29.98 61.94C27.01 58.62 20.04 55.83 16.77 54.99C20.81 58.52 26.87 61.44 29.98 61.94Z" fill="#fff"/><path d="M29.72 61.13C32.98 58.08 35.62 51.06 36.39 47.77C32.94 51.89 30.15 58.00 29.72 61.13Z" fill="#fff"/><path d="M27.47 53.07C24.64 49.42 17.67 45.92 14.37 44.75C18.29 48.71 24.31 52.26 27.47 53.07Z" fill="#fff"/><path d="M27.28 52.24C30.86 49.33 34.22 42.30 35.33 38.97C31.45 42.97 28.02 49.06 27.28 52.24Z" fill="#fff"/><path d="M75.78 78.30C77.51 74.46 77.05 67.44 76.41 64.33C74.94 69.16 74.89 75.46 75.78 78.30Z" fill="#fff"/><path d="M76.36 77.74C80.26 79.33 87.26 78.60 90.34 77.84C85.46 76.56 79.16 76.75 76.36 77.74Z" fill="#fff"/><path d="M82.28 71.48C83.54 66.94 82.26 59.06 81.26 55.62C80.37 61.25 81.06 68.37 82.28 71.48Z" fill="#fff"/><path d="M82.80 70.86C87.38 71.96 95.21 70.38 98.61 69.25C92.95 68.58 85.86 69.53 82.80 70.86Z" fill="#fff"/><path d="M88.02 64.02C88.94 60.04 87.07 53.51 85.81 50.71C85.36 55.57 86.58 61.52 88.02 64.02Z" fill="#fff"/><path d="M88.48 63.36C92.49 64.12 98.94 62.01 101.69 60.66C96.82 60.38 90.92 61.82 88.48 63.36Z" fill="#fff"/><path d="M92.95 56.14C93.57 52.44 91.24 46.75 89.79 44.36C89.69 48.81 91.34 54.05 92.95 56.14Z" fill="#fff"/><path d="M93.33 55.45C97.05 55.94 102.65 53.40 104.98 51.87C100.54 51.93 95.36 53.77 93.33 55.45Z" fill="#fff"/><path d="M96.96 48.06C96.95 43.60 93.59 36.89 91.70 34.09C92.38 39.42 94.96 45.62 96.96 48.06Z" fill="#fff"/><path d="M97.26 47.37C101.72 47.19 108.31 43.58 111.03 41.60C105.73 42.47 99.63 45.28 97.26 47.37Z" fill="#fff"/><path d="M99.63 41.14C99.14 36.55 95.07 29.90 92.88 27.17C94.12 32.60 97.37 38.79 99.63 41.14Z" fill="#fff"/><path d="M99.85 40.46C104.42 39.80 110.91 35.47 113.56 33.19C108.18 34.63 102.12 38.11 99.85 40.46Z" fill="#fff"/></g>
  `,
  ),

  ornament(
    "citrus-branch",
    "Citrus branch",
    `
    <path d="M38 148Q42 143 46 138C50 131 54 128 57 120C60 113 62 106 64 98C66 91 66 85 65 78C64 70 66 61 68 54C70 48 72 43 73 39C76 34 78 29 78 24"/><path d="M57 120Q49.5 119 42 116"/><path d="M42 116C40.49 106.01 26.45 98.21 15 101C19.99 111.09 34.07 117.55 42 116Z" fill="#fff"/><path d="M42 116Q27.15 107.75 18.51 102.95" stroke-width="1"/><path d="M65 78Q72.5 74 80 71"/><path d="M80 71C88.69 75.50 101.69 68.74 105 58C94.55 56.22 82.60 63.79 80 71Z" fill="#fff"/><path d="M80 71Q93.75 63.85 101.75 59.69" stroke-width="1"/><path d="M68 54Q62.0 47 56 44"/><path d="M56 44C57.66 34.34 47.26 23.94 36 24C37.47 34.53 48.32 43.68 56 44Z" fill="#fff"/><path d="M56 44Q45.00 33.00 38.60 26.60" stroke-width="1"/><path d="M73 39Q79.0 38 85 35"/><path d="M85 35C93.51 37.94 105.99 30.14 109 20C98.83 19.75 87.39 28.14 85 35Z" fill="#fff"/><path d="M85 35Q98.20 26.75 105.88 21.95" stroke-width="1"/><path d="M78 24C82.30 18.93 79.70 9.57 73 6C70.26 12.58 73.56 21.36 78 24Z" fill="#fff"/><path d="M78 24Q75.25 14.10 73.65 8.34" stroke-width="1"/><path d="M46 138Q52.0 138 58 135"/><path d="M58 135C65.38 135.90 73.18 127.58 73 119C65.00 120.52 58.15 129.13 58 135Z" fill="#fff"/><path d="M58 135Q66.25 126.20 71.05 121.08" stroke-width="1"/><path d="M64 98C72 96 78 98 83 105M65 78C57 67 48 59 38 58"/><path d="M83 105C88 108 98 107 103 117C108 128 103 136 100 138L98 142L94 139C83 139 77 130 77 120C77 114 80 110 81 108Z" fill="#fff"/><path d="M38 58C39 64 46 65 45 74C44 82 35 88 28 87L24 90L23 86C17 82 19 72 24 66C28 62 33 61 35 59Z" fill="#fff"/><path d="M79 105Q81 102 83 105Q86 103 88 106L83 109ZM34 58Q36 55 38 58Q41 55 42 58L38 62Z" fill="#fff" stroke-width="1.2"/><path d="M82 117C80 125 85 132 90 134M24 76C25 70 29 67 32 66" stroke-width="1"/>
  `,
  ),

  ornament(
    "wildflower-spray",
    "Wildflower spray",
    `
    <path d="M58 148C58 128 55 112 48 96C41 80 33 69 24 59M58 137C68 119 75 102 81 84C85 72 88 58 88 44M55 119C43 111 31 105 17 102M68 116C80 109 94 105 106 104M48 96C55 89 61 81 65 73"/>
    <path d="M17 102C13 97 14 91 19 89C23 94 22 99 17 102ZM106 104C104 98 107 93 112 92C115 97 112 102 106 104ZM65 73C61 68 62 62 67 60C71 65 70 70 65 73Z" fill="#fff"/>
    <path d="M25 57L22 48M87 42L89 33M18 100L18 93M105 102L111 96M65 71L66 64"/>
    <path d="M35 78C30 73 31 67 36 64C41 68 40 74 35 78Z" fill="#fff"/>
    <path d="M35 75L36 68M81 94C76 90 77 84 82 81C87 85 86 91 81 94Z" fill="#fff"/>
    <path d="M81 91L82 85M32 107C27 101 28 96 34 94C38 99 37 104 32 107Z" fill="#fff"/>
    <path d="M33 104L33 97M91 111C87 106 89 101 95 100C98 105 96 109 91 111Z" fill="#fff"/>
    <path d="M92 108L94 103"/>
    <path d="M16 90C13 85 16 81 21 81C24 86 22 90 17 92C13 90 11 86 14 82C18 83 19 86 17 90ZM112 93C113 88 117 86 121 89C121 94 117 97 112 96C109 93 109 89 112 86C116 87 117 90 114 94ZM66 61C63 56 66 52 71 52C74 56 72 61 67 63C63 61 61 57 64 53C68 54 69 57 67 61Z" fill="#fff"/>
    <circle cx="17" cy="87" r="1.35" fill="#000" stroke="none"/><circle cx="114" cy="91" r="1.35" fill="#000" stroke="none"/><circle cx="67" cy="57" r="1.35" fill="#000" stroke="none"/>
    <path d="M22 44C20 39 21 35 24 34C28 37 28 41 24 44C29 42 33 43 34 46C31 50 27 50 24 46C26 51 25 55 22 56C18 53 18 49 22 46C17 48 13 47 12 44C15 40 19 40 22 44Z" fill="#fff"/>
    <circle cx="22.5" cy="45" r="1.45" fill="#000" stroke="none"/>
    <path d="M89 27C86 23 86 19 89 17C93 19 94 23 91 27C95 24 99 24 101 27C99 31 95 32 91 29C94 33 94 37 91 39C87 37 86 33 89 29C85 32 81 32 79 29C81 25 85 24 89 27Z" fill="#fff"/>
    <circle cx="90" cy="28" r="1.45" fill="#000" stroke="none"/>
  `,
  ),

  ornament(
    "floral-corner",
    "Paired floral corner",
    `
    <path d="M14 146C15 116 25 93 45 74C60 60 78 49 105 42M15 146C43 145 66 138 83 122C99 107 108 88 112 59"/>
    <path d="M33 91C24 83 23 73 30 65C40 71 42 81 33 91ZM51 70C46 59 50 50 60 46C66 56 63 65 51 70ZM78 54C78 43 85 36 96 37C97 48 90 54 78 54ZM83 122C72 117 68 108 73 98C84 101 88 111 83 122ZM103 94C92 91 87 82 91 72C102 74 107 84 103 94ZM109 68C100 62 98 52 104 43C114 49 116 59 109 68Z" fill="#fff"/>
    <path d="M34 87C32 79 31 73 31 68M53 67C54 60 57 54 60 49M80 51C85 45 90 41 94 39M80 119C77 111 76 105 75 101M100 91C97 84 95 79 94 75M108 65C106 57 105 51 105 46"/>
    <path d="M34 91C44 92 52 90 58 85M51 70C59 75 64 81 67 88M78 54C81 63 81 71 79 78M83 122C91 122 98 120 104 115M103 94C109 97 113 102 116 108M109 68C115 74 118 80 119 87"/>
    <path d="M58 85C54 77 57 69 65 66C71 73 69 81 62 86C54 88 48 84 47 76C54 74 60 78 62 86Z" fill="#fff"/>
    <path d="M64 70C63 76 62 81 61 85M62 86C57 82 53 79 50 77M64 84C66 79 67 75 67 70"/>
    <path d="M104 115C103 108 107 103 114 103C117 110 113 115 106 117C100 116 97 111 99 105C105 106 108 111 106 117Z" fill="#fff"/>
    <path d="M101 108L106 115M105 113L113 106"/>
  `,
  ),

  ornament(
    "artisan-leaf",
    "Artisan leaf branch",
    `
    <path d="M18 132C38 122 50 108 58 90C67 69 75 47 101 28M39 116C32 104 27 93 26 79M55 96C45 85 39 73 38 59M67 70C79 69 91 65 101 57M78 52C70 42 66 31 68 20"/>
    <path d="M26 79C18 73 17 63 23 56C32 62 34 71 26 79ZM38 59C30 52 30 42 37 35C46 42 46 51 38 59ZM101 57C100 47 106 40 116 40C118 50 112 57 102 59ZM68 24C60 18 61 10 68 5C76 10 77 18 68 24Z" fill="#fff"/>
    <path d="M26 76C25 69 24 64 24 59M38 56C37 48 37 43 38 39M103 56C108 51 111 47 114 43M68 21C67 16 67 12 68 8"/>
    <path d="M39 116C49 117 57 115 63 110M55 96C64 100 71 104 77 111M67 70C69 81 68 90 64 98M78 52C88 52 97 50 105 46"/>
    <path d="M63 110C59 102 62 94 70 91C76 99 74 106 67 111C59 113 53 109 52 101C59 99 65 103 67 111Z" fill="#fff"/>
    <path d="M68 95C67 101 67 106 66 110M65 109C61 105 58 103 55 102M68 108C71 103 72 99 72 95"/>
    <path d="M77 111C79 103 86 99 94 102C93 111 87 116 78 114C72 109 72 102 77 97C84 101 85 108 78 114Z" fill="#fff"/>
    <path d="M77 101C78 105 78 110 78 113M80 110C84 106 88 104 92 103"/>
    <path d="M51 105C46 109 41 112 36 114M60 88C56 83 52 78 49 72M72 61C78 58 85 56 92 54"/>
  `,
  ),

  ornament(
    "fern-frond",
    "Fern frond",
    `
    <path d="M27 150C43 132 58 116 70 97C83 76 91 53 93 29C94 21 93 14 92 8"/>
    <path d="M38 137C29 136 20 132 13 125C23 122 33 125 40 132ZM43 132C36 123 31 114 29 104C39 109 45 118 47 128ZM49 124C40 119 32 112 26 103C37 104 46 110 53 120ZM53 119C47 109 43 99 43 89C52 96 57 105 57 115ZM58 110C48 103 42 95 38 85C49 89 57 97 62 107ZM63 101C56 91 53 81 54 71C62 79 67 88 67 98ZM68 92C61 83 58 73 59 63C68 70 73 79 73 89ZM74 80C69 70 67 60 69 50C77 58 80 67 79 77ZM80 67C76 57 76 47 79 38C86 47 88 56 85 65ZM85 53C83 43 84 34 88 25C94 34 95 43 90 52Z" fill="#fff"/>
    <path d="M40 134L16 127M45 128L31 107M51 120L29 106M56 114L45 92M61 107L41 88M66 98L56 74M72 89L61 66M78 77L71 53M84 65L81 41M90 52L90 29" stroke-width="1.05"/>
    <path d="M92 10C87 7 87 3 91 1C96 4 96 8 92 10Z" fill="#fff"/><path d="M92 8L92 3" stroke-width="1"/>
    <path d="M28 149C24 153 20 156 16 158M35 141L30 153" stroke-width="1"/>
  `,
  ),

  ornament(
    "eucalyptus-stem",
    "Eucalyptus stem",
    `
    <path d="M58 150C62 127 59 106 64 86C69 64 79 43 94 18"/>
    <path d="M61 126C51 119 42 113 34 108M62 112C73 106 84 101 94 95M63 96C52 90 44 83 38 76M67 80C78 77 87 71 95 64M73 62C64 56 58 49 54 42M81 45C89 41 96 35 101 29"/>
    <circle cx="30" cy="105" r="6.8" fill="#fff"/><circle cx="99" cy="92" r="6.8" fill="#fff"/>
    <circle cx="34" cy="73" r="6.7" fill="#fff"/><circle cx="101" cy="61" r="6.8" fill="#fff"/>
    <circle cx="50" cy="38" r="6.6" fill="#fff"/><circle cx="108" cy="26" r="6.6" fill="#fff"/>
    <path d="M25 108L35 102M95 95L103 89M29 76L39 70M97 64L105 58M46 41L54 35M104 29L112 23" stroke-width=".95"/>
    <path d="M60 137C52 133 47 129 44 123M61 121C70 117 76 112 80 107" stroke-width="1.1"/>
  `,
  ),

  ornament(
    "berry-branch",
    "Berry branch",
    `
    <path d="M26 145C41 125 53 106 62 85C70 66 78 45 95 20M54 103C43 95 32 88 21 82M65 79C78 77 91 77 105 80M75 55C64 47 55 39 48 29M84 38C92 37 101 38 111 42"/>
    <path d="M21 82C20 74 25 68 33 68C37 76 33 82 26 84C24 84 22 83 21 82ZM105 80C105 72 111 67 119 69C121 77 117 83 110 84C108 83 106 82 105 80ZM48 29C48 22 53 17 61 18C64 26 60 31 53 32C51 32 49 31 48 29ZM111 42C114 35 119 33 123 38C123 46 120 50 114 48C112 47 111 45 111 42Z" fill="#fff"/>
    <path d="M30 83L25 72M110 81L116 73M55 31L51 22M115 44L123 39" stroke-width="1"/>
    <path d="M60 88C51 81 47 73 49 63C59 66 64 74 62 84M72 65C80 56 89 54 98 59C92 68 83 70 74 67M39 122C31 119 25 113 23 104C33 104 40 110 41 119" fill="#fff"/>
    <path d="M57 83L51 67M75 65L94 60M37 117L26 107" stroke-width="1"/>
    <path d="M94 20C96 15 99 12 103 10M103 21C108 17 113 16 117 18" stroke-width="1.2"/>
    <circle cx="101" cy="10" r="5.1" fill="#fff"/><circle cx="112" cy="17" r="5" fill="#fff"/><circle cx="118" cy="28" r="5" fill="#fff"/><circle cx="106" cy="31" r="5" fill="#fff"/>
    <circle cx="101" cy="10" r="1.1"/><circle cx="112" cy="17" r="1.1"/><circle cx="118" cy="28" r="1.1"/><circle cx="106" cy="31" r="1.1"/>
  `,
  ),

  ornament(
    "poppy-stem",
    "Poppy stem",
    `
    <path d="M58 150C60 127 58 108 63 89C66 76 69 67 73 58M61 117C51 111 44 104 39 95M62 102C71 97 78 90 83 82"/>
    <path d="M39 95C30 97 24 92 24 84C33 81 39 85 41 92C44 84 51 82 57 86C55 95 49 98 42 95C47 101 46 108 40 112C33 107 33 101 39 95Z" fill="#fff"/>
    <path d="M27 87C34 88 39 91 42 95M54 88L42 95M40 108L41 96" stroke-width="1"/>
    <path d="M83 82C74 82 69 76 71 68C80 67 85 72 85 79C89 71 96 69 102 74C99 82 93 85 86 82C91 88 89 95 82 98C76 92 77 86 83 82Z" fill="#fff"/>
    <path d="M74 72C80 75 84 78 85 82M99 76L85 82M83 95L84 83" stroke-width="1"/>
    <path d="M73 58C67 52 64 45 67 39C71 34 78 34 83 38C87 33 94 34 97 40C103 39 108 44 107 50C103 56 96 57 90 54C85 60 78 61 73 58Z" fill="#fff"/>
    <path d="M72 55C78 52 84 51 90 52C95 48 99 46 104 46M79 56L76 39M91 53L94 38" stroke-width="1"/>
    <circle cx="89" cy="49" r="3.1" fill="#fff"/><circle cx="89" cy="49" r="1"/>
    <path d="M57 149C52 153 48 156 44 158" stroke-width="1.2"/>
  `,
  ),

  ornament(
    "chamomile-sprig",
    "Chamomile sprig",
    `
    <path d="M61 149C58 128 59 111 62 94C64 79 65 64 62 49M61 120C49 115 39 109 31 101M61 110C72 105 82 98 90 88M62 83C51 78 43 71 37 62M64 70C74 65 81 58 87 49"/>
    <g fill="#fff" stroke="#000" stroke-width="1.2">
      <ellipse cx="34" cy="96" rx="2" ry="6"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(45 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(90 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(135 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(180 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(225 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(270 34 101)"/><ellipse cx="34" cy="96" rx="2" ry="6" transform="rotate(315 34 101)"/><circle cx="34" cy="101" r="3.4"/>
      <ellipse cx="91" cy="83" rx="1.8" ry="5.5"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(45 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(90 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(135 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(180 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(225 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(270 91 88)"/><ellipse cx="91" cy="83" rx="1.8" ry="5.5" transform="rotate(315 91 88)"/><circle cx="91" cy="88" r="3.1"/>
      <ellipse cx="38" cy="57" rx="1.8" ry="5.4"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(45 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(90 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(135 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(180 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(225 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(270 38 62)"/><ellipse cx="38" cy="57" rx="1.8" ry="5.4" transform="rotate(315 38 62)"/><circle cx="38" cy="62" r="3.1"/>
      <ellipse cx="88" cy="44" rx="1.8" ry="5.3"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(45 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(90 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(135 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(180 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(225 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(270 88 49)"/><ellipse cx="88" cy="44" rx="1.8" ry="5.3" transform="rotate(315 88 49)"/><circle cx="88" cy="49" r="3"/>
    </g>
    <g fill="#000" stroke="none"><circle cx="34" cy="101" r=".8"/><circle cx="91" cy="88" r=".8"/><circle cx="38" cy="62" r=".8"/><circle cx="88" cy="49" r=".8"/></g>
  `,
  ),

  ornament(
    "fern-corner",
    "Fern corner",
    `
    <path d="M12 149C19 123 33 102 52 83C70 65 91 48 113 29M14 148C42 145 66 137 84 123C102 109 112 90 116 67"/>
    <path d="M25 119C19 110 16 101 17 91C27 97 32 106 30 115M39 100C32 92 28 83 27 73C37 79 43 88 43 96M56 82C49 73 46 64 47 55C57 62 61 71 60 78M75 64C70 54 69 45 72 36C81 44 84 53 80 61M94 47C91 38 92 29 97 21C104 30 105 39 99 45" fill="#fff"/>
    <path d="M29 114L19 95M42 95L30 77M59 77L50 58M78 60L75 39M97 43L99 24" stroke-width="1"/>
    <path d="M42 137C43 126 49 118 59 114C61 125 55 133 45 138M64 132C65 121 72 114 82 112C82 123 75 131 66 134M84 118C87 108 95 102 105 103C103 114 95 120 86 120M101 99C105 90 113 86 121 89C119 99 112 104 103 102" fill="#fff"/>
    <path d="M46 134L58 117M67 130L80 115M86 117L103 106M104 99L119 92" stroke-width="1"/>
    <path d="M12 149C9 153 6 156 3 158M14 148L8 139" stroke-width="1.2"/>
  `,
  ),

  ornament(
    "asymmetric-side-spray",
    "Asymmetric side spray",
    `
    <path d="M15 150C35 133 49 111 59 87C69 63 78 39 105 14M32 132C25 122 19 113 15 102M47 112C38 103 32 94 29 83M58 89C69 86 80 81 91 73M68 63C58 55 52 46 49 35M79 40C89 37 98 31 106 24"/>
    <path d="M15 102C8 100 5 93 8 86C16 87 20 93 18 100C24 95 31 96 34 102C30 109 24 110 18 104C20 112 16 117 9 117C5 111 8 105 15 102Z" fill="#fff"/>
    <path d="M29 83C22 79 21 72 26 66C33 70 35 76 31 82C38 79 44 82 45 88C39 94 33 93 29 86C29 94 24 98 17 96C14 89 19 84 29 83Z" fill="#fff"/>
    <path d="M91 73C88 65 92 59 100 58C104 66 101 72 94 75C102 74 107 79 106 86C98 89 93 85 93 77C90 85 83 87 78 82C79 74 84 71 91 73Z" fill="#fff"/>
    <path d="M49 35C43 30 44 23 50 19C56 24 57 30 52 35C59 33 64 37 64 43C58 48 52 45 51 39C48 46 42 47 38 42C40 35 44 33 49 35Z" fill="#fff"/>
    <path d="M106 24C103 17 107 11 114 11C118 18 115 24 109 26C116 25 120 30 118 36C111 39 106 35 107 28C103 34 97 35 93 30C96 24 101 22 106 24Z" fill="#fff"/>
    <path d="M13 113L13 89M29 91L27 69M94 82L101 62M51 41L51 22M108 31L113 14" stroke-width="1"/>
    <path d="M45 119C53 119 60 122 65 128M56 98C50 93 46 87 44 80M70 59C76 53 82 49 89 46" stroke-width="1.1"/>
  `,
  ),

  ornament(
    "laurel-arc",
    "Laurel arc",
    `
    <path d="M24 148C39 128 49 106 54 82C59 58 59 36 54 14M54 82C68 65 82 50 101 39M48 108C34 94 23 81 16 65M55 57C69 48 80 38 88 26"/>
    <path d="M48 112C41 104 34 96 28 87M52 96C42 89 35 82 29 73M55 78C45 72 38 66 33 57M57 60C49 53 45 45 42 36M57 42C52 34 50 26 50 18M53 127C43 121 35 114 29 106M60 74C68 66 77 59 86 53M65 59C75 53 83 46 90 38M72 52C80 45 86 37 91 29"/>
    <path d="M28 87C20 83 17 76 20 69C29 73 32 80 30 86C37 82 44 84 46 91C40 97 33 95 29 88ZM29 73C22 68 21 60 26 54C34 59 36 66 32 72C39 69 46 73 46 80C39 85 33 81 30 74ZM33 57C26 52 25 44 30 38C38 43 39 50 35 56C42 53 48 57 48 64C42 69 35 65 34 58ZM42 36C37 29 38 22 44 17C50 24 50 31 44 36C51 34 56 39 55 46C48 50 43 44 43 37ZM50 18C46 11 49 5 56 3C61 11 59 17 53 20C61 19 66 24 64 31C57 34 52 28 53 21Z" fill="#fff"/>
    <path d="M86 53C84 45 88 39 96 38C99 47 96 52 89 55C97 54 102 59 100 66C92 70 87 65 88 57C84 65 77 67 72 62C75 54 80 51 86 53ZM90 38C89 30 94 24 102 25C105 33 101 39 94 41C102 39 108 43 108 50C101 55 95 51 94 43C91 51 84 53 80 47C83 40 87 37 90 38ZM91 29C90 21 95 15 103 16C106 24 102 30 95 32C103 30 109 34 109 41C102 46 96 42 95 34C92 42 85 44 81 38C84 31 88 28 91 29Z" fill="#fff"/>
    <path d="M29 84L21 72M31 70L27 57M34 54L31 41M43 33L45 20M53 17L56 6M88 52L97 41M93 37L103 28M94 29L104 19" stroke-width="1"/>
    <path d="M24 148L19 155" stroke-width="1.1"/>
  `,
  ),

  ornament(
    "cosmos-stem",
    "Cosmos stem",
    `
    <path d="M59 150C61 126 57 106 62 86C65 74 70 62 75 52C78 45 82 40 88 36M60 121C53 116 48 110 45 102M61 108C68 103 73 98 78 91M62 86C54 80 50 74 47 67M68 68C61 64 57 59 54 53"/>
    <path d="M45 102C39 97 34 92 31 86M45 102C43 94 43 88 45 81M45 102C36 101 30 101 24 103M45 102C38 107 34 112 31 118M45 102C48 110 51 115 56 120M78 91C73 85 70 80 69 74M78 91C78 83 80 77 83 71M78 91C70 91 64 93 58 97M78 91C74 98 73 104 74 110M78 91C84 95 89 98 95 99M47 67C40 61 36 56 33 50M47 67C47 59 49 53 52 48M47 67C39 67 33 69 27 73M47 67C43 74 42 80 43 86M54 53C49 47 47 42 46 36M54 53C56 46 59 41 63 37M54 53C47 53 42 55 37 59" fill="none" stroke-width="1.25"/>
    <path d="M88 36C82 32 81 25 86 20C92 23 93 29 90 34C95 30 101 32 103 38C99 44 93 44 89 38C91 45 87 50 81 48C78 42 82 37 88 36Z" fill="#fff"/>
    <g fill="#fff" stroke="#000" stroke-width="1.25">
      <ellipse cx="89" cy="27" rx="2.5" ry="6.4"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(45 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(90 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(135 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(180 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(225 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(270 89 36)"/><ellipse cx="89" cy="27" rx="2.5" ry="6.4" transform="rotate(315 89 36)"/><circle cx="89" cy="36" r="4"/>
    </g><circle cx="89" cy="36" r="1.2" fill="#000" stroke="none"/>
    <path d="M58 149L52 157M62 145L68 153" stroke-width="1.1"/>
  `,
  ),

  ornament(
    "seedhead-grass",
    "Meadow seedheads",
    `
    <path d="M48 151C53 123 52 99 48 72C46 57 44 43 42 28M57 150C62 124 68 101 78 77C84 62 90 47 96 31M66 151C66 125 64 105 61 86C58 67 58 48 61 18M53 132C42 118 32 108 20 99M63 119C75 108 86 98 101 91M51 108C42 99 34 89 29 78M70 99C80 91 87 82 93 71"/>
    <path d="M42 29C35 22 36 14 42 9C49 15 49 22 43 29ZM96 32C91 24 94 16 101 13C106 21 104 28 97 32ZM61 19C56 12 58 5 64 1C70 8 68 15 62 19ZM20 99C12 98 8 92 11 85C19 85 23 91 22 97ZM101 91C98 83 102 77 110 77C114 85 110 91 103 93ZM29 78C22 73 21 66 27 61C34 67 34 73 30 78ZM93 71C89 64 92 58 99 56C103 63 100 69 94 72Z" fill="#fff"/>
    <path d="M42 27L42 12M97 30L101 16M62 17L64 4M21 96L13 88M102 90L109 80M29 76L27 64M94 69L98 59" stroke-width="1"/>
    <path d="M48 145C41 139 38 132 40 124C48 129 51 136 50 143M55 138C61 131 68 128 76 130C71 138 64 142 56 140M67 141C72 134 80 131 88 133C82 141 75 145 68 143M59 128C53 121 52 114 56 107C63 114 64 121 60 128" fill="#fff"/>
    <path d="M49 143L42 127M57 139L73 132M68 142L85 135M59 126L57 110" stroke-width="1"/>
    <path d="M49 151L44 158M57 150L58 158M66 151L72 158" stroke-width="1.1"/>
  `,
  ),
];
