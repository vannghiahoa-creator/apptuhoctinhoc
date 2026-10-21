import React, { useState } from 'react';
import { playRobotBeep } from '../utils/audio';

interface NutaAvatarProps {
  mood?: 'neutral' | 'thinking' | 'happy' | 'celebrating' | 'talking';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  bubbleText?: string;
  onClick?: () => void;
}

export const NutaAvatar: React.FC<NutaAvatarProps> = ({
  mood = 'neutral',
  size = 'md',
  showSpeechBubble = false,
  bubbleText,
  onClick,
}) => {
  const [isWaving, setIsWaving] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  const handleAvatarClick = () => {
    playRobotBeep();
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 800);
    if (onClick) onClick();
  };

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Speech bubble if provided */}
      {showSpeechBubble && bubbleText && (
        <div className="absolute -top-12 z-20 bg-white border-2 border-sky-400 text-sky-900 text-xs sm:text-sm font-bold px-3 py-1.5 rounded-2xl shadow-lg whitespace-nowrap animate-bounce pointer-events-none">
          {bubbleText}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-8 border-t-sky-400"></div>
        </div>
      )}

      {/* Robot Body Container with gentle floating */}
      <div
        onClick={handleAvatarClick}
        className={`${sizeClasses[size]} relative cursor-pointer group transition-transform duration-300 hover:scale-105 active:scale-95`}
        title="Bấm vào NUTA để nghe chào hỏi!"
      >
        <svg
          viewBox="0 0 120 120"
          className={`w-full h-full drop-shadow-md transition-all ${
            mood === 'thinking' ? 'animate-pulse' : ''
          } ${mood === 'celebrating' || isWaving ? 'animate-bounce' : 'animate-[bounce_3s_ease-in-out_infinite]'}`}
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>
            <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Antenna */}
          <line x1="60" y1="20" x2="60" y2="34" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
          <circle
            cx="60"
            cy="16"
            r="8"
            fill={mood === 'thinking' ? '#F59E0B' : '#38BDF8'}
            className="transition-colors duration-300"
          />
          <circle cx="58" cy="14" r="2.5" fill="#FFFFFF" opacity="0.8" />

          {/* Ears / Headphone puffs */}
          <rect x="12" y="44" width="10" height="24" rx="5" fill="#0284C7" />
          <rect x="98" y="44" width="10" height="24" rx="5" fill="#0284C7" />
          <circle cx="17" cy="56" r="3" fill="#BAE6FD" />
          <circle cx="103" cy="56" r="3" fill="#BAE6FD" />

          {/* Head Outer Shell */}
          <rect
            x="20"
            y="30"
            width="80"
            height="56"
            rx="18"
            fill="url(#bodyGrad)"
            stroke="#0284C7"
            strokeWidth="3.5"
          />

          {/* Face Screen Visor */}
          <rect
            x="27"
            y="36"
            width="66"
            height="44"
            rx="12"
            fill="url(#screenGrad)"
            stroke="#38BDF8"
            strokeWidth="1.5"
          />

          {/* Eyes depending on Mood */}
          {mood === 'happy' || mood === 'celebrating' ? (
            /* Crescent Happy Eyes */
            <>
              <path
                d="M 39 58 Q 47 48 55 58"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 65 58 Q 73 48 81 58"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          ) : mood === 'thinking' ? (
            /* Analytical Curious Eyes */
            <>
              <circle cx="47" cy="56" r="6" fill="#FBBF24" />
              <circle cx="49" cy="54" r="2" fill="#FFFFFF" />
              <circle cx="73" cy="56" r="6" fill="#FBBF24" />
              <circle cx="75" cy="54" r="2" fill="#FFFFFF" />
              {/* Question light above eye */}
              <circle cx="83" cy="45" r="2.5" fill="#FBBF24" className="animate-ping" />
            </>
          ) : (
            /* Standard Alert Blue Eyes */
            <>
              <ellipse cx="47" cy="56" rx="6.5" ry="7" fill="#38BDF8" />
              <circle cx="45" cy="54" r="2.5" fill="#FFFFFF" />
              <ellipse cx="73" cy="56" rx="6.5" ry="7" fill="#38BDF8" />
              <circle cx="71" cy="54" r="2.5" fill="#FFFFFF" />
            </>
          )}

          {/* Cheerful Robot Mouth */}
          {mood === 'talking' ? (
            <ellipse cx="60" cy="70" rx="6" ry="4" fill="#38BDF8" className="animate-pulse" />
          ) : mood === 'happy' || mood === 'celebrating' ? (
            <path
              d="M 52 68 Q 60 76 68 68"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            <rect x="54" y="68" width="12" height="3" rx="1.5" fill="#38BDF8" />
          )}

          {/* Rosy Cheeks */}
          <circle cx="34" cy="66" r="3.5" fill="#F472B6" opacity="0.75" />
          <circle cx="86" cy="66" r="3.5" fill="#F472B6" opacity="0.75" />

          {/* Neck connector */}
          <rect x="53" y="86" width="14" height="6" rx="2" fill="#64748B" />

          {/* Upper Body & Smart Badge */}
          <path
            d="M 34 92 C 34 90, 44 89, 60 89 C 76 89, 86 90, 86 92 L 92 110 C 92 114, 28 114, 28 110 Z"
            fill="url(#bodyGrad)"
            stroke="#0284C7"
            strokeWidth="3"
          />

          {/* Circuit Badge in Chest */}
          <circle cx="60" cy="101" r="5" fill="url(#blueGlow)" />
          <circle cx="60" cy="101" r="2" fill="#FFFFFF" />
        </svg>

        {/* Level ring indicator badge */}
        <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow border-2 border-white">
          AI
        </span>
      </div>
    </div>
  );
};
