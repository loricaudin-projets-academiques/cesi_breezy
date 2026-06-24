/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { Archive, Bookmark, Heart, MessageCircle, MoreHorizontal, Pin, Send, Share2, Trash2 } from 'lucide-react';
import { Comment, CommentsByPost, Post } from '../types';
import { playTick, playChime } from '../audio';
import Avatar from './Avatar';
import { getMediaUrl } from '../utils/mediaUrl';
import { forceNavigate } from '../utils/navigation';

// Les actions possibles sur un post — définies une seule fois et réutilisées
// par tous les écrans qui affichent des posts (feed, profil...)
export interface PostInteractionHandlers {
  onToggleStar: (id: string) => void;
  onToggleLike: (id: string) => void;
  onToggleComments: (id: string) => void;
  onLoadMoreComments: (id: string) => void;
  onCommentDraftChange: (id: string, text: string) => void;
  onAddComment: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDeletePost: (id: string, title?: string) => boolean | Promise<boolean>;
  triggerToast: (msg: string) => void;
}

// L'état partagé des listes de posts (commentaires, brouillons, sections dépliées)
export interface PostListState {
  postComments: CommentsByPost;
  commentDrafts: Record<string, string>;
  showCommentsForPost: Record<string, boolean>;
  commentHasMore: Record<string, boolean>;
  loadingComments: Record<string, boolean>;
}

interface PostCardProps extends PostInteractionHandlers {
  post: Post;
  comments: Comment[];
  commentDraft: string;
  showComments: boolean;
  hasMoreComments?: boolean;
  isLoadingComments?: boolean;
  canArchive?: boolean;
}

