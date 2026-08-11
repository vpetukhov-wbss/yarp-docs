import { Component, computed, effect, signal } from '@angular/core';

type ThemePreference = 'light' | 'dark' | null;

const STORAGE_KEY = 'yarp-docs:theme';

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
}

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggle {
  // null = no explicit user choice yet - the page follows the OS's
  // prefers-color-scheme via CSS alone (see styles/_tokens.scss). Toggling
  // sets an explicit preference and persists it, matching the Phase 1
  // mockup's requirement that both the manual toggle and the OS setting work.
  protected readonly preference = signal<ThemePreference>(readStoredPreference());

  // Only used to pick which icon/label to show and which way the next click
  // goes; not kept live against OS changes while preference is null - a
  // deliberate v1 simplification, CSS itself still reacts to OS changes
  // instantly regardless of what this signal reports.
  protected readonly isDark = computed(
    () => this.preference() === 'dark' || (this.preference() === null && this.systemPrefersDark()),
  );

  constructor() {
    effect(() => {
      const preference = this.preference();
      if (preference) {
        document.documentElement.setAttribute('data-theme', preference);
        localStorage.setItem(STORAGE_KEY, preference);
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  protected toggle(): void {
    this.preference.set(this.isDark() ? 'light' : 'dark');
  }

  private systemPrefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
