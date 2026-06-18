/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAxiosError } from "axios";

// Extrait un message lisible depuis une erreur de type inconnu.
// Lit d'abord le message serveur (réponse JSON { message }) avant le fallback.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const serverMsg = (error.response?.data as { message?: string })?.message;
    return serverMsg || error.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
