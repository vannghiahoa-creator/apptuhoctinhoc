import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Bug,
  HelpCircle,
  Sparkles,
  CheckCircle,
  Lightbulb,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { GradeLevel, ScratchBlock, ScratchChallenge } from '../types';
import {
  playClickPop,
  playHintDing,
  playRobotBeep,
  playVictoryFanfare,
} from '../utils/audio';

interface ScratchPlaygroundProps {
  grade: GradeLevel;
  onAskNuta: (prompt: string) => void;
  onRewardStar: () => void;
}

const AVAILABLE_PALETTE_BLOCKS: ScratchBlock[] = [
  { id: 'b-flag', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { id: 'b-move-10', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 hover:bg-blue-600 text-white', value: 10 },
  { id: 'b-move-20', type: 'motion', text: 'Di chuyển 20 bước', color: 'bg-blue-500 hover:bg-blue-600 text-white', value: 20 },
  { id: 'b-bounce', type: 'motion', text: 'Bật lại nếu chạm cạnh', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { id: 'b-turn-15', type: 'motion', text: 'Xoay phải 15 độ ↷', color: 'bg-blue-500 hover:bg-blue-600 text-white', value: 15 },
  { id: 'b-repeat-10', type: 'control', text: 'Lặp lại 10 lần', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { id: 'b-forever', type: 'control', text: 'Lặp lại mãi mãi 🔄', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  { id: 'b-say-hello', type: 'looks', text: 'Nói "Xin chào!" trong 2 giây 💬', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { id: 'b-next-costume', type: 'looks', text: 'Đổi sang trang phục kế tiếp 🐾', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
];

const CURATED_CHALLENGES: ScratchChallenge[] = [
  {
    id: 'c1',
    title: 'Thử thách 1: Cứu chú Mèo mất tích!',
    grade: 'Lớp 3',
    goal: 'Làm sao để chú mèo đi tuần tra từ trái sang phải rồi tự bật lại khi chạm vào mép?',
    bugDescription: 'Hiện tại chú mèo chạy một mạch sang mép phải rồi biến mất khỏi màn hình!',
    correctBlocks: ['b-flag', 'b-forever', 'b-move-10', 'b-bounce'],
    hint: 'Bạn hãy tìm khối lệnh màu xanh lam giúp nhân vật biết "quay đầu" mỗi khi chạm vào bờ tường nhé!',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 text-white' },
      { id: '2', type: 'control', text: 'Lặp lại mãi mãi 🔄', color: 'bg-amber-600 text-white' },
      { id: '3', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 text-white', value: 10 },
      // Lỗi: Thiếu khối "Bật lại nếu chạm cạnh"
    ],
  },
  {
    id: 'c2',
    title: 'Thử thách 2: Chú Mèo bị lộn ngược đầu!',
    grade: 'Lớp 4',
    goal: 'Giúp chú mèo quay mặt sang trái một cách tự nhiên mà không bị trồng cây chuối!',
    bugDescription: 'Khi bật lại ở bờ tường, chú mèo bị chúc ngược đầu xuống đất!',
    correctBlocks: ['b-flag', 'b-forever', 'b-move-10', 'b-bounce', 'b-next-costume'],
    hint: 'Hãy quan sát xem nhân vật đang xoay theo kiểu vòng tròn hay chỉ nhìn sang trái - sang phải?',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 text-white' },
      { id: '2', type: 'motion', text: 'Xoay phải 15 độ ↷', color: 'bg-blue-500 text-white', value: 15 },
      { id: '3', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 text-white', value: 10 },
      { id: '4', type: 'motion', text: 'Bật lại nếu chạm cạnh', color: 'bg-blue-500 text-white' },
    ],
  },
  {
    id: 'c3',
    title: 'Thử thách 3: Khối lệnh bị lạc khỏi vòng lặp!',
    grade: 'Lớp 5',
    goal: 'Tạo hoạt hình chú mèo vừa đi vừa nói lời chào và đổi bước chân liên tục.',
    bugDescription: 'Mèo chỉ bước được đúng 1 bước chân rồi đứng im thin thít!',
    correctBlocks: ['b-flag', 'b-forever', 'b-move-10', 'b-next-costume', 'b-bounce'],
    hint: 'Hãy kiểm tra thứ tự: khối di chuyển đang nằm bên trong hay bên ngoài khối lặp?',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 text-white' },
      { id: '2', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 text-white', value: 10 },
      { id: '3', type: 'control', text: 'Lặp lại mãi mãi 🔄', color: 'bg-amber-600 text-white' },
      { id: '4', type: 'looks', text: 'Nói "Xin chào!" trong 2 giây 💬', color: 'bg-purple-600 text-white' },
    ],
  },
  {
    id: 'c4',
    title: 'Thử thách 4: Phím cách nhảy múa!',
    grade: 'Lớp 3',
    goal: 'Khi người chơi bấm lá cờ, chú mèo cất tiếng chào và đổi bước chân nhịp nhàng.',
    bugDescription: 'Thiếu khối sự kiện bắt đầu khiến mèo đứng im không cử động!',
    correctBlocks: ['b-flag', 'b-next-costume', 'b-say-hello'],
    hint: 'Em hãy tìm khối lệnh màu cam "Khi bấm vào Lá cờ xanh" đặt lên đầu tiên nhé!',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'looks', text: 'Nói "Xin chào!" trong 2 giây 💬', color: 'bg-purple-600 text-white' },
      { id: '2', type: 'looks', text: 'Đổi sang trang phục kế tiếp 🐾', color: 'bg-purple-600 text-white' },
    ],
  },
  {
    id: 'c5',
    title: 'Thử thách 5: Đổi trang phục bước chân nhịp nhàng!',
    grade: 'Lớp 4',
    goal: 'Mỗi khi di chuyển 10 bước, chú mèo phải đổi trang phục để giống như đang đi bộ thật.',
    bugDescription: 'Mèo lướt đi như bay trên mặt băng mà không hề co duỗi chân!',
    correctBlocks: ['b-flag', 'b-forever', 'b-move-10', 'b-next-costume', 'b-bounce'],
    hint: 'Hãy lồng khối đổi trang phục vào bên trong khối lặp mãi mãi!',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 text-white' },
      { id: '2', type: 'control', text: 'Lặp lại mãi mãi 🔄', color: 'bg-amber-600 text-white' },
      { id: '3', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 text-white', value: 10 },
      { id: '4', type: 'motion', text: 'Bật lại nếu chạm cạnh', color: 'bg-blue-500 text-white' },
    ],
  },
  {
    id: 'c6',
    title: 'Thử thách 6: Vòng tuần tra siêu tốc!',
    grade: 'Lớp 5',
    goal: 'Lập trình mèo đi tuần tra với tốc độ 20 bước, khi chạm mép thì bật lại và đổi trang phục.',
    bugDescription: 'Mèo chạy quá chậm và chạm mép thì dừng lại hẳn!',
    correctBlocks: ['b-flag', 'b-forever', 'b-move-20', 'b-bounce', 'b-next-costume'],
    hint: 'Hãy thay khối di chuyển 10 bước bằng khối di chuyển 20 bước và thêm khối bật lại!',
    sampleBlocks: [],
    initialActiveBlocks: [
      { id: '1', type: 'event', text: 'Khi bấm vào 🟩 Lá cờ xanh', color: 'bg-amber-500 text-white' },
      { id: '2', type: 'motion', text: 'Di chuyển 10 bước', color: 'bg-blue-500 text-white', value: 10 },
    ],
  },
];

export const ScratchPlayground: React.FC<ScratchPlaygroundProps> = ({
  grade,
  onAskNuta,
  onRewardStar,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<ScratchChallenge>(CURATED_CHALLENGES[0]);
  const [activeBlocks, setActiveBlocks] = useState<ScratchBlock[]>(CURATED_CHALLENGES[0].initialActiveBlocks);
  const [isRunning, setIsRunning] = useState(false);
  const [catPos, setCatPos] = useState({ x: 0, y: 0, direction: 1, speech: '' });
  const [costumeToggle, setCostumeToggle] = useState(false);
  const [hasSolved, setHasSolved] = useState(false);
  const [stageMessage, setStageMessage] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);

  // Switch challenge
  const handleSelectChallenge = (c: ScratchChallenge) => {
    playClickPop();
    setSelectedChallenge(c);
    setActiveBlocks([...c.initialActiveBlocks]);
    setIsRunning(false);
    setHasSolved(false);
    setCatPos({ x: 0, y: 0, direction: 1, speech: '' });
    setStageMessage(null);
  };

  // Add block to script
  const handleAddBlock = (block: ScratchBlock) => {
    playClickPop();
    const newBlock: ScratchBlock = {
      ...block,
      id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setActiveBlocks((prev) => [...prev, newBlock]);
  };

  // Remove block
  const handleRemoveBlock = (id: string) => {
    playClickPop();
    setActiveBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    playClickPop();
    setActiveBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index >= activeBlocks.length - 1) return;
    playClickPop();
    setActiveBlocks((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Reset stage
  const handleReset = () => {
    playClickPop();
    setIsRunning(false);
    setCatPos({ x: 0, y: 0, direction: 1, speech: '' });
    setStageMessage(null);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  // Execute green flag
  const handleRun = () => {
    playClickPop();
    setIsRunning(true);
    setStageMessage('Đang thực thi khối lệnh...');

    // Check if bounce block exists
    const hasBounce = activeBlocks.some((b) => b.text.includes('Bật lại nếu chạm cạnh'));
    const hasMove = activeBlocks.some((b) => b.text.includes('Di chuyển'));
    const hasForever = activeBlocks.some((b) => b.text.includes('Lặp lại mãi mãi'));
    const hasSay = activeBlocks.some((b) => b.text.includes('Nói'));

    if (hasSay) {
      setCatPos((p) => ({ ...p, speech: 'Xin chào các bạn nhỏ! Meo meo!' }));
      setTimeout(() => {
        setCatPos((p) => ({ ...p, speech: '' }));
      }, 2500);
    }

    let currentX = catPos.x;
    let currentDir = catPos.direction;
    let stepCount = 0;

    const loop = () => {
      if (!hasMove) {
        setStageMessage('Chú mèo đứng yên vì chưa có khối lệnh "Di chuyển"!');
        return;
      }

      // If no forever loop and already stepped 10 times, stop
      if (!hasForever && stepCount >= 10) {
        setStageMessage('Khối lệnh đã hoàn tất! Chú mèo dừng lại.');
        setIsRunning(false);
        return;
      }

      currentX += currentDir * 3.5;
      stepCount++;

      // Stage boundaries: -160 to +160
      if (currentX > 160) {
        if (hasBounce) {
          currentDir = -1;
          currentX = 160;
          playRobotBeep();
        } else {
          // BUG: Cat disappears off screen!
          currentX = 220;
          setStageMessage('⚠️ Ôi không! Chú mèo đã đi xuyên tường biến mất rồi!');
          setIsRunning(false);
          setCatPos({ x: currentX, y: 0, direction: currentDir, speech: 'Cứu tớ với!' });
          return;
        }
      } else if (currentX < -160) {
        if (hasBounce) {
          currentDir = 1;
          currentX = -160;
          playRobotBeep();
        } else {
          currentX = -220;
          setStageMessage('⚠️ Chú mèo đã rơi ra ngoài sân khấu bên trái!');
          setIsRunning(false);
          return;
        }
      }

      setCatPos((prev) => ({
        ...prev,
        x: currentX,
        direction: currentDir,
      }));
      setCostumeToggle((prev) => !prev);

      animationRef.current = requestAnimationFrame(loop);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(loop);
  };

  const handleStop = () => {
    playClickPop();
    setIsRunning(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setStageMessage('Đã dừng kịch bản.');
  };

  // Verify solution
  const handleVerifySolution = () => {
    const hasFlag = activeBlocks.some((b) => b.text.includes('Lá cờ xanh'));
    const hasMove = activeBlocks.some((b) => b.text.includes('Di chuyển'));
    const hasBounce = activeBlocks.some((b) => b.text.includes('Bật lại nếu chạm cạnh'));
    const hasForever = activeBlocks.some((b) => b.text.includes('Lặp lại mãi mãi'));

    if (selectedChallenge.id === 'c1') {
      if (hasFlag && hasMove && hasBounce && hasForever) {
        setHasSolved(true);
        playVictoryFanfare();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        onRewardStar();
        setStageMessage('🎉 TUYỆT VỜI! Bạn đã gỡ lỗi thành công! Mèo bật lại nhịp nhàng!');
      } else {
        playHintDing();
        setStageMessage('Gần đúng rồi! Hãy kiểm tra xem khối "Bật lại nếu chạm cạnh" đã có chưa nhé!');
      }
    } else {
      // General check
      if (hasFlag && hasMove && hasBounce) {
        setHasSolved(true);
        playVictoryFanfare();
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        onRewardStar();
        setStageMessage('🎉 XUẤT SẮC! Thuật toán của bạn hoạt động rất thông minh!');
      } else {
        playHintDing();
        setStageMessage('Hãy cùng xem xét kỹ các khối lệnh và thử hỏi Robot NUTA nhé!');
      }
    }
  };

  // Send current problem to NUTA Socratic Chat
  const handleAskNutaCurrentBug = () => {
    playClickPop();
    const blockNames = activeBlocks.map((b) => b.text).join(' → ');
    const prompt = `Tớ đang làm ${selectedChallenge.title} (${selectedChallenge.grade}). ${selectedChallenge.bugDescription}. Các khối lệnh hiện tại của tớ là: [${blockNames}]. NUTA hãy gợi ý giúp tớ phát hiện lỗi sai ở đâu nhé!`;
    onAskNuta(prompt);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Challenge Selector Top Banner */}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl font-bold">
              <Bug className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                Xưởng Gỡ Lỗi Scratch Tiểu Học
              </h3>
              <p className="text-xs text-slate-500">
                Thực hành tư duy logic: <span className="font-bold text-sky-600">Phát hiện lỗi & Đổi mới khối lệnh</span>
              </p>
            </div>
          </div>

          {/* Ask NUTA Socratic button */}
          <button
            onClick={handleAskNutaCurrentBug}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-sm hover:from-sky-600 hover:to-indigo-700 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Hỏi Robot NUTA gợi ý lỗi</span>
          </button>
        </div>

        {/* Challenge Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CURATED_CHALLENGES.map((c) => {
            const isSelected = selectedChallenge.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectChallenge(c)}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase text-amber-700">
                    {c.grade}
                  </span>
                  {hasSolved && isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Đã sửa!
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-xs text-slate-800 truncate">
                  {c.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace: 3 Columns (Block Palette, Script Area, Live Stage) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-y-auto">
        {/* Column 1: Block Palette (4 cols) */}
        <div className="lg:col-span-3 bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Khối lệnh Scratch
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
              Bấm để thêm
            </span>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {AVAILABLE_PALETTE_BLOCKS.map((block) => (
              <button
                key={block.id}
                onClick={() => handleAddBlock(block)}
                className={`w-full text-left p-2.5 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-between group active:scale-98 ${block.color}`}
              >
                <span className="truncate">{block.text}</span>
                <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 ml-1" />
              </button>
            ))}
          </div>
          <div className="mt-2 p-2 bg-sky-50 rounded-lg border border-sky-200 text-[11px] text-sky-800 font-medium">
            💡 <span className="font-bold">Mẹo:</span> Ghép khối lệnh theo thứ tự từ trên xuống dưới!
          </div>
        </div>

        {/* Column 2: Script Construction Workspace (5 cols) */}
        <div className="lg:col-span-5 bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <div>
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Kịch bản của bạn ({activeBlocks.length} khối)
              </span>
            </div>
            <button
              onClick={() => {
                playClickPop();
                setActiveBlocks([...selectedChallenge.initialActiveBlocks]);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold"
            >
              <RotateCcw className="w-3 h-3" /> Đặt lại mẫu
            </button>
          </div>

          {/* Challenge Bug Banner */}
          <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <div className="font-black flex items-center gap-1 text-rose-700 mb-0.5">
              <Bug className="w-3.5 h-3.5" /> Mô tả lỗi cần sửa:
            </div>
            <div className="font-semibold">{selectedChallenge.bugDescription}</div>
          </div>

          {/* Blocks List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto bg-slate-50 p-2 rounded-xl border border-dashed border-slate-300 min-h-[220px]">
            {activeBlocks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                <span>Chưa có khối lệnh nào. Hãy bấm khối lệnh bên trái để thêm vào kịch bản!</span>
              </div>
            ) : (
              activeBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={`p-2.5 rounded-lg font-bold text-xs shadow-xs flex items-center justify-between gap-1 transition-all ${block.color}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-4 h-4 rounded-full bg-black/20 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="truncate">{block.text}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 hover:bg-black/20 rounded disabled:opacity-20 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === activeBlocks.length - 1}
                      className="p-1 hover:bg-black/20 rounded disabled:opacity-20 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1 hover:bg-rose-500/80 rounded cursor-pointer"
                      title="Xóa khối lệnh này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Action buttons under script */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleVerifySolution}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Kiểm tra lời giải</span>
            </button>
          </div>
        </div>

        {/* Column 3: Live Scratch Stage (4 cols) */}
        <div className="lg:col-span-4 bg-white p-3 rounded-xl border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Sân khấu Scratch
            </span>

            {/* Run / Stop Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                title="Bấm vào lá cờ xanh để chạy"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chạy</span>
              </button>
              <button
                onClick={handleStop}
                disabled={!isRunning}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer"
                title="Dừng kịch bản"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                title="Đặt lại sân khấu về vị trí ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stage Canvas Area */}
          <div className="relative flex-1 bg-gradient-to-b from-sky-100 to-emerald-50 border-2 border-slate-300 rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center">
            {/* Stage Grid/Horizon background lines */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute bottom-6 left-0 right-0 h-1 bg-emerald-300/60"></div>

            {/* Coordinates Badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-full">
              x: {Math.round(catPos.x)} | y: {Math.round(catPos.y)}
            </div>

            {/* Speech bubble above sprite */}
            {catPos.speech && (
              <div
                style={{
                  transform: `translate(${catPos.x}px, -45px)`,
                }}
                className="absolute z-20 bg-white border border-slate-300 shadow-md text-[11px] font-bold text-slate-800 px-2.5 py-1 rounded-xl whitespace-nowrap"
              >
                {catPos.speech}
                <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-slate-300 rotate-45"></div>
              </div>
            )}

            {/* Cat Sprite */}
            <div
              style={{
                transform: `translateX(${catPos.x}px) scaleX(${catPos.direction})`,
                transition: isRunning ? 'none' : 'transform 0.3s ease',
              }}
              className="relative w-16 h-16 cursor-pointer select-none"
              onClick={() => {
                playRobotBeep();
                setCatPos((p) => ({ ...p, speech: 'Meo meo!' }));
                setTimeout(() => setCatPos((p) => ({ ...p, speech: '' })), 1500);
              }}
            >
              {/* Cute Cat SVG Sprite */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                {/* Cat ears */}
                <polygon points="25,45 35,15 50,35" fill="#F97316" stroke="#C2410C" strokeWidth="3" />
                <polygon points="30,40 37,22 47,34" fill="#FDBA74" />
                <polygon points="75,45 65,15 50,35" fill="#F97316" stroke="#C2410C" strokeWidth="3" />
                <polygon points="70,40 63,22 53,34" fill="#FDBA74" />

                {/* Head */}
                <circle cx="50" cy="50" r="30" fill="#FB923C" stroke="#C2410C" strokeWidth="3" />

                {/* Eyes */}
                <ellipse cx="40" cy="45" rx="5" ry="6" fill="#1E293B" />
                <circle cx="38" cy="43" r="1.5" fill="#FFFFFF" />
                <ellipse cx="60" cy="45" rx="5" ry="6" fill="#1E293B" />
                <circle cx="58" cy="43" r="1.5" fill="#FFFFFF" />

                {/* Nose & Mouth */}
                <polygon points="48,54 52,54 50,57" fill="#F43F5E" />
                <path d="M 44 58 Q 50 63 56 58" fill="none" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />

                {/* Whiskers */}
                <line x1="22" y1="52" x2="35" y2="52" stroke="#475569" strokeWidth="2" />
                <line x1="24" y1="58" x2="35" y2="56" stroke="#475569" strokeWidth="2" />
                <line x1="78" y1="52" x2="65" y2="52" stroke="#475569" strokeWidth="2" />
                <line x1="76" y1="58" x2="65" y2="56" stroke="#475569" strokeWidth="2" />

                {/* Feet moving toggle */}
                <ellipse
                  cx={costumeToggle ? "42" : "38"}
                  cy="84"
                  rx="7"
                  ry="5"
                  fill="#F97316"
                  stroke="#C2410C"
                  strokeWidth="2"
                />
                <ellipse
                  cx={costumeToggle ? "62" : "58"}
                  cy="84"
                  rx="7"
                  ry="5"
                  fill="#F97316"
                  stroke="#C2410C"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Stage Status / Debugger Feedback Message */}
          {stageMessage && (
            <div
              className={`mt-2 p-2 rounded-xl text-xs font-bold ${
                stageMessage.includes('TUYỆT VỜI') || stageMessage.includes('XUẤT SẮC')
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : stageMessage.includes('⚠️')
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}
            >
              {stageMessage}
            </div>
          )}

          {/* Socratic Hint Callout */}
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-amber-800">Gợi ý từ NUTA: </span>
              <span>{selectedChallenge.hint}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
