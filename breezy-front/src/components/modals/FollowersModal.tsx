import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Follower, ProfileStatType } from '../../types';
import { playTick } from '../../audio';
import { getAvatarUrl } from '../Avatar';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ProfileStatType;
  members: Follower[];
  isLoading: boolean;
  triggerToast: (msg: string) => void;
}

export default function FollowersModal({ isOpen, onClose, type, members, isLoading, triggerToast }: FollowersModalProps) {
  const router = useRouter();

  const openProfile = (username: string) => {
    playTick();
    onClose();
    router.push(`/profile/${encodeURIComponent(username)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playTick();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xs glassmorphism-premium rounded-3xl p-5 border border-white/10 z-10 flex flex-col max-h-[460px]"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
              <span className="text-xs font-mono text-breezy-neon uppercase tracking-wider font-bold">
                {type === 'followers' && 'Abonnes'}
                {type === 'following' && 'Abonnements'}
                {type === 'friends' && 'Amis proches'}
              </span>
              <span className="text-[10px] font-mono text-white/30">DB</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2.5">
              {isLoading ? (
                <div className="py-8 text-center text-white/30 text-[10.5px] font-sans">
                  Synchronisation...
                </div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-[10.5px] font-sans">
                  Personne dans cette liste pour l'instant.
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.username}
                    role="button"
                    tabIndex={0}
                    onClick={() => openProfile(member.username)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openProfile(member.username);
                      }
                    }}
                    className="p-2 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-2 hover:border-breezy-border-active/50 hover:bg-white/[0.04] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={getAvatarUrl(member.avatar, member.username, member.name)} className="w-7 h-7 rounded-full object-cover border border-white/10" alt="" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-sans font-medium text-breezy-icy truncate">{member.name}</p>
                        <p className="text-[8.5px] font-mono text-white/40 truncate">{member.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        playTick();
                        triggerToast(`Action effectuee pour ${member.name}`);
                      }}
                      className="py-1 px-2 text-[8px] font-bold font-mono rounded bg-white/5 hover:bg-white/10 border border-white/5 transition shrink-0 active:scale-95"
                    >
                      {member.followedByMe ? (
                        <span className="text-[#AEEBFF] flex items-center gap-0.5">
                          <UserCheck className="w-2.5 h-2.5" /> suivi
                        </span>
                      ) : (
                        <span className="text-white/65 flex items-center gap-0.5">
                          <UserPlus className="w-2.5 h-2.5" /> suivre
                        </span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                playTick();
                onClose();
              }}
              className="w-full mt-4 text-center py-2 text-[10px] font-mono hover:text-breezy-purple text-white/30 border border-white/5 hover:border-white/15 rounded-xl block cursor-pointer transition"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
