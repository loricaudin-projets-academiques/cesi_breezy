"use client";

import { useEffect } from "react";
import { playTick } from "../../audio";
import ProfileScreen from "../../screens/ProfileScreen";
import { useBreezyApp } from "../BreezyAppProvider";
import { ProfileSubTab } from "../../types";

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

  useEffect(() => {
    void profile.refreshCurrentUser();
  }, [profile.refreshCurrentUser]);

  const handleProfileSubTabChange = (tab: ProfileSubTab) => {
    setActiveProfileSubTab(tab);
    if (tab !== "posts") {
      void profile.loadSocialList(tab);
    }
  };

  return (
    <ProfileScreen
      key="profile"
      user={profile.user}
      posts={feed.posts}
      socialMembers={activeProfileSubTab === "posts" ? [] : profile.socialLists[activeProfileSubTab]}
      isSocialListLoading={profile.isSocialListLoading}
      activeProfileSubTab={activeProfileSubTab}
      setActiveProfileSubTab={handleProfileSubTabChange}
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
