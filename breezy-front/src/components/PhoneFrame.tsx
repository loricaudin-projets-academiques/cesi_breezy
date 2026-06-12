/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

// Simule le boîtier d'un smartphone — tout le contenu de l'app s'affiche à l'intérieur
export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="w-full max-w-sm h-[840px] md:h-[840px] rounded-[48px] border-[8px] border-[#1a1a1a] bg-[#050505] bg-gradient-custom flex flex-col relative overflow-hidden z-10 box-border shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
      
      {/* L'encoche en haut — comme un vrai Dynamic Island */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-4.5 rounded-full bg-black/95 border border-white/5 z-40 flex items-center justify-center p-1 select-none pointer-events-none">
        
        {/* Point de caméra */}
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute left-4.5 border border-white/[0.04]" />
        
        {/* Petite signature de l'app */}
        <span className="text-[7.5px] font-mono font-black text-breezy-neon/80 tracking-widest pl-5 active-nav-glow">BREEZY UI</span>
      </div>
      {children}
    </div>
  );
}
