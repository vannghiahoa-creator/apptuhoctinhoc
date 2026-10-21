import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Award,
  ChevronRight,
  ArrowRight,
  UserX,
  Lock,
  PhoneCall
} from 'lucide-react';
import { GradeLevel, SafetyScenario, TeacherMetadata } from '../types';
import {
  playClickPop,
  playHintDing,
  playSuccessChime,
  playVictoryFanfare,
} from '../utils/audio';

interface SafetyQuestProps {
  grade: GradeLevel;
  onAskNuta: (prompt: string) => void;
  onRecordAssessment: (meta: TeacherMetadata, topic: string) => void;
  onRewardStar: () => void;
}

const SAFETY_SCENARIOS: SafetyScenario[] = [
  {
    id: 's1',
    title: 'Tình huống 1: Người lạ xin mật khẩu game để nạp tiền',
    grade: 'Lớp 3',
    category: 'Bảo vệ mật khẩu & Tài khoản',
    sender: 'GameThu_VIP_999 (Người lạ trên mạng)',
    avatar: '🎮',
    context: 'Bạn đang chơi game khám phá cùng bạn bè, bỗng nhận được tin nhắn từ một tài khoản lạ:',
    dilemma: '"Chào em, anh là quản trị viên game! Hãy gửi cho anh tên đăng nhập và mật khẩu, anh sẽ tặng em 10.000 kim cương miễn phí ngay bây giờ!"',
    options: [
      {
        id: 'opt-1',
        text: 'Gửi ngay mật khẩu cho anh ấy vì muốn có kim cương miễn phí.',
        isSafe: false,
        feedback: 'Ồ, nếu bạn gửi mật khẩu, người lạ sẽ chiếm đoạt tài khoản của bạn ngay lập tức và bạn sẽ mất hết dữ liệu đấy!',
        socraticPrompt: 'Theo bạn, tại sao một người quản trị viên thực sự lại không bao giờ hỏi mật khẩu của người chơi nhỉ?',
      },
      {
        id: 'opt-2',
        text: 'Tuyệt đối KHÔNG gửi mật khẩu, chặn tài khoản lạ và báo ngay cho bố mẹ hoặc thầy cô.',
        isSafe: true,
        feedback: 'Xuất sắc! Mật khẩu cũng giống như chiếc chìa khóa nhà của bạn, chỉ một mình bạn và bố mẹ được biết thôi!',
        socraticPrompt: 'Nếu người lạ dọa sẽ khóa nick nếu bạn không đưa mật khẩu, bạn sẽ làm gì tiếp theo?',
      },
      {
        id: 'opt-3',
        text: 'Không gửi mật khẩu nhưng gửi số điện thoại và địa chỉ nhà để anh ấy đến nạp hộ.',
        isSafe: false,
        feedback: 'Rất nguy hiểm! Địa chỉ nhà và số điện thoại là thông tin riêng tư, tuyệt đối không được tiết lộ cho người lạ trên mạng!',
        socraticPrompt: 'Điều gì có thể xảy ra nếu người lạ biết chính xác địa chỉ nhà của chúng mình?',
      },
    ],
  },
  {
    id: 's2',
    title: 'Tình huống 2: Thông báo trúng thưởng quà siêu to',
    grade: 'Lớp 4',
    category: 'Nhận diện bẫy lừa đảo & Virus',
    sender: 'Quà Tặng May Mắn 24h (Quảng cáo nhấp nháy)',
    avatar: '🎁',
    context: 'Khi đang tìm tài liệu Tin học trên mạng, màn hình bất ngờ hiện lên một bảng quảng cáo rung lắc mạnh:',
    dilemma: '"Chúc mừng bạn là người may mắn thứ 999 trúng một chiếc máy tính bảng iPad! Bấm vào đây và nhập họ tên, trường lớp để nhận quà ngay lập tức!"',
    options: [
      {
        id: 'opt-1',
        text: 'Bấm ngay vào liên kết đó và điền thông tin để sớm nhận máy tính bảng.',
        isSafe: false,
        feedback: 'Đây là cái bẫy lừa đảo (phishing)! Khi bấm vào, máy tính của bạn có thể bị nhiễm mã độc hoặc virus độc hại.',
        socraticPrompt: 'Bạn có nhận thấy điều gì đáng ngờ khi một trang web chưa từng quen biết lại tặng bạn món quà đắt tiền không?',
      },
      {
        id: 'opt-2',
        text: 'Tắt ngay cửa sổ đó đi và không bấm vào bất kỳ đường link lạ nào.',
        isSafe: true,
        feedback: 'Rất thông minh! Trên Internet, những món quà miễn phí bất ngờ thường là bẫy của kẻ xấu.',
        socraticPrompt: 'Làm thế nào để phân biệt một trang web học tập an toàn với các trang quảng cáo giả mạo?',
      },
      {
        id: 'opt-3',
        text: 'Chia sẻ đường link đó vào nhóm chat của lớp để bạn bè cùng bấm trúng thưởng.',
        isSafe: false,
        feedback: 'Nếu làm vậy, máy tính của các bạn khác trong lớp cũng sẽ bị dính virus nguy hiểm đấy!',
        socraticPrompt: 'Tại sao chúng mình cần kiểm tra kỹ thông tin trước khi chia sẻ bất kỳ thứ gì cho bạn bè?',
      },
    ],
  },
  {
    id: 's3',
    title: 'Tình huống 3: Ứng xử khi thấy bạn bè bị trêu chọc trong nhóm',
    grade: 'Lớp 5',
    category: 'Văn hóa ứng xử số & Tôn trọng bạn bè',
    sender: 'Nhóm chat Lớp 5A',
    avatar: '👥',
    context: 'Trong nhóm chat lớp trên Zalo/Teams, một bạn vô tình gửi ảnh một bạn khác bị điểm thấp kèm lời trêu chọc:',
    dilemma: '"Cả lớp nhìn này, bạn Nam hôm nay bị 3 điểm Tin học kìa! Ha ha ha, cùng thả biểu tượng mặt cười chế giễu đi!"',
    options: [
      {
        id: 'opt-1',
        text: 'Cùng hùa theo thả biểu tượng cười cợt và chia sẻ ảnh đó cho các bạn lớp khác xem.',
        isSafe: false,
        feedback: 'Đây là hành vi bắt nạt trên mạng (Cyberbullying). Hành động này làm tổn thương bạn bè sâu sắc và vi phạm đạo đức số.',
        socraticPrompt: 'Nếu đặt mình vào vị trí của bạn Nam, bạn sẽ cảm thấy thế nào khi bị cả lớp cười cợt như vậy?',
      },
      {
        id: 'opt-2',
        text: 'Nhắn vào nhóm nhắc các bạn dừng lại, động viên bạn Nam và báo cho cô giáo chủ nhiệm.',
        isSafe: true,
        feedback: 'Bạn là một người bạn tuyệt vời và dũng cảm! Giúp đỡ bạn bè và giữ môi trường số văn minh là trách nhiệm của công dân số.',
        socraticPrompt: 'Theo bạn, những lời nói trên mạng ảo có thể gây ra nỗi buồn có thật ngoài đời không?',
      },
      {
        id: 'opt-3',
        text: 'Im lặng không nói gì, coi như không liên quan đến mình.',
        isSafe: false,
        feedback: 'Sự im lặng đôi khi vô tình khiến kẻ trêu chọc nghĩ rằng mình làm đúng. Bạn nên nhẹ nhàng nhắc nhở hoặc báo với cô giáo.',
        socraticPrompt: 'Làm thế nào để chúng mình xây dựng một nhóm học tập trực tuyến vui vẻ và đoàn kết?',
      },
    ],
  },
];

