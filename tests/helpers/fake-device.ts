import { tracked } from '@glimmer/tracking';
import { settled } from '@ember/test-helpers';
import type Owner from '@ember/owner';
import TiltService from 'headband/services/tilt';
import type {
  ContentRotation,
  MotionAccess,
  TiltDirection,
} from 'headband/services/tilt';
import OrientationService from 'headband/services/orientation';

/**
 * A motion sensor the test controls. Call `tiltPhone` to tilt it.
 */
export class FakeTilt extends TiltService {
  /**
   * What the next permission request returns.
   */
  nextAccess: MotionAccess = 'granted';
  listeners = new Set<(direction: TiltDirection) => void>();

  requestAccess(): Promise<MotionAccess> {
    this.access = this.nextAccess;
    return Promise.resolve(this.access);
  }

  listen(onTilt: (direction: TiltDirection) => void): () => void {
    this.listeners.add(onTilt);
    return () => this.listeners.delete(onTilt);
  }

  sidewaysWatchers = new Set<(rotation: ContentRotation | undefined) => void>();

  async tiltPhone(direction: TiltDirection): Promise<void> {
    for (const listener of this.listeners) {
      listener(direction);
    }
    await settled();
  }

  watchSideways(
    onChange: (rotation: ContentRotation | undefined) => void,
  ): () => void {
    this.sidewaysWatchers.add(onChange);
    return () => this.sidewaysWatchers.delete(onChange);
  }

  /**
   * Reports the phone as held sideways (or upright, with `undefined`), the
   * way the motion sensor would.
   */
  async holdPhone(rotation: ContentRotation | undefined): Promise<void> {
    for (const watcher of this.sidewaysWatchers) {
      watcher(rotation);
    }
    await settled();
  }
}

/**
 * Screen orientation the test controls. Starts sideways.
 */
export class FakeOrientation extends OrientationService {
  @tracked isLandscape = true;

  lockLandscape(): void {}
  unlock(): void {}
}

/**
 * Swaps in the fake motion sensor and orientation. Call before `visit`.
 */
export function useFakeDevice(owner: Owner): {
  tilt: FakeTilt;
  orientation: FakeOrientation;
} {
  owner.register('service:tilt', FakeTilt);
  owner.register('service:orientation', FakeOrientation);
  return {
    tilt: owner.lookup('service:tilt') as FakeTilt,
    orientation: owner.lookup('service:orientation') as FakeOrientation,
  };
}
