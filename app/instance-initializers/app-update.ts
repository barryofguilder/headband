import type ApplicationInstance from '@ember/application/instance';
import type AppUpdateService from 'headband/services/app-update';

/**
 * Registers the service worker and starts watching for new versions.
 */
export function initialize(appInstance: ApplicationInstance): void {
  (appInstance.lookup('service:app-update') as AppUpdateService).start();
}

export default { initialize };
