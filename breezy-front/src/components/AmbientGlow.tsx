/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';

interface AmbientGlowProps {
  enabled: boolean;
}

// Les deux halos lumineux animés qui flottent derrière l'interface
// On les coupe pour économiser les ressources si l'utilisateur le désactive
export default function AmbientGlow({ enabled }: AmbientGlowProps) {
  return (
    <AnimatePresence>
      {enabled && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          
          {/* Cercle violet en haut à gauche — il respire lentement */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.6 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
            className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full ambient-glow-violet"
          />
          
          {/* Cercle bleu en bas à droite — légèrement décalé pour un effet naturel */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 0.9, opacity: 0.7 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", delay: 1 }}
            className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full ambient-glow-blue"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
