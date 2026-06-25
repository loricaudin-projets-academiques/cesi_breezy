"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FeedScreen from "../../screens/FeedScreen";
import { useBreezyApp } from "../BreezyAppProvider";
import { PostCategory } from "../../types";

const VALID_CATEGORIES: PostCategory[] = ["for-you", "following", "friends"];

export default function FeedPage() {
  const { feed, postInteractions } = useBreezyApp();
  const searchParams = useSearchParams();
  const highlightPostId = searchParams?.get("post") || null;
  const categoryParam = searchParams?.get("category") as PostCategory | null;

  useEffect(() => {
    if (categoryParam && VALID_CATEGORIES.includes(categoryParam)) {
      feed.handleCategoryChange(categoryParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam]);

  // Si le post cible n'est pas encore chargé, continuer à charger les pages suivantes
  useEffect(() => {
    if (!highlightPostId) return;
    if (feed.feedLoadingMore) return;
    const found = feed.filteredPosts.some((p) => p.id === highlightPostId);
    if (!found && feed.feedHasMore) {
      void feed.handleLoadMoreFeed();
    }
  }, [highlightPostId, feed.filteredPosts, feed.feedHasMore, feed.feedLoadingMore, feed.handleLoadMoreFeed]);

  return (
    <FeedScreen
      key="feed"
      homeCategory={feed.homeCategory}
      onCategoryChange={feed.handleCategoryChange}
      filteredPosts={feed.filteredPosts}
      feedHasMore={feed.feedHasMore}
      feedLoadingMore={feed.feedLoadingMore}
      onLoadMoreFeed={feed.handleLoadMoreFeed}
      highlightedPostId={highlightPostId || undefined}
      {...postInteractions}
    />
  );
}
