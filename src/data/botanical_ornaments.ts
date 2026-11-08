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
  keywords: {
    "olive-sprig": "olive olives olive branch twig botanical olive zweig olivenzweig pflanze blatt",
    "lavender-stem": "lavender lavender stem botanical lavendel stiel blume pflanze",
    "citrus-branch": "citrus lemon orange fruit branch zitrus zitrone orange frucht zweig",
    "wildflower-spray": "wildflower meadow flowers floral spray wildblume wiese blumen blüten blumenstrauß",
    "floral-corner": "floral corner flowers ornament blumenecke blumen ecke ornament",
    "artisan-leaf": "leaf branch botanical artisan leaves blatt zweig botanisch blätter",
  }[id] ?? "botanical plant pflanze floral blume",
  viewBox: "0 0 124 160",
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 160" fill="none" stroke="#000" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`,
});

export const BOTANICAL_ORNAMENTS: BotanicalOrnament[] = [
  ornament("olive-sprig", "Olive sprig", `
    <path d="M59 148C58 126 63 111 60 93C57 74 48 56 34 39"/>
    <path d="M60 105C70 91 82 83 96 78M58 91C48 80 38 73 26 68M60 121C72 111 82 106 94 104M57 77C67 66 76 60 86 57M51 65C43 53 35 47 26 43"/>
    <path d="M93 78C83 74 76 77 72 86C81 88 89 85 93 78ZM27 68C35 63 42 65 47 73C39 77 31 75 27 68ZM92 104C84 99 77 101 72 109C79 113 88 111 92 104ZM85 57C77 52 70 54 66 62C73 66 81 64 85 57ZM27 43C35 40 41 43 44 51C37 54 30 51 27 43Z" fill="#fff"/>
    <path d="M74 84C79 82 85 80 91 79M30 69C35 69 40 71 44 73M74 108C79 106 85 105 90 104M68 61C73 59 78 58 83 57M30 45C35 46 39 48 42 50"/>
    <ellipse cx="48" cy="57" rx="2.2" ry="3.2" transform="rotate(-35 48 57)" fill="#fff"/>
    <ellipse cx="67" cy="70" rx="2.2" ry="3.2" transform="rotate(33 67 70)" fill="#fff"/>
    <ellipse cx="67" cy="96" rx="2.2" ry="3.2" transform="rotate(28 67 96)" fill="#fff"/>
  `),

  ornament("lavender-stem", "Lavender stem", `
    <path d="M58 149C62 121 57 95 61 68C63 52 67 37 72 22"/>
    <path d="M59 125C50 117 43 110 38 101M60 112C68 105 74 98 78 89M60 96C51 89 46 82 43 74M62 81C69 75 74 68 77 61"/>
    <path d="M72 24C66 20 66 15 71 11C76 14 77 19 72 24ZM68 32C61 30 59 25 63 20C69 22 71 27 68 32ZM74 39C68 35 69 30 74 27C79 31 79 36 74 39ZM66 47C60 43 61 38 66 35C72 38 72 43 66 47ZM72 54C66 51 67 45 72 43C77 46 77 51 72 54ZM63 61C58 57 59 52 64 49C69 53 68 58 63 61ZM70 68C64 66 64 60 69 58C75 61 75 65 70 68Z" fill="#fff"/>
    <path d="M70 22L72 16M65 29L65 24M73 37L74 32M64 44L65 39M71 52L72 47M62 58L63 54M69 66L70 62"/>
    <path d="M39 102C43 105 47 110 50 115M77 90C73 95 68 100 63 104M44 75C48 79 52 84 55 88M76 62C73 67 69 71 64 75"/>
    <path d="M50 115C42 114 37 109 38 101C46 103 50 108 50 115ZM63 104C64 96 70 91 78 89C78 97 72 102 63 104ZM55 88C47 87 43 82 43 74C51 76 55 81 55 88ZM64 75C65 68 70 63 77 61C77 68 72 73 64 75Z" fill="#fff"/>
  `),

  ornament("citrus-branch", "Citrus branch", `
    <path d="M18 134C38 116 49 98 61 79C73 59 83 42 103 26"/>
    <path d="M46 101C37 93 27 88 17 86M59 81C53 68 49 56 48 44M72 61C83 61 92 58 101 52M35 116C31 106 25 99 17 94"/>
    <path d="M18 86C26 79 36 81 42 89C36 97 26 97 18 86ZM48 45C39 40 37 30 43 22C52 27 54 36 48 45ZM101 52C98 42 104 34 114 33C116 43 111 50 101 52ZM18 94C27 91 35 97 37 107C27 110 20 105 18 94Z" fill="#fff"/>
    <path d="M21 86C28 86 34 87 40 90M47 42C45 36 44 31 44 26M103 50C107 45 110 41 113 36M21 96C27 98 32 102 35 106"/>
    <path d="M80 104C80 95 86 89 95 88C97 97 91 104 82 106C73 104 68 97 70 88C78 89 83 95 82 104Z" fill="#fff"/>
    <path d="M81 91C82 96 82 100 82 104M80 104C76 100 74 96 72 92M83 101C86 97 90 94 94 92"/>
    <path d="M65 119C65 112 69 107 76 106C78 113 74 119 67 121C60 119 57 114 58 107C64 107 68 112 67 119Z" fill="#fff"/>
    <path d="M66 109L67 119M65 117L60 110M68 116L74 109"/>
    <path d="M102 26C102 19 107 14 114 14C115 21 111 26 104 28C97 26 94 21 95 14C101 14 105 19 104 26Z" fill="#fff"/>
    <path d="M45 99C45 103 46 105 47 108"/>
    <path d="M47 107C54 110 58 117 56 123C54 130 46 132 40 127C34 122 37 114 42 109C44 107 45 106 47 107Z" fill="#fff"/>
    <path d="M44 113C41 117 40 121 42 124M50 111C54 115 55 120 53 124"/>
  `),

  ornament("wildflower-spray", "Wildflower spray", `
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
  `),

  ornament("floral-corner", "Paired floral corner", `
    <path d="M14 146C15 116 25 93 45 74C60 60 78 49 105 42M15 146C43 145 66 138 83 122C99 107 108 88 112 59"/>
    <path d="M33 91C24 83 23 73 30 65C40 71 42 81 33 91ZM51 70C46 59 50 50 60 46C66 56 63 65 51 70ZM78 54C78 43 85 36 96 37C97 48 90 54 78 54ZM83 122C72 117 68 108 73 98C84 101 88 111 83 122ZM103 94C92 91 87 82 91 72C102 74 107 84 103 94ZM109 68C100 62 98 52 104 43C114 49 116 59 109 68Z" fill="#fff"/>
    <path d="M34 87C32 79 31 73 31 68M53 67C54 60 57 54 60 49M80 51C85 45 90 41 94 39M80 119C77 111 76 105 75 101M100 91C97 84 95 79 94 75M108 65C106 57 105 51 105 46"/>
    <path d="M34 91C44 92 52 90 58 85M51 70C59 75 64 81 67 88M78 54C81 63 81 71 79 78M83 122C91 122 98 120 104 115M103 94C109 97 113 102 116 108M109 68C115 74 118 80 119 87"/>
    <path d="M58 85C54 77 57 69 65 66C71 73 69 81 62 86C54 88 48 84 47 76C54 74 60 78 62 86Z" fill="#fff"/>
    <path d="M64 70C63 76 62 81 61 85M62 86C57 82 53 79 50 77M64 84C66 79 67 75 67 70"/>
    <path d="M104 115C103 108 107 103 114 103C117 110 113 115 106 117C100 116 97 111 99 105C105 106 108 111 106 117Z" fill="#fff"/>
    <path d="M101 108L106 115M105 113L113 106"/>
  `),

  ornament("artisan-leaf", "Artisan leaf branch", `
    <path d="M18 132C38 122 50 108 58 90C67 69 75 47 101 28M39 116C32 104 27 93 26 79M55 96C45 85 39 73 38 59M67 70C79 69 91 65 101 57M78 52C70 42 66 31 68 20"/>
    <path d="M26 79C18 73 17 63 23 56C32 62 34 71 26 79ZM38 59C30 52 30 42 37 35C46 42 46 51 38 59ZM101 57C100 47 106 40 116 40C118 50 112 57 102 59ZM68 24C60 18 61 10 68 5C76 10 77 18 68 24Z" fill="#fff"/>
    <path d="M26 76C25 69 24 64 24 59M38 56C37 48 37 43 38 39M103 56C108 51 111 47 114 43M68 21C67 16 67 12 68 8"/>
    <path d="M39 116C49 117 57 115 63 110M55 96C64 100 71 104 77 111M67 70C69 81 68 90 64 98M78 52C88 52 97 50 105 46"/>
    <path d="M63 110C59 102 62 94 70 91C76 99 74 106 67 111C59 113 53 109 52 101C59 99 65 103 67 111Z" fill="#fff"/>
    <path d="M68 95C67 101 67 106 66 110M65 109C61 105 58 103 55 102M68 108C71 103 72 99 72 95"/>
    <path d="M77 111C79 103 86 99 94 102C93 111 87 116 78 114C72 109 72 102 77 97C84 101 85 108 78 114Z" fill="#fff"/>
    <path d="M77 101C78 105 78 110 78 113M80 110C84 106 88 104 92 103"/>
    <path d="M51 105C46 109 41 112 36 114M60 88C56 83 52 78 49 72M72 61C78 58 85 56 92 54"/>
  `),
];
