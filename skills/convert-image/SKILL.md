---
name: convert-image
description: Convert images between formats - png, jpeg, webp and avif, with svg accepted as input. Use when the user wants to change an image's file format, export an svg to a raster image, produce webp or avif versions of assets, or batch-convert a folder of images.
---

# Convert image

Changes image format in batch, using sharp. SVG is rasterised on the way in.

## Prerequisite

The `wb` command must be on PATH. From the workbench repo:

```bash
pnpm install && pnpm build
ln -sf "$PWD/packages/cli/dist/index.js" /opt/homebrew/bin/wb
```

## Usage

```bash
wb convert logo.svg photo.png --format webp --out ./converted --json
```

## Options

| Flag | Default | Notes |
|---|---|---|
| `--format` | required | `png`, `webp`, `jpeg`, `avif` |
| `--out` | `.` | Output directory; nothing is written outside it |
| `--quality` | `90` | Ignored by `png`, which is lossless here |
| `--width` | source | Resize on the way out, preserving the ratio |
| `--background` | `#FFFFFF` | Matte for `jpeg`, which has no alpha |
| `--lossless` | off | `webp` and `avif` only |
| `--density` | — | Rasterisation DPI for svg input |
| `--allow-upscale` | off | |
| `--keep-metadata` | off | |

## Behaviour worth knowing

- **SVG is input-only.** There is no raster-to-SVG conversion: that is image
  tracing, a different problem, and deliberately out of scope. Asking for
  `--format svg` returns an error saying so.
- **Sizing an SVG.** Use `--width`; sharp rasterises at the final resolution,
  so the result is crisp with no extra flags. `--density` is only for what it
  cannot infer, such as an SVG sized in percentages, or scaling one up without
  naming a width.
- **Going to JPEG drops alpha.** Transparent pixels are matted with
  `--background` rather than compositing to black.
- **EXIF is stripped by default**, which also removes GPS coordinates.
- **Refuses to overwrite its source**, so `convert a.png --format png` into the
  same directory errors rather than destroying the original.
- **Refuses colliding batches.** Output names come from the input's basename,
  so `a/logo.png` and `b/logo.svg` in one run would both want `logo.webp`. That
  errors up front rather than silently writing only the last one.

## When not to use this

Reducing file size while keeping the format is `compress-image`. Changing the
aspect ratio or framing is `crop-image`.
