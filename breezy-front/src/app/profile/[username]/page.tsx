"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, MessageCircle, UserCheck, UserPlus } from "lucide-react";

import { playTick } from "../../../audio";
import Avatar from "../../../components/Avatar";
import PostCard from "../../../components/PostCard";
import { conversationService, feedService } from "../../../services/ServiceContainer";
import { api } from "../../../services/api";
import { getErrorMessage } from "../../../utils/errors";
import { Follower, Post, UserProfile } from "../../../types";
import { useBreezyApp } from "../../BreezyAppProvider";

type PublicUserProfile = UserProfile & Follower & {
  id?: string;
  isFriend?: boolean;
  canViewPrivate?: boolean;
};

function getRouteUsername(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = getRouteUsername(params.username);
  const { conversations, postInteractions, triggerToast, profile } = useBreezyApp();
  const [publicUser, setPublicUser] = useState<PublicUserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    if (username === profile.user.username) {
      router.replace("/profile");
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      api.get<PublicUserProfile>(`/users/profile/${encodeURIComponent(username)}`),
      feedService.fetchUserPosts(username),
    ])
      .then(([{ data }, posts]) => {
        if (!cancelled) {
          setPublicUser(data);
          setUserPosts(posts);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          triggerToast(getErrorMessage(error, "Profil introuvable."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile.user.username, router, triggerToast, username]);

  const handleToggleFollow = async () => {
    if (!publicUser) return;

    playTick();

    try {
      const { data } = publicUser.followedByMe
        ? await api.delete<PublicUserProfile>(`/users/${publicUser.username}/follow`)
        : await api.post<PublicUserProfile>(`/users/${publicUser.username}/follow`);

      setPublicUser(data);
      void profile.refreshCurrentUser();
      triggerToast(data.isFriend ? `${data.name} est maintenant ton ami.` : data.followedByMe ? `${data.name} suivi.` : `${data.name} retire des abonnements.`);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Action impossible."));
    }
  };

  const handleMessage = async () => {
    if (!publicUser) return;

    playTick();

    if (!publicUser.isFriend) {
      triggerToast("Vous devez vous suivre mutuellement pour discuter.");
      return;
    }

    try {
      const conversation = await conversationService.createRemoteConversation({
        name: publicUser.name,
        username: publicUser.username,
        avatar: publicUser.avatar,
      });

      conversations.setConversations((prev) => [
        conversation,
        ...prev.filter((item) => item.id !== conversation.id),
      ]);
      triggerToast(`Chat ouvert avec ${publicUser.name}.`);
      router.push("/messages");
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'ouvrir le chat."));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 min-h-[420px] flex items-center justify-center text-xs text-white/35">
        Chargement du profil...
      </div>
    );
  }

  if (!publicUser) {
    return (
      <div className="p-4 min-h-[420px] flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-breezy-icy">Profil introuvable.</p>
        <button
          onClick={() => router.push("/search")}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-white/65"
        >
          Retour recherche
        </button>
      </div>
    );
  }

  const isPrivateLocked = Boolean(publicUser.isPrivate && !publicUser.canViewPrivate);

  return (
    <div className="p-4 flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            playTick();
            router.back();
          }}
          className="w-9 h-9 rounded-xl glassmorphism-light hover:bg-white/10 flex items-center justify-center text-white/85 transition"
          title="Retour"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span />
      </div>

      <section className="glassmorphic rounded-2xl border border-white/5 p-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar
            name={publicUser.name}
            username={publicUser.username}
            url={publicUser.avatar}
            className="w-16 h-16"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-sans font-bold text-breezy-icy leading-tight">
              {publicUser.name}
            </h2>
            <p className="text-xs font-mono text-purple-300 mt-1">{publicUser.username}</p>
            <p className="text-xs text-white/70 mt-3 leading-relaxed break-words">
              {publicUser.bio || "Membre Breezy."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="glass rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-[#AEEBFF]">{publicUser.followers}</p>
            <p className="text-[8px] text-white/40 uppercase">Abonnes</p>
          </div>
          <div className="glass rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-[#C8B6FF]">{publicUser.following}</p>
            <p className="text-[8px] text-white/40 uppercase">Suit</p>
          </div>
          <div className="glass rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-[#E4B5FF]">{publicUser.friends}</p>
            <p className="text-[8px] text-white/40 uppercase">Amis</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleToggleFollow}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold font-mono text-white/75 flex items-center justify-center gap-1.5 transition"
          >
            {publicUser.followedByMe ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-[#AEEBFF]" /> Suivi
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" /> Suivre
              </>
            )}
          </button>
          <button
            onClick={handleMessage}
            disabled={!publicUser.isFriend}
            title={publicUser.isFriend ? "Ouvrir le chat" : "Vous devez vous suivre mutuellement pour discuter"}
            className="flex-1 py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon disabled:bg-white/10 disabled:text-white/35 disabled:border disabled:border-white/10 text-slate-950 text-[10px] font-bold font-mono flex items-center justify-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Message
          </button>
        </div>
        {!publicUser.isFriend && (
          <p className="text-[9px] font-mono text-white/35 text-center">
            Le chat se debloque quand vous vous suivez mutuellement.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-0.5">
          <h3 className="text-[10px] font-mono tracking-widest text-white/35 uppercase">
            Publications
          </h3>
          <span className="text-[9px] font-mono text-breezy-neon">
            {userPosts.length} post(s)
          </span>
        </div>

        {isPrivateLocked ? (
          <div className="py-12 text-center text-white/45 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
            <Lock className="w-7 h-7 text-breezy-lavender" />
            <span className="font-bold text-breezy-icy">Compte privé</span>
            <span>Ses posts, sa musique et sa note sont visibles uniquement par ses amis.</span>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="py-10 text-center text-white/30 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5">
            Aucun post visible pour l'instant.
          </div>
        ) : (
          userPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={postInteractions.postComments[post.id]}
              commentDraft={postInteractions.commentDrafts[post.id]}
              showComments={postInteractions.showCommentsForPost[post.id]}
              {...postInteractions}
            />
          ))
        )}
      </section>
    </div>
  );
}
