/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, ImagePlus } from 'lucide-react';
import { PostCategory } from '../types';
import { playTick, playChime } from '../audio';
import { POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../profileLimits';

interface PostCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPost: (title: string, content: string, category: PostCategory, image?: string, images?: string[]) => void;
}

export default function PostCreationModal({
  isOpen,
  onClose,
  onAddPost
}: PostCreationModalProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [localImages, setLocalImages] = useState<string[]>([]);

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

    onAddPost(title.trim().slice(0, POST_TITLE_MAX_LENGTH), text.trim().slice(0, POST_CONTENT_MAX_LENGTH), 'for-you', imageUrl.trim() || undefined, localImages);
    playChime();
    setTitle('');
    setText('');
    setImageUrl('');
    setLocalImages([]);
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
            className="w-full max-w-sm glassmorphism-premium rounded-3xl p-5 border border-white/10 relative shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-breezy-neon" />
                <span className="text-[13px] font-bold text-[#AEEBFF] uppercase select-none">
                  Nouvelle publication
                </span>
              </div>
              <button
                onClick={() => { playTick(); onClose(); }}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-white/65 px-0.5">Titre</span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, POST_TITLE_MAX_LENGTH))}
                  placeholder="Titre du post"
                  maxLength={POST_TITLE_MAX_LENGTH}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                />
                <span className="text-[10px] text-white/35 text-right">{title.length}/{POST_TITLE_MAX_LENGTH}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold text-white/65 px-0.5">Description</span>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, POST_CONTENT_MAX_LENGTH))}
                  placeholder="Quoi de neuf ?"
                  maxLength={POST_CONTENT_MAX_LENGTH}
                  rows={6}
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active resize-none transition-all"
                />
                <span className="text-[10px] text-white/35 text-right">{text.length}/{POST_CONTENT_MAX_LENGTH}</span>
              </div>

              <div className="flex flex-col gap-2 font-sans">
                <span className="text-[13px] font-bold text-white/65 px-0.5">
                  Images depuis l'appareil
                </span>
                <label className="w-full min-h-20 rounded-2xl glassmorphism-light border border-white/5 hover:border-breezy-border-active cursor-pointer flex flex-col items-center justify-center gap-2 text-white/65 transition">
                  <ImagePlus className="w-5 h-5 text-breezy-neon" />
                  <span className="text-[13px] font-bold">Choisir jusqu'a 5 images</span>
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
                  URL d'image (optionnel)
                </span>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-[15px] leading-5 p-3 rounded-2xl glassmorphism-light text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                />
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-white/5 mt-1 font-sans">
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="py-2.5 px-6 rounded-xl bg-breezy-icy text-slate-950 font-bold text-[15px] leading-5 hover:bg-breezy-neon disabled:opacity-40 disabled:hover:bg-breezy-icy transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Publier
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
