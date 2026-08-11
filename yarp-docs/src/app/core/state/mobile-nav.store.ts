import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

// Coordinates the mobile off-canvas drawer between SiteHeader (the
// hamburger trigger, in AppShell) and SidebarNav (the drawer itself, only
// rendered inside DocArticle - the only screen with a sidebar). They're not
// parent/child, so this is the shared state that connects them.
export const MobileNavStore = signalStore(
  { providedIn: 'root' },
  withState<{ open: boolean }>({ open: false }),
  withMethods((store) => ({
    toggle(): void {
      patchState(store, { open: !store.open() });
    },
    close(): void {
      patchState(store, { open: false });
    },
  })),
);
