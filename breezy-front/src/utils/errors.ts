/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Extrait un message lisible depuis une erreur de type inconnu.
// Évite les `catch (error: any)` dispersés dans le code.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
