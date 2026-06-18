/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Zap, Menu, Edit2, Music, Gamepad2, ImageIcon, Link as LinkIcon, Sparkles } from 'lucide-react';
import { UserProfile, Post, ProfileStatType, ProfileSubTab } from '../types';
import { INITIAL_FOLLOWERS } from '../mockData';
import SpotifyWidget from '../components/SpotifyWidget';
import PostCard, { PostInteractionHandlers, PostListState } from '../components/PostCard';
import { getAvatarUrl } from '../components/Avatar';
import { playTick, playChime } from '../audio';
import { useLang } from '../translations/LanguageProvider';

interface ProfileScreenProps extends PostInteractionHandlers, PostListState {
  user: UserProfile;
  posts: Post[];
  activeProfileSubTab: ProfileSubTab;
  setActiveProfileSubTab: (tab: ProfileSubTab) => void;
  onOpenHamburger: () => void;
  onOpenPostModal: () => void;
  onOpenBioEditor: () => void;
  onOpenNoteEditor: () => void;
  onOpenAvatarSelector: () => void;
  onOpenStatsModal: (type: ProfileStatType) => void;
  onMusicPlayToggle: () => void;
  onMusicChange: (updates: Partial<UserProfile['music']>) => void;
}

const PROFILE_SUB_TABS: ProfileSubTab[] = ['posts', 'followers', 'following', 'friends'];

