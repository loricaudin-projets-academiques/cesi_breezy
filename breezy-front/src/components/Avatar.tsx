/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMediaUrl } from '../utils/mediaUrl';

interface AvatarProps {
  name: string;
  username?: string;
  url?: string;
  className?: string;
  textSizeClass?: string;
}

// Si l'utilisateur n'a pas encore mis de photo, on génère un avatar unique
// basé sur son pseudo grâce à Dicebear — chaque seed donne toujours le même résultat
export function getAvatarUrl(url?: string, username?: string, name?: string): string {
  if (url && url.trim()) return getMediaUrl(url);
  
  // On nettoie le @ si présent avant de l'utiliser comme graine de génération
  const seed = (username || name || "default").trim().replace(/^@/, '');
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
}

// Avatar rond avec un léger contour — s'adapte à la taille passée en props
export default function Avatar({ name, username, url, className = "w-9 h-9" }: AvatarProps) {
  return (
    <div className={`${className} rounded-full overflow-hidden border border-white/10 p-0.5 shrink-0 bg-[#050505]`}>
      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#050505] relative">
        <img src={getAvatarUrl(url, username, name)} className="w-full h-full object-cover rounded-full" alt={name} />
      </div>
    </div>
  );
}
