import { describe, expect, it } from "vitest";

import { parseRatio, ratioValue } from "../src/crop/ratio.js";
import { orientedSize, targetBox } from "../src/crop/index.js";

describe("parseRatio", () => {
  it.each([
    ["1:1", 1, 1, "1x1"],
    ["16:9", 16, 9, "16x9"],
    ["16x9", 16, 9, "16x9"],
    ["4/3", 4, 3, "4x3"],
    [" 9 : 16 ", 9, 16, "9x16"],
  ])("%s", (input, width, height, slug) => {
    expect(parseRatio(input)).toEqual({ width, height, slug });
  });

  it("accepts a bare decimal", () => {
    expect(ratioValue(parseRatio("1.7778"))).toBeCloseTo(1.7778, 4);
  });

  it.each(["", "0:1", "1:0", "-16:9", "banana", "16:"])("rejects %s", (bad) => {
    expect(() => parseRatio(bad)).toThrow();
  });
});

describe("targetBox", () => {
  const landscape = { width: 1600, height: 900 };

  it("takes the largest window of the ratio when cropping", () => {
    expect(targetBox(landscape, parseRatio("1:1"), "crop")).toEqual({ width: 900, height: 900 });
    expect(targetBox(landscape, parseRatio("4:3"), "crop")).toEqual({ width: 1200, height: 900 });
  });

  it("grows the short axis when padding, keeping the whole image", () => {
    expect(targetBox(landscape, parseRatio("1:1"), "pad")).toEqual({ width: 1600, height: 1600 });
    expect(targetBox(landscape, parseRatio("4:3"), "pad")).toEqual({ width: 1600, height: 1200 });
  });

  it("is a no-op when the source already matches", () => {
    expect(targetBox(landscape, parseRatio("16:9"), "crop")).toEqual(landscape);
    expect(targetBox(landscape, parseRatio("16:9"), "pad")).toEqual(landscape);
  });
});

describe("orientedSize", () => {
  // sharp's metadata() reports stored dimensions regardless of rotate() or
  // autoOrient(), so orientations 5-8 must be swapped by hand.
  it.each([1, 2, 3, 4])("keeps axes for orientation %i", (orientation) => {
    expect(orientedSize({ width: 1600, height: 900, orientation }))
      .toEqual({ width: 1600, height: 900 });
  });

  it.each([5, 6, 7, 8])("swaps axes for quarter-turn orientation %i", (orientation) => {
    expect(orientedSize({ width: 1600, height: 900, orientation }))
      .toEqual({ width: 900, height: 1600 });
  });

  it("defaults to no swap when orientation is absent", () => {
    expect(orientedSize({ width: 1600, height: 900 }))
      .toEqual({ width: 1600, height: 900 });
  });

  it("returns undefined when dimensions are unreadable", () => {
    expect(orientedSize({ orientation: 1 })).toBeUndefined();
  });
});
