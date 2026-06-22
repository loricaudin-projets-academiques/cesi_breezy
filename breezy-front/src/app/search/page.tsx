"use client";

import SearchScreen from "../../screens/SearchScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function SearchPage() {
  const { searchQuery, setSearchQuery, searchedPosts, triggerToast, profile } = useBreezyApp();

  return (
    <SearchScreen
      key="search"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchedPosts={searchedPosts}
      triggerToast={triggerToast}
      onCurrentUserChanged={profile.refreshCurrentUser}
    />
  );
}
