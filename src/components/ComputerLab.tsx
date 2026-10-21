import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Monitor,
  Cpu,
  Mouse,
  Keyboard,
  Volume2,
  Folder,
  FileText,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Trophy,
  Star,
  RotateCcw,
  Palette
} from 'lucide-react';
import { GradeLevel, HardwarePart, TeacherMetadata } from '../types';
import {
  playClickPop,
  playHintDing,
  playRobotBeep,
  playVictoryFanfare,
} from '../utils/audio';
import { AlgorithmicTurtleArt } from './AlgorithmicTurtleArt';

interface ComputerLabProps {
  grade: GradeLevel;
  onAskNuta: (prompt: string) => void;
  onRecordAssessment: (meta: TeacherMetadata, topic: string) => void;
  onRewardStar: () => void;
}

const HARDWARE_PARTS: HardwarePart[] = [
  {
    id: 'cpu',
    name: 'Thân máy (Bộ xử lý trung tâm)',
    icon: '🖥️',
    role: 'Là "bộ não" của máy tính, chứa bộ vi xử lý (CPU) giúp tính toán và điều khiển mọi hoạt động.',
    tip: 'Bấm nút Power hình tròn để bật máy tính. Tuyệt đối không tự ý rút dây nguồn khi máy đang chạy!',
    funFact: 'CPU có thể thực hiện hàng tỷ phép tính chỉ trong vòng 1 giây chớp mắt!',
  },
  {
    id: 'monitor',
    name: 'Màn hình máy tính',
    icon: '💻',
    role: 'Là thiết bị xuất, giúp hiển thị hình ảnh, bài học, tranh vẽ và kết quả làm việc của bạn.',
    tip: 'Nên ngồi cách màn hình từ 50-70cm (khoảng 1 cánh tay) để bảo vệ đôi mắt luôn sáng khỏe.',
    funFact: 'Màn hình ngày nay hiển thị hàng triệu điểm ảnh nhỏ xíu ghép lại thành bức tranh sống động.',
  },
  {
    id: 'keyboard',
    name: 'Bàn phím máy tính',
    icon: '⌨️',
    role: 'Là thiết bị nhập chữ cái, con số và câu lệnh để ra lệnh cho máy tính thực hiện.',
    tip: 'Hai phím F và J có gờ nổi đặc biệt để đặt hai ngón trỏ vào vị trí chuẩn!',
    funFact: 'Hàng phím ở giữa chứa các chữ A, S, D, F, G, H, J, K, L được gọi là Hàng phím cơ sở.',
  },
  {
    id: 'mouse',
    name: 'Chuột máy tính',
    icon: '🖱️',
    role: 'Giúp điều khiển con trỏ trên màn hình: nháy chuột trái để chọn, nháy đúp để mở và lăn bánh xe để cuộn trang.',
    tip: 'Đặt lòng bàn tay ôm nhẹ lấy lưng chuột, ngón trỏ đặt lên nút chuột trái, ngón giữa đặt lên nút chuột phải.',
    funFact: 'Chú chuột máy tính đầu tiên trên thế giới được làm bằng... một khối gỗ!',
  },
];

// 5 Typing practice levels
const TYPING_LEVELS = [
  {
    id: 1,
    title: 'Cấp 1: Hai phím cơ sở F & J',
    desc: 'Luyện 2 ngón trỏ định vị gờ nổi',
    sequence: ['F', 'J', 'F', 'J', 'F', 'F', 'J', 'J', 'F', 'J'],
    fingerTips: {
      F: '👉 Ngón trỏ tay trái đặt lên phím F',
      J: '👈 Ngón trỏ tay phải đặt lên phím J',
    },
  },
  {
    id: 2,
    title: 'Cấp 2: Toàn bộ Hàng phím cơ sở',
    desc: 'Các phím A, S, D, F, G, H, J, K, L',
    sequence: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'S', 'K', 'D', 'J'],
    fingerTips: {
      A: '🖐️ Ngón út trái',
      S: '🖐️ Ngón áp út trái',
      D: '🖐️ Ngón giữa trái',
      F: '👉 Ngón trỏ trái',
      G: '👉 Ngón trỏ trái vươn sang G',
      H: '👈 Ngón trỏ phải vươn sang H',
      J: '👈 Ngón trỏ phải',
      K: '🖐️ Ngón giữa phải',
      L: '🖐️ Ngón áp út phải',
    },
  },
  {
    id: 3,
    title: 'Cấp 3: Hàng phím trên',
    desc: 'Các phím Q, W, E, R, T, Y, U, I, O, P',
    sequence: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    fingerTips: {},
  },
  {
    id: 4,
    title: 'Cấp 4: Hàng phím dưới',
    desc: 'Các phím Z, X, C, V, B, N, M',
    sequence: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
    fingerTips: {},
  },
  {
    id: 5,
    title: 'Cấp 5: Từ vựng Tin học',
    desc: 'Gõ nhanh các thuật ngữ máy tính',
    sequence: ['S', 'C', 'R', 'A', 'T', 'C', 'H', 'R', 'O', 'B', 'O', 'T'],
    fingerTips: {},
  },
];

