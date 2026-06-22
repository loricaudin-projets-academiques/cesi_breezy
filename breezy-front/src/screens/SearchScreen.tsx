import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Search, UserCheck, UserPlus } from 'lucide-react';
import { Follower, Post } from '../types';
import { playTick } from '../audio';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { getAvatarUrl } from '../components/Avatar';

interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchedPosts: Post[];
  triggerToast: (msg: string) => void;
  onCurrentUserChanged?: () => Promise<unknown>;
}

export default function SearchScreen({
  searchQuery,
  setSearchQuery,
  searchedPosts,
  triggerToast,
  onCurrentUserChanged
}: SearchScreenProps) {
  const router = useRouter();
  const [searchedUsers, setSearchedUsers] = useState<Follower[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setIsSearchingUsers(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = await api.get<Follower[]>('/users/search', { params: { q: query } });
        if (!cancelled) setSearchedUsers(data);
      } catch (error) {
        if (!cancelled) {
          setSearchedUsers([]);
          triggerToast(getErrorMessage(error, 'Recherche utilisateurs indisponible.'));
        }
      } finally {
        if (!cancelled) setIsSearchingUsers(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, triggerToast]);

  const handleToggleFollow = async (user: Follower) => {
    playTick();

    try {
      const { data } = user.followedByMe
        ? await api.delete<Follower>(`/users/${user.username}/follow`)
        : await api.post<Follower>(`/users/${user.username}/follow`);

      setSearchedUsers((prev) => prev.map((item) => item.username === user.username ? data : item));
      void onCurrentUserChanged?.();
      triggerToast(data.isFriend ? `${data.name} est maintenant ton ami.` : data.followedByMe ? `${data.name} suivi.` : `${data.name} retire des abonnements.`);
    } catch (error) {
      triggerToast(getErrorMessage(error, 'Action impossible.'));
    }
  };

  const openUserProfile = (username: string) => {
    playTick();
    router.push(`/profile/${encodeURIComponent(username)}`);
  };

  const hasQuery = searchQuery.trim() !== '';
  const totalResults = searchedUsers.length + searchedPosts.length;

  return (
    <motion.div
      key="search-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 flex flex-col gap-4"
    >
      <div className="glassmorphic rounded-2xl p-3 border border-white/5">
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-white/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un post, un auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 pl-11 text-breezy-icy placeholder-white/40 border border-white/5 focus:outline-none focus:border-breezy-border-active/40 focus:glow-neon transition"
          />
        </div>
      </div>

      {!hasQuery ? (
        <div className="flex-1 min-h-[400px]" />
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline px-0.5">
            <p className="text-[10px] font-mono tracking-wider text-white/60">
              {totalResults} RESULTAT(S)
            </p>
            <button
              onClick={() => {
                playTick();
                setSearchQuery('');
              }}
              className="text-[9px] text-[#AEEBFF] underline select-none"
            >
              Effacer
            </button>
          </div>

          {totalResults === 0 && !isSearchingUsers ? (
            <div className="py-12 text-center text-white/55 text-xs">
              Aucun resultat pour &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 text-left">
              <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-2 min-h-[280px]">
                <p className="text-[9px] font-mono tracking-wider text-white/60 uppercase">
                  Utilisateurs {isSearchingUsers ? '...' : `(${searchedUsers.length})`}
                </p>

                {searchedUsers.map((user) => (
                  <div
                    key={user.username}
                    role="button"
                    tabIndex={0}
                    onClick={() => openUserProfile(user.username)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openUserProfile(user.username);
                      }
                    }}
                    className="p-2.5 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-between gap-2 hover:border-breezy-border-active/50 hover:bg-white/[0.04] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={getAvatarUrl(user.avatar, user.username, user.name)} className="w-8 h-8 rounded-full object-cover border border-white/10" alt="" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-sans font-bold text-breezy-icy truncate">
                          {user.name}
                          {user.isFriend && <span className="ml-1 text-[8px] font-mono text-breezy-neon uppercase">ami</span>}
                        </p>
                        <p className="text-[9px] font-mono text-white/55 truncate">
                          {user.username}{user.followsMe ? ' · te suit' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleFollow(user);
                      }}
                      className="py-1.5 px-2.5 text-[8px] font-bold font-mono rounded bg-white/5 hover:bg-white/10 border border-white/5 transition shrink-0 active:scale-95"
                    >
                      {user.followedByMe ? (
                        <span className="text-[#AEEBFF] flex items-center gap-1"><UserCheck className="w-3 h-3" /> suivi</span>
                      ) : (
                        <span className="text-white/75 flex items-center gap-1"><UserPlus className="w-3 h-3" /> suivre</span>
                      )}
                    </button>
                  </div>
                ))}
              </section>

              <section className="glassmorphic rounded-2xl border border-white/5 p-3 flex flex-col gap-3 min-h-[280px]">
                <p className="text-[9px] font-mono tracking-wider text-white/60 uppercase">
                  Posts ({searchedPosts.length})
                </p>

                {searchedPosts.map((post) => (
                  <div key={post.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <p className="text-[10px] font-sans font-bold text-breezy-neon">
                      {post.authorName} {post.authorUsername}
                    </p>
                    {post.title && (
                      <p className="text-sm font-bold text-breezy-icy mt-1 break-words">{post.title}</p>
                    )}
                    <p className="text-xs text-white/85 mt-1 break-words">{post.content}</p>
                  </div>
                ))}
              </section>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
