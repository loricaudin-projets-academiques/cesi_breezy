/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Normalise un pseudo saisi par l'utilisateur : espaces retirés et @ garanti en préfixe.
// Toute l'app passe par ici — la règle n'existe qu'à un seul endroit.
export function normalizeUsername(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}
