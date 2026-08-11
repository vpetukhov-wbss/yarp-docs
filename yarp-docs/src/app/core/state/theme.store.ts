import { computed, effect } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

type ThemePreference = 'light' | 'dark' | null;

const STORAGE_KEY = 'yarp-docs:theme';

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

interface ThemeState {
  // null = no explicit user choice - the page follows the OS's
  // prefers-color-scheme via CSS alone (see styles/_tokens.scss). Toggling
  // sets an explicit preference and persists it, so both the manual toggle
  // and the OS setting work without contradicting each other.
  preference: ThemePreference;
}

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState<ThemeState>({ preference: readStoredPreference() }),
  withComputed(({ preference }) => ({
    // Not kept live against OS changes while preference is null - a
    // deliberate v1 simplification. CSS itself still reacts to OS changes
    // instantly regardless of what this signal reports; the only thing that
    // could lag is which icon the toggle button shows.
    isDark: computed(
      () => preference() === 'dark' || (preference() === null && systemPrefersDark()),
    ),
  })),
  withMethods((store) => ({
    toggle(): void {
      patchState(store, { preference: store.isDark() ? 'light' : 'dark' });
    },
  })),
  withHooks({
    onInit(store) {
      effect(() => {
        const preference = store.preference();
        if (preference) {
          document.documentElement.setAttribute('data-theme', preference);
          localStorage.setItem(STORAGE_KEY, preference);
        } else {
          document.documentElement.removeAttribute('data-theme');
          localStorage.removeItem(STORAGE_KEY);
        }
      });
    },
  }),
);
