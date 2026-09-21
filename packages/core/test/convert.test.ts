import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { convertImage } from "../src/convert/index.js";

let dir: string;
let png: string;
let svg: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "wb-convert-"));
  png = path.join(dir, "source.png");
  svg = path.join(dir, "logo.svg");

  // half opaque, half transparent, so the alpha matte is observable
  await sharp({
    create: { width: 80, height: 40, channels: 4, background: "#00000000" },
  })
    .composite([
      {
        input: {
          create: { width: 40, height: 40, channels: 4, background: "#4F46E5" },
        },
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toFile(png);

  await writeFile(
    svg,
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
      '<rect width="64" height="64" fill="#10B981"/></svg>',
  );
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("convertImage", () => {
  it("converts png to webp", async () => {
    const out = path.join(dir, "webp");
    const result = await convertImage({ inputs: [png], format: "webp", outDir: out });
    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.format).toBe("webp");
    expect((await sharp(result.files[0]!.path).metadata()).format).toBe("webp");
  });

  it("rasterises svg input at the requested width without extra flags", async () => {
    const out = path.join(dir, "svg-wide");
    const result = await convertImage({
      inputs: [svg],
      format: "png",
      outDir: out,
      width: 512,
      allowUpscale: true,
    });
    expect(result.files[0]).toMatchObject({ width: 512, height: 512 });
  });

  it("mattes transparency when going to jpeg instead of compositing to black", async () => {
    const out = path.join(dir, "jpg");
    const result = await convertImage({
      inputs: [png],
      format: "jpeg",
      outDir: out,
      background: "#FFFFFF",
    });
    // sample the transparent half; it should be the matte, not black
    const { data } = await sharp(result.files[0]!.path)
      .extract({ left: 60, top: 10, width: 4, height: 4 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeGreaterThan(240);
    expect(data[1]).toBeGreaterThan(240);
    expect(data[2]).toBeGreaterThan(240);
  });

  it("refuses to overwrite its own source", async () => {
    await expect(
      convertImage({ inputs: [png], format: "png", outDir: dir }),
    ).rejects.toThrow(/Refusing to overwrite/);
  });

  it("does not upscale unless asked", async () => {
    const out = path.join(dir, "big");
    const clamped = await convertImage({
      inputs: [png], format: "png", outDir: out, width: 400,
    });
    expect(clamped.files[0]!.width).toBe(80);

    const allowed = await convertImage({
      inputs: [png], format: "png", outDir: path.join(dir, "big2"), width: 400, allowUpscale: true,
    });
    expect(allowed.files[0]!.width).toBe(400);
  });

  it("rejects an empty input list", async () => {
    await expect(
      convertImage({ inputs: [], format: "png", outDir: dir }),
    ).rejects.toThrow(/At least one input/);
  });

  it("strips metadata by default and keeps it on request", async () => {
    const withExif = path.join(dir, "exif.jpg");
    await sharp(png).jpeg().withMetadata({ orientation: 6 }).toFile(withExif);

    const stripped = await convertImage({
      inputs: [withExif], format: "jpeg", outDir: path.join(dir, "s"),
    });
    const kept = await convertImage({
      inputs: [withExif], format: "jpeg", outDir: path.join(dir, "k"), keepMetadata: true,
    });
    expect((await sharp(stripped.files[0]!.path).metadata()).orientation).toBeUndefined();
    expect((await sharp(kept.files[0]!.path).metadata()).orientation).toBeDefined();
  });
});
