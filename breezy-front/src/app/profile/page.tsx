"use client";

import { playTick } from "../../audio";
import ProfileScreen from "../../screens/ProfileScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function ProfilePage() {
  const {
    profile,
    feed,
    activeProfileSubTab,
    setActiveProfileSubTab,
    setIsHamburgerOpen,
    setIsPostModalOpen,
    postInteractions,
  } = useBreezyApp();

  return (
    <ProfileScreen
      key="profile"
      user={profile.user}
      posts={feed.posts}
      activeProfileSubTab={activeProfileSubTab}
      setActiveProfileSubTab={setActiveProfileSubTab}
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
