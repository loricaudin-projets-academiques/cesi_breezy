/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, ArrowLeft, MoreVertical, Search, X } from 'lucide-react';
import { Conversation, Follower, MessageItem } from '../types';
import { playTick, playMessageSound, playChime } from '../audio';
import { conversationService } from '../services/ServiceContainer';
import { normalizeUsername } from '../utils/username';
import { getErrorMessage } from '../utils/errors';
import Avatar from './Avatar';
import { api } from '../services/api';

// Heure courante au format HH:MM — affichée sous chaque bulle de message
// Applique une transformation à une seule conversation de la liste
function updateConversation(
  conversations: Conversation[],
  id: string,
  transform: (conv: Conversation) => Conversation
): Conversation[] {
  return conversations.map((c) => (c.id === id ? transform(c) : c));
}

interface MessagesTabProps {
  conversations: Conversation[];
  onUpdateConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  triggerToast: (msg: string) => void;
}

// Écran de messagerie : liste des conversations à gauche, chat à droite
export default function MessagesTab({ conversations, onUpdateConversations, triggerToast }: MessagesTabProps) {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSelectContactOpen, setIsSelectContactOpen] = useState(false);
  
  // Champs du formulaire de création de nouveau contact
  const [contactName, setContactName] = useState('');
  const [contactUsername, setContactUsername] = useState('');
  const [contactAvatar, setContactAvatar] = useState('');
  const [contactResults, setContactResults] = useState<Follower[]>([]);
  
  // Référence pour faire défiler jusqu'au dernier message automatiquement
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConv = conversations.find(c => c.id === activeConvId);

  useEffect(() => {
    if (!isSelectContactOpen) return;

    let cancelled = false;
    const query = contactUsername.trim();
    const timeoutId = window.setTimeout(async () => {
      try {
        const { data } = query
          ? await api.get<Follower[]>('/users/search', { params: { q: query } })
          : await api.get<Follower[]>('/users/friends');
        if (!cancelled) setContactResults(data);
      } catch {
        if (!cancelled) setContactResults([]);
      }
    }, query ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [contactUsername, isSelectContactOpen]);

  const openChatWithUser = async (user: Follower) => {
    setContactName(user.name);
    setContactUsername(user.username);
    setContactAvatar(user.avatar);
    playChime();
    setIsSelectContactOpen(false);

    const existing = conversations.find((conversation) => conversation.username === user.username);
    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    try {
      const newConv = await conversationService.createRemoteConversation({
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      });
      onUpdateConversations((prev) => [newConv, ...prev.filter((conv) => conv.id !== newConv.id)]);
      setActiveConvId(newConv.id);
      triggerToast(`Chat ouvert avec ${newConv.name}`);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'ouvrir ce chat."));
    }
  };

  // Crée une nouvelle conversation ou ouvre celle qui existe déjà
  const handleCreateConvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactUsername.trim()) return;

    playChime();
    setIsSelectContactOpen(false);

    // Si ce contact existe déjà, on va directement dans le chat
    const cleanUsername = normalizeUsername(contactUsername);
    const existing = conversations.find(c => c.username === cleanUsername);
    if (existing) {
      setActiveConvId(existing.id);
      return;
    }

    try {
      const newConv = await conversationService.createRemoteConversation({
        name: contactName.trim() || normalizeUsername(contactUsername),
        username: contactUsername,
        avatar: contactAvatar,
      });

      onUpdateConversations((prev) => [newConv, ...prev.filter((conv) => conv.id !== newConv.id)]);
      setActiveConvId(newConv.id);
      setContactName('');
      setContactUsername('');
      setContactAvatar('');
      triggerToast(`Chat ouvert avec ${newConv.name}`);
    } catch (error) {
      triggerToast(getErrorMessage(error, "Impossible d'ouvrir ce chat. Verifie que l'utilisateur existe."));
    }
  };

  // Scroll automatique vers le bas quand un nouveau message arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages, isTyping, activeConvId]);

  // Ouvre une conversation et marque tous les messages comme lus
  const handleOpenConv = (id: string) => {
    playTick();
    setActiveConvId(id);

    onUpdateConversations((prev) =>
      updateConversation(prev, id, (c) => ({ ...c, unreadCount: 0 }))
    );
  };

  // Ajoute un message à la conversation active (le nôtre ou celui du contact)
  const appendMessage = (convId: string, message: MessageItem) => {
    onUpdateConversations((prev) =>
      updateConversation(prev, convId, (c) => ({
        ...c,
        messages: [...c.messages, message],
        lastMessage: message.text,
        time: "À l'instant"
      }))
    );
  };

  // Envoie notre message et attend la réponse (API ou bot local — c'est le service qui gère)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || !selectedConv) return;

    const userMessage = inputText.trim();
    const convId = activeConvId;
    setInputText('');
    // On affiche les trois points "en train d'écrire..."
    setIsTyping(true);

    // On attend 1.5 secondes pour simuler un délai de frappe humain
    try {
      const savedMessage = await conversationService.sendMessage(convId, userMessage);
      appendMessage(convId, savedMessage);
      setIsTyping(false);
      playMessageSound(true);
    } catch (error) {
      setInputText(userMessage);
      setIsTyping(false);
      triggerToast(getErrorMessage(error, "Message non envoye."));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeConvId ? (
          /* VUE 1 : Boîte de réception */
          <motion.div
            key="list"
            className="flex-1 overflow-y-auto no-scrollbar py-2 px-4 flex flex-col gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-2 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-display font-medium text-breezy-icy flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-breezy-lavender active-nav-glow" />
                  Messages
                </h2>
                <button
                  onClick={() => setIsSelectContactOpen(true)}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 hover:text-breezy-neon text-white/50 transition cursor-pointer"
                  title="Rechercher un utilisateur"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-white/40 tracking-wider">MESSAGERIE</span>
            </div>

            <AnimatePresence>
              {isSelectContactOpen && (
                <motion.form
                  key="contact-search"
                  onSubmit={handleCreateConvSubmit}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="glassmorphic rounded-2xl border border-white/10 p-3 flex flex-col md:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={contactUsername}
                    onChange={(e) => {
                      setContactUsername(e.target.value);
                      setContactName(e.target.value.replace(/^@/, ''));
                    }}
                  placeholder="Rechercher un utilisateur..."
                    className="flex-1 text-xs font-sans rounded-xl bg-white/[0.04] p-3 text-breezy-icy placeholder-white/35 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!contactUsername.trim()}
                    className="px-4 py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon text-slate-950 font-sans font-bold text-xs transition disabled:opacity-50"
                  >
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSelectContactOpen(false)}
                    className="px-3 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    {contactResults.map((user) => (
                      <button
                        key={user.username}
                        type="button"
                        onClick={() => void openChatWithUser(user)}
                        className="w-full flex items-center gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-2 text-left"
                      >
                        <Avatar name={user.name} username={user.username} url={user.avatar} className="w-8 h-8" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{user.name} {user.isFriend ? 'AMI' : ''}</p>
                          <p className="text-[10px] text-white/45 truncate">{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2.5 mt-1">
              {conversations.length === 0 ? (
                <div className="py-20 text-center text-white/30 text-xs bg-[#0d0d12]/20 rounded-2xl border border-white/5">
                  Aucune conversation ouverte.
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleOpenConv(conv.id)}
                    className="w-full text-left glassmorphic rounded-2xl p-3.5 flex items-center gap-3.5 border border-white/5 hover:border-white/15 hover:bg-white/[0.02] active:scale-[0.99] transition-all duration-300 relative group"
                  >
                    {/* Pastille verte sur les messages non lus */}
                    {conv.unreadCount > 0 && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-breezy-neon flex items-center justify-center glow-neon">
                        <span className="text-[9px] font-bold text-black">{conv.unreadCount}</span>
                      </div>
                    )}

                    {/* Avatar avec indicateur de présence */}
                    <div className="relative shrink-0">
                      <Avatar name={conv.name} username={conv.username} url={conv.avatar} className="w-12 h-12" />
                    </div>

                    {/* Aperçu du dernier message */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-sans font-medium text-breezy-icy group-hover:text-breezy-neon transition-colors">
                          {conv.name}
                        </h4>
                        <span className="text-[10px] font-mono text-white/30 truncate select-none">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 truncate tracking-tight">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          /* VUE 2 : La discussion en cours */
          <motion.div
            key="chat"
            className="breezy-chat-surface flex-1 flex flex-col h-full z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
          >
            {/* En-tête de la discussion */}
            <div className="shrink-0 p-4 border-b border-white/5 flex items-center justify-between glassmorphic">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { playTick(); setActiveConvId(null); }}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/85 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2.5">
                  <Avatar name={selectedConv?.name || ''} username={selectedConv?.username} url={selectedConv?.avatar} className="w-9 h-9" />
                  <div>
                    <h3 className="text-xs font-sans font-semibold text-breezy-icy">{selectedConv?.name}</h3>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulles de messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3">
              <div className="mx-auto my-3 text-[10px] font-mono text-white/30 tracking-wider text-center select-none uppercase">
                Conversation chiffrée
              </div>

              {selectedConv?.messages.map((msg) => {
                const isMe = msg.sender === 'me';
                return (
                  // Nos messages à droite, ceux du contact à gauche
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col max-w-[78%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-[12.5px] leading-relaxed relative ${
                        isMe
                          ? 'bg-gradient-to-br from-breezy-lavender to-breezy-purple text-slate-950 font-medium rounded-tr-xs'
                          : 'glassmorphic text-breezy-icy rounded-tl-xs border border-white/5 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-white/40 mt-1 px-1">
                      {msg.time}
                    </span>
                  </motion.div>
                );
              })}

              {/* Indicateur "en train d'écrire..." animé */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="self-start flex flex-col items-start max-w-[70%]"
                  >
                    <div className="glassmorphic p-3 rounded-2xl rounded-tl-xs border border-white/5 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-breezy-neon mr-1">En train d'écrire</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-breezy-neon/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-breezy-lavender/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-breezy-purple/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Barre de saisie du message */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 shrink-0 border-t border-white/5 glassmorphic flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={5000}
                placeholder="Écrire un message..."
                className="flex-1 text-xs rounded-xl glassmorphism-light py-3 px-4 text-breezy-icy placeholder-white/30 focus:outline-none focus:border-breezy-border-active transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-breezy-icy text-slate-950 hover:bg-breezy-neon disabled:opacity-40 disabled:hover:bg-breezy-icy flex items-center justify-center active:scale-95 transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VUE 3 : Formulaire pour démarrer une nouvelle conversation */}
      <AnimatePresence>
        {false && isSelectContactOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => { playTick(); setIsSelectContactOpen(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-white/10 z-10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <span className="text-xs font-mono text-breezy-neon uppercase tracking-wider font-bold">
                  Nouvelle conversation
                </span>
                <button 
                  onClick={() => { playTick(); setIsSelectContactOpen(false); }}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateConvSubmit} className="flex flex-col gap-3.5 text-left font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-white/40 uppercase tracking-wider">Nom du contact</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Alice Dupont"
                    className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-white/40 uppercase tracking-wider">Nom d'utilisateur</label>
                  <input
                    type="text"
                    required
                    value={contactUsername}
                    onChange={(e) => setContactUsername(e.target.value)}
                    placeholder="@alice"
                    className="w-full text-xs font-sans rounded-xl bg-white/[0.04] p-3 text-breezy-icy placeholder-white/20 border border-white/5 focus:outline-none focus:border-breezy-border-active transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!contactName.trim() || !contactUsername.trim()}
                  className="w-full mt-1 py-2.5 rounded-xl bg-breezy-icy hover:bg-breezy-neon text-slate-950 font-sans font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                >
                  Démarrer le chat
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
