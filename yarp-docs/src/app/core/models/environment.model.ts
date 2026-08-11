// Both src/environments/*.ts files must satisfy this shape (fileReplacements
// swaps between them silently - the explicit `: Environment` annotation on
// each is what catches the two drifting apart at compile time).
export interface Environment {
  readonly production: boolean;
  readonly useMockApi: boolean;
  readonly apiBaseUrl: string;
}
