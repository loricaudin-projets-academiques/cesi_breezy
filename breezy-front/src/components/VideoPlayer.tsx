/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface VideoPlayerProps {
  src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      className="w-full rounded-xl border border-white/10 mt-1 max-h-72 bg-black"
    />
  );
}
