/**
 * FNV-1a over the UTF-8 bytes of the input.
 *
 * Determinism is the whole point of a name-derived avatar: the same name must
 * produce the same gradient in the CLI, in the studio, and on anyone else's
 * machine. That rules out Math.random(), Date, and anything locale-dependent.
 */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(input)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Stable index into a list of length `len`, derived from `input`. */
export function pickIndex(input: string, len: number): number {
  return len <= 0 ? 0 : fnv1a32(input) % len;
}
