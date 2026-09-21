import type { OperationResult, WrittenFile } from "@workbench/core";

interface MaybeCompressed extends WrittenFile {
  sourceBytes?: number;
  quality?: number;
  keptOriginal?: boolean;
  missedTarget?: boolean;
}

function kb(value: number): string {
  return `${(value / 1024).toFixed(1)} kB`;
}

/** Savings suffix, shown only for operations that report a source size. */
function savings(file: MaybeCompressed): string {
  if (file.sourceBytes === undefined) return "";
  if (file.keptOriginal) return `  (kept original, ${kb(file.sourceBytes)})`;
  const percent = 100 - (100 * file.bytes) / file.sourceBytes;
  const note = file.missedTarget ? ", below target floor" : "";
  return `  ${kb(file.sourceBytes)} -> ${kb(file.bytes)}, ${percent.toFixed(1)}% saved` +
    `${file.quality === undefined ? "" : ` at q${file.quality}`}${note}`;
}

/**
 * Every command speaks JSON on request so agents parse structured output
 * instead of scraping stdout. The human form is a courtesy; the JSON is the
 * contract.
 */
export function emit(result: OperationResult, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  for (const file of result.files as MaybeCompressed[]) {
    const size = file.sourceBytes === undefined ? `  ${kb(file.bytes)}` : "";
    process.stdout.write(
      `${file.path}  ${file.width}x${file.height}${size}${savings(file)}\n`,
    );
  }
}

export function fail(error: unknown, json: boolean): never {
  const message = error instanceof Error ? error.message : String(error);
  if (json) {
    process.stdout.write(`${JSON.stringify({ error: { message } }, null, 2)}\n`);
  } else {
    process.stderr.write(`error: ${message}\n`);
  }
  process.exit(1);
}
