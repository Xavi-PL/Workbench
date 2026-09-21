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
