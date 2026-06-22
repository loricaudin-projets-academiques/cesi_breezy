/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Extrait un message lisible depuis une erreur de type inconnu.
// Gère les erreurs Axios (response.data.message) en priorité.
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    // Erreur Axios : le vrai message est dans response.data.message
    const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  return fallback;
}
