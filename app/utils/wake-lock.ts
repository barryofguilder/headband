/**
 * Asks the browser to keep the screen on. With tilt controls nobody touches
 * the screen during a round, so without this the phone can dim or lock.
 * Returns a function that lets the screen sleep again. Does nothing where
 * the browser doesn't support it.
 */
export function keepScreenOn(): () => void {
  let sentinel: WakeLockSentinel | undefined;
  let released = false;

  navigator.wakeLock
    ?.request('screen')
    .then((lock) => {
      if (released) {
        void lock.release();
      } else {
        sentinel = lock;
      }
    })
    .catch(() => {
      // Not allowed or not supported. The round still works.
    });

  return () => {
    released = true;
    void sentinel?.release();
  };
}
