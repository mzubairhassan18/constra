/**
 * Patch @opennextjs/cloudflare so it inlines `.next/server/preview-props.json`.
 *
 * Next.js 16.4's NextNodeServer constructor eagerly calls getPreviewProps(),
 * which does loadManifest(join(distDir, "server", "preview-props.json")).
 * OpenNext's manifest-inlining glob only matches
 * `{*-manifest,required-server-files,prefetch-hints}.json`, so the patched
 * loadManifest() falls through to `throw new Error("Unexpected loadManifest(...)")`
 * and every request dies with Error 1101 (worker threw exception).
 *
 * We widen the glob by one alternative. The script is idempotent and safe to
 * run on every build (npm ci wipes node_modules, so this must run post-install).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(
  here,
  "..",
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "build",
  "patches",
  "plugins",
  "load-manifest.js"
);

const OLD_GLOB = "**/{*-manifest,required-server-files,prefetch-hints}.json";
const NEW_GLOB =
  "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json";

if (!existsSync(target)) {
  console.error(`[patch-opennext] not found: ${target}`);
  process.exit(1);
}

const src = readFileSync(target, "utf8");

if (src.includes(NEW_GLOB)) {
  console.log("[patch-opennext] already applied");
} else if (src.includes(OLD_GLOB)) {
  writeFileSync(target, src.replace(OLD_GLOB, NEW_GLOB), "utf8");
  console.log("[patch-opennext] inlined preview-props.json manifest");
} else {
  // Upstream changed the shape — fail loudly rather than ship a broken worker.
  console.error(
    "[patch-opennext] unexpected load-manifest.js contents; " +
      "expected the manifest glob to be present. Upstream may have fixed " +
      "this already — re-check and remove the patch."
  );
  process.exit(1);
}
