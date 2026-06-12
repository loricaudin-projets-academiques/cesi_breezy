/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IStorageProvider } from './storage/IStorageProvider';
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { IAuthService } from './auth/IAuthService';
import { MockAuthService } from './auth/MockAuthService';
import { IFeedService } from './feed/IFeedService';
import { MockFeedService } from './feed/MockFeedService';
import { IConversationService } from './conversation/IConversationService';
import { MockConversationService } from './conversation/MockConversationService';

// On instancie un seul fournisseur de stockage partagé par tous les services
const storageProvider: IStorageProvider = new LocalStorageProvider();

// Ces trois services sont des singletons — une seule instance dans toute l'app.
// Le reste du code ne voit que les interfaces : quand on passera à un vrai
// back-end, on remplacera juste "Mock" par "Api" ici, sans toucher au reste.
export const authService: IAuthService = new MockAuthService(storageProvider);
export const feedService: IFeedService = new MockFeedService(storageProvider);
export const conversationService: IConversationService = new MockConversationService(storageProvider, authService);
