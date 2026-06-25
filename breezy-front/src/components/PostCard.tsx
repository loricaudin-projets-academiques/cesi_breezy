/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Archive, Bookmark, ChevronDown, ChevronUp, CornerDownRight, Edit3, Heart, MessageCircle, MoreHorizontal, Pin, Send, Share2, Trash2 } from 'lucide-react';
import { Comment, CommentsByPost, Post, RepliesByComment } from '../types';
import { playTick, playChime } from '../audio';
import Avatar from './Avatar';
import { getMediaUrl } from '../utils/mediaUrl';
import { forceNavigate } from '../utils/navigation';
import PostEditorModal from './modals/PostEditorModal';
import { useTranslation } from '../hooks/useTranslation';
import MentionInput from './MentionInput';
import { renderWithMentions } from '../utils/mentionUtils';

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
  onEditPost: (id: string, title: string, content: string) => Promise<void> | void;
  onToggleReplies: (commentId: string) => void;
  onAddReply: (postId: string, commentId: string, text: string) => Promise<void>;
  triggerToast: (msg: string) => void;
}

// L'état partagé des listes de posts (commentaires, brouillons, sections dépliées)
export interface PostListState {
  postComments: CommentsByPost;
  commentDrafts: Record<string, string>;
  showCommentsForPost: Record<string, boolean>;
  commentHasMore: Record<string, boolean>;
  loadingComments: Record<string, boolean>;
  commentReplies: RepliesByComment;
  showRepliesForComment: Record<string, boolean>;
}

