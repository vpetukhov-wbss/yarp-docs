import type { Environment } from '../app/core/models/environment.model';

// Both environments point at the mock API for now - there is no real .NET
// Minimal API yet. Flipping this to the real endpoint is Step 16, explicitly
// out of scope for this phase (see the plan's "Out of scope" section).
export const environment: Environment = {
  production: true,
  useMockApi: true,
  apiBaseUrl: '/assets/mock-api/v1',
};
