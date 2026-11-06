/**
 * How to add Headband to the home screen, for each kind of browser.
 *
 * When a new iOS version moves the buttons, add an entry to
 * IOS_SAFARI_STEPS with the new Safari version. Safari's version matches
 * iOS (Safari 27 is on iOS 27). Newer versions than any listed get the
 * newest steps.
 */

export interface VersionedSteps {
  /**
   * The lowest Safari version these steps are for.
   */
  minSafariVersion: number;
  steps: string[];
}

/**
 * Newest first.
 */
export const IOS_SAFARI_STEPS: VersionedSteps[] = [
  {
    // Confirmed on iOS 27.
    minSafariVersion: 27,
    steps: [
      'Tap the page menu button to the left of the web address. It looks like a puzzle piece over a few lines.',
      'Tap Share.',
      'Tap View More.',
      'Tap Add to Home Screen.',
      'Leave “Open as Web App” on, then tap Add.',
    ],
  },
  {
    minSafariVersion: 26,
    steps: [
      'Tap ••• next to the web address.',
      'Tap Share.',
      'Tap Add to Home Screen. If you don’t see it, tap View More first.',
      'Leave “Open as Web App” on, then tap Add.',
    ],
  },
  {
    minSafariVersion: 0,
    steps: [
      'Tap the Share button at the bottom of the screen. It’s a square with an arrow pointing up.',
      'Scroll down and tap Add to Home Screen.',
      'Tap Add.',
    ],
  },
];

/**
 * For iPhone Safari when the version can't be read.
 */
export const IOS_SAFARI_UNKNOWN_STEPS = [
  'Tap Share. On newer iPhones, it’s in the menu button next to the web address.',
  'Tap Add to Home Screen. If you don’t see it, tap View More first.',
  'Tap Add.',
];

export const IOS_CHROME_STEPS = [
  'Tap the Share button in the address bar.',
  'Tap Add to Home Screen. If you don’t see it, tap View More first.',
  'Tap Add.',
];

/**
 * Apps like Instagram and Messenger open links in their own browser,
 * which can't add to the home screen. Neither can other iPhone browsers.
 */
export const IOS_OPEN_IN_SAFARI_STEPS = [
  'This browser can’t add Headband to your home screen.',
  'Open this page in Safari. Look for “Open in Safari” or “Open in browser” in this app’s menu.',
  'Then come back here for the next steps.',
];

/**
 * For Android browsers that don't offer their own install button.
 */
export const ANDROID_STEPS = [
  'Tap the browser menu (⋮) at the top right.',
  'Tap Add to Home screen or Install app.',
];

export function iosSafariSteps(version: number | undefined): string[] {
  if (version === undefined) {
    return IOS_SAFARI_UNKNOWN_STEPS;
  }
  const match = IOS_SAFARI_STEPS.find(
    (entry) => version >= entry.minSafariVersion,
  );
  return match?.steps ?? IOS_SAFARI_UNKNOWN_STEPS;
}
