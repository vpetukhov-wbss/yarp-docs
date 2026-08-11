import type { Environment } from '../app/core/models/environment.model';

export const environment: Environment = {
  production: false,
  useMockApi: true,
  apiBaseUrl: '/assets/mock-api/v1',
};
