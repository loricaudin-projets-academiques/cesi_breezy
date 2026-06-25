/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Extrait un message lisible depuis une erreur de type inconnu.
// Évite les `catch (error: any)` dispersés dans le code.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    // Réponse HTTP avec message serveur (axios / fetch)
    const resp = (error as Record<string, unknown>).response;
    if (resp && typeof resp === "object") {
      const data = (resp as Record<string, unknown>).data;
      if (data && typeof data === "object") {
        const msg = (data as Record<string, unknown>).message;
        if (typeof msg === "string" && msg) return msg;
      }
    }
    if (error instanceof Error && error.message) return error.message;
  }
  return fallback;
}