interface PostCardProps extends PostInteractionHandlers {
  post: Post;
  comments: Comment[];
  commentDraft: string;
  showComments: boolean;
  hasMoreComments?: boolean;
  isLoadingComments?: boolean;
  canArchive?: boolean;
  commentReplies?: RepliesByComment;
  showRepliesForComment?: Record<string, boolean>;
  isHighlighted?: boolean;
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
  commentReplies = {},
  showRepliesForComment = {},
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
  isHighlighted = false
}: PostCardProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showReplyInputFor, setShowReplyInputFor] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const images = post.images?.length ? post.images : post.image ? [post.image] : [];
  const canManage = canArchive || post.canManage;
  const mediaImages = images.slice(0, 5);

  useEffect(() => {
    if (isHighlighted) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`post-${post.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, post.id]);

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
      id={`post-${post.id}`}
      className={`glassmorphic rounded-2xl p-4 border flex flex-col gap-3 hover:border-white/10 transition-all duration-300 relative group ${
        isHighlighted
          ? 'border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.15)] bg-emerald-500/[0.03]'
          : 'border-white/5'
      }`}
    >
      {post.pinned && (
        <div className="absolute right-4 top-4 text-breezy-lavender" title="Publication épinglée">
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
                <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-white/10 bg-[#08080c] shadow-2xl p-1.5 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-white/[0.07] text-left text-[13px] leading-4 text-breezy-icy flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
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
                    {post.pinned ? 'Retirer pin' : 'Épingler'}
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
        <h3 className="text-[15px] md:text-[17px] leading-5 md:leading-6 font-bold text-breezy-icy break-words pl-0.5">
          {post.title}
        </h3>
      )}

      {/* Le texte du post */}
      <p className="text-xs text-white/85 leading-relaxed tracking-tight break-words pl-0.5 font-sans">
        {renderWithMentions(post.content)}
      </p>

      {/* Tags du post */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-0.5">
          {post.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-mono text-breezy-lavender bg-breezy-lavender/10 px-2 py-0.5 rounded-full border border-breezy-lavender/20 cursor-default select-none">
              #{tag}
            </span>
          ))}
        </div>
      )}

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
            navigator.clipboard.writeText(`${window.location.origin}/profile/${encodeURIComponent(post.authorUsername)}?post=${post.id}`);
            triggerToast(t('post.link_copied'));
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
          {isLoadingComments && comments.length === 0 && (
            <p className="text-[10px] text-white/35 text-center py-2">Chargement des commentaires...</p>
          )}

          {/* Commentaires déjà publiés */}
          {comments.map((cmt, idx) => {
            const cid = cmt.id || `${idx}`;
            const replies = commentReplies[cid] || [];
            const repliesVisible = showRepliesForComment[cid] || false;
            const replyInputVisible = showReplyInputFor[cid] || false;

            return (
              <div key={cid} className="flex flex-col gap-1.5">
                {/* Commentaire principal */}
                <div className="bg-white/[0.02] border border-white/[0.03] p-2.5 rounded-xl text-[11px] leading-relaxed relative text-left">
                  <span className="absolute right-2.5 top-2.5 text-[8.5px] font-mono text-white/30">{cmt.time}</span>
                  <p className="font-semibold text-breezy-icy pr-12">
                    {cmt.author}
                    <span className="text-[9px] font-mono text-white/40 ml-1">{cmt.username}</span>
                  </p>
                  <p className="text-white/80 mt-1">{renderWithMentions(cmt.text)}</p>

                  {/* Actions du commentaire */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => setShowReplyInputFor((prev) => ({ ...prev, [cid]: !prev[cid] }))}
                      className="flex items-center gap-1 text-[10px] text-white/40 hover:text-breezy-neon transition"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      Répondre
                    </button>
                    {(cmt.repliesCount || 0) > 0 && (
                      <button
                        onClick={() => onToggleReplies(cid)}
                        className="flex items-center gap-1 text-[10px] text-white/40 hover:text-breezy-lavender transition"
                      >
                        {repliesVisible
                          ? <><ChevronUp className="w-3 h-3" />Masquer</>
                          : <><ChevronDown className="w-3 h-3" />{cmt.repliesCount} réponse{(cmt.repliesCount || 0) > 1 ? 's' : ''}</>
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Champ de réponse inline */}
                {replyInputVisible && (
                  <div className="flex items-center gap-1.5 ml-5 pl-3 border-l border-white/10">
                    <input
                      type="text"
                      placeholder={`Répondre à ${cmt.author}...`}
                      value={replyDrafts[cid] || ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [cid]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void onAddReply(post.id, cid, replyDrafts[cid] || '').then(() => {
                            setReplyDrafts((prev) => ({ ...prev, [cid]: '' }));
                            setShowReplyInputFor((prev) => ({ ...prev, [cid]: false }));
                          });
                        }
                      }}
                      className="flex-1 bg-white/[0.03] text-xs p-2 rounded-xl text-breezy-icy placeholder-white/25 focus:outline-none border border-white/5 focus:border-breezy-border-active transition"
                    />
                    <button
                      onClick={() => {
                        void onAddReply(post.id, cid, replyDrafts[cid] || '').then(() => {
                          setReplyDrafts((prev) => ({ ...prev, [cid]: '' }));
                          setShowReplyInputFor((prev) => ({ ...prev, [cid]: false }));
                        });
                      }}
                      className="w-8 h-8 rounded-xl bg-breezy-lavender/80 text-slate-950 flex items-center justify-center hover:bg-breezy-lavender active:scale-95 transition shrink-0"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Liste des réponses */}
                {repliesVisible && replies.length > 0 && (
                  <div className="flex flex-col gap-1.5 ml-5 pl-3 border-l border-white/10">
                    {replies.map((reply, rIdx) => (
                      <div key={reply.id || rIdx} className="bg-white/[0.015] border border-white/[0.025] p-2 rounded-xl text-[11px] leading-relaxed relative text-left">
                        <span className="absolute right-2 top-2 text-[8px] font-mono text-white/25">{reply.time}</span>
                        <p className="font-semibold text-breezy-lavender pr-10">
                          {reply.author}
                          <span className="text-[9px] font-mono text-white/35 ml-1">{reply.username}</span>
                        </p>
                        <p className="text-white/70 mt-0.5">{renderWithMentions(reply.text)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

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
            <MentionInput
              value={commentDraft}
              onChange={(v) => onCommentDraftChange(post.id, v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onAddComment(post.id);
                }
              }}
              placeholder={t('messages.input_placeholder')}
              className="flex-1 bg-white/[0.03] text-xs p-2 rounded-xl text-breezy-icy placeholder-white/25 focus:outline-none border border-white/5 focus:border-breezy-border-active transition"
            />
            <button
              onClick={() => onAddComment(post.id)}
              className="w-8 h-8 rounded-xl bg-breezy-icy text-slate-950 flex items-center justify-center hover:bg-breezy-neon active:scale-95 transition shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <PostEditorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialTitle={post.title || ""}
        initialContent={post.content}
        onSave={(title, content) => onEditPost(post.id, title, content)}
      />
    </motion.div>
  );
}
