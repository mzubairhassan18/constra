import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts"],
    // Neon serverless compute cold-starts; integration tests need headroom.
    testTimeout: 60000,
  },
  resolve: {
    alias: { "@": import.meta.dirname + "/src" },
  },
});
