import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Post } from '../types';
import { playTick } from '../audio';
import { getErrorMessage } from '../utils/errors';
import { feedService } from '../services/ServiceContainer';
import { forceNavigate } from '../utils/navigation';
import { useTranslation } from '../hooks/useTranslation';

interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchedPosts: Post[];
  triggerToast: (msg: string) => void;
  onCurrentUserChanged?: () => Promise<unknown>;
  language?: string;
}

export default function SearchScreen({
  searchQuery,
  setSearchQuery,
  triggerToast,
  language = 'fr',
}: SearchScreenProps) {
  const [tagSearchPosts, setTagSearchPosts] = useState<Post[]>([]);
  const [isSearchingTags, setIsSearchingTags] = useState(false);
  const [tagSearchPage, setTagSearchPage] = useState(1);
  const [tagSearchHasMore, setTagSearchHasMore] = useState(false);
  const [tagSearchLoadingMore, setTagSearchLoadingMore] = useState(false);

  const { t } = useTranslation();
  const isEnglish = language === 'en';
  const labels = {
    placeholder: isEnglish ? 'Search by tag (e.g. music, art)...' : 'Rechercher par tag (ex : musique, art)...',
    helpText: isEnglish ? 'Type a tag name to search posts.' : 'Saisis un nom de tag pour rechercher des posts.',
    results: isEnglish ? 'RESULT(S)' : 'RESULTAT(S)',
    clear: isEnglish ? 'Clear' : 'Effacer',
    noResult: isEnglish ? 'No results for' : 'Aucun résultat pour',
    postsWith: isEnglish ? 'Posts with' : 'Posts avec',
    loading: isEnglish ? 'Loading...' : 'Chargement...',
    loadMore: isEnglish ? 'Load more' : 'Charger plus',
  };

  const rawTag = searchQuery.trim().replace(/^#+/, '').trim();

  useEffect(() => {
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
          triggerToast(getErrorMessage(error, t('search.error_tag')));
        }
      } finally {
        if (!cancelled) setIsSearchingTags(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, rawTag, triggerToast, isEnglish]);

  const handleLoadMoreTagResults = async () => {
    if (!rawTag || !tagSearchHasMore || tagSearchLoadingMore) return;
    setTagSearchLoadingMore(true);
    try {
      const nextPage = tagSearchPage + 1;
      const result = await feedService.searchByTag(rawTag, nextPage);
      setTagSearchPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...result.posts.filter((p) => !existingIds.has(p.id))];
      });
      setTagSearchPage(nextPage);
      setTagSearchHasMore(result.hasMore);
    } catch (error) {
      triggerToast(getErrorMessage(error, t('search.error_more')));
    } finally {
      setTagSearchLoadingMore(false);
    }
  };

  const hasQuery = rawTag !== '';

  return (
    <motion.div
      key="search-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 flex flex-col gap-3 relative min-h-[460px] w-full"
    >
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-[#AEEBFF]/10 to-purple-500/5 blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-pink-500/5 to-[#C8B6FF]/10 blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="glassmorphic rounded-2xl p-3 border border-white/5 z-10 relative">
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={labels.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 pl-11 text-breezy-icy placeholder-white/40 border border-white/5 focus:outline-none focus:border-breezy-border-active/40 focus:glow-neon transition"
          />
        </div>
      </div>

      {!hasQuery ? (
        <div className="flex flex-col gap-2 min-h-[300px] z-10 relative">
          <p className="text-[10px] font-mono text-white/30 text-center mt-6 select-none">
            {labels.helpText}
          </p>
        </div>
      ) : (
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
                  <button
                    key={post.id}
                    onClick={() => {
                      playTick();
                      forceNavigate(`/feed?post=${post.id}&category=${post.category}`);
                    }}
                    className="p-2.5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition rounded-xl border border-white/5 text-left flex flex-col gap-1.5 cursor-pointer w-full"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-sans font-bold text-white/90">
                        {post.authorName} <span className="font-mono text-purple-300 font-medium ml-1 text-[10px]">{post.authorUsername}</span>
                      </p>
                      <span className="text-[8.5px] font-mono text-white/30">{post.timestamp}</span>
                    </div>
                    {post.title && (
                      <p className="text-sm font-bold text-breezy-icy break-words">{post.title}</p>
                    )}
                    <p className="text-xs text-white/85 break-words font-sans">{post.content}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {post.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono text-breezy-lavender bg-breezy-lavender/10 px-2 py-0.5 rounded-full border border-breezy-lavender/20">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
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
      )}
    </motion.div>
  );
}
