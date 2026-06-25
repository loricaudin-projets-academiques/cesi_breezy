/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Compass } from 'lucide-react';
import { Post, PostCategory, POST_CATEGORIES } from '../types';
import PostCard, { PostInteractionHandlers, PostListState } from '../components/PostCard';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';

const categoryTranslations: Record<string, TranslationKey> = {
  'for-you': 'feed.for_you',
  'following': 'feed.following',
  'friends': 'feed.friends',
  'saved': 'feed.favorites'
};

interface FeedScreenProps extends PostInteractionHandlers, PostListState {
  homeCategory: PostCategory;
  onCategoryChange: (cat: PostCategory) => void;
  filteredPosts: Post[];
  feedHasMore: boolean;
  feedLoadingMore: boolean;
  onLoadMoreFeed: () => void;
  highlightedPostId?: string;
}

// Fil d'actualité principal — affiche les posts selon l'onglet sélectionné
export default function FeedScreen({
  homeCategory,
  onCategoryChange,
  filteredPosts,
  feedHasMore,
  feedLoadingMore,
  onLoadMoreFeed,
  postComments,
  commentDrafts,
  showCommentsForPost,
  commentHasMore,
  loadingComments,
  commentReplies,
  showRepliesForComment,
  onToggleStar,
  onToggleLike,
  onToggleComments,
  onLoadMoreComments,
  onCommentDraftChange,
  onAddComment,
  onToggleArchive,
  onTogglePin,
  onDeletePost,
  onEditPost,
  onToggleReplies,
  onAddReply,
  triggerToast,
  highlightedPostId
}: FeedScreenProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      key="home-feed"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 flex flex-col gap-3"
    >
      {/* Onglets de catégorie : Pour toi, Abonnements, Amis, Favoris */}
      <div className="glassmorphic rounded-2xl p-1 flex gap-1 border border-white/5 select-none shrink-0">
        {POST_CATEGORIES.map(({ key }) => {
          const isActive = homeCategory === key;
          const translatedLabel = t(categoryTranslations[key] || 'feed.for_you');
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
              {translatedLabel}
            </button>
          );
        })}
      </div>

      {/* Message d'état vide si aucun post dans cette catégorie */}
      {filteredPosts.length === 0 ? (
        <div className="py-14 text-center text-white/30 flex flex-col justify-center items-center gap-2 bg-[#0d0d12]/20 rounded-2xl border border-white/5">
          <Compass className="w-9 h-9 opacity-35" />
          <div>
            <p className="text-xs font-semibold text-breezy-icy">
              {t('feed.empty', { category: t(categoryTranslations[homeCategory] || 'feed.for_you') })}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">{t('feed.empty_desc')}</p>
          </div>
        </div>
      ) : (
        // La liste des posts filtrés
        <div className="flex flex-col gap-2.5">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isHighlighted={highlightedPostId === post.id}
              comments={postComments[post.id]}
              commentDraft={commentDrafts[post.id]}
              showComments={showCommentsForPost[post.id]}
              hasMoreComments={commentHasMore[post.id]}
              isLoadingComments={loadingComments[post.id]}
              commentReplies={commentReplies}
              showRepliesForComment={showRepliesForComment}
              onToggleStar={onToggleStar}
              onToggleLike={onToggleLike}
              onToggleComments={onToggleComments}
              onLoadMoreComments={onLoadMoreComments}
              onCommentDraftChange={onCommentDraftChange}
              onAddComment={onAddComment}
              onToggleArchive={onToggleArchive}
              onTogglePin={onTogglePin}
              onDeletePost={onDeletePost}
              onEditPost={onEditPost}
              onToggleReplies={onToggleReplies}
              onAddReply={onAddReply}
              canArchive={post.canArchive}
              triggerToast={triggerToast}
            />
          ))}

          {feedHasMore && (
            <button
              onClick={onLoadMoreFeed}
              disabled={feedLoadingMore}
              className="w-full py-3 text-xs font-medium font-sans rounded-2xl glass border border-white/10 text-white/60 hover:text-white transition duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {feedLoadingMore ? t('feed.loading') : t('feed.load_more')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
