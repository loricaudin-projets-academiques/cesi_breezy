/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ProfileStatType, UserProfile } from '../types';
import { playChime, playTick } from '../audio';
import { authService } from '../services/ServiceContainer';

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

  // À chaque modification du profil, on sauvegarde discrètement en arrière-plan
  useEffect(() => {
    authService.saveCurrentUser(user);
  }, [user]);

  // Enregistre la note d'humeur — si vide, on met un message par défaut
  const handleSaveNote = (newNote: string) => {
    playChime();
    setUser((prev) => ({ ...prev, note: newNote.trim() || 'En mode Breezy...' }));
    setShowNoteEditor(false);
    triggerToast('Ta note a bien été mise à jour !');
  };

  // Enregistre la biographie
  const handleSaveBio = (newBio: string) => {
    playChime();
    setUser((prev) => ({ ...prev, bio: newBio.trim() || 'Membre Breezy.' }));
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
    handleSaveNote,
    handleSaveBio,
    handleSelectAvatar,
    handleOpenStatsModal,
    toggleMusicPlaying,
    handleMusicChange
  };
}
