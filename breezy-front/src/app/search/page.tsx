"use client";

import SearchScreen from "../../screens/SearchScreen";
import { useBreezyApp } from "../BreezyAppProvider";

export default function SearchPage() {
  const { searchQuery, setSearchQuery, searchedPosts } = useBreezyApp();

  return (
    <SearchScreen
      key="search"
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchedPosts={searchedPosts}
    />
  );
}
