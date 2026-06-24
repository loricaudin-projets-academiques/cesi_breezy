/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState, useEffect } from 'react';
import { Follower, ProfileStatType, UserProfile } from '../types';
import { playChime, playTick } from '../audio';
import { authService } from '../services/ServiceContainer';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { PROFILE_BIO_MAX_LENGTH, PROFILE_NAME_MAX_LENGTH, PROFILE_NOTE_MAX_LENGTH } from '../profileLimits';
import { INITIAL_USER } from '../mockData';
import { getT } from './useTranslation';

const limitProfileText = (value: string, maxLength: number) => value.trim().slice(0, maxLength);
const emptySocialLists: Record<ProfileStatType, Follower[]> = {
  followers: [],
  following: [],
  friends: [],
};

// Gère tout ce qui concerne le profil utilisateur : édition, musique, modals d'édition
export function useProfile(triggerToast: (msg: string) => void) {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const t = getT(user.language || 'fr');

  // Contrôle l'ouverture et la fermeture de chaque modal d'édition
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<ProfileStatType>('followers');
  const [socialLists, setSocialLists] = useState<Record<ProfileStatType, Follower[]>>(emptySocialLists);
  const [isSocialListLoading, setIsSocialListLoading] = useState(false);

  // À chaque modification du profil, on sauvegarde discrètement en arrière-plan
  useEffect(() => {
    if (user.username) {
      authService.saveCurrentUser(user);
    }
  }, [user]);

  const refreshCurrentUser = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      const localUser = authService.getCurrentUser();
      setUser(localUser);
      return localUser;
    }

    try {
      const freshUser = await authService.fetchCurrentUser();
      setUser(freshUser);
      return freshUser;
    } catch {
      const localUser = authService.getCurrentUser();
      setUser(localUser);
      return localUser;
    }
  }, []);

  useEffect(() => {
    if (!authService.isLoggedIn()) return;

    refreshCurrentUser().catch(() => {
      // Keep the cached profile usable if the API is temporarily unavailable.
    });

    const interval = setInterval(() => {
      refreshCurrentUser().catch(() => {});
    }, 30_000);

    return () => clearInterval(interval);
  }, [refreshCurrentUser]);

  const loadSocialList = useCallback(async (type: ProfileStatType) => {
    if (!authService.isLoggedIn()) {
      setSocialLists(emptySocialLists);
      return [];
    }

    setIsSocialListLoading(true);
    try {
      const { data } = await api.get<Follower[]>(`/users/${type}`);
      setSocialLists((prev) => ({ ...prev, [type]: data }));
      return data;
    } catch (error) {
      triggerToast(getErrorMessage(error, t('profile.error_list')));
      return [];
    } finally {
      setIsSocialListLoading(false);
    }
  }, [triggerToast]);

  const updateCurrentUser = useCallback(async (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));

    try {
      const { data } = await api.patch<UserProfile>('/users/me', updates);
      setUser(data);
      return data;
    } catch (error) {
      triggerToast(getErrorMessage(error, t('profile.error_save')));
      throw error;
    }
  }, [triggerToast]);

  // Enregistre la note d'humeur — si vide, on met un message par défaut
  const handleSaveNote = (newNote: string) => {
    playChime();
    const nextNote = limitProfileText(newNote, PROFILE_NOTE_MAX_LENGTH);
    void updateCurrentUser({ note: nextNote || 'En mode Breezy...' });
    setShowNoteEditor(false);
    triggerToast(t('profile.toast_note'));
  };

  // Enregistre la biographie
  const handleSaveBio = (newName: string, newBio: string) => {
    playChime();
    const nextName = limitProfileText(newName, PROFILE_NAME_MAX_LENGTH);
    const nextBio = limitProfileText(newBio, PROFILE_BIO_MAX_LENGTH);
    void updateCurrentUser({ name: nextName || user.name, bio: nextBio || 'Membre Breezy.' });
    setShowBioEditor(false);
    triggerToast(t('profile.toast_bio'));
  };

  // Change l'avatar et répercute la modification sur les posts existants si besoin
  const handleSelectAvatar = (url: string, onAvatarChangeCallback?: (url: string) => void) => {
    playChime();
    void updateCurrentUser({ avatar: url }).then((savedUser) => {
      onAvatarChangeCallback?.(savedUser.avatar);
    });
    setShowAvatarSelector(false);
    triggerToast(t('profile.toast_avatar'));
  };

  // Ouvre la liste des abonnés, abonnements ou amis
  const handleOpenStatsModal = (type: ProfileStatType) => {
    playTick();
    setFollowersModalType(type);
    setShowFollowersModal(true);
    void loadSocialList(type);
  };

  const handleToggleFollow = useCallback(async (member: Follower) => {
    playTick();
    try {
      const { data } = member.followedByMe
        ? await api.delete<{ followedByMe: boolean; isFriend: boolean }>(`/users/${member.username}/follow`)
        : await api.post<{ followedByMe: boolean; isFriend: boolean }>(`/users/${member.username}/follow`);

      setSocialLists((prev) => {
        const updated = { ...prev } as Record<ProfileStatType, Follower[]>;
        for (const key of Object.keys(updated) as ProfileStatType[]) {
          updated[key] = updated[key].map((m) =>
            m.username === member.username
              ? { ...m, followedByMe: data.followedByMe, isFriend: data.isFriend }
              : m
          );
        }
        return updated;
      });

      triggerToast(
        data.isFriend
          ? t('profile.toast_now_friend', { name: member.name })
          : data.followedByMe
          ? t('profile.toast_followed', { name: member.name })
          : t('profile.toast_unfollowed', { name: member.name })
      );
    } catch (error) {
      triggerToast(getErrorMessage(error, t('action.error')));
    }
  }, [triggerToast]);

  return {
    user,
    setUser,
    showNoteEditor,
    setShowNoteEditor,
    showBioEditor,
    setShowBioEditor,
    showAvatarSelector,
    setShowAvatarSelector,
    showFollowersModal,
    setShowFollowersModal,
    followersModalType,
    refreshCurrentUser,
    updateCurrentUser,
    socialLists,
    isSocialListLoading,
    loadSocialList,
    handleSaveNote,
    handleSaveBio,
    handleSelectAvatar,
    handleOpenStatsModal,
    handleToggleFollow,
  };
}
