/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Compass } from 'lucide-react';
import { Post, PostCategory, POST_CATEGORIES } from '../types';
import PostCard, { PostInteractionHandlers, PostListState } from '../components/PostCard';
import { useLang } from '../translations/LanguageProvider';

interface FeedScreenProps extends PostInteractionHandlers, PostListState {
  homeCategory: PostCategory;
  onCategoryChange: (cat: PostCategory) => void;
  filteredPosts: Post[];
}

export default function FeedScreen({
  homeCategory,
  onCategoryChange,
  filteredPosts,
  postComments,
  commentDrafts,
  showCommentsForPost,
  onToggleStar,
  onToggleLike,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  triggerToast
}: FeedScreenProps) {
  const { t } = useLang();

  const categoryLabel: Record<PostCategory, string> = {
    'for-you': t('feed.categoryForYou'),
    'following': t('feed.categoryFollowing'),
    'friends': t('feed.categoryFriends'),
    'starred': t('feed.categoryStarred'),
  };

  return (
    <motion.div
      key="home-feed"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 flex flex-col gap-4"
    >
      <div className="glassmorphic rounded-2xl p-1 flex gap-1 border border-white/5 select-none shrink-0">
        {POST_CATEGORIES.map(({ key }) => {
          const isActive = homeCategory === key;
          return (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={`flex-1 py-1.5 text-[10.5px] font-medium font-sans rounded-xl transition-all duration-300 relative ${
                isActive
                  ? 'text-[#050505] font-semibold bg-white scale-[1.01] shadow-md'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {categoryLabel[key]}
            </button>
          );
        })}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-24 text-center text-white/30 flex flex-col justify-center items-center gap-3 bg-[#0d0d12]/20 rounded-2xl border border-white/5">
          <Compass className="w-9 h-9 opacity-35" />
          <div>
            <p className="text-xs font-semibold text-breezy-icy">
              {t('feed.emptyTitle', { category: categoryLabel[homeCategory] })}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">{t('feed.emptyDesc')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={postComments[post.id]}
              commentDraft={commentDrafts[post.id]}
              showComments={showCommentsForPost[post.id]}
              onToggleStar={onToggleStar}
              onToggleLike={onToggleLike}
              onToggleComments={onToggleComments}
              onCommentDraftChange={onCommentDraftChange}
              onAddComment={onAddComment}
              triggerToast={triggerToast}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
