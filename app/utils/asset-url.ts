/**
 * The full URL of a file in public/, including the deployment path
 * (ROOT_URL). Use this instead of a bare "/file.svg", which would skip the
 * path and 404 when the game is served from a folder.
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export const LOGO_URL = assetUrl('logo.svg');
