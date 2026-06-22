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
import { PROFILE_BIO_MAX_LENGTH, PROFILE_NOTE_MAX_LENGTH } from '../profileLimits';

const limitProfileText = (value: string, maxLength: number) => value.trim().slice(0, maxLength);
const emptySocialLists: Record<ProfileStatType, Follower[]> = {
  followers: [],
  following: [],
  friends: [],
};

// Gère tout ce qui concerne le profil utilisateur : édition, musique, modals d'édition
export function useProfile(triggerToast: (msg: string) => void) {
  // Les données du profil, rechargées depuis le stockage au démarrage
  const [user, setUser] = useState<UserProfile>(() => {
    return authService.getCurrentUser();
  });

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
    authService.saveCurrentUser(user);
  }, [user]);

  const refreshCurrentUser = useCallback(async () => {
    if (!authService.isLoggedIn()) {
      const localUser = authService.getCurrentUser();
      setUser(localUser);
      return localUser;
    }

    const freshUser = await authService.fetchCurrentUser();
    setUser(freshUser);
    return freshUser;
  }, []);

  useEffect(() => {
    if (!authService.isLoggedIn()) return;

    refreshCurrentUser().catch(() => {
      // Keep the cached profile usable if the API is temporarily unavailable.
    });
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
      triggerToast(getErrorMessage(error, 'Liste indisponible.'));
      return [];
    } finally {
      setIsSocialListLoading(false);
    }
  }, [triggerToast]);

  // Enregistre la note d'humeur — si vide, on met un message par défaut
  const handleSaveNote = (newNote: string) => {
    playChime();
    const nextNote = limitProfileText(newNote, PROFILE_NOTE_MAX_LENGTH);
    setUser((prev) => ({ ...prev, note: nextNote || 'En mode Breezy...' }));
    setShowNoteEditor(false);
    triggerToast('Ta note a bien été mise à jour !');
  };

  // Enregistre la biographie
  const handleSaveBio = (newBio: string) => {
    playChime();
    const nextBio = limitProfileText(newBio, PROFILE_BIO_MAX_LENGTH);
    setUser((prev) => ({ ...prev, bio: nextBio || 'Membre Breezy.' }));
    setShowBioEditor(false);
    triggerToast('Ta bio a été mise à jour !');
  };

  // Change l'avatar et répercute la modification sur les posts existants si besoin
  const handleSelectAvatar = (url: string, onAvatarChangeCallback?: (url: string) => void) => {
    playChime();
    setUser((prev) => ({ ...prev, avatar: url }));
    if (onAvatarChangeCallback) {
      onAvatarChangeCallback(url);
    }
    setShowAvatarSelector(false);
    triggerToast('Nouvel avatar enregistré !');
  };

  // Ouvre la liste des abonnés, abonnements ou amis
  const handleOpenStatsModal = (type: ProfileStatType) => {
    playTick();
    setFollowersModalType(type);
    setShowFollowersModal(true);
    void loadSocialList(type);
  };

  // Met la musique en pause ou la relance
  const toggleMusicPlaying = () => {
    playTick();
    setUser((prev) => {
      const nextPlaying = !prev.music.isPlaying;
      triggerToast(nextPlaying ? 'Lecture en cours 🎵' : 'Musique en pause');
      return {
        ...prev,
        music: { ...prev.music, isPlaying: nextPlaying }
      };
    });
  };

  // Met à jour les infos de la chanson en cours (titre, artiste, pochette...)
  const handleMusicChange = (updates: Partial<typeof user.music>) => {
    setUser((prev) => ({
      ...prev,
      music: { ...prev.music, ...updates }
    }));
  };

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
    socialLists,
    isSocialListLoading,
    loadSocialList,
    handleSaveNote,
    handleSaveBio,
    handleSelectAvatar,
    handleOpenStatsModal,
    toggleMusicPlaying,
    handleMusicChange
  };
}
