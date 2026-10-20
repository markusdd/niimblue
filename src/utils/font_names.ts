/** Font metadata often repeats a family once per weight and writing system. */
export function normalizeFontFamilies(names: readonly unknown[]): string[] {
  const families = new Map<string, string>();
  for (const value of names) {
    if (typeof value !== "string") continue;
    const name = value.trim();
    if (!name || [...name].some((character) => character.charCodeAt(0) < 32)) continue;
    const key = name.toLocaleLowerCase();
    if (!families.has(key)) families.set(key, name);
  }
  return [...families.values()].sort((a, b) => a.localeCompare(b));
}
