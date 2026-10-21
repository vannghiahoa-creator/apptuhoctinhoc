import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Plus,
  Trash2,
  Palette,
  Compass,
  Star,
  CheckCircle2
} from 'lucide-react';
import { GradeLevel } from '../types';
import { playClickPop, playHintDing, playVictoryFanfare } from '../utils/audio';

interface AlgorithmicTurtleArtProps {
  grade: GradeLevel;
  onRewardStar: () => void;
}

interface TurtleCommand {
  id: string;
  type: 'forward' | 'turnRight' | 'turnLeft' | 'setColor' | 'repeat';
  value: number | string;
  label: string;
  color?: string;
}

export const AlgorithmicTurtleArt: React.FC<AlgorithmicTurtleArtProps> = ({
  grade,
  onRewardStar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [commands, setCommands] = useState<TurtleCommand[]>([
    { id: '1', type: 'repeat', value: 4, label: 'Lặp lại 4 lần 🔄' },
    { id: '2', type: 'forward', value: 90, label: 'Tiến 90 bước ⬆️' },
    { id: '3', type: 'turnRight', value: 90, label: 'Xoay phải 90° ↷' },
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0284c7');
  const [hasCompleted, setHasCompleted] = useState(false);

  // Preset patterns
  const handleSelectPreset = (presetName: string) => {
    playClickPop();
    setHasCompleted(false);

    if (presetName === 'square') {
      setPenColor('#0284c7');
      setCommands([
        { id: 'p1', type: 'repeat', value: 4, label: 'Lặp lại 4 lần 🔄' },
        { id: 'p2', type: 'forward', value: 90, label: 'Tiến 90 bước ⬆️' },
        { id: 'p3', type: 'turnRight', value: 90, label: 'Xoay phải 90° ↷' },
      ]);
    } else if (presetName === 'star') {
      setPenColor('#f59e0b');
      setCommands([
        { id: 'p1', type: 'repeat', value: 5, label: 'Lặp lại 5 lần 🔄' },
        { id: 'p2', type: 'forward', value: 120, label: 'Tiến 120 bước ⬆️' },
        { id: 'p3', type: 'turnRight', value: 144, label: 'Xoay phải 144° ↷' },
      ]);
    } else if (presetName === 'flower') {
      setPenColor('#ec4899');
      setCommands([
        { id: 'p1', type: 'repeat', value: 6, label: 'Lặp lại 6 lần 🔄' },
        { id: 'p2', type: 'forward', value: 80, label: 'Tiến 80 bước ⬆️' },
        { id: 'p3', type: 'turnRight', value: 60, label: 'Xoay phải 60° ↷' },
      ]);
    } else if (presetName === 'spiral') {
      setPenColor('#8b5cf6');
      setCommands([
        { id: 'p1', type: 'repeat', value: 24, label: 'Lặp lại 24 lần 🔄' },
        { id: 'p2', type: 'forward', value: 50, label: 'Tiến 50 bước ⬆️' },
        { id: 'p3', type: 'turnRight', value: 75, label: 'Xoay phải 75° ↷' },
      ]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw coordinate center guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    clearCanvas();
  }, []);

  const handleRunAlgorithm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isDrawing) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas();
    setIsDrawing(true);
    setHasCompleted(false);
    playHintDing();

    // Start at center
    let x = canvas.width / 2;
    let y = canvas.height / 2;
    let angle = -Math.PI / 2; // facing up

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    // Parse repeat blocks
    let repeatCount = 1;
    const innerCommands: TurtleCommand[] = [];

    commands.forEach((cmd) => {
      if (cmd.type === 'repeat') {
        repeatCount = Number(cmd.value) || 1;
      } else {
        innerCommands.push(cmd);
      }
    });

    for (let r = 0; r < repeatCount; r++) {
      for (const cmd of innerCommands) {
        if (cmd.type === 'forward') {
          const step = Number(cmd.value) || 50;
          const targetX = x + step * Math.cos(angle);
          const targetY = y + step * Math.sin(angle);

          // Animate line
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          x = targetX;
          y = targetY;
          await new Promise((resolve) => setTimeout(resolve, 80));
        } else if (cmd.type === 'turnRight') {
          const deg = Number(cmd.value) || 90;
          angle += (deg * Math.PI) / 180;
        } else if (cmd.type === 'turnLeft') {
          const deg = Number(cmd.value) || 90;
          angle -= (deg * Math.PI) / 180;
        }
      }
    }

    setIsDrawing(false);
    setHasCompleted(true);
    playVictoryFanfare();
    onRewardStar();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    playClickPop();
    const link = document.createElement('a');
    link.download = `NUTA_Hoa_Si_Nhi_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-3 sm:p-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
            🎨
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              Họa Sĩ Nhí Thuật Toán (Algorithmic Turtle Art)
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                {grade}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Ghép khối lệnh góc quay và độ dài bước đi để Robot NUTA vẽ nên các hoa văn hình học kỳ ảo!
            </p>
          </div>
        </div>

        {/* Preset pattern buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Mẫu vẽ sẵn:</span>
          {[
            { id: 'square', label: 'Hình vuông 🟩' },
            { id: 'star', label: 'Ngôi sao ⭐' },
            { id: 'flower', label: 'Hoa 6 cánh 🌸' },
            { id: 'spiral', label: 'Vòng xoáy 🌀' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 font-bold text-xs text-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto">
        {/* Left: Command Block Sequence */}
        <div className="md:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-4 h-4 text-indigo-600" /> Chuỗi câu lệnh thuật toán:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-500">Màu nét:</span>
              {['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    penColor === c ? 'scale-125 ring-2 ring-slate-800' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {commands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <span>{cmd.label}</span>
                </div>
                <button
                  onClick={() => {
                    playClickPop();
                    setCommands(commands.filter((c) => c.id !== cmd.id));
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                  title="Xóa lệnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick command buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block">Thêm câu lệnh mới:</span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                onClick={() => {
                  playClickPop();
                  setCommands([
                    ...commands,
                    { id: `c-${Date.now()}`, type: 'forward', value: 60, label: 'Tiến 60 bước ⬆️' },
                  ]);
                }}
                className="p-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 font-bold transition-colors cursor-pointer text-left"
              >
                + Tiến 60 bước
              </button>
              <button
                onClick={() => {
                  playClickPop();
                  setCommands([
                    ...commands,
                    { id: `c-${Date.now()}`, type: 'turnRight', value: 90, label: 'Xoay phải 90° ↷' },
                  ]);
                }}
                className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 font-bold transition-colors cursor-pointer text-left"
              >
                + Xoay phải 90°
              </button>
              <button
                onClick={() => {
                  playClickPop();
                  setCommands([
                    ...commands,
                    { id: `c-${Date.now()}`, type: 'turnRight', value: 144, label: 'Xoay phải 144° ↷' },
                  ]);
                }}
                className="p-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold transition-colors cursor-pointer text-left"
              >
                + Xoay sao 144°
              </button>
              <button
                onClick={() => {
                  playClickPop();
                  setCommands([
                    ...commands,
                    { id: `c-${Date.now()}`, type: 'repeat', value: 8, label: 'Lặp lại 8 lần 🔄' },
                  ]);
                }}
                className="p-2 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-800 font-bold transition-colors cursor-pointer text-left"
              >
                + Lặp lại 8 lần
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleRunAlgorithm}
              disabled={isDrawing || commands.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isDrawing ? 'Đang vẽ...' : 'Chạy thuật toán'}</span>
            </button>

            <button
              onClick={() => {
                playClickPop();
                clearCanvas();
                setHasCompleted(false);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
              title="Xóa bảng vẽ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Drawing Canvas */}
        <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 p-3 relative">
          <canvas
            ref={canvasRef}
            width={380}
            height={320}
            className="bg-white rounded-xl shadow-inner border border-slate-200 max-w-full"
          />

          {hasCompleted && (
            <div className="mt-2.5 flex items-center justify-between w-full max-w-[380px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tuyệt vời! +1 ⭐ ngôi sao sáng tạo!</span>
              </span>
              <button
                onClick={handleDownloadImage}
                className="text-emerald-700 hover:text-emerald-900 underline font-black cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Lưu ảnh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
