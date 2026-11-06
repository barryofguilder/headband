import type ApplicationInstance from '@ember/application/instance';

/**
 * Starts the install service right away. Chrome's install prompt event can
 * fire before the Home screen renders, and it's lost if nothing is listening.
 */
export function initialize(appInstance: ApplicationInstance): void {
  appInstance.lookup('service:install');
}

export default { initialize };
