/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IStorageProvider } from "./IStorageProvider";

export class LocalStorageProvider implements IStorageProvider {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Erreur de lecture localStorage pour la cle "${key}" :`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Erreur d'ecriture localStorage pour la cle "${key}" :`, error);
    }
  }

  remove(key: string): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erreur de suppression localStorage pour la cle "${key}" :`, error);
    }
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.clear();
    } catch (error) {
      console.error("Erreur lors du nettoyage du localStorage :", error);
    }
  }
}
