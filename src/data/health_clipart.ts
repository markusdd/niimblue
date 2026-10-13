import icons from "./health_icons.json";
import type { ClipartIcon } from "./clipart";

const keywords: Record<keyof typeof icons, string> = {
  "ppe-mask-24px": "mask maske face gesicht hygiene schutz medical medizin",
  "ppe-mask-n95-24px": "mask maske respirator atemschutz n95 ffp2 hygiene schutz",
  "ppe-goggles": "goggles safety glasses schutzbrille augenschutz lab labor",
  "thermometer-digital": "thermometer temperature temperatur fever fieber medical medizin",
  "gluten-free": "gluten free glutenfrei allergy allergie food essen wheat weizen",
  "exercise-weights": "exercise weights training fitness sport gewichte hanteln",
  "medicine-bottle": "medicine bottle medication medizin medikament arznei flasche apotheke",
  "allergies-24px": "allergy allergies allergie allergien allergen unvertraeglichkeit",
  "hospital-24px": "hospital clinic krankenhaus klinik medical medizin health gesundheit",
};

export const CLIPART: ClipartIcon[] = Object.entries(icons).map(([id, icon]) => {
  const dimensions = icon as { body: string; width?: number; height?: number };
  return {
    id: id.replace("-24px", ""),
    keywords: keywords[id as keyof typeof icons],
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimensions.width ?? 48} ${dimensions.height ?? 48}">${icon.body.replaceAll("currentColor", "#000")}</svg>`,
  };
});
