import { defineConfig } from 'vitest/config';

// Separate from the Angular app's own test builder (angular.json's
// "test": { "builder": "@angular/build:unit-test" }), which only ever looks
// at src/**/*.spec.ts and bundles for a browser-ish target - everything
// under scripts/ (the content compiler in scripts/content/, the i18n
// catalog checks in scripts/i18n/) is plain Node ESM with no Angular/DOM
// involved and touches node:fs/node:child_process directly, so it needs
// its own runner rather than fighting the app builder's assumptions.
export default defineConfig({
  test: {
    include: ['scripts/**/*.spec.mjs'],
    environment: 'node',
    globals: true,
  },
});
