export function assertAdminAccess(isAdmin: boolean): void {
  if (!isAdmin) {
    throw new Error('Bitte mit einem freigeschalteten Admin-Account im Maschinenraum einloggen.');
  }
}
