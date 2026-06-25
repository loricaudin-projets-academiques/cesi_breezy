import { motion } from 'motion/react';
import { Menu, Edit2, Gamepad2, ImageIcon } from 'lucide-react';
import { UserProfile, Post, ProfileStatType } from '../types';
import PostCard, { PostInteractionHandlers, PostListState } from '../components/PostCard';
import { getAvatarUrl } from '../components/Avatar';
import { playChime } from '../audio';
import { useTranslation } from '../hooks/useTranslation';

interface ProfileScreenProps extends PostInteractionHandlers, PostListState {
  user: UserProfile;
  posts: Post[];
  onOpenHamburger: () => void;
  onOpenPostModal: () => void;
  onOpenBioEditor: () => void;
  onOpenNoteEditor: () => void;
  onOpenAvatarSelector: () => void;
  onOpenStatsModal: (type: ProfileStatType) => void;
  highlightedPostId?: string;
}

export default function ProfileScreen({
  user,
  posts,
  onOpenHamburger,
  onOpenPostModal,
  onOpenBioEditor,
  onOpenNoteEditor,
  onOpenAvatarSelector,
  onOpenStatsModal,
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
}: ProfileScreenProps) {
  const { t } = useTranslation();
  const userPosts = posts
    .filter((post) => post.authorUsername === user.username)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <motion.div
      key="profile-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3 md:p-4 flex flex-col gap-3 text-left w-full max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-center bg-transparent shrink-0">
        <div />
        <button
          onClick={onOpenHamburger}
          className="w-10 h-10 rounded-xl glassmorphism-light hover:bg-white/10 flex md:hidden items-center justify-center text-white/90 cursor-pointer active:scale-95 transition shadow-sm border border-white/5"
          title="Menu"
        >
          <Menu className="w-4.5 h-4.5 text-breezy-icy" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 md:gap-5 pb-2 select-none">
        <div className="col-span-8 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-1">
              <div>
                <h2 className="text-[16px] md:text-lg font-sans font-bold text-white leading-none tracking-tight">
                  {user.name}
                </h2>
                <p className="text-xs font-sans text-purple-300 font-medium mt-1">{user.username}</p>
              </div>
              <button
                onClick={onOpenBioEditor}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/55 hover:text-breezy-neon select-none"
                title={t('profile.edit_bio')}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div
              onClick={onOpenBioEditor}
              className="glass mt-3 w-full max-w-full min-h-[72px] rounded-2xl border border-white/5 px-4 py-3 text-[11px] md:text-xs leading-relaxed text-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition duration-300 hover:border-purple-500/20 cursor-pointer font-sans"
              title={t('profile.edit_bio')}
            >
              <p className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
                {user.bio ? `"${user.bio}"` : <span className="text-white/45 italic">{t('modal.edit_bio_placeholder')}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-4 select-none w-full">
            <div className="flex gap-1.5 w-full">
              <button
                onClick={() => onOpenStatsModal('followers')}
                className="flex-1 glass p-2 rounded-xl text-center transition duration-300 active:scale-95 hover:border-purple-500/20"
              >
                <div className="text-xs font-bold text-[#AEEBFF]">{user.followers}</div>
                <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wider font-sans">{t('profile.followers')}</div>
              </button>

              <button
                onClick={() => onOpenStatsModal('following')}
                className="flex-1 glass p-2 rounded-xl text-center transition duration-300 active:scale-95 hover:border-purple-500/20"
              >
                <div className="text-xs font-bold text-[#C8B6FF]">{user.following}</div>
                <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wider font-sans">{t('profile.following')}</div>
              </button>
            </div>

            <button
              onClick={() => onOpenStatsModal('friends')}
              className="w-full glass p-2 rounded-xl text-center transition duration-300 active:scale-95 flex items-center justify-between px-3 hover:border-purple-500/20"
            >
              <span className="text-[8px] text-white/40 font-semibold uppercase tracking-wider font-sans">{t('profile.friends')}</span>
              <span className="text-xs font-bold text-[#E4B5FF]">{user.friends}</span>
            </button>
          </div>
        </div>

        <div className="col-span-4 min-w-0 flex flex-col items-center gap-2.5">
          <div className="relative group text-center flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-x-0 bottom-0 top-0 rounded-full bg-gradient-to-tr from-[#E1306C] via-purple-500 to-[#AEEBFF] blur-md opacity-35 animate-pulse" />

              <button
                onClick={onOpenAvatarSelector}
                className="relative block w-[72px] h-[72px] md:w-[88px] md:h-[88px] rounded-full overflow-hidden p-[3px] bg-gradient-to-tr from-[#E1306C] via-purple-500 to-[#AEEBFF] shadow-[0_0_15px_rgba(174,235,255,0.3)] transition duration-300 transform active:scale-95 z-10"
                title={t('profile.edit_avatar')}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#050505] flex items-center justify-center">
                  <img
                    src={getAvatarUrl(user.avatar, user.username, user.name)}
                    className="w-full h-full object-cover rounded-full"
                    alt={t('profile.edit_avatar')}
                  />
                </div>
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-mono font-bold transition rounded-full text-white z-20">
                  {t('action.modify')}
                </div>
              </button>
            </div>

            <button
              onClick={onOpenNoteEditor}
              className="mt-2 glass-bright border border-[#C8B6FF] rounded-2xl px-2 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.6)] cursor-pointer hover:border-breezy-neon transition w-full max-w-[170px] z-20 text-[9px] text-left leading-tight transform hover:-translate-y-0.5 text-white"
              title={t('profile.edit_note')}
            >
              <p className="font-mono text-[7px] text-[#AEEBFF] font-black uppercase tracking-widest -mb-0.5">{t('profile.note_title')}</p>
              <p className="whitespace-normal break-words">
                {user.note ? (user.note.length > 15 ? `${user.note.slice(0, 15)}...` : user.note) : <span className="text-white/40 italic">{t('modal.edit_note_placeholder')}</span>}
              </p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1 w-[84px] mx-auto select-none">
            <button
              onClick={() => {
                playChime();
                triggerToast(t('profile.opening_linkedin'));
              }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] text-[12px] font-bold font-sans active:scale-95 cursor-pointer"
              title="LinkedIn"
            >
              in
            </button>

            <button
              onClick={() => {
                playChime();
                triggerToast(t('profile.opening_facebook'));
              }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] text-[12px] font-bold font-sans active:scale-95 cursor-pointer"
              title="Facebook"
            >
              f
            </button>

            <button
              onClick={() => {
                playChime();
                triggerToast(t('profile.opening_twitter'));
              }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] active:scale-95 cursor-pointer select-none"
              title="X (Twitter)"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            <button
              onClick={() => {
                playChime();
                triggerToast(t('profile.opening_discord'));
              }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] active:scale-95 cursor-pointer"
              title="Discord"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenPostModal}
        className="w-full glass-bright bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white rounded-2xl p-4 cursor-pointer text-left transition duration-300 flex items-center justify-between group relative"
      >
        <span className="text-xs text-white/90 group-hover:text-white font-sans font-medium">
          {t('profile.what_new')}
        </span>
        <div className="flex items-center gap-3 text-white/70 group-hover:text-white transition">
          <ImageIcon className="w-3.5 h-3.5 hover:text-breezy-neon" />
        </div>
      </button>

      <div className="flex flex-col gap-2.5 mt-1 font-sans">
        <div className="px-0.5 flex justify-between items-baseline mb-1">
          <h5 className="text-[10px] font-mono tracking-widest text-[#F5FAFF]/30 uppercase select-none">
            {t('feed.my_publications')}
          </h5>
        </div>

        {userPosts.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5">
            {t('feed.no_publications')}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {userPosts.map((post) => (
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
          </div>
        )}
      </div>

    </motion.div>
  );
}
