/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Music, Settings, X } from 'lucide-react';
import { MusicState } from '../types';
import { playTick, playChime } from '../audio';

interface SpotifyWidgetProps {
  music: MusicState;
  onChangeMusic: (updates: Partial<MusicState>) => void;
  triggerToast: (message: string) => void;
}

// Widget qui simule un lecteur de musique sur le profil
export default function SpotifyWidget({ music, onChangeMusic, triggerToast }: SpotifyWidgetProps) {
  // Champs du formulaire de configuration
  const [localProgress, setLocalProgress] = useState(music.progressPercent);
  const [showConfig, setShowConfig] = useState(false);
  const [newTitle, setNewTitle] = useState(music.title || '');
  const [newArtist, setNewArtist] = useState(music.artist || '');
  const [newCover, setNewCover] = useState(music.cover || '');

  // Si l'utilisateur change de musique depuis l'extérieur, on met à jour les champs
  useEffect(() => {
    setNewTitle(music.title || '');
    setNewArtist(music.artist || '');
    setNewCover(music.cover || '');
  }, [music.title, music.artist, music.cover]);

  // Remet la barre de progression au bon endroit quand la chanson change
  useEffect(() => {
    setLocalProgress(music.progressPercent);
  }, [music.title, music.progressPercent]);

  // Avance automatiquement la progression quand la musique est en lecture
  // On ajoute 1.5% par seconde pour simuler une chanson de ~67 secondes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (music.isPlaying) {
      timer = setInterval(() => {
        setLocalProgress((prev) => {
          let newProgress = prev + 1.5;
          if (newProgress >= 100) {
            newProgress = 0;
            onChangeMusic({ progressPercent: 0 });
            return 0;
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [music.isPlaying, onChangeMusic]);

  // Bascule lecture / pause
  const handlePlayToggle = () => {
    playTick();
    onChangeMusic({ isPlaying: !music.isPlaying });
    triggerToast(music.isPlaying ? "Musique en pause" : `En écoute : ${music.title}`);
  };

  // Enregistre la nouvelle chanson et remet la progression à zéro
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    playChime();
    onChangeMusic({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      cover: newCover.trim(),
      isPlaying: false,
      progressPercent: 0
    });
    setShowConfig(false);
    triggerToast("Musique mise à jour !");
  };

  // VUE 1 : Formulaire pour configurer la chanson
  if (showConfig) {
    return (
      <div className="glassmorphic rounded-2xl p-4 border border-white/5 relative overflow-hidden font-sans">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-mono text-breezy-neon uppercase tracking-wider font-bold">
            Configurer la musique
          </span>
          <button
            type="button"
            onClick={() => { playTick(); setShowConfig(false); }}
            className="w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <form onSubmit={handleSaveConfig} className="flex flex-col gap-2.5 text-left">
          <div className="flex flex-col gap-0.5">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titre de la chanson"
              className="w-full text-xs rounded-xl bg-white/[0.03] p-2.5 px-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <input
              type="text"
              required
              value={newArtist}
              onChange={(e) => setNewArtist(e.target.value)}
              placeholder="Nom de l'artiste"
              className="w-full text-xs rounded-xl bg-white/[0.03] p-2.5 px-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <input
              type="text"
              value={newCover}
              onChange={(e) => setNewCover(e.target.value)}
              placeholder="URL de la pochette (optionnel)"
              className="w-full text-xs rounded-xl bg-white/[0.03] p-2.5 px-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon text-slate-950 font-sans font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Appliquer
          </button>
        </form>
      </div>
    );
  }

  // VUE 2 : Aucune musique configurée — invitation à en ajouter une
  if (!music.title) {
    return (
      <div className="glassmorphic rounded-2xl p-4 border border-white/5 relative overflow-hidden group hover:border-breezy-border-active/20 transition-all duration-300 font-sans">
        <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-breezy-purple/10 blur-xl pointer-events-none" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 shrink-0 rounded-full border border-white/10 flex items-center justify-center bg-black/40 text-white/30">
              <Music className="w-5 h-5 text-breezy-neon/60" />
            </div>
            <div className="text-left">
              <h4 className="text-[12px] font-sans font-semibold text-breezy-icy/70 tracking-tight">Aucune musique</h4>
              <p className="text-[10px] font-sans text-white/30 -mt-0.5">Dis ce que tu écoutes !</p>
            </div>
          </div>
          <button
            onClick={() => { playTick(); setShowConfig(true); }}
            className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9.5px] font-bold font-mono text-[#AEEBFF] hover:border-[#AEEBFF]/30 transition active:scale-95 cursor-pointer"
          >
            CONFIGURER
          </button>
        </div>
      </div>
    );
  }

  // VUE 3 : Le lecteur complet avec la chanson en cours
  return (
    <div className="glassmorphic rounded-2xl p-3 border border-white/5 relative overflow-hidden group hover:border-breezy-border-active/20 transition-all duration-300 font-sans">
      <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-breezy-purple/10 blur-xl pointer-events-none group-hover:bg-breezy-purple/20 transition-all duration-500" />
      
      <div className="flex items-center gap-2.5">
        {/* Pochette de l'album — tourne quand la musique joue */}
        <div className="relative w-11 h-11 shrink-0 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-black/40">
          {music.cover ? (
            <motion.img
              src={music.cover}
              alt="Pochette"
              className="w-full h-full object-cover"
              animate={music.isPlaying ? { rotate: 360 } : {}}
              transition={music.isPlaying ? { repeat: Infinity, duration: 12, ease: "linear" } : {}}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-pink-500 to-breezy-purple flex items-center justify-center text-white/80 text-[10px] font-bold">
              <Music className="w-4 h-4" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Centre du vinyle */}
            <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/20 flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-breezy-neon" />
            </div>
          </div>
        </div>

        {/* Titre et artiste */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Music className="w-3 h-3 text-breezy-neon" />
            <p className="text-[11px] font-mono tracking-wider text-white/40 uppercase">EN ÉCOUTE</p>
          </div>
          <h4 className="text-[12px] font-sans font-semibold text-breezy-icy truncate tracking-tight">{music.title}</h4>
          <p className="text-[10px] font-sans text-white/50 truncate -mt-0.5">{music.artist}</p>
        </div>

        {/* Boutons play/pause et paramètres */}
        <div className="flex items-center gap-1.5 select-none">
          <button
            onClick={handlePlayToggle}
            className="w-7 h-7 rounded-lg glassmorphism-light hover:bg-white/10 flex items-center justify-center text-white/90 hover:text-breezy-neon active:scale-95 transition cursor-pointer"
            title={music.isPlaying ? "Pause" : "Lecture"}
          >
            {music.isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => { playTick(); setShowConfig(true); }}
            className="w-7 h-7 rounded-lg glassmorphism-light hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 active:scale-95 transition cursor-pointer"
            title="Changer de musique"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barre de progression de la chanson */}
      <div className="mt-2.5">
        <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-breezy-neon to-breezy-purple rounded-full"
            style={{ width: `${localProgress}%` }}
            layoutId="trackProgress"
          />
        </div>
        <div className="flex justify-between items-center text-[8px] font-mono text-white/30 mt-1 px-0.5">
          <span>{`0:${Math.floor(localProgress * 0.03).toString().padStart(2, '0')}`}</span>
          {/* Indicateur de lecture animé (barres qui bougent) */}
          {music.isPlaying && (
            <div className="flex gap-0.5 h-2 items-end">
              <span className="w-[1.5px] bg-breezy-neon rounded-full animate-pulse h-1" />
              <span className="w-[1.5px] bg-breezy-purple rounded-full animate-pulse h-2" style={{ animationDelay: '0.15s' }} />
              <span className="w-[1.5px] bg-breezy-lavender rounded-full animate-pulse h-1.5" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
          <span>2:45</span>
        </div>
      </div>
    </div>
  );
}
