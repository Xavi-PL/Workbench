import type { OperationResult } from "@workbench/core";

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
  for (const file of result.files) {
    const kb = (file.bytes / 1024).toFixed(1);
    process.stdout.write(
      `${file.path}  ${file.width}x${file.height}  ${kb} kB\n`,
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
