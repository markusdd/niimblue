import type { MaterialIcon } from "$/styles/mdi_icons";

/**
 * Extra words for the Material set. The ligature names miss everyday searches:
 * "flower" is not in local_florist, and "tree" is not in park or forest.
 */
export const materialKeywords: Partial<Record<MaterialIcon, string>> = {
  local_florist: "flower blume florist bouquet pflanze",
  yard: "plant pflanze garden garten grass",
  grass: "plant pflanze grass gras",
  energy_savings_leaf: "leaf blatt plant pflanze",
  park: "tree baum park wald nature natur",
  forest: "tree baum wald forest wood natur",
  nature: "nature natur plant pflanze",
  emoji_nature: "flower blume nature natur plant",
  spa: "spa flower blume leaf wellness",
  compost: "compost plant pflanze leaf blatt",
  pets: "pet haustier paw pfote dog cat",
  cruelty_free: "rabbit hase bunny kaninchen",
  hive: "bee biene hive",
  cake: "cake kuchen",
  coffee: "coffee kaffee",
  local_cafe: "coffee kaffee cafe",
  local_bar: "beer bier bar drink",
  local_pizza: "pizza",
  lunch_dining: "food essen meal lunch",
  egg: "egg ei",
  outdoor_grill: "grill bbq food essen",
  fireplace: "fire feuer flame",
  icecream: "ice cream eis icecream",
  set_meal: "food essen meal",
  tapas: "food essen tapas",
  wb_sunny: "sun sonne sunny weather",
  dark_mode: "moon mond night nacht",
  water_drop: "water wasser drop tropfen rain",
  ac_unit: "snow schnee cold kalt winter",
  thunderstorm: "storm rain regen thunder weather",
  favorite: "heart herz love liebe",
  star: "star stern",
};
