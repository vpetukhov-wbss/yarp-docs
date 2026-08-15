import { defineConfig } from 'vitest/config';

// Separate from the Angular app's own test builder (angular.json's
// "test": { "builder": "@angular/build:unit-test" }), which only ever looks
// at src/**/*.spec.ts and bundles for a browser-ish target - the content
// compiler under scripts/content/ is plain Node ESM with no Angular/DOM
// involved, and touches node:fs/node:child_process directly, so it needs
// its own runner rather than fighting the app builder's assumptions.
export default defineConfig({
  test: {
    include: ['scripts/content/**/*.spec.mjs'],
    environment: 'node',
    globals: true,
  },
});
