/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Video, X, Upload } from 'lucide-react';
import { mediaService } from '../services/ServiceContainer';
import { MAX_VIDEO_SIZE } from '../services/media/HttpMediaService';
import { getErrorMessage } from '../utils/errors';

interface VideoUploadFieldProps {
  value?: string;           // URL de la vidéo déjà uploadée
  onChange: (url: string | undefined) => void;
  onFilenameChange?: (filename: string | undefined) => void; // filename brut pour deleteVideo
  onUploadingChange?: (uploading: boolean) => void;
  triggerToast: (msg: string) => void;
  compact?: boolean;        // mode compact pour commentaires / messages
}

export default function VideoUploadField({
  value,
  onChange,
  onFilenameChange,
  onUploadingChange,
  triggerToast,
  compact = false,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  // filename brut conservé pour appel deleteVideo
  const filenameRef = useRef<string | undefined>(undefined);

  const setUploadingState = (val: boolean) => {
    setUploading(val);
    onUploadingChange?.(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) inputRef.current!.value = '';
    if (!file) return;

    // Validation côté client
    if (!file.type.startsWith('video/')) {
      triggerToast('Seules les vidéos sont autorisées.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      triggerToast('La vidéo dépasse la limite de 100 Mo.');
      return;
    }

    setUploadingState(true);
    setProgress(0);

    try {
      const result = await mediaService.uploadVideo(file, setProgress);
      filenameRef.current = result.filename;
      onFilenameChange?.(result.filename);
      onChange(result.url);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Échec de l'upload de la vidéo."));
    } finally {
      setUploadingState(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (filenameRef.current) {
      mediaService.deleteVideo(filenameRef.current).catch(() => {});
      filenameRef.current = undefined;
      onFilenameChange?.(undefined);
    }
    onChange(undefined);
    setProgress(0);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {value ? (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-[9px] font-mono text-breezy-neon border border-breezy-neon/30 px-2 py-1 rounded-lg hover:bg-breezy-neon/10 transition"
            title="Retirer la vidéo"
          >
            <X className="w-3 h-3" />
            Vidéo
          </button>
        ) : uploading ? (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/50">
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-breezy-neon rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-breezy-neon transition"
            title="Joindre une vidéo"
          >
            <Video className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest px-0.5">
        Vidéo (optionnel, max 100 Mo)
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="flex flex-col gap-1.5">
          <video
            src={value}
            controls
            preload="metadata"
            className="w-full rounded-xl border border-white/10 max-h-40 bg-black"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 self-start text-[9px] font-mono text-white/40 hover:text-rose-400 transition"
          >
            <X className="w-3 h-3" /> Retirer la vidéo
          </button>
        </div>
      ) : uploading ? (
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between text-[9px] font-mono text-white/40">
            <span>Upload en cours…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-breezy-neon rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 p-3 rounded-2xl border border-dashed border-white/10 hover:border-breezy-neon/40 text-white/30 hover:text-breezy-neon text-[10px] font-mono transition"
        >
          <Upload className="w-3.5 h-3.5" />
          Choisir une vidéo
        </button>
      )}
    </div>
  );
}
