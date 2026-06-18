/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Bookmark, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { Comment, CommentsByPost, Post } from '../types';
import { playTick, playChime } from '../audio';
import Avatar from './Avatar';
import ImagePicker from './ImagePicker';

// Les actions possibles sur un post — définies une seule fois et réutilisées
// par tous les écrans qui affichent des posts (feed, profil...)
export interface PostInteractionHandlers {
  onToggleStar: (id: string) => void;
  onToggleLike: (id: string) => void;
  onToggleComments: (id: string) => void;
  onCommentDraftChange: (id: string, text: string) => void;
  onCommentImageChange: (id: string, url?: string) => void;
  onAddComment: (id: string) => void;
  triggerToast: (msg: string) => void;
}

// L'état partagé des listes de posts (commentaires, brouillons, sections dépliées)
export interface PostListState {
  postComments: CommentsByPost;
  commentDrafts: Record<string, string>;
  commentImageDrafts: Record<string, string>;
  showCommentsForPost: Record<string, boolean>;
}

interface PostCardProps extends PostInteractionHandlers {
  post: Post;
  comments: Comment[];
  commentDraft: string;
  commentImageDraft?: string;
  showComments: boolean;
}

// Carte qui représente un post dans le fil d'actualité
export default function PostCard({
  post,
  comments = [],
  commentDraft = '',
  commentImageDraft,
  showComments = false,
  onToggleStar,
  onToggleLike,
  onToggleComments,
  onCommentDraftChange,
  onCommentImageChange,
  onAddComment,
  triggerToast
}: PostCardProps) {
  return (
    <motion.div
      layout
      className="glassmorphic rounded-2xl p-4 border border-white/5 flex flex-col gap-3 hover:border-white/10 transition-all duration-300 relative group"
    >
      {/* Qui a publié ce post et quand */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name={post.authorName} username={post.authorUsername} url={post.avatar} className="w-9 h-9" />
          <div>
            <h4 className="text-xs font-semibold text-breezy-icy leading-none">{post.authorName}</h4>
            <p className="text-[10px] font-mono text-white/45 mt-0.5">{post.authorUsername}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[8.5px] font-mono text-white/30">{post.timestamp}</span>
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

      {/* Le texte du post */}
      <p className="text-xs text-white/85 leading-relaxed tracking-tight break-words pl-0.5 font-sans">
        {post.content}
      </p>

      {/* Image optionnelle jointe au post */}
      {post.image && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 mt-1 max-h-64 flex justify-center bg-black/20">
          <img src={post.image} className="max-w-full max-h-64 object-contain" alt="Image du post" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pointer-events-none">
            <span className="text-[8.5px] font-mono text-white/60 bg-black/40 px-1.5 py-0.5 rounded border border-white/10">IMAGE</span>
          </div>
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
          <span className="text-[10px]">{comments.length}</span>
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
              {cmt.text && <p className="text-white/80 mt-1">{cmt.text}</p>}
              {cmt.image && (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-48 flex justify-center bg-black/20">
                  <img src={cmt.image} className="max-w-full max-h-48 object-contain" alt="Image du commentaire" />
                </div>
              )}
            </div>
          ))}

          {/* Champ pour écrire un nouveau commentaire */}
          <div className="flex flex-col gap-1.5">
            <ImagePicker
              value={commentImageDraft || undefined}
              onChange={(u) => onCommentImageChange(post.id, u)}
              triggerToast={triggerToast}
            />
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
                disabled={!commentDraft.trim() && !commentImageDraft}
                className="w-8.5 h-8.5 rounded-xl bg-breezy-icy text-slate-950 flex items-center justify-center hover:bg-breezy-neon active:scale-95 transition shrink-0 disabled:opacity-40 disabled:hover:bg-breezy-icy"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
