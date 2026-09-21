# workbench

Agent skills, a CLI, and a local studio UI for image and promo tooling.

One implementation, three front doors — the same code runs whether it is
invoked by Claude Code, by the terminal, or from the browser, so the output is
byte-identical everywhere.

## Tools

| Skill | What it does |
|---|---|
| `/gradient-avatar` | Gradient avatar from a name's initials, deterministic per name |
| `/crop-image` | Crop or reframe to a target ratio (1:1, 16:9, 4:3, …) |
| `/convert-image` | Convert between jpg / png / webp / avif (svg is input-only) |
| `/compress-image` | Compress with a quality knob or a target file size |
| `/feature-banner` | Feature-highlight promo banner |
| `/project-banner` | Project promo banner with a device mockup |

## Layout

```
.claude-plugin/   plugin manifest
skills/           agent-facing skill definitions
packages/core/    all logic
packages/cli/     `wb` binary
packages/templates/  satori banner templates
apps/studio/      local Next.js UI
```

## Getting started

```bash
pnpm install
pnpm build
```

See [CLAUDE.md](CLAUDE.md) for the architectural rules.
