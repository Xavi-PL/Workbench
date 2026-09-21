import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export type FontWeight = 400 | 500 | 600 | 700 | 800;

const WEIGHT_DIRS: Record<FontWeight, string> = {
  400: "400Regular/Inter_400Regular.ttf",
  500: "500Medium/Inter_500Medium.ttf",
  600: "600SemiBold/Inter_600SemiBold.ttf",
  700: "700Bold/Inter_700Bold.ttf",
  800: "800ExtraBold/Inter_800ExtraBold.ttf",
};

export const FONT_FAMILY = "Inter";

/**
 * Absolute path to a bundled Inter TTF.
 *
 * The font ships as a pinned dependency rather than resolving from the system:
 * resvg would otherwise fall back to whatever the host has installed, and the
 * same name would render differently on another machine.
 *
 * TTF specifically - resvg 2.6 reads ttf/otf only, and silently renders nothing
 * for woff/woff2.
 */
export function interFontPath(weight: FontWeight = 600): string {
  return require.resolve(`@expo-google-fonts/inter/${WEIGHT_DIRS[weight]}`);
}
