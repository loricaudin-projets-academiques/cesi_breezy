/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Mail, Zap, ArrowRight, UserPlus, Moon, Sun, Check, Circle } from 'lucide-react';
import { playTick, playChime } from '../audio';
import { DEFAULT_API_URL } from '../config';
import { normalizeUsername } from '../utils/username';
import { useTranslation, TranslationKey } from '../hooks/useTranslation';

interface LoginScreenProps {
  onLogin: (username: string, passkey: string, apiUrl: string) => void | Promise<void>;
  onRegister: (name: string, email: string, username: string, passkey: string, apiUrl: string) => void | Promise<void>;
  triggerToast: (msg: string) => void;
  isLightTheme: boolean;
  onToggleTheme: () => void;
}

// Regex email simple : au moins un @ et un . après le @
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mot de passe fort : min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

type Screen = 'splash' | 'login' | 'register';

export default function LoginScreen({ onLogin, onRegister, triggerToast, isLightTheme, onToggleTheme }: LoginScreenProps) {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('splash');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setLoginUsername('');
    setRegUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const goTo = (s: Screen) => {
    playTick();
    resetForm();
    setScreen(s);
  };

  const passwordCriteria: { key: TranslationKey; test: (pw: string) => boolean; fallback: string }[] = [
    { key: 'login.pass_len', test: (pw: string) => pw.length >= 8, fallback: "8 caractères min." },
    { key: 'login.pass_upper', test: (pw: string) => /[A-Z]/.test(pw), fallback: "1 majuscule" },
    { key: 'login.pass_lower', test: (pw: string) => /[a-z]/.test(pw), fallback: "1 minuscule" },
    { key: 'login.pass_number', test: (pw: string) => /\d/.test(pw), fallback: "1 chiffre" },
    { key: 'login.pass_symbol', test: (pw: string) => /[^A-Za-z\d]/.test(pw), fallback: "1 symbole (!@#$…)" },
  ];

  // Valide et soumet la connexion
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) { triggerToast(t('login.err_username_required')); return; }
    if (!password) { triggerToast(t('login.err_password_required')); return; }

    playChime();
    setIsConnecting(true);
    triggerToast(t('login.connecting'));

    setTimeout(async () => {
      try {
        await onLogin(normalizeUsername(loginUsername), password, DEFAULT_API_URL);
      } catch {
        // Le provider affiche déjà le message d'erreur.
      } finally {
        setIsConnecting(false);
      }
    }, 1200);
  };

  // Valide et soumet l'inscription
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { triggerToast(t('login.err_name_required')); return; }
    if (!email.trim()) { triggerToast(t('login.err_email_required')); return; }
    if (!EMAIL_REGEX.test(email.trim())) { triggerToast(t('login.err_email_invalid')); return; }
    if (!regUsername.trim()) { triggerToast(t('login.err_username_choose')); return; }
    if (!password) { triggerToast(t('login.err_password_required')); return; }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      triggerToast(t('login.err_pass_weak'));
      return;
    }
    if (password !== confirmPassword) { triggerToast(t('login.err_pass_mismatch')); return; }

    playChime();
    setIsConnecting(true);
    triggerToast(t('login.registering'));

    setTimeout(async () => {
      try {
        await onRegister(name.trim(), email.trim().toLowerCase(), normalizeUsername(regUsername), password, DEFAULT_API_URL);
      } catch {
        // Le provider affiche déjà le message d'erreur.
      } finally {
        setIsConnecting(false);
      }
    }, 1200);
  };

  // ─── Écran d'accueil (splash) ────────────────────────────────────────────
  if (screen === 'splash') {
    return (
      <motion.div
        key="splash"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="p-6 flex flex-col justify-center items-center min-h-screen w-full max-w-md mx-auto select-none gap-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-breezy-neon/25 blur-lg rounded-full animate-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-breezy-purple via-breezy-lavender to-breezy-neon flex items-center justify-center border border-white/10 z-10 relative">
              <Zap className="w-8 h-8 text-slate-950 active-nav-glow" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-black tracking-wider text-breezy-icy uppercase">BREEZY</h1>
          <p className="text-xs text-white/40 text-center font-sans">{t('login.subtitle')}</p>
        </div>

        {/* Boutons d'accueil */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={() => goTo('login')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-breezy-purple via-breezy-lavender to-breezy-neon text-slate-950 hover:glow-neon active:scale-[0.98] transition-all duration-300 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            {t('login.authenticate')}
          </button>
          <button
            type="button"
            onClick={() => goTo('register')}
            className="w-full py-4 rounded-xl border border-breezy-neon/40 text-breezy-neon hover:bg-breezy-neon/10 active:scale-[0.98] transition-all duration-300 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {t('login.create_account')}
          </button>
        </div>

        {/* Toggle thème */}
        <button
          type="button"
          onClick={() => { playTick(); onToggleTheme(); }}
          className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold flex items-center gap-1.5"
        >
          {isLightTheme ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {isLightTheme ? t('login.theme_light') : t('login.theme_dark')}
        </button>
      </motion.div>
    );
  }

  // ─── Formulaire connexion ────────────────────────────────────────────────
  if (screen === 'login') {
    return (
      <motion.div
        key="login"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        className="p-6 flex flex-col justify-center items-stretch min-h-screen w-full max-w-md mx-auto select-none"
      >
        <div className="text-center mb-6 mt-2 flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-breezy-neon/25 blur-lg rounded-full animate-pulse" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-breezy-purple via-breezy-lavender to-breezy-neon flex items-center justify-center border border-white/10 z-10 relative">
              <Zap className="w-6 h-6 text-slate-950 active-nav-glow" />
            </div>
          </div>
          <h1 className="text-xl font-display font-black tracking-wider text-breezy-icy uppercase">{t('login.authenticate')}</h1>
        </div>

        <div className="glassmorphic rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-breezy-neon/5 blur-xl pointer-events-none" />

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Nom d'utilisateur */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
                {t('login.username')}
              </label>
              <div className="relative">
                <span className="text-xs font-semibold text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                <input
                  type="text"
                  required
                  value={loginUsername.startsWith('@') ? loginUsername.slice(1) : loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="jeandupont"
                  className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
                {t('login.password')}
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

            <button
              type="submit"
              disabled={isConnecting}
              onClick={() => playTick()}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-breezy-purple via-breezy-lavender to-breezy-neon text-slate-950 hover:glow-neon active:scale-[0.98] transition-all duration-300 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? t('login.connecting') : (<>{t('login.connect')} <ArrowRight className="w-3.5 h-3.5" /></>)}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => goTo('splash')}
              className="text-[10px] font-mono text-breezy-neon/80 hover:text-breezy-neon underline cursor-pointer transition uppercase tracking-wider"
            >
              {t('login.back_home')}
            </button>
          </div>
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => goTo('register')}
              className="text-[10px] font-mono text-white/40 hover:text-breezy-neon cursor-pointer transition uppercase tracking-wider"
            >
              {t('login.no_account_create')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Formulaire inscription ──────────────────────────────────────────────
  return (
    <motion.div
      key="register"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="p-6 flex flex-col justify-center items-stretch min-h-screen w-full max-w-md mx-auto select-none"
    >
      <div className="text-center mb-6 mt-2 flex flex-col items-center">
        <div className="relative mb-2">
          <div className="absolute inset-0 bg-breezy-neon/25 blur-lg rounded-full animate-pulse" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-breezy-purple via-breezy-lavender to-breezy-neon flex items-center justify-center border border-white/10 z-10 relative">
            <UserPlus className="w-6 h-6 text-slate-950" />
          </div>
        </div>
        <h1 className="text-xl font-display font-black tracking-wider text-breezy-icy uppercase">{t('login.create_account')}</h1>
      </div>

      <div className="glassmorphic rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-breezy-neon/5 blur-xl pointer-events-none" />

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Nom complet */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              {t('login.name')}
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
          </div>

          {/* Courriel */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              {t('login.email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@exemple.fr"
                className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
              />
            </div>
          </div>

          {/* Nom d'utilisateur */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              {t('login.username')}
            </label>
            <div className="relative">
              <span className="text-xs font-semibold text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
              <input
                type="text"
                required
                value={regUsername.startsWith('@') ? regUsername.slice(1) : regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="jeandupont"
                className="w-full text-xs font-sans rounded-xl bg-white/[0.03] p-3.5 pl-10 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active focus:bg-white/[0.06] transition"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              {t('login.password')}
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
            
            {/* Dynamic criteria checking */}
            <div className="grid grid-cols-2 gap-2 mt-2 ml-1">
              {passwordCriteria.map((c) => {
                const isMet = c.test(password);
                return (
                  <div
                    key={c.key}
                    className={`flex items-center gap-1.5 text-[9px] font-sans font-medium transition-colors duration-300 ${
                      isMet ? 'text-emerald-400' : 'text-white/30'
                    }`}
                  >
                    {isMet ? (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-white/20 shrink-0" />
                    )}
                    <span>{t(c.key) || c.fallback}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirmation mot de passe */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[9px] font-mono text-white/40 uppercase tracking-wider font-semibold ml-1">
              {t('login.confirm_password')}
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
          </div>

          <button
            type="submit"
            disabled={isConnecting}
            onClick={() => playTick()}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-breezy-purple via-breezy-lavender to-breezy-neon text-slate-950 hover:glow-neon active:scale-[0.98] transition-all duration-300 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isConnecting ? t('login.connecting') : (<>{t('login.create_account')} <ArrowRight className="w-3.5 h-3.5" /></>)}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => goTo('splash')}
            className="text-[10px] font-mono text-breezy-neon/80 hover:text-breezy-neon underline cursor-pointer transition uppercase tracking-wider"
          >
            {t('login.back_home')}
          </button>
        </div>
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => goTo('login')}
            className="text-[10px] font-mono text-white/40 hover:text-breezy-neon cursor-pointer transition uppercase tracking-wider"
          >
            {t('login.already_registered')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
