"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
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

  const searchParams = useSearchParams();
  const highlightPostId = searchParams?.get("post") || null;
  const expandComments = searchParams?.get("expandComments") === "true";

  useEffect(() => {
    void profile.refreshCurrentUser();
  }, [profile.refreshCurrentUser]);

  useEffect(() => {
    if (highlightPostId && expandComments && feed.userPosts.length > 0) {
      const hasPost = feed.userPosts.some((p) => p.id === highlightPostId);
      if (hasPost && !feed.showCommentsForPost[highlightPostId] && feed.handleToggleComments) {
        feed.handleToggleComments(highlightPostId);
      }
    }
  }, [highlightPostId, expandComments, feed.userPosts, feed.showCommentsForPost, feed.handleToggleComments]);

  return (
    <ProfileScreen
      key="profile"
      user={profile.user}
      posts={feed.userPosts}
      highlightedPostId={highlightPostId || undefined}
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
      {...postInteractions}
    />
  );
}
