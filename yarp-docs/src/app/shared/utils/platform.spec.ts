import { isApplePlatform } from './platform';

function stubNavigator(platform: string, userAgent = ''): void {
  Object.defineProperty(navigator, 'platform', { value: platform, configurable: true });
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
}

describe('isApplePlatform', () => {
  it('returns true for macOS (MacIntel)', () => {
    stubNavigator('MacIntel');
    expect(isApplePlatform()).toBe(true);
  });

  it('returns true for iPad (iPadOS reports MacIntel too, but this covers older UAs)', () => {
    stubNavigator('iPad');
    expect(isApplePlatform()).toBe(true);
  });

  it('returns true for iPhone', () => {
    stubNavigator('iPhone');
    expect(isApplePlatform()).toBe(true);
  });

  it('falls back to userAgent when platform is blank', () => {
    stubNavigator('', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)');
    expect(isApplePlatform()).toBe(true);
  });

  it('returns false for Windows', () => {
    stubNavigator('Win32');
    expect(isApplePlatform()).toBe(false);
  });

  it('returns false for Linux', () => {
    stubNavigator('Linux x86_64');
    expect(isApplePlatform()).toBe(false);
  });
});