export const SafetyQuest: React.FC<SafetyQuestProps> = ({
  grade,
  onAskNuta,
  onRecordAssessment,
  onRewardStar,
}) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);

  const scenario = SAFETY_SCENARIOS[currentScenarioIndex];
  const selectedOption = scenario.options.find((o) => o.id === selectedOptionId);

  const handleSelectOption = (optId: string) => {
    playClickPop();
    setSelectedOptionId(optId);

    const opt = scenario.options.find((o) => o.id === optId);
    if (opt?.isSafe) {
      playVictoryFanfare();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      onRewardStar();

      if (!completedQuests.includes(scenario.id)) {
        setCompletedQuests((prev) => [...prev, scenario.id]);
      }

      onRecordAssessment(
        {
          skill_assessed: 'An toàn số',
          hint_level: 1,
          student_state: 'Hoàn thành',
          teacher_note: `Học sinh đã giải quyết đúng tình huống an toàn số: "${scenario.title}" và hiểu nguyên tắc bảo mật.`,
        },
        'An toàn số'
      );
    } else {
      playHintDing();
      onRecordAssessment(
        {
          skill_assessed: 'An toàn số',
          hint_level: 2,
          student_state: 'Cần hỗ trợ',
          teacher_note: `Học sinh cần rèn luyện thêm về nhận diện rủi ro trong tình huống: "${scenario.title}".`,
        },
        'An toàn số'
      );
    }
  };

  const handleNextScenario = () => {
    playClickPop();
    setSelectedOptionId(null);
    setCurrentScenarioIndex((prev) => (prev + 1) % SAFETY_SCENARIOS.length);
  };

  const handleAskNutaScenario = () => {
    playClickPop();
    const prompt = `Tớ đang làm tình huống an toàn số: "${scenario.title}". Bối cảnh là: "${scenario.dilemma}". NUTA hãy gợi mở cho tớ hiểu tại sao cần cẩn trọng và cách xử lý đúng nhất nhé!`;
    onAskNuta(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                Đấu Trường Hiệp Sĩ An Toàn Số
              </h3>
              <p className="text-xs text-slate-500">
                Rèn luyện kỹ năng: <span className="font-bold text-emerald-600">Bảo vệ thông tin cá nhân & Ứng xử văn minh</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Đã hoàn thành: {completedQuests.length}/{SAFETY_SCENARIOS.length}
            </span>
            <button
              onClick={handleAskNutaScenario}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold text-xs shadow-sm hover:from-sky-600 hover:to-indigo-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hỏi NUTA về tình huống này</span>
            </button>
          </div>
        </div>

        {/* Scenario Progress Selector */}
        <div className="grid grid-cols-3 gap-2">
          {SAFETY_SCENARIOS.map((sc, idx) => {
            const isCurrent = idx === currentScenarioIndex;
            const isDone = completedQuests.includes(sc.id);
            return (
              <button
                key={sc.id}
                onClick={() => {
                  playClickPop();
                  setSelectedOptionId(null);
                  setCurrentScenarioIndex(idx);
                }}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200 font-black'
                    : 'bg-slate-50 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-bold text-slate-500">Thử thách {idx + 1}</span>
                  {isDone && <span className="text-emerald-600 font-black">✓ Hoàn thành</span>}
                </div>
                <div className="text-xs font-bold truncate text-slate-800">
                  {sc.category}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Quest Content */}
      <div className="flex-1 p-4 overflow-y-auto max-w-4xl mx-auto w-full space-y-4">
        {/* Scenario Simulation Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm space-y-4">
          {/* Situation Context */}
          <div className="flex items-start gap-3">
            <span className="text-3xl p-2.5 bg-slate-100 rounded-2xl shrink-0">
              {scenario.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {scenario.grade}
                </span>
                <span className="text-xs font-black text-slate-500 uppercase">
                  {scenario.category}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-slate-900">
                {scenario.title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {scenario.context}
              </p>
            </div>
          </div>

          {/* Incoming Message Box (Chat / Pop-up Simulator) */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" /> Người gửi: {scenario.sender}
              </span>
              <span className="text-rose-400 font-bold animate-pulse">CẢNH BÁO AN TOÀN SỐ</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-amber-200 leading-relaxed italic">
              {scenario.dilemma}
            </p>
          </div>

          {/* Socratic Question prompt for student */}
          <div className="text-sm font-extrabold text-slate-700 flex items-center gap-2 pt-1">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Nếu là bạn trong tình huống này, bạn sẽ chọn hành động nào?</span>
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {scenario.options.map((option, idx) => {
              const isSelected = selectedOptionId === option.id;
              const hasAnswered = selectedOptionId !== null;

              let btnStyle = 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800';
              if (hasAnswered && isSelected) {
                btnStyle = option.isSafe
                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-500 ring-2 ring-rose-300 text-rose-900';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                >
                  <span className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 text-slate-700">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="flex-1 font-bold text-sm sm:text-base leading-snug">
                    {option.text}
                  </div>
                  {hasAnswered && isSelected && (
                    <span className="shrink-0">
                      {option.isSafe ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Socratic Feedback & Explanation Card */}
          {selectedOption && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                selectedOption.isSafe
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {selectedOption.isSafe ? '🌟' : '🤔'}
                </span>
                <span className="font-black text-sm uppercase">
                  {selectedOption.isSafe
                    ? 'Chính xác! Bạn là một hiệp sĩ số thông thái!'
                    : 'Chúng mình cùng suy ngẫm kỹ hơn nhé!'}
                </span>
              </div>

              <p className="text-sm font-semibold leading-relaxed">
                {selectedOption.feedback}
              </p>

              {/* Socratic follow-up reflection question */}
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200">
                <div className="text-xs font-black uppercase text-sky-700 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Câu hỏi tư duy từ Robot NUTA:
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedOption.socraticPrompt}
                </div>
              </div>

              {/* Action: Next scenario */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => onAskNuta(`Về tình huống an toàn số "${scenario.title}": ${selectedOption.socraticPrompt}`)}
                  className="text-xs font-extrabold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Thảo luận câu này cùng NUTA
                </button>

                <button
                  onClick={handleNextScenario}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Thử thách tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
