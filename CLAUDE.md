# workbench

Personal tooling for images and promo assets, usable three ways: as Claude Code
skills, as a CLI, and through a local web studio.

## The core rule

**One implementation, three front doors.** All logic lives in `packages/core`.
The CLI, the skills, and the studio are thin wrappers over it and must never
reimplement behaviour.

```
packages/core/     the actual logic. pure TS + sharp. no UI, no agent awareness
packages/cli/      thin binary over core. `wb <command> --json`
skills/*/SKILL.md  agent-facing trigger + a CLI invocation. no logic
apps/studio/       local Next.js. route handlers call core directly
```

If a `SKILL.md` starts explaining *how* to resize an image, the implementation
has already forked. Skills describe **when** to run something, not how it works.

## Conventions

- **Every CLI command supports `--json`.** Agents parse structured output
  (paths written, bytes before/after) instead of scraping stdout.
- **Nothing writes outside `--out`.** These tools run unattended; a tool that
  scatters files into the cwd is one you stop letting the agent run.
- **Commands are non-interactive and idempotent.** Never prompt. Same inputs
  produce the same bytes.
- **Determinism is a feature.** Anything derived from an input (an avatar
  gradient from a name) must be a pure function of that input, identical in the
  CLI and the browser. Never `Math.random()` in a render path.

## Skills, not commands

Everything agent-facing is a skill (`skills/<name>/SKILL.md`), never a
`commands/*.md` file. Skills can be invoked both ways; commands cannot:

| | invoked by the user | invoked automatically by the agent |
|---|---|---|
| `commands/*.md` | yes, `/name` | no |
| `skills/*/SKILL.md` | yes, `/name` | yes, via `description:` |

The `description:` frontmatter **is** the auto-invocation surface. Write it as
trigger phrases a user would actually say, not as a summary of the code.

## Conventional commits

`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. One tool per commit.

## Stack

pnpm workspaces, TypeScript (ESM, NodeNext), sharp for raster work,
satori + resvg for banners, Next.js for the studio.
