/**
 * Which kind of browser the game is running in, for showing the right
 * "add to home screen" help.
 */
export type InstallPlatform =
  | 'ios-safari'
  | 'ios-chrome'
  | 'ios-in-app'
  | 'ios-other'
  | 'android'
  | 'desktop';

const IN_APP_BROWSER = /FBAN|FBAV|Instagram|Snapchat|Line\/|GSA\/|LinkedInApp/;

export function detectPlatform(
  userAgent: string,
  maxTouchPoints: number,
): InstallPlatform {
  // iPads ask for the desktop site, so they say "Macintosh" but have touch.
  const isIOS =
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1);

  if (isIOS) {
    if (IN_APP_BROWSER.test(userAgent)) {
      return 'ios-in-app';
    }
    if (/CriOS/.test(userAgent)) {
      return 'ios-chrome';
    }
    if (/FxiOS|EdgiOS|OPiOS|DuckDuckGo/.test(userAgent)) {
      return 'ios-other';
    }
    return 'ios-safari';
  }

  if (/Android/.test(userAgent)) {
    return 'android';
  }

  return 'desktop';
}

/**
 * Safari's version, which matches the iOS version. iPhones no longer report
 * their real iOS version, but they still report this.
 */
export function safariVersion(userAgent: string): number | undefined {
  const match = /Version\/(\d+)/.exec(userAgent);
  return match ? Number(match[1]) : undefined;
}

/**
 * True when opened from the home screen instead of a browser tab.
 */
export function isRunningInstalled(): boolean {
  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true
  );
}
