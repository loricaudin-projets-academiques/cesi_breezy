/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, ImagePlus, Tag } from 'lucide-react';
import { PostCategory } from '../types';
import { playTick, playChime } from '../audio';
import { useTranslation } from '../hooks/useTranslation';
import { POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../profileLimits';
import MentionInput from './MentionInput';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (title: string, content: string, category: PostCategory, image?: string, images?: string[], tags?: string[]) => void;
}

export default function PostCreationModal({
  isOpen,
  onClose,
  onAddPost
}: PostCreationModalProps) {
  const { t, lang } = useTranslation();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const addTag = (raw: string) => {
    const clean = raw.toLowerCase().replace(/^#+/, '').replace(/[^a-z0-9_]/g, '').trim();
    if (clean.length > 0 && clean.length <= 20 && tags.length < 5 && !tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, Math.max(0, 5 - localImages.length));

    const nextImages = await Promise.all(
      selectedFiles.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))
    );

    setLocalImages((prev) => [...prev, ...nextImages].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onAddPost(title.trim().slice(0, POST_TITLE_MAX_LENGTH), text.trim().slice(0, POST_CONTENT_MAX_LENGTH), 'for-you', imageUrl.trim() || undefined, localImages, tags);
    playChime();
    setTitle('');
    setText('');
    setImageUrl('');
    setLocalImages([]);
    setTags([]);
    setTagInput('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-sm glassmorphism-premium rounded-3xl p-5 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 flex flex-col max-h-[85vh]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-breezy-neon" />
                <span className="text-[13px] font-bold text-[#AEEBFF] uppercase select-none">
                  {t('modal.create_post')}
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
                  value={text}
                  onChange={(v) => setText(v)}
                  placeholder={t('modal.post_content_placeholder')}
                  maxLength={POST_CONTENT_MAX_LENGTH}
                  rows={4}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active resize-none transition-all"
                />
                <span className={`text-[10px] text-right font-mono ${
                  text.length >= POST_CONTENT_MAX_LENGTH
                    ? 'text-red-400 font-bold'
                    : text.length >= POST_CONTENT_MAX_LENGTH * 0.9
                    ? 'text-yellow-400'
                    : 'text-white/35'
                }`}>
                  {text.length}/{POST_CONTENT_MAX_LENGTH}
                </span>
              </div>

              <div className="flex flex-col gap-2 font-sans">
                <span className="text-[13px] font-bold text-white/65 px-0.5">
                  {lang === 'en' ? 'Images from device' : "Images depuis l'appareil"}
                </span>
                <label className="w-full min-h-20 rounded-2xl glassmorphism-light border border-white/5 hover:border-breezy-border-active cursor-pointer flex flex-col items-center justify-center gap-2 text-white/65 transition">
                  <ImagePlus className="w-5 h-5 text-breezy-neon" />
                  <span className="text-[13px] font-bold">{lang === 'en' ? 'Choose up to 5 images' : "Choisir jusqu'à 5 images"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      void handleImageFiles(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>

                {localImages.length > 0 && (
                  <div className={`grid gap-1.5 overflow-hidden rounded-2xl border border-white/5 p-1.5 bg-black/20 ${
                    localImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {localImages.map((image, index) => (
                      <div key={`${image.slice(0, 24)}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setLocalImages((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white/80 flex items-center justify-center hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <span className="text-[13px] font-bold text-white/65 px-0.5">
                  {lang === 'en' ? 'Image URL (optional)' : "URL d'image (optionnel)"}
                </span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                />
              </div>

              <div className="flex flex-col gap-1.5 font-sans">
                <span className="text-[13px] font-bold text-white/65 px-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Tags <span className="text-[11px] font-normal text-white/35">{lang === 'en' ? '(max 5, press Enter)' : '(max 5, appuyer Entrée)'}</span>
                </span>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-mono text-breezy-lavender bg-breezy-lavender/10 border border-breezy-lavender/25 px-2 py-0.5 rounded-full">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                          className="text-white/40 hover:text-white ml-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={tags.length < 5 ? "#javascript, #dev..." : (lang === 'en' ? "Maximum 5 tags reached" : "Maximum 5 tags atteint")}
                  disabled={tags.length >= 5}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-white/5 mt-1 font-sans">
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="py-2.5 px-6 rounded-xl bg-breezy-icy text-slate-950 font-bold text-[15px] leading-5 hover:bg-breezy-neon disabled:opacity-40 disabled:hover:bg-breezy-icy transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {t('action.publish')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
