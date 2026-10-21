import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Presentation
} from 'lucide-react';
import { GradeLevel } from '../types';
import { generateLessonSlides, exportPresentationHtml, SlideData } from '../utils/exportPptx';
import { playClickPop } from '../utils/audio';

interface SlideViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: GradeLevel;
  topic?: string;
}

export const SlideViewerModal: React.FC<SlideViewerModalProps> = ({
  isOpen,
  onClose,
  grade,
  topic = 'Lập trình Scratch & An toàn số',
}) => {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSlides(generateLessonSlides(grade, topic));
      setCurrentIndex(0);
    }
  }, [isOpen, grade, topic]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, slides.length]);

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      playClickPop();
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playClickPop();
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleDownload = () => {
    playClickPop();
    exportPresentationHtml(grade, topic);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 rounded-3xl w-full flex flex-col shadow-2xl border border-slate-700 overflow-hidden transition-all ${
          isFullscreen ? 'h-full max-w-full' : 'max-w-4xl h-[85vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-sky-400" />
            <span className="font-black text-sm">
              Trình Chiếu Bài Giảng: {grade} - {topic}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-colors cursor-pointer"
              title="Tải tệp trình chiếu về máy tính"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải Slide (.html/ppt)</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                playClickPop();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors cursor-pointer"
              title="Đóng trình chiếu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Canvas Area */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto relative">
          {/* Slide Background Gradient Glow */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgGradient} opacity-20 pointer-events-none`}
          />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl sm:text-5xl">{currentSlide.icon}</span>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                Slide {currentIndex + 1} / {slides.length}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentSlide.title}
              </h1>
              {currentSlide.subtitle && (
                <p className="text-sm sm:text-base text-slate-300 font-medium mt-1">
                  {currentSlide.subtitle}
                </p>
              )}
            </div>

            <div className="pt-2">
              <ul className="space-y-3">
                {currentSlide.bullets.map((b, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-slate-200 font-medium leading-relaxed"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 shrink-0"></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {currentSlide.highlightText && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{currentSlide.highlightText}</span>
              </div>
            )}
          </div>

          {/* Bottom Bar: Mascot Note & Navigation buttons */}
          <div className="relative z-10 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-bold">
              <span>🤖 Robot NUTA: Dùng phím mũi tên [←] và [→] để chuyển slide</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === slides.length - 1}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-30 text-white font-black text-xs flex items-center gap-1 transition-all shadow-md cursor-pointer"
              >
                <span>Kế tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
