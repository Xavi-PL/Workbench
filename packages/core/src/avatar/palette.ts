import { pickIndex } from "./hash.js";

export interface GradientPalette {
  name: string;
  stops: readonly [string, string];
}

/**
 * Curated two-stop gradients. Kept deliberately small and hand-picked: a
 * generated hue wheel produces muddy pairs, and the set needs to look
 * intentional when a directory of avatars is seen side by side.
 */
export const PALETTES: readonly GradientPalette[] = [
  { name: "indigo", stops: ["#4F46E5", "#7C3AED"] },
  { name: "violet", stops: ["#7C3AED", "#C026D3"] },
  { name: "fuchsia", stops: ["#C026D3", "#DB2777"] },
  { name: "rose", stops: ["#E11D48", "#F43F5E"] },
  { name: "ember", stops: ["#EA580C", "#DC2626"] },
  // Deliberately pale: these two carry dark ink and give the set some range.
  { name: "amber", stops: ["#FBBF24", "#F59E0B"] },
  { name: "lime", stops: ["#84CC16", "#22C55E"] },
  { name: "emerald", stops: ["#059669", "#047857"] },
  { name: "teal", stops: ["#0D9488", "#0F766E"] },
  { name: "cyan", stops: ["#0891B2", "#2563EB"] },
  { name: "sky", stops: ["#0284C7", "#4F46E5"] },
  { name: "slate", stops: ["#475569", "#1E293B"] },
];

/** Eight fixed directions; a continuous angle adds variety nobody notices. */
export const ANGLES: readonly number[] = [0, 45, 90, 135, 180, 225, 270, 315];

export function paletteFor(key: string): GradientPalette {
  return PALETTES[pickIndex(key, PALETTES.length)]!;
}

export function angleFor(key: string): number {
  // Offset the key so the angle does not correlate with the palette choice.
  return ANGLES[pickIndex(`${key}#angle`, ANGLES.length)]!;
}

export function paletteByName(name: string): GradientPalette {
  const found = PALETTES.find((p) => p.name === name.toLowerCase());
  if (!found) {
    const names = PALETTES.map((p) => p.name).join(", ");
    throw new Error(`Unknown palette "${name}". Available: ${names}`);
  }
  return found;
}
