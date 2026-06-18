import React, { useRef, useState, useEffect } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { validateImageFile, IMAGE_ACCEPT } from '../utils/image';
import { uploadService } from '../services/ServiceContainer';
import { getErrorMessage } from '../utils/errors';

interface ImagePickerProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  triggerToast: (msg: string) => void;
  compact?: boolean; // Mode bouton icône seule, pour la barre de messagerie
}

export default function ImagePicker({ value, onChange, triggerToast, compact = false }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  // Réinitialise l'aperçu local quand le parent vide la valeur (ex: après envoi du message/commentaire)
  useEffect(() => {
    if (!value) {
      setPreview(undefined);
    }
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Réinitialiser pour pouvoir re-sélectionner le même fichier
    if (inputRef.current) inputRef.current.value = '';

    const error = validateImageFile(file);
    if (error) {
      triggerToast(error);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const url = await uploadService.uploadImage(file);
      onChange(url);
    } catch (err) {
      triggerToast(getErrorMessage(err, "Impossible d'envoyer l'image."));
      setPreview(undefined);
      onChange(undefined);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayed = value || preview;

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />

      {displayed ? (
        <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-white/10 flex justify-center bg-black/20">
          <img src={displayed} className="max-w-full max-h-48 object-contain" alt="Aperçu" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-breezy-neon animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : compact ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-breezy-neon transition shrink-0"
          title="Ajouter une photo"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 text-[10px] font-mono text-white/40 hover:text-breezy-neon transition py-2 px-3 rounded-xl border border-dashed border-white/10 hover:border-breezy-neon/40 w-full justify-center"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Ajouter une photo
        </button>
      )}
    </div>
  );
}
