import { module, test } from 'qunit';
import { detectPlatform, safariVersion } from 'headband/utils/install';
import {
  IOS_SAFARI_STEPS,
  IOS_SAFARI_UNKNOWN_STEPS,
  iosSafariSteps,
} from 'headband/utils/install-steps';

const UA = {
  iphoneSafari27:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
  iphoneSafari17:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/140.0.0.0 Mobile/15E148 Safari/604.1',
  iphoneInstagram:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0',
  iphoneFirefox:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/140.0 Mobile/15E148 Safari/605.1.15',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Safari/605.1.15',
  android:
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
};

module('Unit | Utility | install', function () {
  test('detectPlatform', function (assert) {
    assert.strictEqual(detectPlatform(UA.iphoneSafari27, 5), 'ios-safari');
    assert.strictEqual(detectPlatform(UA.iphoneChrome, 5), 'ios-chrome');
    assert.strictEqual(detectPlatform(UA.iphoneInstagram, 5), 'ios-in-app');
    assert.strictEqual(detectPlatform(UA.iphoneFirefox, 5), 'ios-other');
    assert.strictEqual(
      detectPlatform(UA.ipad, 5),
      'ios-safari',
      'iPad says Mac but has touch',
    );
    assert.strictEqual(detectPlatform(UA.android, 5), 'android');
    assert.strictEqual(detectPlatform(UA.mac, 0), 'desktop');
  });

  test('safariVersion reads Safari, not the frozen iOS version', function (assert) {
    assert.strictEqual(safariVersion(UA.iphoneSafari27), 27);
    assert.strictEqual(safariVersion(UA.iphoneSafari17), 17);
    assert.strictEqual(safariVersion(UA.iphoneInstagram), undefined);
  });

  test('iosSafariSteps picks the steps for each version', function (assert) {
    const [ios27, ios26, older] = IOS_SAFARI_STEPS;
    assert.deepEqual(iosSafariSteps(27), ios27?.steps);
    assert.deepEqual(
      iosSafariSteps(30),
      ios27?.steps,
      'newer versions get the newest steps',
    );
    assert.deepEqual(iosSafariSteps(26), ios26?.steps);
    assert.deepEqual(iosSafariSteps(17), older?.steps);
    assert.deepEqual(iosSafariSteps(undefined), IOS_SAFARI_UNKNOWN_STEPS);
  });

  test('the iOS 27 steps include View More and Open as Web App', function (assert) {
    const steps = iosSafariSteps(27).join(' ');
    assert.true(steps.includes('View More'));
    assert.true(steps.includes('Open as Web App'));
  });
});
