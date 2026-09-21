---
name: crop-image
description: Crop or reframe images to a target aspect ratio such as 1:1, 16:9, 4:3 or 9:16. Use when the user wants an image cropped, reframed, squared off, letterboxed, or resized to a ratio - including preparing thumbnails, OG or social images, or making a batch of photos a consistent shape.
---

# Crop image

Crops or pads images to an aspect ratio, in batch, using sharp.

## Prerequisite

The CLI must be built once:

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && pnpm install && pnpm build
```

## Usage

```bash
node "${CLAUDE_PLUGIN_ROOT}/packages/cli/dist/index.js" crop \
  photo.jpg other.png --ratio 16:9 --out ./cropped --json
```

Takes any number of input files. Pass `--json` to read back what was written.

## Options

| Flag | Default | Notes |
|---|---|---|
| `--ratio` | required | `1:1`, `16:9`, `4x3`, `4/3` or a decimal |
| `--out` | `.` | Output directory; nothing is written outside it |
| `--position` | `center` | Edge/corner names, or `attention` / `entropy` |
| `--strategy` | `crop` | `crop` discards overflow; `pad` keeps all of it |
| `--width` | source | Output width; height follows from the ratio |
| `--format` | input's | `png`, `webp`, `jpeg`, `avif` |
| `--background` | `#FFFFFF` | Matte for `pad` and for alpha-less formats |
| `--quality` | `90` | |
| `--allow-upscale` | off | |
| `--keep-metadata` | off | |

Output is named `<input>-<ratio>.<ext>`, e.g. `photo-16x9.jpg`.

## Behaviour worth knowing

- **`crop` vs `pad`.** `crop` takes the largest window of the target shape from
  inside the image and loses the overflow. `pad` keeps the entire image and
  grows the other axis, filling the gap with `--background`. Use `pad` when
  nothing may be cut, such as a logo or a screenshot.
- **`--position attention`** lets sharp pick the window around the most visually
  salient region rather than the middle. Good for batches of photos, where a
  centre crop often beheads the subject.
- **EXIF orientation is applied before cropping**, so portrait photos stored
  landscape are framed as they are actually displayed.
- **EXIF is stripped by default**, which also removes GPS coordinates. Pass
  `--keep-metadata` only when the metadata is wanted.
- **Refuses colliding batches.** Two inputs with the same basename from
  different folders would write to the same output, so that errors up front.
- **Never upscales** unless `--allow-upscale` is given; a larger `--width` than
  the source is clamped rather than producing invented pixels.

## When not to use this

Changing only the file format, with no reframing, is `convert-image`.
Reducing file size at the same dimensions is `compress-image`.
