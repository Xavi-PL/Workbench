/** Split a comma-separated flag value, tolerating spaces and trailing commas. */
export function list(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

export function integers(value: string, flag: string): number[] {
  return list(value).map((part) => {
    const parsed = Number(part);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${flag} expects positive integers, got "${part}"`);
    }
    return parsed;
  });
}

export function oneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  flag: string,
): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`${flag} expects one of ${allowed.join(", ")}, got "${value}"`);
  }
  return value as T;
}

export function number(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${flag} expects a number, got "${value}"`);
  }
  return parsed;
}

const SIZE_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  k: 1024,
  mb: 1024 * 1024,
  m: 1024 * 1024,
};

/** Parse a byte budget: "200kb", "1.5mb", "204800". Binary units throughout. */
export function bytes(value: string, flag: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|k|mb|m)?$/i.exec(value.trim());
  const unit = SIZE_UNITS[(match?.[2] ?? "b").toLowerCase()];
  if (!match || unit === undefined) {
    throw new Error(`${flag} expects a size like 200kb or 1.5mb, got "${value}"`);
  }
  return Math.round(Number(match[1]) * unit);
}
