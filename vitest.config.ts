import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["contract/test/**/*.test.ts"],
    environment: "node",
  },
});
