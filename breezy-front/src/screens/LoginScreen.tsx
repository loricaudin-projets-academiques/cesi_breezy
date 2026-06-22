/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Mail, Zap, Shield, ArrowRight, UserPlus, Check, X } from 'lucide-react';
import { playTick, playChime } from '../audio';
import { DEFAULT_API_URL } from '../config';
import { normalizeUsername } from '../utils/username';

interface LoginScreenProps {
  onLogin: (username: string, passkey: string, apiUrl: string) => void | Promise<void>;
  onRegister: (name: string, username: string, email: string, passkey: string, apiUrl: string) => void | Promise<void>;
  triggerToast: (msg: string) => void;
}

interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

const CRITERIA_LABELS: { key: keyof PasswordCriteria; label: string }[] = [
  { key: 'minLength', label: '8 caractères minimum' },
  { key: 'hasUppercase', label: 'Une lettre majuscule' },
  { key: 'hasLowercase', label: 'Une lettre minuscule' },
  { key: 'hasDigit', label: 'Un chiffre' },
  { key: 'hasSpecial', label: 'Un caractère spécial' },
];

export default function LoginScreen({ onLogin, onRegister, triggerToast }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const criteria = getPasswordCriteria(password);
  const allCriteriaMet = Object.values(criteria).every(Boolean);
  const showCriteria = isSignUp && password.length > 0;
  const emailInvalid = emailTouched && email.length > 0 && !isValidEmail(email);

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

    const formattedUsername = normalizeUsername(username);

    playChime();
    setIsConnecting(true);

    if (isSignUp) {
      if (!name.trim()) {
        triggerToast("Indique ton prénom et nom.");
        setIsConnecting(false);
        return;
      }
      if (!isValidEmail(email)) {
        triggerToast("Adresse email invalide.");
        setIsConnecting(false);
        return;
      }
      if (!allCriteriaMet) {
        triggerToast("Le mot de passe ne respecte pas tous les critères de sécurité.");
        setIsConnecting(false);
        return;
      }
      if (password !== confirmPassword) {
        triggerToast("Les mots de passe ne correspondent pas.");
        setIsConnecting(false);
        return;
      }
      triggerToast("Création du compte en cours...");

      setTimeout(async () => {
        try {
          await onRegister(name.trim(), formattedUsername, email.trim().toLowerCase(), password, DEFAULT_API_URL);
        } catch {
          // Le provider affiche déjà le message d'erreur.
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
          // Le provider affiche déjà le message d'erreur.
        } finally {
          setIsConnecting(false);
        }
      }, 1200);
    }
  };

  const handleToggleMode = () => {
    playTick();
    setIsSignUp(prev => !prev);
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setEmailTouched(false);
  };

  return (
    <motion.div
      key="login-screen"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 flex flex-col justify-center items-stretch min-h-full w-full select-none"
    >
      {/* Logo et titre */}
      <div className="text-center mb-6 mt-2 flex flex-col items-center">
        <div className="relative mb-2">
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
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
          {isSignUp ? 'Rejoins le réseau' : 'Accès au réseau'}
        </p>
      </div>

      {/* Formulaire */}
      <div className="glassmorphic rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-breezy-neon/5 blur-xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {/* Champ Nom complet — inscription uniquement */}
            {isSignUp && (
              <motion.div
                key="name-field"
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

          <AnimatePresence mode="popLayout">
            {/* Champ Email — inscription uniquement */}
            {isSignUp && (
              <motion.div
                key="email-field"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-1.5 text-left"
              >
                <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="jean@exemple.com"
                    className={`w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border focus:outline-none focus:bg-white/[0.06] transition ${
                      emailInvalid
                        ? 'border-red-500/50 focus:border-red-500/70'
                        : email.length > 0 && isValidEmail(email)
                        ? 'border-green-500/40 focus:border-green-500/60'
                        : 'border-white/5 focus:border-breezy-border-active'
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {emailInvalid && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[9px] text-red-400/80 ml-1 flex items-center gap-1"
                    >
                      <X className="w-2.5 h-2.5" />
                      Format invalide (ex: jean@exemple.com)
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Critères de sécurité du mot de passe — inscription uniquement */}
          <AnimatePresence>
            {showCriteria && (
              <motion.div
                key="criteria"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex flex-col gap-1.5">
                  <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider mb-0.5">
                    Critères de sécurité
                  </p>
                  {CRITERIA_LABELS.map(({ key, label }) => (
                    <motion.div
                      key={key}
                      className="flex items-center gap-2"
                      animate={{ opacity: criteria[key] ? 1 : 0.5 }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                          criteria[key] ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        {criteria[key] ? (
                          <Check className="w-2.5 h-2.5 text-green-400" />
                        ) : (
                          <X className="w-2.5 h-2.5 text-white/20" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono transition-colors duration-300 ${
                          criteria[key] ? 'text-green-400/80' : 'text-white/30'
                        }`}
                      >
                        {label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation mot de passe — inscription uniquement */}
          <AnimatePresence mode="popLayout">
            {isSignUp && (
              <motion.div
                key="confirm-field"
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
                    className={`w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border focus:outline-none focus:bg-white/[0.06] transition ${
                      confirmPassword.length > 0
                        ? confirmPassword === password
                          ? 'border-green-500/40 focus:border-green-500/60'
                          : 'border-red-500/50 focus:border-red-500/70'
                        : 'border-white/5 focus:border-breezy-border-active'
                    }`}
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
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
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

      {/* Note de sécurité */}
      <div className="mt-6 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] flex items-center gap-2.5 text-left select-none">
        <Shield className="w-4 h-4 text-breezy-lavender shrink-0" />
        <p className="text-[9px] text-white/30 leading-snug">
          Connexion sécurisée via JWT. Mot de passe chiffré avec bcrypt côté serveur.
        </p>
      </div>
    </motion.div>
  );
}
