import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Globe2, Hash, Search, UserRound } from 'lucide-react';
import { Post } from '../types';
import { playTick } from '../audio';
import { getErrorMessage } from '../utils/errors';
import { feedService } from '../services/ServiceContainer';
import { api } from '../services/api';
import { forceNavigate } from '../utils/navigation';
import Avatar from '../components/Avatar';

type SearchMode = 'tags' | 'global';

interface SearchUser {
  name: string;
  username: string;
  avatar: string;
  bio?: string;
}

interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchedPosts: Post[];
  triggerToast: (msg: string) => void;
  onCurrentUserChanged?: () => Promise<unknown>;
  language?: string;
}

const SEARCH_MODE_STORAGE_KEY = 'breezy_search_mode';

function PostSearchResult({ post }: { post: Post }) {
  return (
    <button
      onClick={() => {
        playTick();
        forceNavigate(`/feed?post=${post.id}&category=${post.category}`);
      }}
      className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition rounded-xl border border-white/5 text-left flex flex-col gap-1.5 cursor-pointer w-full"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-sans font-bold text-white/90 truncate">
          {post.authorName}
          <span className="font-mono text-purple-300 font-medium ml-1 text-[10px]">
            {post.authorUsername}
          </span>
        </p>
        <span className="text-[8.5px] font-mono text-white/30 shrink-0">{post.timestamp}</span>
      </div>
      {post.title && (
        <p className="text-sm font-bold text-breezy-icy break-words">{post.title}</p>
      )}
      <p className="text-xs text-white/85 break-words font-sans">{post.content}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono text-breezy-lavender bg-breezy-lavender/10 px-2 py-0.5 rounded-full border border-breezy-lavender/20"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export default function SearchScreen({
  searchQuery,
  setSearchQuery,
  searchedPosts,
  triggerToast,
  language = 'fr',
}: SearchScreenProps) {
  const [searchMode, setSearchMode] = useState<SearchMode>(() => {
    if (typeof window === 'undefined') return 'tags';
    return window.localStorage.getItem(SEARCH_MODE_STORAGE_KEY) === 'global' ? 'global' : 'tags';
  });
  const [tagSearchPosts, setTagSearchPosts] = useState<Post[]>([]);
  const [isSearchingTags, setIsSearchingTags] = useState(false);
  const [tagSearchPage, setTagSearchPage] = useState(1);
  const [tagSearchHasMore, setTagSearchHasMore] = useState(false);
  const [tagSearchLoadingMore, setTagSearchLoadingMore] = useState(false);
  const [allSearchPosts, setAllSearchPosts] = useState<Post[]>([]);
  const [globalPostsLoaded, setGlobalPostsLoaded] = useState(false);
  const [isLoadingGlobalPosts, setIsLoadingGlobalPosts] = useState(false);
  const [globalUsers, setGlobalUsers] = useState<SearchUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const isEnglish = language === 'en';
  const labels = {
    tagPlaceholder: isEnglish ? 'Search by tag (e.g. music, art)...' : 'Rechercher par tag (ex : musique, art)...',
    globalPlaceholder: isEnglish ? 'Search posts, users and tags...' : 'Rechercher des posts, utilisateurs et tags...',
    tagHelp: isEnglish ? 'Type a tag name to search posts.' : 'Saisis un nom de tag pour rechercher des posts.',
    globalHelp: isEnglish
      ? 'Type at least one letter to search everywhere.'
      : 'Saisis au moins une lettre pour lancer une recherche globale.',
    tagMode: isEnglish ? 'Tags' : 'Tags',
    globalMode: isEnglish ? 'Global' : 'Globale',
    results: isEnglish ? 'RESULT(S)' : 'RÉSULTAT(S)',
    clear: isEnglish ? 'Clear' : 'Effacer',
    noResult: isEnglish ? 'No results for' : 'Aucun résultat pour',
    postsWith: isEnglish ? 'Posts with' : 'Posts avec',
    posts: isEnglish ? 'Posts' : 'Posts',
    users: isEnglish ? 'Users' : 'Utilisateurs',
    matchingTags: isEnglish ? 'Tags' : 'Tags',
    loading: isEnglish ? 'Loading...' : 'Chargement...',
    loadMore: isEnglish ? 'Load more' : 'Charger plus',
  };

  const rawTag = searchQuery.trim().replace(/^#+/, '').trim();
  const globalQuery = searchQuery.trim().replace(/^[@#]+/, '').trim().toLowerCase();

  const changeSearchMode = (mode: SearchMode) => {
    playTick();
    setSearchMode(mode);
    window.localStorage.setItem(SEARCH_MODE_STORAGE_KEY, mode);
  };

  useEffect(() => {
    if (searchMode !== 'tags') {
      setIsSearchingTags(false);
      return;
    }

    if (!rawTag) {
      setTagSearchPosts([]);
      setTagSearchPage(1);
      setTagSearchHasMore(false);
      setIsSearchingTags(false);
      return;
    }

    let cancelled = false;
    setIsSearchingTags(true);
    setTagSearchPage(1);

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await feedService.searchByTag(rawTag, 1);
        if (!cancelled) {
          setTagSearchPosts(result.posts);
          setTagSearchPage(1);
          setTagSearchHasMore(result.hasMore);
        }
      } catch (error) {
        if (!cancelled) {
          setTagSearchPosts([]);
          setTagSearchHasMore(false);
          triggerToast(getErrorMessage(error, isEnglish ? 'Tag search unavailable.' : 'Recherche par tag indisponible.'));
        }
      } finally {
        if (!cancelled) setIsSearchingTags(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchMode, rawTag, triggerToast, isEnglish]);

  useEffect(() => {
    if (searchMode !== 'global' || globalPostsLoaded) return;

    let cancelled = false;
    setIsLoadingGlobalPosts(true);

    void feedService.fetchAllPostsForSearch()
      .then((posts) => {
        if (!cancelled) {
          setAllSearchPosts(posts);
          setGlobalPostsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllSearchPosts([]);
          setGlobalPostsLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGlobalPosts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchMode, globalPostsLoaded]);

  useEffect(() => {
    if (searchMode !== 'global' || !globalQuery) {
      setGlobalUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setIsSearchingUsers(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = await api.get<SearchUser[]>('/users/search', {
          params: { q: globalQuery },
        });
        if (!cancelled) setGlobalUsers(data || []);
      } catch {
        if (!cancelled) setGlobalUsers([]);
      } finally {
        if (!cancelled) setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchMode, globalQuery]);

  const globalSourcePosts = globalPostsLoaded ? allSearchPosts : searchedPosts;

  const globalPosts = useMemo(() => {
    if (!globalQuery) return [];
    return globalSourcePosts.filter((post) => {
      const searchableText = [
        post.title || '',
        post.content,
        post.authorName,
        post.authorUsername,
        ...(post.tags || []),
      ].join(' ').toLowerCase();

      return searchableText.includes(globalQuery);
    });
  }, [globalQuery, globalSourcePosts]);

  const globalTags = useMemo(() => {
    if (!globalQuery) return [];
    const tags = new Set<string>();

    globalSourcePosts.forEach((post) => {
      (post.tags || []).forEach((tag) => {
        if (tag.toLowerCase().includes(globalQuery)) tags.add(tag);
      });
    });

    return [...tags].sort((a, b) => a.localeCompare(b));
  }, [globalQuery, globalSourcePosts]);

  const handleLoadMoreTagResults = async () => {
    if (!rawTag || !tagSearchHasMore || tagSearchLoadingMore) return;
    setTagSearchLoadingMore(true);
    try {
      const nextPage = tagSearchPage + 1;
      const result = await feedService.searchByTag(rawTag, nextPage);
      setTagSearchPosts((prev) => {
        const existingIds = new Set(prev.map((post) => post.id));
        return [...prev, ...result.posts.filter((post) => !existingIds.has(post.id))];
      });
      setTagSearchPage(nextPage);
      setTagSearchHasMore(result.hasMore);
    } catch (error) {
      triggerToast(getErrorMessage(error, isEnglish ? 'Unable to load more results.' : 'Impossible de charger plus de résultats.'));
    } finally {
      setTagSearchLoadingMore(false);
    }
  };

  const hasQuery = searchMode === 'tags' ? rawTag !== '' : globalQuery !== '';
  const globalResultCount = globalPosts.length + globalUsers.length + globalTags.length;
  const isSearchingGlobally = isLoadingGlobalPosts || isSearchingUsers;

  return (
    <motion.div
      key="search-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 flex flex-col gap-3 relative min-h-[460px] w-full"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-[#AEEBFF]/10 to-purple-500/5 blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-pink-500/5 to-[#C8B6FF]/10 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="glassmorphic rounded-2xl p-3 border border-white/5 z-10 relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4.5 h-4.5 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchMode === 'tags' ? labels.tagPlaceholder : labels.globalPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 pl-11 text-breezy-icy placeholder-white/40 border border-white/5 focus:outline-none focus:border-breezy-border-active/40 focus:glow-neon transition"
            />
          </div>

          <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/5 shrink-0">
            <button
              type="button"
              aria-pressed={searchMode === 'tags'}
              onClick={() => changeSearchMode('tags')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono transition cursor-pointer ${
                searchMode === 'tags'
                  ? 'bg-breezy-lavender/15 text-breezy-lavender border border-breezy-lavender/25'
                  : 'text-white/40 border border-transparent hover:text-white/70'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              {labels.tagMode}
            </button>
            <button
              type="button"
              aria-pressed={searchMode === 'global'}
              onClick={() => changeSearchMode('global')}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono transition cursor-pointer ${
                searchMode === 'global'
                  ? 'bg-[#AEEBFF]/15 text-[#AEEBFF] border border-[#AEEBFF]/25'
                  : 'text-white/40 border border-transparent hover:text-white/70'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              {labels.globalMode}
            </button>
          </div>
        </div>
      </div>

      {!hasQuery ? (
        <div className="flex flex-col gap-2 min-h-[300px] z-10 relative">
          <p className="text-[10px] font-mono text-white/30 text-center mt-6 select-none">
            {searchMode === 'tags' ? labels.tagHelp : labels.globalHelp}
          </p>
        </div>
      ) : searchMode === 'tags' ? (
        <div className="flex flex-col gap-3.5 z-10 relative">
          <div className="flex justify-between items-baseline px-0.5 select-none">
            <p className="text-[10px] font-mono tracking-wider text-white/60">
              {isSearchingTags ? '...' : `${tagSearchPosts.length} ${labels.results}`}
              <span className="ml-2 text-breezy-lavender font-mono text-[9px]">#{rawTag}</span>
            </p>
            <button
              onClick={() => {
                playTick();
                setSearchQuery('');
              }}
              className="text-[9px] text-[#AEEBFF] underline cursor-pointer"
            >
              {labels.clear}
            </button>
          </div>

          {tagSearchPosts.length === 0 && !isSearchingTags ? (
            <div className="py-12 text-center text-white/35 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5 font-sans">
              {labels.noResult} &quot;{rawTag}&quot;
            </div>
          ) : (
            <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-2.5 min-h-[280px]">
              <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase select-none mb-1">
                {labels.postsWith} #{rawTag} {isSearchingTags ? '...' : `(${tagSearchPosts.length})`}
              </p>

              <div className="flex flex-col gap-3">
                {tagSearchPosts.map((post) => (
                  <PostSearchResult key={post.id} post={post} />
                ))}
              </div>

              {tagSearchHasMore && (
                <button
                  onClick={handleLoadMoreTagResults}
                  disabled={tagSearchLoadingMore}
                  className="self-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 hover:text-breezy-lavender hover:border-breezy-lavender/40 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer mt-2"
                >
                  {tagSearchLoadingMore ? labels.loading : labels.loadMore}
                </button>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 z-10 relative">
          <div className="flex justify-between items-baseline px-0.5 select-none">
            <p className="text-[10px] font-mono tracking-wider text-white/60">
              {isSearchingGlobally ? '...' : `${globalResultCount} ${labels.results}`}
              <span className="ml-2 text-[#AEEBFF] font-mono text-[9px]">&quot;{globalQuery}&quot;</span>
            </p>
            <button
              onClick={() => {
                playTick();
                setSearchQuery('');
              }}
              className="text-[9px] text-[#AEEBFF] underline cursor-pointer"
            >
              {labels.clear}
            </button>
          </div>

          {!isSearchingGlobally && globalResultCount === 0 ? (
            <div className="py-12 text-center text-white/35 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5 font-sans">
              {labels.noResult} &quot;{globalQuery}&quot;
            </div>
          ) : (
            <>
              {(isSearchingUsers || globalUsers.length > 0) && (
                <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-2.5">
                  <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase select-none">
                    {labels.users} {isSearchingUsers ? '...' : `(${globalUsers.length})`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {globalUsers.map((user) => (
                      <button
                        key={user.username}
                        onClick={() => {
                          playTick();
                          forceNavigate(`/profile/${encodeURIComponent(user.username.replace(/^@+/, ''))}`);
                        }}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 text-left transition cursor-pointer"
                      >
                        <Avatar name={user.name} username={user.username} url={user.avatar} className="w-9 h-9" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white/90 truncate">{user.name}</p>
                          <p className="text-[9px] font-mono text-purple-300 truncate">{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {globalTags.length > 0 && (
                <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-2.5">
                  <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase select-none">
                    {labels.matchingTags} ({globalTags.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {globalTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          changeSearchMode('tags');
                        }}
                        className="text-[10px] font-mono text-breezy-lavender bg-breezy-lavender/10 px-3 py-1.5 rounded-full border border-breezy-lavender/20 hover:border-breezy-lavender/50 hover:bg-breezy-lavender/15 transition cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {(isLoadingGlobalPosts || globalPosts.length > 0) && (
                <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-2.5 min-h-[120px]">
                  <p className="text-[10px] font-mono tracking-wider text-white/50 uppercase select-none">
                    {labels.posts} {isLoadingGlobalPosts ? '...' : `(${globalPosts.length})`}
                  </p>
                  <div className="flex flex-col gap-3">
                    {globalPosts.map((post) => (
                      <PostSearchResult key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              )}

              {isSearchingGlobally && globalResultCount === 0 && (
                <div className="py-8 flex items-center justify-center gap-2 text-white/35 text-[10px] font-mono">
                  <UserRound className="w-4 h-4" />
                  {labels.loading}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
