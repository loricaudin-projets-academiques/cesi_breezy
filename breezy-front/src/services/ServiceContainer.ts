/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IStorageProvider } from './storage/IStorageProvider';
import { LocalStorageProvider } from './storage/LocalStorageProvider';
import { IAuthService } from './auth/IAuthService';
import { HttpAuthService } from './auth/HttpAuthService';
import { IFeedService } from './feed/IFeedService';
import { HttpFeedService } from './feed/HttpFeedService';
import { IConversationService } from './conversation/IConversationService';
import { HttpConversationService } from './conversation/HttpConversationService';
import { IUploadService } from './upload/IUploadService';
import { HttpUploadService } from './upload/HttpUploadService';

// On instancie un seul fournisseur de stockage partagé par tous les services
const storageProvider: IStorageProvider = new LocalStorageProvider();

// Ces quatre services sont des singletons — une seule instance dans toute l'app.
// Le reste du code ne voit que les interfaces : quand on passera à un vrai
// back-end, on remplacera juste "Mock" par "Api" ici, sans toucher au reste.
export const authService: IAuthService = new HttpAuthService(storageProvider);
export const feedService: IFeedService = new HttpFeedService(storageProvider);
export const conversationService: IConversationService = new HttpConversationService(storageProvider);
export const uploadService: IUploadService = new HttpUploadService();
