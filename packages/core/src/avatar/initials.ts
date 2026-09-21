/**
 * Name particles dropped when they sit between other tokens, so
 * "Maria de la Cruz" yields MC rather than MD. Matched case-insensitively
 * against the accent-stripped token.
 */
const PARTICLES = new Set([
  "de", "del", "della", "der", "den", "di", "da", "das", "dos", "du",
  "la", "las", "le", "les", "lo", "los", "van", "von", "of", "the",
  "el", "al", "bin", "ibn", "y", "e", "i",
]);

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** First grapheme cluster, so accents and emoji survive intact. */
function firstGrapheme(token: string): string {
  for (const { segment } of segmenter.segment(token)) return segment;
  return "";
}

function stripAccents(token: string): string {
  return token.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function hasLetterOrDigit(token: string): boolean {
  return /[\p{L}\p{N}]/u.test(token);
}

/**
 * Derive display initials from a name.
 *
 * Rules, in order:
 *   1. Split on whitespace, hyphens and underscores.
 *   2. Drop tokens with no letter or digit (stray punctuation).
 *   3. Drop lowercase particles ("de", "van", "of"), but never all tokens.
 *   4. Take the first grapheme of the first token, plus the first grapheme of
 *      the last token when `max` allows and more than one token remains.
 *
 * A single-token name yields a single initial: "Xavi" -> "X", not "XA".
 */
export function extractInitials(name: string, max = 2): string {
  const cleaned = name.normalize("NFC").replace(/[-_]+/g, " ").trim();
  if (cleaned === "") return "";

  const all = cleaned.split(/\s+/).filter(hasLetterOrDigit);
  if (all.length === 0) return "";

  const kept = all.filter((t) => !PARTICLES.has(stripAccents(t).toLowerCase()));
  const tokens = kept.length > 0 ? kept : all;

  if (max <= 1 || tokens.length === 1) {
    return firstGrapheme(tokens[0]!).toUpperCase();
  }

  // Fewer tokens than we have room for: use them all. Otherwise first + last,
  // which is what people expect from "Ana Maria Torres" -> AT.
  const chosen =
    tokens.length <= max ? tokens : [tokens[0]!, tokens.at(-1)!].slice(0, max);

  return chosen.map((t) => firstGrapheme(t)).join("").toUpperCase();
}
