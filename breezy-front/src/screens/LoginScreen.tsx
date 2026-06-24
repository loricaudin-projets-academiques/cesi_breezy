/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Zap, Shield, ArrowRight, UserPlus, Moon, Sun } from 'lucide-react';
import { playTick, playChime } from '../audio';
import { DEFAULT_API_URL } from '../config';
import { normalizeUsername } from '../utils/username';

interface LoginScreenProps {
  onLogin: (username: string, passkey: string, apiUrl: string) => void | Promise<void>;
  onRegister: (name: string, username: string, passkey: string, apiUrl: string) => void | Promise<void>;
  triggerToast: (msg: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

// Page de connexion et d'inscription
export default function LoginScreen({ onLogin, onRegister, triggerToast, isLightTheme, onToggleTheme }: LoginScreenProps) {
  // isSignUp contrôle si on est en mode connexion ou en mode création de compte
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Valide les champs et soumet le formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      triggerToast("Saisis un nom d'utilisateur.");
      return;
    }
    if (!password) {
      triggerToast("Le mot de passe est obligatoire.");
      return;
    }

    // On force le @ au début du pseudo si l'utilisateur l'a oublié
    const formattedUsername = normalizeUsername(username);

    playChime();
    setIsConnecting(true);

    if (isSignUp) {
      // Vérifications supplémentaires pour l'inscription
      if (!name.trim()) {
        triggerToast("Indique ton prénom et nom.");
        setIsConnecting(false);
        return;
      }
      if (password !== confirmPassword) {
        triggerToast("Les mots de passe ne correspondent pas.");
        setIsConnecting(false);
        return;
      }
      triggerToast("Création du compte en cours...");

      // Petit délai pour simuler une requête réseau
      setTimeout(async () => {
        try {
          await onRegister(name.trim(), formattedUsername, password, DEFAULT_API_URL);
        } catch {
          // Le provider affiche deja le message d'erreur.
        } finally {
          setIsConnecting(false);
        }
      }, 1200);
    } else {
      triggerToast("Vérification en cours...");

      setTimeout(async () => {
        try {
          await onLogin(formattedUsername, password, DEFAULT_API_URL);
        } catch {
          // Le provider affiche deja le message d'erreur.
        } finally {
          setIsConnecting(false);
        }
      }, 1200);
    }
  };

  // Bascule entre connexion et inscription en réinitialisant les mots de passe
  const handleToggleMode = () => {
    playTick();
    setIsSignUp(prev => !prev);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <motion.div
      key="login-screen"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 flex flex-col justify-center items-stretch min-h-screen w-full max-w-md mx-auto select-none"
    >
      {/* Logo et titre de la page */}
      <div className="text-center mb-6 mt-2 flex flex-col items-center">
        <div className="relative mb-2">
          {/* Halo animé derrière l'icône */}
          <div className="absolute inset-0 bg-breezy-neon/25 blur-lg rounded-full animate-pulse" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-breezy-purple via-breezy-lavender to-breezy-neon flex items-center justify-center border border-white/10 z-10 relative">
            {isSignUp ? (
              <UserPlus className="w-6 h-6 text-slate-950" />
            ) : (
              <Zap className="w-6 h-6 text-slate-950 active-nav-glow" />
            )}
          </div>
        </div>
        <h1 className="text-xl font-display font-black tracking-wider text-breezy-icy uppercase">
          {isSignUp ? 'CRÉER UN COMPTE' : 'BREEZY'}
        </h1>
        <p className="hidden">
          {isSignUp ? 'Rejoins le réseau' : 'Accès au réseau'}
        </p>
        <button
          type="button"
          onClick={() => {
            playTick();
            onToggleTheme();
          }}
          className="mt-3 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5 self-center"
        >
          {isLightTheme ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isLightTheme ? 'Theme clair' : 'Theme sombre'}
        </button>
      </div>

      {/* Formulaire principal */}
      <div className="glassmorphic rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-breezy-neon/5 blur-xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {/* Champ Nom — visible uniquement en mode inscription */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-1.5 text-left"
              >
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Champ Pseudo */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              Nom d'utilisateur
            </label>
            <div className="relative">
              {/* Préfixe @ affiché dans le champ */}
              <span className="text-xs font-semibold text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2">
                @
              </span>
              <input
                type="text"
                required
                value={username.startsWith('@') ? username.slice(1) : username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jeandupont"
                className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
              />
            </div>
          </div>

          {/* Confirmation du mot de passe — seulement lors de l'inscription */}
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-1.5 text-left"
              >
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isConnecting}
            onClick={() => playTick()}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-breezy-purple via-breezy-lavender to-breezy-neon text-slate-950 hover:glow-neon active:scale-[0.98] transition-all duration-300 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? (
              <span className="flex items-center gap-1.5">
                {isSignUp ? "Création en cours..." : "Vérification..."}
              </span>
            ) : (
              <>
                {isSignUp ? "Créer mon compte" : "Se connecter"}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Lien pour basculer entre connexion et inscription */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-[10px] font-mono text-breezy-neon/80 hover:text-breezy-neon underline cursor-pointer transition uppercase tracking-wider"
          >
            {isSignUp ? "Déjà inscrit ? Se connecter" : "Pas encore de compte ? S'inscrire"}
          </button>
        </div>
      </div>

      {/* Note de sécurité en bas de la page */}
      <div className="hidden">
        <Shield className="w-4 h-4 text-breezy-lavender shrink-0" />
        <p className="text-[9px] text-white/30 leading-snug">
          Tout est stocké localement dans ton navigateur. Aucune donnée n'est envoyée sans ton accord.
        </p>
      </div>
    </motion.div>
  );
}
