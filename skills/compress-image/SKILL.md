---
name: compress-image
description: Make image files smaller by re-encoding them, either with a quality setting or to a target file size such as "under 200kb". Use when the user wants to compress, optimise, shrink or reduce the file size of images, get assets under a size budget, or make a page's images lighter.
---

# Compress image

Re-encodes images smaller, in batch, using sharp. Either set a quality knob or
give a size budget and let it find the quality that fits.

## Prerequisite

The `wb` command must be on PATH. From the workbench repo:

```bash
pnpm install && pnpm build
ln -sf "$PWD/packages/cli/dist/index.js" /opt/homebrew/bin/wb
```

## Usage

```bash
# quality knob: higher means better and larger
wb compress hero.jpg --quality 70 --out ./optimised --json

# size budget: finds the highest quality that fits
wb compress hero.jpg --max-size 200kb --out ./optimised --json
```

## Options

| Flag | Default | Notes |
|---|---|---|
| `--out` | `.` | Output directory; nothing is written outside it |
| `--quality` | `80` | 1-100; higher means larger and better |
| `--max-size` | — | Budget per file, e.g. `200kb`, `1.5mb`. Overrides `--quality` |
| `--format` | input's | `png`, `webp`, `jpeg`, `avif` |
| `--width` | source | Also resize down; often the biggest single saving |
| `--background` | `#FFFFFF` | Matte for alpha-less formats |
| `--effort` | encoder's | Higher is slower and smaller |
| `--no-palette` | — | Keep png truecolour instead of quantising |
| `--allow-larger` | off | Write the result even when it beats nothing |
| `--keep-metadata` | off | |

## Behaviour worth knowing

- **Quality is inverted from compression.** `--quality 95` is a light touch;
  `--quality 40` is aggressive. There is no separate "compression" number.
- **`--max-size` binary-searches the quality** that fits the budget, in about
  seven encodes. If even the quality floor overshoots, the result carries
  `missedTarget: true` rather than silently returning something too big.
- **Never writes a larger file.** If re-encoding cannot beat the source, the
  original is copied through byte for byte and `keptOriginal: true` is
  reported. Already-optimised images are therefore safe to run through.
- **png is quantised to a palette here** by default, unlike `convert-image`: a
  lossless png re-encode saves almost nothing, and this tool exists to save
  bytes. `--no-palette` opts out.
- **`--json` reports `sourceBytes`, `bytes` and `quality`**, so the saving can
  be computed without re-stating the files.
- **Resizing usually beats re-encoding.** If an image is displayed at 800px,
  `--width 800` will save far more than any quality setting.

## When not to use this

Changing format without caring about size is `convert-image`. Changing the
aspect ratio or framing is `crop-image`.
