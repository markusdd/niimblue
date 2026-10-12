/** Fold a search box value so German plurals and accents still hit a keyword. */
export const foldSearch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

// "tree" is inside the ligature name account_tree, and also inside "streetview".
// Word matching drops streetview. These are the remaining false friends.
const NOISE: Record<string, readonly string[]> = {
  tree: ["account_tree"],
  trees: ["account_tree"],
  baum: ["account_tree"],
  baume: ["account_tree"],
};

const wordsOf = (value: string): string[] =>
  foldSearch(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);

/** A query token hits a keyword, including a longer inflection such as "blumen" → "blume". */
const wordHit = (token: string, word: string): boolean => {
  if (word === token) return true;
  if (token.length >= 3 && word.startsWith(token)) return true;
  if (word.length >= 4 && token.startsWith(word)) return true;
  return false;
};

/**
 * Every word of the query has to hit the icon name or its keywords.
 * An empty query matches everything.
 */
export const iconMatches = (query: string, name: string, keywords = ""): boolean => {
  const folded = foldSearch(query).trim();
  if (!folded) return true;
  const tokens = folded.split(/[^a-z0-9]+/).filter((token) => token.length > 0);
  if (tokens.length === 0) return false;
  if (tokens.length === 1 && NOISE[tokens[0]]?.includes(name)) return false;
  const words = wordsOf(`${name.replace(/[_-]/g, " ")} ${keywords}`);
  return tokens.every((token) => words.some((word) => wordHit(token, word)));
};
