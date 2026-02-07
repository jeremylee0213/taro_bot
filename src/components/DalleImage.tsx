'use client';

import { useState } from 'react';

interface DalleImageProps {
  imageUrl?: string;
  cardName: string;
  emojiArt: string;
  isLoading?: boolean;
}

export function DalleImage({ imageUrl, cardName, emojiArt, isLoading }: DalleImageProps) {
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden gold-border">
        <div className="aspect-square bg-card flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-6xl pixel-shimmer">{emojiArt}</div>
            <p className="text-xs text-text-muted">이미지 생성 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!imageUrl || imgError) {
    return (
      <div className="rounded-xl overflow-hidden gold-border">
        <div className="aspect-square bg-card flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-6xl">{emojiArt}</div>
            <p className="text-xs text-text-muted">{cardName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden gold-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={`${cardName} Pixel Art`}
        className="w-full aspect-square object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
