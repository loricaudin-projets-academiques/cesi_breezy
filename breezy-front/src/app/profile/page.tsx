"use client";

import { useEffect } from "react";
import { playTick } from "../../audio";
import ProfileScreen from "../../screens/ProfileScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function ProfilePage() {
  const {
    profile,
    feed,
    setIsHamburgerOpen,
    setIsPostModalOpen,
    postInteractions,
  } = useBreezyApp();

  useEffect(() => {
    void profile.refreshCurrentUser();
  }, [profile.refreshCurrentUser]);

  return (
    <ProfileScreen
      key="profile"
      user={profile.user}
      posts={feed.posts}
      onOpenHamburger={() => {
        playTick();
        setIsHamburgerOpen(true);
      }}
      onOpenPostModal={() => {
        playTick();
        setIsPostModalOpen(true);
      }}
      onOpenBioEditor={() => {
        playTick();
        profile.setShowBioEditor(true);
      }}
      onOpenNoteEditor={() => {
        playTick();
        profile.setShowNoteEditor(true);
      }}
      onOpenAvatarSelector={() => {
        playTick();
        profile.setShowAvatarSelector(true);
      }}
      onOpenStatsModal={profile.handleOpenStatsModal}
      onMusicPlayToggle={profile.toggleMusicPlaying}
      onMusicChange={profile.handleMusicChange}
      {...postInteractions}
    />
  );
}
