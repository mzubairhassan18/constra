import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// R2-backed ISR / data cache (bucket bound as NEXT_INC_CACHE_R2_BUCKET in
// wrangler.jsonc). Falls back gracefully — R2IncrementalCache raises an
// IgnorableError when the binding is absent, so local dev without the
// binding still works.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
