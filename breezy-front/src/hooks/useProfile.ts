/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ProfileStatType, UserProfile } from '../types';
import { playChime, playTick } from '../audio';
import { authService } from '../services/ServiceContainer';
import { PROFILE_BIO_MAX_LENGTH, PROFILE_NOTE_MAX_LENGTH } from '../profileLimits';
import { useLang } from '../translations/LanguageProvider';

const limitProfileText = (value: string, maxLength: number) => value.trim().slice(0, maxLength);

export function useProfile(triggerToast: (msg: string) => void) {
  const { t } = useLang();
  const [user, setUser] = useState<UserProfile>(() => {
    return authService.getCurrentUser();
  });

  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<ProfileStatType>('followers');

  useEffect(() => {
    authService.saveCurrentUser(user);
  }, [user]);

  const handleSaveNote = (newNote: string) => {
    playChime();
    const nextNote = limitProfileText(newNote, PROFILE_NOTE_MAX_LENGTH);
    setUser((prev) => ({ ...prev, note: nextNote || 'En mode Breezy...' }));
    setShowNoteEditor(false);
    triggerToast(t('toasts.noteUpdated'));
  };

  const handleSaveBio = (newBio: string) => {
    playChime();
    const nextBio = limitProfileText(newBio, PROFILE_BIO_MAX_LENGTH);
    setUser((prev) => ({ ...prev, bio: nextBio || 'Membre Breezy.' }));
    setShowBioEditor(false);
    triggerToast(t('toasts.bioUpdated'));
  };

  const handleSelectAvatar = (url: string, onAvatarChangeCallback?: (url: string) => void) => {
    playChime();
    setUser((prev) => ({ ...prev, avatar: url }));
    if (onAvatarChangeCallback) {
      onAvatarChangeCallback(url);
    }
    setShowAvatarSelector(false);
    triggerToast(t('toasts.avatarUpdated'));
  };

  const handleOpenStatsModal = (type: ProfileStatType) => {
    playTick();
    setFollowersModalType(type);
    setShowFollowersModal(true);
  };

  const toggleMusicPlaying = () => {
    playTick();
    setUser((prev) => {
      const nextPlaying = !prev.music.isPlaying;
      triggerToast(nextPlaying ? t('toasts.musicPlayingNow') : t('toasts.musicPaused'));
      return {
        ...prev,
        music: { ...prev.music, isPlaying: nextPlaying }
      };
    });
  };

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