export default function ProfileScreen({
  user,
  posts,
  activeProfileSubTab,
  setActiveProfileSubTab,
  onOpenHamburger,
  onOpenPostModal,
  onOpenBioEditor,
  onOpenNoteEditor,
  onOpenAvatarSelector,
  onOpenStatsModal,
  onMusicPlayToggle,
  onMusicChange,
  postComments,
  commentDrafts,
  showCommentsForPost,
  onToggleStar,
  onToggleLike,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  triggerToast
}: ProfileScreenProps) {
  const { t } = useLang();
  const userPosts = posts.filter(p => p.authorUsername === user.username);

  const tabLabels: Record<ProfileSubTab, string> = {
    posts: t('profile.tabPosts'),
    followers: t('profile.tabFollowers'),
    following: t('profile.tabFollowing'),
    friends: t('profile.tabFriends'),
  };

  return (
    <motion.div
      key="profile-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 flex flex-col gap-4 text-left"
    >
      <div className="flex justify-between items-center bg-transparent shrink-0">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-breezy-neon active-nav-glow" />
          <span className="text-[10px] font-mono tracking-widest text-[#AEEBFF] uppercase select-none">
            {t('profile.title')}
          </span>
        </div>
        <button
          onClick={onOpenHamburger}
          className="w-10 h-10 rounded-xl glassmorphism-light hover:bg-white/10 flex items-center justify-center text-white/90 cursor-pointer active:scale-95 transition shadow-sm border border-white/5"
          title={t('menu.title')}
        >
          <Menu className="w-4.5 h-4.5 text-breezy-icy" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 pb-2 select-none">
        <div className="col-span-8 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-1">
              <div>
                <h2 className="text-[20px] font-sans font-bold text-white leading-none tracking-tight">
                  {user.name}
                </h2>
                <p className="text-xs font-sans text-purple-300 font-medium mt-1">{user.username}</p>
              </div>
              <button
                onClick={onOpenBioEditor}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/55 hover:text-breezy-neon select-none"
                title={t('bioModal.title')}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div
              onClick={onOpenBioEditor}
              className="glass mt-3 w-full max-w-full min-h-[72px] rounded-[24px] border border-white/5 px-4 py-3 text-[11px] leading-relaxed text-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition duration-300 hover:border-purple-500/20 cursor-pointer font-sans"
              title={t('bioModal.title')}
            >
              <p className="max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
                {user.bio ? `"${user.bio}"` : <span className="text-white/45 italic">{t('profile.bioPlaceholder')}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-4 select-none w-full">
            <div className="flex gap-1.5 w-full">
              <button
                onClick={() => onOpenStatsModal('followers')}
                className={`flex-1 glass p-2 rounded-xl text-center transition duration-300 active:scale-95 ${
                  activeProfileSubTab === 'followers' ? 'border-purple-400 bg-white/5' : 'hover:border-purple-500/20'
                }`}
              >
                <div className="text-xs font-bold text-[#AEEBFF]">{user.followers}</div>
                <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wider font-sans">{t('profile.followers')}</div>
              </button>

              <button
                onClick={() => onOpenStatsModal('following')}
                className={`flex-1 glass p-2 rounded-xl text-center transition duration-300 active:scale-95 ${
                  activeProfileSubTab === 'following' ? 'border-[#C8B6FF] bg-white/5' : 'hover:border-purple-500/20'
                }`}
              >
                <div className="text-xs font-bold text-[#C8B6FF]">{user.following}</div>
                <div className="text-[8px] text-white/40 font-semibold uppercase tracking-wider font-sans">{t('profile.following')}</div>
              </button>
            </div>

            <button
              onClick={() => onOpenStatsModal('friends')}
              className={`w-full glass p-2 rounded-xl text-center transition duration-300 active:scale-95 flex items-center justify-between px-3 ${
                activeProfileSubTab === 'friends' ? 'border-[#E4B5FF] bg-white/5' : 'hover:border-purple-500/20'
              }`}
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
                className="relative block w-[92px] h-[92px] rounded-full overflow-hidden p-[3px] bg-gradient-to-tr from-[#E1306C] via-purple-500 to-[#AEEBFF] shadow-[0_0_15px_rgba(174,235,255,0.3)] transition duration-300 transform active:scale-95 z-10"
                title={t('avatarModal.title')}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-[#050505] flex items-center justify-center">
                  <img
                    src={getAvatarUrl(user.avatar, user.username, user.name)}
                    className="w-full h-full object-cover rounded-full"
                    alt={t('avatarModal.title')}
                  />
                </div>
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-mono font-bold transition rounded-full text-white z-20">
                  {t('profile.editLabel')}
                </div>
              </button>
            </div>

            <button
              onClick={onOpenNoteEditor}
              className="absolute -top-1 -right-4 glass-bright border border-[#C8B6FF] rounded-2xl p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.6)] cursor-pointer hover:border-breezy-neon transition max-w-[105px] z-20 text-[9px] text-left leading-tight transform hover:-translate-y-0.5 text-white"
              title={t('noteModal.title')}
            >
              <p className="font-mono text-[7px] text-[#AEEBFF] font-black uppercase tracking-widest -mb-0.5">{t('profile.noteLabel')}</p>
              <p className="truncate">{user.note || <span className="text-white/40 italic">{t('profile.noteAdd')}</span>}</p>
            </button>
          </div>

          <button
            onClick={onOpenNoteEditor}
            className="w-full glass rounded-full p-2 py-1 border border-white/8 hover:border-purple-500/30 transition cursor-pointer text-center text-[10px] text-white/50 hover:text-white font-sans flex items-center justify-center gap-1 leading-none shadow-sm"
          >
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-ping" />
            {t('profile.notePlaceholder')}
          </button>

          <button
            onClick={onMusicPlayToggle}
            className="w-full border border-pink-500/30 bg-pink-500/5 text-pink-300 hover:bg-pink-500/15 rounded-full px-2.5 py-1 text-[9.5px] font-medium flex items-center justify-center gap-1 shadow-[0_0_10px_rgba(255,102,196,0.15)] transition duration-300 active:scale-95"
          >
            <Music
              className={`w-3.5 h-3.5 text-pink-400 ${user.music.isPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '6s' }}
            />
            <span className="truncate max-w-[70px] leading-none">
              {user.music.title ? user.music.title : t('profile.configureMusic')}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1 w-[84px] mx-auto select-none">
            <button
              onClick={() => { playChime(); triggerToast(t('toasts.openingLinkedIn')); }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] text-[12px] font-bold font-sans active:scale-95 cursor-pointer"
              title="LinkedIn"
            >
              in
            </button>

            <button
              onClick={() => { playChime(); triggerToast(t('toasts.openingFacebook')); }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] text-[12px] font-bold font-sans active:scale-95 cursor-pointer"
              title="Facebook"
            >
              f
            </button>

            <button
              onClick={() => { playChime(); triggerToast(t('toasts.openingTwitter')); }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] active:scale-95 cursor-pointer flex items-center select-none"
              title="X (Twitter)"
            >
              <span className="flex items-center justify-center w-full h-full text-white/80 hover:text-white">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => { playChime(); triggerToast(t('toasts.openingDiscord')); }}
              className="w-[38px] h-[38px] rounded-full bg-[#050505] border border-white/10 hover:border-purple-500/50 flex items-center justify-center text-white/80 hover:text-[#C8B6FF] hover:bg-white/10 transition shadow-md hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] active:scale-95 cursor-pointer"
              title="Discord"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/[0.04] pb-1.5 pt-1 select-none">
        {PROFILE_SUB_TABS.map((sub) => {
          const isActive = activeProfileSubTab === sub;
          return (
            <button
              key={sub}
              onClick={() => {
                playTick();
                setActiveProfileSubTab(sub);
              }}
              className={`text-[11px] font-sans font-medium transition-all duration-300 relative capitalize tracking-wider ${
                isActive ? 'text-[#C8B6FF] font-black' : 'text-white/45 hover:text-white/75'
              }`}
            >
              {tabLabels[sub]}
              {isActive && (
                <motion.div
                  layoutId="profileSubTabUnderline"
                  className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-[#AEEBFF] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {activeProfileSubTab === 'posts' ? (
        <>
          <button
            onClick={onOpenPostModal}
            className="w-full glass-bright bg-white/10 hover:bg-white/15 border-white/20 hover:border-white/30 text-white rounded-2xl p-4 cursor-pointer text-left transition duration-300 flex items-center justify-between group relative"
          >
            <span className="text-xs text-white/90 group-hover:text-white font-sans font-medium">
              {t('profile.newPost')}
            </span>
            <div className="flex items-center gap-3 text-white/70 group-hover:text-white transition">
              <ImageIcon className="w-3.5 h-3.5 hover:text-breezy-neon" />
              <LinkIcon className="w-3.5 h-3.5 hover:text-breezy-lavender" />
              <Sparkles className="w-3.5 h-3.5 hover:text-breezy-purple active-nav-glow animate-pulse" />
            </div>
          </button>

          <div className="flex flex-col gap-2.5 mt-1 font-sans">
            <div className="px-0.5 flex justify-between items-baseline mb-1">
              <h5 className="text-[10px] font-mono tracking-widest text-[#F5FAFF]/30 uppercase select-none">
                {t('profile.myPosts')}
              </h5>
              <span className="text-[9px] font-mono text-breezy-neon select-none">{t('profile.synced')}</span>
            </div>

            {userPosts.length === 0 ? (
              <div className="py-10 text-center text-white/30 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5">
                {t('profile.noPosts')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {userPosts.map((post) => (
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
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 mt-1">
          <div className="px-0.5 flex justify-between items-baseline mb-1">
            <h5 className="text-[10px] font-mono tracking-widest text-[#F5FAFF]/30 uppercase select-none">
              {activeProfileSubTab === 'followers' && t('profile.myFollowers')}
              {activeProfileSubTab === 'following' && t('profile.myFollowing')}
              {activeProfileSubTab === 'friends' && t('profile.closeFriends')}
            </h5>
          </div>
          {INITIAL_FOLLOWERS.filter((f) => {
            if (activeProfileSubTab === 'friends') return f.followsMe && f.followedByMe;
            if (activeProfileSubTab === 'following') return f.followedByMe;
            return true;
          }).map((follower) => (
            <div
              key={follower.username}
              className="glass rounded-[20px] p-3 flex items-center justify-between border border-white/5 shadow-md text-left"
            >
              <div className="flex items-center gap-2.5">
                <img src={getAvatarUrl(follower.avatar, follower.username, follower.name)} className="w-8 h-8 rounded-full object-cover" alt={follower.name} />
                <div>
                  <h4 className="text-xs font-semibold text-white leading-none">{follower.name}</h4>
                  <p className="text-[10px] text-white/40 mt-0.5">{follower.username}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  playChime();
                  triggerToast(t('toasts.actionDone', { name: follower.name }));
                }}
                className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#AEEBFF]/20 text-[#AEEBFF] border border-[#AEEBFF]/30 hover:bg-[#AEEBFF]/30 transition"
              >
                {t('profile.message')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-left">
        <SpotifyWidget
          music={user.music}
          onChangeMusic={onMusicChange}
          triggerToast={triggerToast}
        />
      </div>
    </motion.div>
  );
}
