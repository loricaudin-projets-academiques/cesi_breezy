"use client";

import FeedScreen from "../../screens/FeedScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function FeedPage() {
  const { feed, postInteractions } = useBreezyApp();

  return (
    <FeedScreen
      key="feed"
      homeCategory={feed.homeCategory}
      onCategoryChange={feed.handleCategoryChange}
      filteredPosts={feed.filteredPosts}
      {...postInteractions}
    />
  );
}