// Carte qui représente un post dans le fil d'actualité
export default function PostCard({
  post,
  comments = [],
  commentDraft = '',
  showComments = false,
  hasMoreComments = false,
  isLoadingComments = false,
  canArchive = false,
  onToggleStar,
  onToggleLike,
  onToggleComments,
  onLoadMoreComments,
  onCommentDraftChange,
  onAddComment,
  onToggleArchive,
  onTogglePin,
  onDeletePost,
  triggerToast
}: PostCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];
  const canManage = canArchive || post.canManage;
  const mediaImages = images.slice(0, 5);

  const getImageTileClass = (count: number, index: number) => {
    if (count === 1) return 'col-span-6 row-span-6';
    if (count === 2) return 'col-span-3 row-span-6';
    if (count === 3) return index === 0 ? 'col-span-6 row-span-3' : 'col-span-3 row-span-3';
    if (count === 4) return 'col-span-3 row-span-3';
    return index < 2 ? 'col-span-3 row-span-3' : 'col-span-2 row-span-3';
  };

  return (
    <motion.div
      layout
      className="glassmorphic rounded-2xl p-4 border border-white/5 flex flex-col gap-3 hover:border-white/10 transition-all duration-300 relative group"
    >
      {post.pinned && (
        <div className="absolute right-4 top-4 text-breezy-lavender" title="Publication epinglee">
          <Pin className="w-4 h-4 fill-current" />
        </div>
      )}
      {/* Qui a publié ce post et quand */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => forceNavigate(`/profile/${encodeURIComponent(post.authorUsername)}`)}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition"
        >
          <Avatar name={post.authorName} username={post.authorUsername} url={post.avatar} className="w-9 h-9" />
          <div>
            <h4 className="text-xs font-semibold text-breezy-icy leading-none">{post.authorName}</h4>
            <p className="text-[10px] font-mono text-white/45 mt-0.5">{post.authorUsername}</p>
          </div>
        </button>
        
        <div className={`flex items-center gap-1.5 ${post.pinned ? 'pr-6' : ''}`}>
          <span className="text-[8.5px] font-mono text-white/30">{post.timestamp}</span>
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/45 hover:text-breezy-neon"
                title="Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-white/10 bg-[#09090d] shadow-2xl p-1.5 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleArchive(post.id);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-white/[0.07] text-left text-[13px] leading-4 text-breezy-icy flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {post.archived ? 'Restaurer' : 'Archiver'}
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTogglePin(post.id);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-white/[0.07] text-left text-[13px] leading-4 text-breezy-icy flex items-center gap-2"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {post.pinned ? 'Retirer pin' : 'Epingler'}
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeletePost(post.id, post.title || post.content);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-rose-500/10 text-left text-[13px] leading-4 text-rose-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Marque-page pour sauvegarder le post */}
          <button
            onClick={() => onToggleStar(post.id)}
            className={`p-1.5 rounded-lg hover:bg-white/5 ${
              post.starredByUser ? 'text-breezy-lavender' : 'text-white/30'
            }`}
            title="Sauvegarder"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {post.title && (
        <h3 className="text-[18px] md:text-[22px] leading-6 md:leading-7 font-bold text-breezy-icy break-words pl-0.5">
          {post.title}
        </h3>
      )}

      {/* Le texte du post */}
      <p className="text-xs text-white/85 leading-relaxed tracking-tight break-words pl-0.5 font-sans">
        {post.content}
      </p>

      {/* Image optionnelle jointe au post */}
      {mediaImages.length > 0 && (
        <div className="grid grid-cols-6 grid-rows-6 gap-1.5 aspect-square max-h-[560px] rounded-xl overflow-hidden border border-white/10 mt-1 bg-black/20">
          {mediaImages.map((image, index) => (
            <div
              key={`${image.slice(0, 24)}-${index}`}
              className={`relative overflow-hidden bg-white/5 ${getImageTileClass(mediaImages.length, index)}`}
            >
              <img src={getMediaUrl(image)} className="w-full h-full object-cover" alt="Image du post" />
            </div>
          ))}
        </div>
      )}

      {/* Actions : like, commentaires, partage */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-0.5 font-mono select-none">
        
        {/* Like */}
        <button
          onClick={() => onToggleLike(post.id)}
          className={`flex items-center gap-1.5 text-xs font-semibold focus:outline-none transition active:scale-90 ${
            post.likedByUser ? 'text-rose-400' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${post.likedByUser ? 'fill-current' : ''}`} />
          <span className="text-[10px]">{post.likes}</span>
        </button>

        {/* Afficher / masquer les commentaires */}
        <button
          onClick={() => {
            playTick();
            onToggleComments(post.id);
          }}
          className={`flex items-center gap-1.5 text-xs focus:outline-none transition ${
            showComments ? 'text-breezy-neon font-semibold' : 'text-white/45 hover:text-white/70'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="text-[10px]">{post.comments}</span>
        </button>

        {/* Copie le lien du post dans le presse-papier */}
        <button
          onClick={() => {
            playChime();
            navigator.clipboard.writeText(`breezy.social/stream/${post.id}`);
            triggerToast(`Lien copié !`);
          }}
          className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/70 focus:outline-none"
          title="Copier le lien"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Section commentaires dépliable */}
      {showComments && (
        <div className="flex flex-col gap-2.5 pt-3.5 border-t border-white/5 mt-1.5">
          {/* Commentaires déjà publiés */}
          {comments.map((cmt, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/[0.03] p-2.5 rounded-xl text-[11px] leading-relaxed relative text-left">
              <span className="absolute right-2.5 top-2.5 text-[8.5px] font-mono text-white/30">{cmt.time}</span>
              <p className="font-semibold text-breezy-icy">{cmt.author} <span className="text-[9px] font-mono text-white/40 ml-1">{cmt.username}</span></p>
              <p className="text-white/80 mt-1">{cmt.text}</p>
            </div>
          ))}

          {isLoadingComments && comments.length === 0 && (
            <p className="text-[10px] text-white/35 text-center py-2">Chargement des commentaires...</p>
          )}

          {hasMoreComments && (
            <button
              type="button"
              disabled={isLoadingComments}
              onClick={() => onLoadMoreComments(post.id)}
              className="self-center px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-semibold text-white/65 hover:text-breezy-neon hover:border-breezy-border-active disabled:opacity-40 transition"
            >
              {isLoadingComments ? 'Chargement...' : 'Charger plus de commentaires'}
            </button>
          )}

          {/* Champ pour écrire un nouveau commentaire */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Écrire un commentaire..."
              value={commentDraft}
              onChange={(e) => onCommentDraftChange(post.id, e.target.value)}
              className="flex-1 bg-white/[0.03] text-xs p-2 rounded-xl text-breezy-icy placeholder-white/25 focus:outline-none border border-white/5 focus:border-breezy-border-active transition"
            />
            <button
              onClick={() => onAddComment(post.id)}
              className="w-8.5 h-8.5 rounded-xl bg-breezy-icy text-slate-950 flex items-center justify-center hover:bg-breezy-neon active:scale-95 transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
