/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { Post } from '../types';
import { playTick } from '../audio';
import { useLang } from '../translations/LanguageProvider';

interface SearchScreenProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchedPosts: Post[];
}

export default function SearchScreen({
  searchQuery,
  setSearchQuery,
  searchedPosts
}: SearchScreenProps) {
  const { t } = useLang();

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
          <Search className="w-4.5 h-4.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 pl-11 text-breezy-icy placeholder-white/30 border border-white/5 focus:outline-none focus:border-breezy-border-active/40 focus:glow-neon transition"
          />
        </div>
      </div>

      {searchQuery.trim() === '' ? (
        <div className="flex-1 min-h-[400px]" />
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline px-0.5">
            <p className="text-[10px] font-mono tracking-wider text-white/40">
              {t('search.results', { count: searchedPosts.length })}
            </p>
            <button
              onClick={() => {
                playTick();
                setSearchQuery('');
              }}
              className="text-[9px] text-[#AEEBFF] underline select-none"
            >
              {t('search.clear')}
            </button>
          </div>

          {searchedPosts.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs">
              {t('search.noResults', { query: searchQuery })}
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-left">
              {searchedPosts.map((p) => (
                <div key={p.id} className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <p className="text-[10px] font-sans font-bold text-breezy-neon">
                    {p.authorName} {p.authorUsername}
                  </p>
                  <p className="text-xs text-white/80 mt-1 break-words">
                    {p.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
