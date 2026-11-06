import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export type TiltDirection = 'down' | 'up';

/**
 * Whether the game can read the motion sensor. `unknown` until the player
 * taps Start for the first time.
 */
export type MotionAccess = 'unknown' | 'granted' | 'denied';

/**
 * How far the screen has to face the floor or ceiling to count as a tilt,
 * on a scale from -1 (facing the floor) to 1 (facing the ceiling). 0.5 is
 * 30 degrees past upright.
 */
export const TILT_TRIGGER = 0.5;

/**
 * How close to upright the phone has to come back before the next tilt
 * counts. 0.25 is about 15 degrees. This stops one nod from counting twice.
 */
export const TILT_RESET = 0.25;

interface DeviceOrientationEventWithPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/**
 * Which way the screen faces: 1 is straight up at the ceiling, -1 is straight
 * down at the floor, and 0 is upright, like when it's held to a forehead.
 * This works the same in either landscape direction and in portrait.
 *
 * `beta` and `gamma` are the angles, in degrees, from a `deviceorientation`
 * event. The value is the vertical part of the screen's direction.
 */
export function screenFacing(beta: number, gamma: number): number {
  const toRadians = Math.PI / 180;
  return Math.cos(beta * toRadians) * Math.cos(gamma * toRadians);
}

/**
 * Turns a stream of phone angles into single "down" or "up" tilts.
 */
export class TiltDetector {
  #onTilt: (direction: TiltDirection) => void;
  #armed = false;

  constructor(onTilt: (direction: TiltDirection) => void) {
    this.#onTilt = onTilt;
  }

  update(beta: number | null, gamma: number | null): void {
    if (beta === null || gamma === null) {
      return;
    }

    const facing = screenFacing(beta, gamma);

    // Nothing counts until the phone has been held upright, so a phone that
    // starts out tilted doesn't answer the first word by itself.
    if (Math.abs(facing) <= TILT_RESET) {
      this.#armed = true;
      return;
    }

    if (!this.#armed) {
      return;
    }

    if (facing <= -TILT_TRIGGER) {
      this.#armed = false;
      this.#onTilt('down');
    } else if (facing >= TILT_TRIGGER) {
      this.#armed = false;
      this.#onTilt('up');
    }
  }
}

/**
 * Reads the motion sensor so players can tilt to answer.
 */
export default class TiltService extends Service {
  @tracked access: MotionAccess = 'unknown';

  /**
   * Asks for motion access. On iPhone this shows a prompt, and it only works
   * when called straight from a tap, before anything else is awaited. Other
   * devices don't ask, so they're treated as granted.
   */
  async requestAccess(): Promise<MotionAccess> {
    const OrientationEvent = window.DeviceOrientationEvent as
      DeviceOrientationEventWithPermission | undefined;

    if (typeof OrientationEvent?.requestPermission !== 'function') {
      this.access = 'granted';
      return this.access;
    }

    try {
      const result = await OrientationEvent.requestPermission();
      this.access = result === 'granted' ? 'granted' : 'denied';
    } catch {
      // Safari throws if the page isn't on HTTPS or the call didn't come from a tap.
      this.access = 'denied';
    }
    return this.access;
  }

  /**
   * Calls `onTilt` each time the phone tips down or up. Returns a function
   * that stops listening.
   */
  listen(onTilt: (direction: TiltDirection) => void): () => void {
    const detector = new TiltDetector(onTilt);
    const handler = (event: DeviceOrientationEvent) => {
      detector.update(event.beta, event.gamma);
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }
}
