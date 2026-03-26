import { environment } from '../environments/environment';

const FALLBACK_ADMIN_PORTAL_PATH = 'intern/maschinenraum';

export const adminPortalPath = normalizePath(environment.adminPortalPath);
export const adminPortalUrl = `/${adminPortalPath}`;

function normalizePath(value: string | undefined): string {
  const trimmedValue = value?.trim().replace(/^\/+|\/+$/g, '');
  return trimmedValue || FALLBACK_ADMIN_PORTAL_PATH;
}
