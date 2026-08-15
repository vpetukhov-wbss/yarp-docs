// Apple detection for the site header's search-shortcut hint (⌘K vs
// Ctrl+K). navigator.userAgentData isn't implemented on Safari or Firefox,
// so this reads the older platform/userAgent strings instead - both are
// deprecated but still universally supported, and correctness here only
// affects which glyph a hint shows, never app behavior. iPadOS reports
// "MacIntel" as its platform (matches the Mac branch already); iPhone/iPad/
// iPod cover older iOS UA strings directly.
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');
}
