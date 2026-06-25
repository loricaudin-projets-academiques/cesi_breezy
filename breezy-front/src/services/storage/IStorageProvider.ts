/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Interface commune pour tout système de stockage de données
// Si on veut remplacer le localStorage par autre chose un jour, il suffit
// de créer une nouvelle classe qui respecte ces méthodes
export interface IStorageProvider {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}
