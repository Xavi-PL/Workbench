import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { compressImage, searchQuality } from "../src/compress/index.js";

/** Synthetic encoder: size grows with quality, as every real one does. */
function fakeEncoder(sizeAt: (quality: number) => number) {
  const calls: number[] = [];
  const encode = async (quality: number) => {
    calls.push(quality);
    return Buffer.alloc(sizeAt(quality));
  };
  return { encode, calls };
}

describe("searchQuality", () => {
  it("returns max quality when it already fits", async () => {
    const { encode, calls } = fakeEncoder((q) => q * 10);
    const result = await searchQuality(encode, 5000);
    expect(result.quality).toBe(100);
    expect(result.missedTarget).toBe(false);
    expect(calls).toEqual([100]);
  });

  it("finds the highest quality within budget", async () => {
    const { encode } = fakeEncoder((q) => q * 100);
    const result = await searchQuality(encode, 5000);
    expect(result.quality).toBe(50);
    expect(result.data.byteLength).toBeLessThanOrEqual(5000);
  });

  it("never returns something over budget when the floor fits", async () => {
    for (const budget of [1100, 2500, 4321, 9999]) {
      const { encode } = fakeEncoder((q) => q * 100);
      const result = await searchQuality(encode, budget);
      expect(result.data.byteLength).toBeLessThanOrEqual(budget);
      expect(result.missedTarget).toBe(false);
    }
  });

  it("flags an unreachable budget instead of pretending", async () => {
    const { encode } = fakeEncoder((q) => 10_000 + q);
    const result = await searchQuality(encode, 500);
    expect(result.missedTarget).toBe(true);
    expect(result.quality).toBe(10);
  });

  it("converges in a handful of encodes, not a linear sweep", async () => {
    const { encode, calls } = fakeEncoder((q) => q * 100);
    await searchQuality(encode, 5000);
    expect(calls.length).toBeLessThan(12);
  });
});

describe("compressImage", () => {
  let dir: string;
  let photo: string;

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "wb-compress-"));
    photo = path.join(dir, "photo.jpg");
    const width = 600;
    const height = 400;
    const raw = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      raw[i * 3] = (x / width) * 255;
      raw[i * 3 + 1] = (y / height) * 255;
      raw[i * 3 + 2] = (Math.sin(x / 9) * Math.cos(y / 7) * 0.5 + 0.5) * 255;
    }
    await sharp(raw, { raw: { width, height, channels: 3 } })
      .jpeg({ quality: 100 })
      .toFile(photo);
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("makes higher quality produce larger files", async () => {
    const sizes: number[] = [];
    for (const quality of [40, 70, 95]) {
      const result = await compressImage({
        inputs: [photo], outDir: path.join(dir, `q${quality}`), quality,
      });
      sizes.push(result.files[0]!.bytes);
    }
    expect(sizes[0]).toBeLessThan(sizes[1]!);
    expect(sizes[1]).toBeLessThan(sizes[2]!);
  });

  it("honours a size budget", async () => {
    const budget = 30 * 1024;
    const result = await compressImage({
      inputs: [photo], outDir: path.join(dir, "budget"), maxBytes: budget,
    });
    expect(result.files[0]!.bytes).toBeLessThanOrEqual(budget);
    expect(result.files[0]!.missedTarget).toBe(false);
  });

  it("reports the source size so a saving can be computed", async () => {
    const result = await compressImage({
      inputs: [photo], outDir: path.join(dir, "report"), quality: 50,
    });
    const onDisk = await stat(photo);
    expect(result.files[0]!.sourceBytes).toBe(onDisk.size);
  });

  it("keeps the original rather than writing a larger file", async () => {
    const already = path.join(dir, "already.jpg");
    await sharp(photo).jpeg({ quality: 25 }).toFile(already);
    const before = (await stat(already)).size;

    const result = await compressImage({
      inputs: [already], outDir: path.join(dir, "keep"), quality: 98,
    });
    expect(result.files[0]!.keptOriginal).toBe(true);
    expect(result.files[0]!.bytes).toBe(before);
  });

  it("rejects a non-positive budget", async () => {
    await expect(
      compressImage({ inputs: [photo], outDir: dir, maxBytes: 0 }),
    ).rejects.toThrow(/positive number of bytes/);
  });

  it("refuses to overwrite its own source", async () => {
    await expect(
      compressImage({ inputs: [photo], outDir: dir }),
    ).rejects.toThrow(/Refusing to overwrite/);
  });
});