export const ComputerLab: React.FC<ComputerLabProps> = ({
  grade,
  onAskNuta,
  onRecordAssessment,
  onRewardStar,
}) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'typing' | 'fileExplorer' | 'art'>('hardware');
  const [selectedPart, setSelectedPart] = useState<HardwarePart>(HARDWARE_PARTS[0]);

  // Typing practice state
  const [currentLevel, setCurrentLevel] = useState(1);
  const activeLevelData = TYPING_LEVELS.find((l) => l.id === currentLevel) || TYPING_LEVELS[0];
  const typingSequence = activeLevelData.sequence;
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingScore, setTypingScore] = useState(0);
  const [typingFeedback, setTypingFeedback] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // File sorting game state
  const [filesToOrganize, setFilesToOrganize] = useState([
    { id: 'f1', name: 'Bai_van_ta_chu_cho.docx', type: 'doc', targetFolder: 'docs' },
    { id: 'f2', name: 'Tranh_ve_ngoi_nha.png', type: 'image', targetFolder: 'images' },
    { id: 'f3', name: 'Bai_hat_chu_meo_con.mp3', type: 'audio', targetFolder: 'audio' },
    { id: 'f4', name: 'Bang_diem_toan.xlsx', type: 'doc', targetFolder: 'docs' },
  ]);
  const [sortedCount, setSortedCount] = useState(0);

  // Listen to physical keyboard events in typing mode
  useEffect(() => {
    if (activeTab !== 'typing') return;

    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // Ignore function keys, ctrl, alt, tab
      if (e.key.length > 1) return;
      const key = e.key.toUpperCase();
      handleKeyPress(key);
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [activeTab, typingIndex, typingSequence]);

  const handleKeyPress = (char: string) => {
    playClickPop();
    setTotalAttempts((prev) => prev + 1);
    const targetChar = typingSequence[typingIndex];

    if (char === targetChar) {
      playHintDing();
      setTypingScore((s) => s + 10);
      setCorrectCount((prev) => prev + 1);
      setTypingFeedback(`Chính xác! Bạn gõ đúng phím ${char} bằng ngón tay chuẩn! 🎯`);

      if (typingIndex + 1 >= typingSequence.length) {
        setTypingIndex(0);
        playVictoryFanfare();
        confetti({ particleCount: 50, spread: 60 });
        onRewardStar();
        onRecordAssessment(
          {
            skill_assessed: 'Thao tác máy tính',
            hint_level: 1,
            student_state: 'Hoàn thành',
            teacher_note: `Học sinh hoàn thành xuất sắc bài luyện gõ phím: ${activeLevelData.title}.`,
          },
          'Thao tác máy tính'
        );
      } else {
        setTypingIndex((prev) => prev + 1);
      }
    } else {
      playRobotBeep();
      setTypingFeedback(`Chưa đúng rồi! Hãy tìm phím "${targetChar}" trên bàn phím nhé!`);
    }
  };

  const handleSortFile = (fileId: string, folderType: string) => {
    playClickPop();
    const file = filesToOrganize.find((f) => f.id === fileId);
    if (!file) return;

    if (file.targetFolder === folderType) {
      playHintDing();
      setFilesToOrganize((prev) => prev.filter((f) => f.id !== fileId));
      setSortedCount((c) => c + 1);

      if (filesToOrganize.length === 1) {
        playVictoryFanfare();
        confetti({ particleCount: 60, spread: 70 });
        onRewardStar();
        onRecordAssessment(
          {
            skill_assessed: 'Thao tác máy tính',
            hint_level: 1,
            student_state: 'Hoàn thành',
            teacher_note: 'Học sinh nắm vững cách phân loại tệp tin và tổ chức thư mục học tập.',
          },
          'Thao tác máy tính'
        );
      }
    } else {
      playRobotBeep();
      alert('Thư mục này chưa phù hợp với loại tệp này. Bạn hãy thử lại nhé!');
    }
  };

  const handleAskNutaAboutHardware = () => {
    onAskNuta(`NUTA ơi, hãy giải thích cho tớ hiểu rõ hơn về chức năng của ${selectedPart.name} và cách sử dụng an toàn nhé!`);
  };

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold">
              <Monitor className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                Vườn Ươm Thao Tác Máy Tính
              </h3>
              <p className="text-xs text-slate-500">
                Thực hành: <span className="font-bold text-indigo-600">Phần cứng máy tính, Gõ 10 ngón, Sắp xếp tệp & Họa sĩ thuật toán</span>
              </p>
            </div>
          </div>

          {/* Socratic Bridge button */}
          <button
            onClick={handleAskNutaAboutHardware}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-xs hover:from-sky-600 hover:to-indigo-700 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hỏi NUTA về bài học này</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'hardware' as const, label: '1. Khám phá Phần cứng', icon: '🖥️' },
            { id: 'typing' as const, label: '2. Luyện gõ 10 ngón Pro', icon: '⌨️' },
            { id: 'fileExplorer' as const, label: '3. Phân loại Thư mục', icon: '📁' },
            { id: 'art' as const, label: '4. Họa Sĩ Thuật Toán', icon: '🎨' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClickPop();
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* TAB 1: Hardware Explorer */}
        {activeTab === 'hardware' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-5xl mx-auto">
            {/* Parts list */}
            <div className="md:col-span-5 space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Các bộ phận cơ bản của máy tính:
              </span>
              {HARDWARE_PARTS.map((part) => {
                const isSelected = selectedPart.id === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      playClickPop();
                      setSelectedPart(part);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-3xl p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                      {part.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-sm text-slate-900 truncate">
                        {part.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        Bấm để xem chi tiết
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Part Detail Card */}
            <div className="md:col-span-7 bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-indigo-100">
                <span className="text-4xl p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                  {selectedPart.icon}
                </span>
                <div>
                  <h4 className="text-lg font-black text-slate-900">
                    {selectedPart.name}
                  </h4>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Kiến thức Tin học Tiểu học
                  </span>
                </div>
              </div>

              {/* Role */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-xs font-black text-slate-500 uppercase mb-1">
                  Chức năng chính:
                </div>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {selectedPart.role}
                </p>
              </div>

              {/* Safe Tip */}
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                <div className="text-xs font-black text-emerald-700 uppercase mb-1 flex items-center gap-1">
                  <span>💡 Lời khuyên an toàn:</span>
                </div>
                <p className="text-sm font-semibold text-emerald-900 leading-relaxed">
                  {selectedPart.tip}
                </p>
              </div>

              {/* Fun Fact */}
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <div className="text-xs font-black text-amber-700 uppercase mb-1 flex items-center gap-1">
                  <span>✨ Em có biết?</span>
                </div>
                <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                  {selectedPart.funFact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Typing Practice Pro (5 Levels with physical keyboard listener) */}
        {activeTab === 'typing' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-sm text-center space-y-4">
            {/* Level Selector Pills */}
            <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
              {TYPING_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    playClickPop();
                    setCurrentLevel(lvl.id);
                    setTypingIndex(0);
                    setTypingFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    currentLevel === lvl.id
                      ? 'bg-amber-500 text-white shadow-xs scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {lvl.title.split(':')[0]}
                </button>
              ))}
            </div>

            <div>
              <h4 className="text-lg sm:text-xl font-black text-slate-900">
                {activeLevelData.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {activeLevelData.desc} • <em>(Có thể gõ trực tiếp trên bàn phím máy tính hoặc bấm trên màn hình)</em>
              </p>
            </div>

            {/* Target Character to Type */}
            <div className="flex items-center justify-center gap-4">
              <div className="p-6 bg-slate-900 text-white rounded-2xl min-w-[200px] shadow-inner border border-slate-700 relative">
                <div className="text-xs font-mono text-indigo-300 uppercase mb-1">
                  Phím cần gõ:
                </div>
                <div className="text-6xl font-black text-amber-400 tracking-wider animate-pulse">
                  {typingSequence[typingIndex]}
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-bold">
                  Tiến độ: {typingIndex + 1} / {typingSequence.length}
                </div>
              </div>

              {/* Stats Box */}
              <div className="flex flex-col gap-2 text-left text-xs font-bold">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px]">ĐIỂM SỐ</div>
                  <div className="text-xl font-black text-indigo-600">⭐ {typingScore}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px]">ĐỘ CHÍNH XÁC</div>
                  <div className="text-xl font-black text-emerald-600">{accuracy}%</div>
                </div>
              </div>
            </div>

            {/* Finger placement tip */}
            {(activeLevelData.fingerTips as any)[typingSequence[typingIndex]] && (
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-black border border-sky-300 animate-in fade-in">
                {(activeLevelData.fingerTips as any)[typingSequence[typingIndex]]}
              </div>
            )}

            {/* Feedback message */}
            {typingFeedback && (
              <div className="text-xs sm:text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl max-w-md mx-auto">
                {typingFeedback}
              </div>
            )}

            {/* Virtual Keyboard Grid */}
            <div className="space-y-1.5 pt-2">
              {/* Row 1: Home row */}
              <div className="flex items-center justify-center gap-1.5">
                {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((char) => {
                  const isTarget = char === typingSequence[typingIndex];
                  const isAnchor = char === 'F' || char === 'J';
                  return (
                    <button
                      key={char}
                      onClick={() => handleKeyPress(char)}
                      className={`w-10 sm:w-12 h-12 sm:h-14 rounded-xl font-black text-base sm:text-lg shadow-sm border-2 transition-all flex flex-col items-center justify-between pb-1 cursor-pointer active:translate-y-0.5 ${
                        isTarget
                          ? 'bg-amber-400 border-amber-500 text-slate-950 scale-110 ring-4 ring-amber-200'
                          : isAnchor
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{char}</span>
                      {isAnchor && (
                        <span className="w-3 h-1 bg-indigo-500 rounded-full" title="Gờ nổi định vị ngón trỏ" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Extra Keys for Levels 3, 4 */}
              {currentLevel >= 3 && (
                <div className="flex items-center justify-center gap-1 pt-1 flex-wrap">
                  {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((char) => {
                    const isTarget = char === typingSequence[typingIndex];
                    return (
                      <button
                        key={char}
                        onClick={() => handleKeyPress(char)}
                        className={`w-8 h-9 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                          isTarget
                            ? 'bg-amber-400 border-amber-500 text-slate-950 scale-110 font-black'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: File Sorting Game */}
        {activeTab === 'fileExplorer' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Kỹ năng quản lý dữ liệu
              </span>
              <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
                Trò chơi: Sắp xếp tệp tin vào đúng thư mục
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kéo thả hoặc bấm vào tệp tin rồi chọn đúng thư mục lưu trữ (Văn bản, Hình ảnh hoặc Âm thanh).
              </p>
            </div>

            {/* Files to organize */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-600 mb-2">
                Tệp tin đang nằm lung tung trên Màn hình nền (Desktop):
              </div>
              <div className="flex flex-wrap gap-2">
                {filesToOrganize.length === 0 ? (
                  <div className="text-center w-full py-4 text-emerald-600 font-bold">
                    🎉 Tuyệt vời! Bạn đã dọn dẹp sạch sẽ màn hình máy tính!
                  </div>
                ) : (
                  filesToOrganize.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-300 shadow-2xs text-xs font-bold flex items-center gap-2"
                    >
                      <span>
                        {file.type === 'doc' ? '📄' : file.type === 'image' ? '🖼️' : '🎵'}
                      </span>
                      <span>{file.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Target Folders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  if (filesToOrganize.length > 0) handleSortFile(filesToOrganize[0].id, 'docs');
                }}
                className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 transition-all text-center cursor-pointer"
              >
                <div className="text-4xl mb-1">📁</div>
                <div className="font-black text-sm text-blue-900">Thư mục Văn bản</div>
                <div className="text-[11px] text-blue-600 font-semibold">(.docx, .xlsx, .txt)</div>
              </button>

              <button
                onClick={() => {
                  if (filesToOrganize.length > 0) handleSortFile(filesToOrganize[0].id, 'images');
                }}
                className="p-4 rounded-2xl border-2 border-pink-200 bg-pink-50/50 hover:bg-pink-100/50 transition-all text-center cursor-pointer"
              >
                <div className="text-4xl mb-1">📁</div>
                <div className="font-black text-sm text-pink-900">Thư mục Tranh ảnh</div>
                <div className="text-[11px] text-pink-600 font-semibold">(.png, .jpg, .gif)</div>
              </button>

              <button
                onClick={() => {
                  if (filesToOrganize.length > 0) handleSortFile(filesToOrganize[0].id, 'audio');
                }}
                className="p-4 rounded-2xl border-2 border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-all text-center cursor-pointer"
              >
                <div className="text-4xl mb-1">📁</div>
                <div className="font-black text-sm text-purple-900">Thư mục Âm nhạc</div>
                <div className="text-[11px] text-purple-600 font-semibold">(.mp3, .wav)</div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Algorithmic Turtle Art */}
        {activeTab === 'art' && (
          <AlgorithmicTurtleArt grade={grade} onRewardStar={onRewardStar} />
        )}
      </div>
    </div>
  );
};
