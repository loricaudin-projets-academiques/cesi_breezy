/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Compass } from 'lucide-react';
import { Post, PostCategory, POST_CATEGORIES } from '../types';
import PostCard, { PostInteractionHandlers, PostListState } from '../components/PostCard';

interface FeedScreenProps extends PostInteractionHandlers, PostListState {
  homeCategory: PostCategory;
  onCategoryChange: (cat: PostCategory) => void;
  filteredPosts: Post[];
}

// Fil d'actualité principal — affiche les posts selon l'onglet sélectionné
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
  return (
    <motion.div
      key="home-feed"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 flex flex-col gap-4"
    >
      {/* Onglets de catégorie : Pour toi, Abonnements, Amis, Favoris */}
      <div className="glassmorphic rounded-2xl p-1 flex gap-1 border border-breezy-border select-none shrink-0">
        {POST_CATEGORIES.map(({ key, label }) => {
          const isActive = homeCategory === key;
          return (
            <button
              key={key}
              onClick={() => onCategoryChange(key)}
              className={`flex-1 py-1.5 text-[10.5px] font-medium font-sans rounded-xl transition-all duration-300 relative ${
                isActive
                  ? 'text-breezy-bg font-semibold bg-breezy-icy scale-[1.01] shadow-md'
                  : 'text-breezy-muted hover:text-breezy-icy'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Message d'état vide si aucun post dans cette catégorie */}
      {filteredPosts.length === 0 ? (
        <div className="py-24 text-center text-breezy-faint flex flex-col justify-center items-center gap-3 bg-breezy-card rounded-2xl border border-breezy-border">
          <Compass className="w-9 h-9 opacity-35" />
          <div>
            <p className="text-xs font-semibold text-breezy-icy">Rien dans "{homeCategory}" pour l'instant</p>
            <p className="text-[10px] text-breezy-muted mt-0.5">Publie quelque chose pour commencer !</p>
          </div>
        </div>
      ) : (
        // La liste des posts filtrés
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
