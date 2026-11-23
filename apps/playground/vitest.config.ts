import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import { playgroundCatalogSummary } from "./build/catalog-summary";
import { playgroundI18nPlugins } from "./build/i18n";
import { playgroundSourceAliases } from "./vite.config";

export default defineConfig({
  plugins: [vue(), ...playgroundI18nPlugins(), playgroundCatalogSummary()],
  resolve: { alias: playgroundSourceAliases, dedupe: ["vue"] },
  test: {
    name: "playground",
    environment: "jsdom",
    // Run the field hydration contract against the Playground's Vue 3.5 runtime too.
    include: ["tests/**/*.test.ts", "../../packages/ui-kit/tests/contracts/field-async-hydration.test.ts"],
    setupFiles: ["tests/setup.ts"],
    maxWorkers: 4,
    // Preserve the existing fixture lifecycle while migrating the runner.
    clearMocks: false,
    testTimeout: 20000
  }
});
