import icons from "./tabler_icons.json";
import type { ClipartIcon } from "./clipart";

const keywords: Record<keyof typeof icons, string> = {
  tools: "tools werkzeug repair reparatur workshop werkstatt",
  hammer: "hammer tools werkzeug",
  "hammer-drill": "drill bohrer bohrmaschine power tools werkzeug",
  "ruler-measure": "ruler lineal measure messen length laenge",
  "needle-thread": "sewing needle thread naehen nadel faden textile stoff",
  cpu: "cpu processor chip prozessor electronics elektronik computer",
  "circuit-resistor": "resistor resistance widerstand electronics elektronik schaltplan",
  "circuit-capacitor": "capacitor kondensator electronics elektronik schaltplan",
  "circuit-switch-closed": "switch schalter electronics elektronik schaltplan",
  plug: "plug stecker cable kabel power strom",
  "plug-connected": "plug stecker connection verbindung cable kabel",
  seedling: "seedling seed seeds seedlings saat samen keimling pflanze garden garten",
  cactus: "cactus kaktus plant pflanze",
  mushroom: "mushroom pilz mushrooms pilze food essen",
  carrot: "carrot karotte vegetable gemuese food essen",
  fish: "fish fisch seafood food essen",
  "fish-bone": "fish bone graeten fish fisch food essen",
  flame: "flame fire feuer heat hitze flamme",
  "wash-machine": "washing machine waschmaschine laundry waesche",
  "door-hanger": "door hanger tuer anhaenger hotel",
  "hanger-2": "hanger kleiderbuegel clothes kleidung wardrobe schrank",
  "package-export": "package parcel paket versand shipping export outgoing ausgang",
  "package-import": "package parcel paket lieferung delivery import incoming eingang",
  recycle: "recycle recycling waste muell sorting trennen",
  "battery-automotive": "car battery autobatterie battery batterie power strom",
  "battery-charging-2": "battery charging batterie laden charger ladegeraet",
  "battery-eco": "battery batterie energy energie eco umwelt",
  "solar-panel": "solar panel solarzelle solar photovoltaik energy energie",
  "tools-kitchen": "kitchen tools kueche kochen utensils besteck",
  "tools-kitchen-2": "kitchen tools kueche food essen cutlery besteck",
  cake: "cake kuchen baking backen birthday geburtstag",
  crane: "crane kran construction baustelle lifting heben",
};

export const CLIPART: ClipartIcon[] = Object.entries(icons).map(([id, icon]) => ({
  id,
  keywords: keywords[id as keyof typeof icons],
  svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${icon.body.replaceAll("currentColor", "#000")}</svg>`,
}));
