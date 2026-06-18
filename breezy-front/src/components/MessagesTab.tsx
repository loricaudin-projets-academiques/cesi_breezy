/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, ArrowLeft, MoreVertical, Sparkles, MessageSquarePlus, X } from 'lucide-react';
import { Conversation, MessageItem } from '../types';
import { playTick, playMessageSound, playChime } from '../audio';
import { conversationService } from '../services/ServiceContainer';
import { normalizeUsername } from '../utils/username';
import Avatar from './Avatar';

// Heure courante au format HH:MM — affichée sous chaque bulle de message
function currentTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  
  // Référence pour faire défiler jusqu'au dernier message automatiquement
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConv = conversations.find(c => c.id === activeConvId);

  // Crée une nouvelle conversation ou ouvre celle qui existe déjà
  const handleCreateConvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactUsername.trim()) return;

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
        name: contactName,
        username: contactUsername,
        avatar: contactAvatar,
      });

      onUpdateConversations((prev) => [newConv, ...prev.filter((conv) => conv.id !== newConv.id)]);
      setActiveConvId(newConv.id);
      setContactName('');
      setContactUsername('');
      setContactAvatar('');
      triggerToast(`Chat ouvert avec ${newConv.name}`);
    } catch {
      const newConv = conversationService.createConversation(contactName, contactUsername, contactAvatar);

      onUpdateConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setContactName('');
      setContactUsername('');
      setContactAvatar('');
      triggerToast(`Chat ouvert avec ${newConv.name}`);
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
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConvId || !selectedConv) return;

    const userMessage = inputText.trim();
    const convId = activeConvId;
    const contact = { name: selectedConv.name, username: selectedConv.username };

    appendMessage(convId, {
      id: `me-${Date.now()}`,
      sender: 'me',
      text: userMessage,
      time: currentTimeLabel()
    });
    setInputText('');
    playMessageSound(true);

    // On affiche les trois points "en train d'écrire..."
    setIsTyping(true);

    // On attend 1.5 secondes pour simuler un délai de frappe humain
    setTimeout(async () => {
      const replyText = await conversationService.fetchReply(userMessage, contact);

      appendMessage(convId, {
        id: `bot-${Date.now()}`,
        sender: 'them',
        text: replyText,
        time: currentTimeLabel()
      });

      setIsTyping(false);
      playMessageSound(false);
      triggerToast(`Nouveau message de ${contact.name}`);
    }, 1500);
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
                  className="p-1 rounded-md bg-breezy-card hover:bg-breezy-card-hover hover:text-breezy-neon text-breezy-muted transition cursor-pointer"
                  title="Nouveau chat"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-breezy-muted tracking-wider">MESSAGERIE</span>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              {conversations.length === 0 ? (
                <div className="py-20 text-center text-breezy-faint text-xs bg-breezy-card rounded-2xl border border-breezy-border">
                  Aucune conversation ouverte.
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleOpenConv(conv.id)}
                    className="w-full text-left glassmorphic rounded-2xl p-3.5 flex items-center gap-3.5 border border-breezy-border hover:border-breezy-border-active hover:bg-breezy-card active:scale-[0.99] transition-all duration-300 relative group"
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
                      {conv.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-breezy-bg flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Aperçu du dernier message */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-sans font-medium text-breezy-icy group-hover:text-breezy-neon transition-colors">
                          {conv.name}
                        </h4>
                        <span className="text-[10px] font-mono text-breezy-faint truncate select-none">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-xs text-breezy-muted truncate tracking-tight">
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
            className="flex-1 flex flex-col h-full bg-breezy-bg/95 z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
          >
            {/* En-tête de la discussion */}
            <div className="shrink-0 p-4 border-b border-breezy-border flex items-center justify-between glassmorphic">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { playTick(); setActiveConvId(null); }}
                  className="w-8 h-8 rounded-lg bg-breezy-card hover:bg-breezy-card-hover flex items-center justify-center text-breezy-icy transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2.5">
                  <Avatar name={selectedConv?.name || ''} username={selectedConv?.username} url={selectedConv?.avatar} className="w-9 h-9" />
                  <div>
                    <h3 className="text-xs font-sans font-semibold text-breezy-icy">{selectedConv?.name}</h3>
                    <p className="text-[10px] font-mono text-breezy-neon flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedConv?.online ? 'bg-emerald-500' : 'bg-breezy-faint'}`} />
                      {selectedConv?.online ? 'En ligne' : 'Hors ligne'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-breezy-purple/10 text-breezy-purple">
                  <Sparkles className="w-3.5 h-3.5 active-nav-glow" />
                </div>
                <button className="w-8 h-8 rounded-lg bg-breezy-card hover:bg-breezy-card-hover flex items-center justify-center text-breezy-muted">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bulles de messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-3">
              <div className="mx-auto my-3 text-[10px] font-mono text-breezy-faint tracking-wider text-center select-none uppercase">
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
                          : 'glassmorphic text-breezy-icy rounded-tl-xs border border-breezy-border shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-mono text-breezy-muted mt-1 px-1">
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
                    <div className="glassmorphic p-3 rounded-2xl rounded-tl-xs border border-breezy-border flex items-center gap-1.5">
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
              className="p-3 shrink-0 border-t border-breezy-border glassmorphic flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 text-xs rounded-xl glassmorphism-light py-3 px-4 text-breezy-icy placeholder-breezy-muted focus:outline-none focus:border-breezy-border-active transition"
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
        {isSelectContactOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => { playTick(); setIsSelectContactOpen(false); }}
              className="absolute inset-0 bg-breezy-overlay backdrop-blur-md cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs glassmorphism-premium rounded-2.5xl p-5 border border-breezy-border z-10 flex flex-col"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-breezy-border">
                <span className="text-xs font-mono text-breezy-neon uppercase tracking-wider font-bold">
                  Nouvelle conversation
                </span>
                <button 
                  onClick={() => { playTick(); setIsSelectContactOpen(false); }}
                  className="text-breezy-muted hover:text-breezy-icy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateConvSubmit} className="flex flex-col gap-3.5 text-left font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-breezy-muted uppercase tracking-wider">Nom du contact</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Alice Dupont"
                    className="w-full text-xs font-sans rounded-xl bg-breezy-card p-3 text-breezy-icy placeholder-breezy-muted border border-breezy-border focus:outline-none focus:border-breezy-border-active transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-breezy-muted uppercase tracking-wider">Nom d'utilisateur</label>
                  <input
                    type="text"
                    required
                    value={contactUsername}
                    onChange={(e) => setContactUsername(e.target.value)}
                    placeholder="@alice"
                    className="w-full text-xs font-sans rounded-xl bg-breezy-card p-3 text-breezy-icy placeholder-breezy-muted border border-breezy-border focus:outline-none focus:border-breezy-border-active transition"
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
