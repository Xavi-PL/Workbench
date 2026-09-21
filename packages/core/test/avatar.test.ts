import { describe, expect, it } from "vitest";

import { extractInitials } from "../src/avatar/initials.js";
import { fnv1a32 } from "../src/avatar/hash.js";
import { angleFor, paletteFor, PALETTES } from "../src/avatar/palette.js";
import { contrastRatio, mixHex, pickTextColor } from "../src/avatar/color.js";

describe("extractInitials", () => {
  it.each([
    ["Xavi Pineda", "XP"],
    ["Maria de la Cruz", "MC"],
    ["Ana Maria Torres", "AT"],
    ["jean-luc picard", "JP"],
    ["  spaced   out  ", "SO"],
    ["Xavi", "X"],
    ["José Ángel", "JÁ"],
  ])("%s -> %s", (input, expected) => {
    expect(extractInitials(input)).toBe(expected);
  });

  it("keeps particles when they are all there is", () => {
    expect(extractInitials("de la")).toBe("DL");
  });

  it("ignores punctuation-only tokens", () => {
    expect(extractInitials("Ada -- Lovelace")).toBe("AL");
  });

  it("returns empty for a name with no letters or digits", () => {
    expect(extractInitials("---")).toBe("");
  });

  it("honours maxInitials", () => {
    expect(extractInitials("Ana Maria Torres", 1)).toBe("A");
    expect(extractInitials("Ana Maria Torres", 3)).toBe("AMT");
  });
});

describe("determinism", () => {
  it("hashes stably across calls", () => {
    expect(fnv1a32("Xavi Pineda")).toBe(fnv1a32("Xavi Pineda"));
  });

  it("pins known hashes, so a change to the algorithm is caught", () => {
    // Changing these values silently re-colours every avatar ever generated.
    expect(fnv1a32("")).toBe(2166136261);
    expect(fnv1a32("a")).toBe(3826002220);
  });

  it("derives the same palette and angle for the same name", () => {
    expect(paletteFor("xavi pineda").name).toBe(paletteFor("xavi pineda").name);
    expect(angleFor("xavi pineda")).toBe(angleFor("xavi pineda"));
  });

  it("does not correlate angle with palette", () => {
    const pairs = new Set(
      PALETTES.map((_, i) => {
        const key = `name-${i}`;
        return `${paletteFor(key).name}:${angleFor(key)}`;
      }),
    );
    expect(pairs.size).toBeGreaterThan(1);
  });
});

describe("ink selection", () => {
  it("clears WCAG AA for large text on every palette", () => {
    for (const palette of PALETTES) {
      const ratio = contrastRatio(mixHex(palette.stops), pickTextColor(palette.stops));
      expect(ratio, `${palette.name} is illegible`).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses dark ink only on the pale palettes", () => {
    const dark = PALETTES.filter((p) => pickTextColor(p.stops) === "#1A1A1A");
    expect(dark.map((p) => p.name)).toEqual(["amber", "lime"]);
  });
});
