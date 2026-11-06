import { module, test } from 'qunit';
import {
  TiltDetector,
  screenFacing,
  type TiltDirection,
} from 'headband/services/tilt';

/**
 * Phone angles (beta, gamma) for a phone held sideways, as Safari and Chrome
 * report them.
 */
const UPRIGHT: [number, number] = [0, 90];
const SLIGHTLY_BACK: [number, number] = [0, 80];
const FACING_CEILING: [number, number] = [0, 40];
const FACING_FLOOR: [number, number] = [180, -40];
const UPRIGHT_OTHER_WAY: [number, number] = [0, -90];
const FACING_FLOOR_OTHER_WAY: [number, number] = [180, 40];

module('Unit | Service | tilt', function () {
  test('screenFacing is 0 upright, positive facing up, negative facing down', function (assert) {
    assert.true(Math.abs(screenFacing(...UPRIGHT)) < 0.01);
    assert.true(Math.abs(screenFacing(...UPRIGHT_OTHER_WAY)) < 0.01);
    assert.true(screenFacing(0, 0) > 0.99, 'flat on a table, screen up');
    assert.true(screenFacing(180, 0) < -0.99, 'flat, screen down');
    assert.true(screenFacing(...FACING_CEILING) > 0.5);
    assert.true(screenFacing(...FACING_FLOOR) < -0.5);
  });

  function detect(...angles: [number, number][]): TiltDirection[] {
    const tilts: TiltDirection[] = [];
    const detector = new TiltDetector((direction) => tilts.push(direction));
    for (const [beta, gamma] of angles) {
      detector.update(beta, gamma);
    }
    return tilts;
  }

  test('tilting down counts as down, and up as up', function (assert) {
    assert.deepEqual(detect(UPRIGHT, FACING_FLOOR), ['down']);
    assert.deepEqual(detect(UPRIGHT, FACING_CEILING), ['up']);
  });

  test('works with the phone turned either way', function (assert) {
    assert.deepEqual(detect(UPRIGHT_OTHER_WAY, FACING_FLOOR_OTHER_WAY), [
      'down',
    ]);
  });

  test('one tilt counts once, until the phone comes back upright', function (assert) {
    assert.deepEqual(
      detect(UPRIGHT, FACING_FLOOR, FACING_FLOOR, [180, -60], FACING_FLOOR),
      ['down'],
    );
    assert.deepEqual(detect(UPRIGHT, FACING_FLOOR, UPRIGHT, FACING_CEILING), [
      'down',
      'up',
    ]);
  });

  test('small wobbles do not count', function (assert) {
    assert.deepEqual(detect(UPRIGHT, SLIGHTLY_BACK, UPRIGHT, [0, 70]), []);
  });

  test('nothing counts until the phone has been upright', function (assert) {
    assert.deepEqual(detect(FACING_FLOOR, FACING_CEILING), []);
    assert.deepEqual(detect(FACING_FLOOR, UPRIGHT, FACING_CEILING), ['up']);
  });

  test('ignores readings with no angles', function (assert) {
    const tilts: TiltDirection[] = [];
    const detector = new TiltDetector((direction) => tilts.push(direction));
    detector.update(null, null);
    detector.update(...UPRIGHT);
    detector.update(null, 0);
    assert.deepEqual(tilts, []);
  });
});
