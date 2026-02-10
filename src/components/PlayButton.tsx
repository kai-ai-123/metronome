'use client';

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
}

export function PlayButton({ isPlaying, onToggle }: PlayButtonProps) {
  return (
    <button
      data-testid="play-button"
      onClick={onToggle}
      className="w-20 h-20 rounded-full bg-gray-900 text-white flex items-center justify-center
                 hover:bg-gray-700 active:scale-95 transition-all mx-auto"
      aria-label={isPlaying ? '停止' : '再生'}
    >
      {isPlaying ? (
        /* 停止アイコン */
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        /* 再生アイコン */
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="8,5 20,12 8,19" />
        </svg>
      )}
    </button>
  );
}
