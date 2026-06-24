import React from 'react';
import { forceNavigate } from './navigation';

export function renderWithMentions(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(/(\B@\w+)/g);
  return parts.map((part, i) => {
    if (/^\B@\w+$/.test(part) && part.length > 1) {
      const username = part.slice(1);
      return (
        <button
          key={i}
          type="button"
          onClick={(e) => { e.stopPropagation(); forceNavigate(`/profile/${encodeURIComponent(username)}`); }}
          className="text-breezy-neon hover:underline font-mono"
        >
          {part}
        </button>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
