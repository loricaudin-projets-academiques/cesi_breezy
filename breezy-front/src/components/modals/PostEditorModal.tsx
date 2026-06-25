import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit3 } from 'lucide-react';
import { playTick, playChime } from '../../audio';
import { useTranslation } from '../../hooks/useTranslation';
import { POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../../profileLimits';
import MentionInput from '../MentionInput';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle: string;
  initialContent: string;
  onSave: (title: string, content: string) => void;
}

export default function PostEditorModal({
  isOpen,
  onClose,
  initialTitle,
  initialContent,
  onSave,
}: PostEditorModalProps) {
  const { t, lang } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSave(title.trim().slice(0, POST_TITLE_MAX_LENGTH), content.trim().slice(0, POST_CONTENT_MAX_LENGTH));
    playChime();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => { playTick(); onClose(); }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            className="w-full max-w-sm glassmorphism-premium rounded-3xl p-5 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-breezy-neon" />
                <span className="text-[13px] font-bold text-[#AEEBFF] uppercase select-none">
                  {t('modal.edit_post')}
                </span>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 overflow-y-auto no-scrollbar">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-white/65 px-0.5">{lang === 'en' ? 'Title' : 'Titre'}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, POST_TITLE_MAX_LENGTH))}
                  placeholder={t('modal.post_title_placeholder')}
                  maxLength={POST_TITLE_MAX_LENGTH}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                />
                <span className="text-[10px] text-white/35 text-right">{title.length}/{POST_TITLE_MAX_LENGTH}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-white/65 px-0.5">Message</span>
                <MentionInput
                  multiline
                  value={content}
                  onChange={(v) => setContent(v)}
                  placeholder={t('modal.post_content_placeholder')}
                  maxLength={POST_CONTENT_MAX_LENGTH}
                  rows={4}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active resize-none transition-all"
                />
                <span className="text-[10px] text-white/35 text-right">{content.length}/{POST_CONTENT_MAX_LENGTH}</span>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-white/5 mt-1 font-sans">
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="py-2.5 px-6 rounded-xl bg-breezy-icy text-slate-950 font-bold text-[15px] leading-5 hover:bg-breezy-neon disabled:opacity-40 disabled:hover:bg-breezy-icy transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {t('action.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
