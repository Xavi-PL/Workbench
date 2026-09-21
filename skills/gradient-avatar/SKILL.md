---
name: gradient-avatar
description: Generate a gradient avatar image from the initials of a name. Use when the user wants an avatar, profile picture, monogram, initials avatar, placeholder user image, or default profile image - including generating a batch of them for seed or demo data, or exporting one at particular sizes or formats (png, webp, jpeg, avif, svg).
---

# Gradient avatar

Renders a gradient tile with a name's initials on it. The gradient is a pure
function of the name, so the same person always gets the same avatar.

## Prerequisite

The `wb` command must be on PATH. From the workbench repo:

```bash
pnpm install && pnpm build
ln -sf "$PWD/packages/cli/dist/index.js" /opt/homebrew/bin/wb
```

## Usage

```bash
wb avatar --name "Xavi Pineda" --out ./avatars --size 512 --format webp --json
```

Pass `--json` whenever you need to read back what was written; it returns each
file's path, dimensions and byte size.

## Options

| Flag | Default | Notes |
|---|---|---|
| `--name` | required | Drives both the initials and the gradient |
| `--out` | `.` | Output directory; nothing is written outside it |
| `--size` | `512` | Comma-separated for multiple sizes: `64,128,512` |
| `--format` | `png` | Comma-separated: `png,webp,jpeg,avif,svg` |
| `--initials` | derived | Override when the derived initials are wrong |
| `--max-initials` | `2` | |
| `--shape` | `circle` | `circle`, `rounded`, `square` |
| `--radius` | `0.22` | Corner radius as a fraction of size, for `rounded` |
| `--weight` | `600` | `400`–`800` |
| `--palette` | derived | Force one; `--list-palettes` prints the names |
| `--colors` | — | Explicit stops, e.g. `#FF0080,#7928CA` |
| `--angle` | derived | Degrees; `0` runs left to right |
| `--background` | `#FFFFFF` | Matte for `jpeg`, which has no alpha |

## Behaviour worth knowing

- **Deterministic.** The palette and angle come from a hash of the name. The
  same name yields byte-identical output on any machine. Do not add randomness.
- **Initials.** Split on spaces and hyphens, particles like *de*, *van*, *of*
  are dropped, then first + last token. `Maria de la Cruz` gives `MC`;
  a single-word name gives one letter. Use `--initials` to override.
- **Ink colour** is chosen automatically: white unless the gradient is too pale
  for it, so pale palettes (amber, lime) get dark text instead.
- **Batches.** For many names, call the command once per name; each run is
  independent and safe to parallelise.

## When not to use this

If the user wants an avatar derived from a *photo*, this is the wrong tool -
this only renders initials.
