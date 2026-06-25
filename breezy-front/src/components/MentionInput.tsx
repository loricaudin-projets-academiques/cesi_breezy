import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

interface UserSuggestion {
  username: string;
  name: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export default function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  multiline = false,
  rows = 4,
  maxLength,
  onKeyDown,
  autoFocus,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectMention = useCallback((text: string, cursorPos: number) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionStart(before.lastIndexOf('@'));
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (mentionQuery === null) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (mentionQuery.length < 1) { setSuggestions([]); return; }
      try {
        const { data } = await api.get<UserSuggestion[]>(`/users/search?q=${encodeURIComponent(mentionQuery)}`);
        setSuggestions((data || []).slice(0, 5).map(u => ({ ...u, username: u.username.replace(/^@+/, '') })));
        setSelectedIndex(0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }, [mentionQuery]);

  const insertMention = (username: string) => {
    const cleanName = username.replace(/^@+/, '');
    // Re-derive @ position from DOM at insertion time — avoids stale state entirely
    const el = inputRef.current;
    const cursor = el ? (el.selectionStart ?? value.length) : value.length;
    const textBefore = value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (!match || match.index === undefined) {
      setSuggestions([]);
      setMentionQuery(null);
      return;
    }
    const atIndex = match.index;
    const queryLen = match[1].length;
    const prefix = value.slice(0, atIndex);
    const suffix = value.slice(atIndex + 1 + queryLen);
    const next = `${prefix}@${cleanName} ${suffix}`;
    onChange(maxLength ? next.slice(0, maxLength) : next);
    setSuggestions([]);
    setMentionQuery(null);
    const newPos = prefix.length + cleanName.length + 2;
    setTimeout(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
    onChange(newValue);
    detectMention(newValue, e.target.selectionStart ?? newValue.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((p) => Math.min(p + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((p) => Math.max(p - 1, 0)); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(suggestions[selectedIndex].username); return; }
      if (e.key === 'Escape') { setSuggestions([]); setMentionQuery(null); return; }
    }
    onKeyDown?.(e);
  };

  const sharedProps = {
    ref: inputRef,
    value,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className,
    autoFocus,
    ...(maxLength ? { maxLength } : {}),
  };

  return (
    <div className="relative">
      {multiline
        ? <textarea {...sharedProps} rows={rows} />
        : <input type="text" {...sharedProps} />
      }

      {suggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-60 glassmorphism-premium rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
          {suggestions.map((user, i) => (
            <button
              key={user.username}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(user.username); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition ${
                i === selectedIndex ? 'bg-breezy-neon/10 text-breezy-neon' : 'text-white/80 hover:bg-white/5'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 font-mono truncate">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
