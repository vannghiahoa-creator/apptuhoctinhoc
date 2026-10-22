import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Send,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  UploadCloud,
  X,
  Bot,
  AlertCircle,
  Key,
  Cpu
} from 'lucide-react';
import { ChatMessage, GradeLevel, HintLevel, SocraticStep, TeacherMetadata, Student } from '../types';
import { NutaAvatar } from './NutaAvatar';
import {
  playClickPop,
  playHintDing,
  playRobotBeep,
  playSuccessChime,
  playVictoryFanfare,
  speakVietnamese,
  stopSpeaking
} from '../utils/audio';
import {
  callGeminiWithFallback,
  getStoredApiKey,
  getStoredModel,
} from '../utils/geminiAi';

interface SocraticChatProps {
  grade: GradeLevel;
  topic: string;
  onRecordAssessment: (meta: TeacherMetadata, topic: string) => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  currentStudent?: Student | null;
  onOpenStudentModal?: () => void;
  onOpenApiKeyModal?: () => void;
}

const SOCRATIC_STEPS: { step: SocraticStep; label: string; icon: string; desc: string }[] = [
  { step: 'Hỏi', label: '1. Hỏi', icon: '❓', desc: 'Xác định rõ vấn đề quan sát được' },
  { step: 'Nghĩ', label: '2. Nghĩ', icon: '🧠', desc: 'Suy ngẫm kiến thức đã học' },
  { step: 'Dự đoán', label: '3. Dự đoán', icon: '🔮', desc: 'Đoán xem điều gì sẽ xảy ra' },
  { step: 'Thử', label: '4. Thử', icon: '🧪', desc: 'Bấm thử nghiệm trên máy tính' },
  { step: 'Kiểm chứng', label: '5. Kiểm chứng', icon: '🔍', desc: 'So sánh kết quả thực tế' },
  { step: 'Giải thích', label: '6. Giải thích', icon: '💡', desc: 'Hiểu tại sao và rút ra bài học' },
];

export const SocraticChat: React.FC<SocraticChatProps> = ({
  grade,
  topic,
  onRecordAssessment,
  externalPrompt,
  onClearExternalPrompt,
  currentStudent,
  onOpenStudentModal,
  onOpenApiKeyModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Chào bạn! Tớ là Robot NUTA đây! 🤖 Hôm nay chúng mình cùng khám phá Tin học thật vui nhé!',
      greeting: 'Chào bạn! Tớ là Robot NUTA, người bạn đồng hành Tin học của bạn! 🌟🤖',
      hint: 'Bạn đang muốn tìm hiểu về Scratch, an toàn số hay thao tác máy tính nào? Hãy kể cho NUTA nghe bạn đang thử làm gì nhé!',
      action: 'Hãy nhập câu hỏi hoặc chọn một tình huống dưới đây để chúng mình cùng suy nghĩ!',
      metadata: {
        skill_assessed: 'Tư duy logic',
        hint_level: 1,
        student_state: 'Đang tiến bộ',
        teacher_note: 'Bắt đầu phiên học tập tương tác cùng NUTA.',
      },
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState<HintLevel>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSpeakingMessageId, setIsSpeakingMessageId] = useState<string | null>(null);
  const [nutaMood, setNutaMood] = useState<'neutral' | 'thinking' | 'happy' | 'celebrating' | 'talking'>('happy');
  const [fallbackStatus, setFallbackStatus] = useState<string | null>(null);
  const [stepError, setStepError] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle external prompts sent from Scratch Playground or Safety Quest
  useEffect(() => {
    if (externalPrompt) {
      sendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp ảnh chụp màn hình hoặc bài tập nhé!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      playClickPop();
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSpeechPlay = (msg: ChatMessage) => {
    if (isSpeakingMessageId === msg.id) {
      stopSpeaking();
      setIsSpeakingMessageId(null);
      setNutaMood('happy');
      return;
    }

    stopSpeaking();
    setIsSpeakingMessageId(msg.id);
    setNutaMood('talking');

    const fullSpeech = `${msg.greeting || ''}. ${msg.hint || ''}. ${msg.action || ''}. ${msg.transfer || ''}`;
    speakVietnamese(fullSpeech, () => {
      setIsSpeakingMessageId(null);
      setNutaMood('happy');
    });
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query && !attachedImage) return;

    playClickPop();
    setInput('');
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: query || '(Đã gửi kèm ảnh màn hình để NUTA quan sát)',
        image: attachedImage || undefined,
        timestamp: Date.now(),
        grade,
        topic,
      },
    ];

    setMessages(newMessages);
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setLoading(true);
    setFallbackStatus(null);
    setStepError(false);
    setNutaMood('thinking');
    playRobotBeep();

    try {
      const apiKey = getStoredApiKey();
      let data: any;

      if (apiKey) {
        // Ưu tiên 1 (Tối ưu cho Vercel & Client): Gọi trực tiếp Google Gemini REST API với Fallback chain
        data = await callGeminiWithFallback({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
          grade,
          topic,
          hintLevel,
          currentStep: SOCRATIC_STEPS[currentStepIndex].step,
          studentName: currentStudent?.name,
          studentId: currentStudent?.id,
          studentClass: currentStudent?.className || grade,
          onModelFallback: (fromModel, toModel, error) => {
            setFallbackStatus(`Đang tự động chuyển từ ${fromModel} sang ${toModel}...`);
          },
        });
      } else {
        // Ưu tiên 2: Thử gọi backend server nội bộ (Local dev hoặc Node proxy)
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              image: m.image,
            })),
            grade,
            topic,
            hintLevel,
            currentStep: SOCRATIC_STEPS[currentStepIndex].step,
            studentName: currentStudent?.name,
            studentId: currentStudent?.id,
            studentClass: currentStudent?.className || grade,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errMsg = errData?.error || `HTTP ${response.status} ${response.statusText}`;
          throw new Error(errMsg || 'CHUA_CO_API_KEY');
        }

        data = await response.json();
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.raw || data.hint,
        greeting: data.greeting,
        hint: data.hint,
        action: data.action,
        transfer: data.transfer,
        metadata: data.metadata,
        usedModel: data.usedModel,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setNutaMood('happy');
      playHintDing();

      // If finished state or transfer question present, celebrate!
      if (data.metadata?.student_state === 'Hoàn thành' || (data.transfer && data.transfer.length > 5)) {
        setNutaMood('celebrating');
        playVictoryFanfare();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Record assessment for teacher
      if (data.metadata) {
        onRecordAssessment(data.metadata, topic);
      }

      // Progress Socratic step gently
      setStepError(false);
      setCurrentStepIndex((prev) => (prev + 1) % SOCRATIC_STEPS.length);
    } catch (err: any) {
      console.error('Lỗi khi trò chuyện cùng NUTA:', err);
      setStepError(true);
      const rawErrMsg = err?.message || 'Lỗi không xác định khi kết nối với AI';
      const isMissingKey = rawErrMsg === 'CHUA_CO_API_KEY' || !getStoredApiKey();

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: isMissingKey
            ? 'Bạn ơi, ứng dụng cần API Key Google Gemini để NUTA có thể trò chuyện và hỗ trợ bạn.'
            : 'Đã dừng do lỗi kết nối hoặc vượt hạn mức API.',
          greeting: isMissingKey
            ? 'Chưa thiết lập API Key Google AI Studio 🔑'
            : 'Đã dừng do lỗi kết nối API ⚠️',
          hint: isMissingKey
            ? 'Vui lòng nhấn nút "Cài đặt API Key" bên dưới hoặc trên thanh Header để nhập API Key từ Google AI Studio nhé!'
            : `Hệ thống đã thử các model nhưng đều thất bại. Chi tiết lỗi: ${rawErrMsg}`,
          action: isMissingKey ? 'Nhấn vào nút "Cài đặt API Key" để bắt đầu!' : 'Bạn hãy kiểm tra lại kết nối mạng hoặc đổi API Key khác nhé!',
          isError: true,
          errorMessage: rawErrMsg,
          timestamp: Date.now(),
        },
      ]);
      setNutaMood('neutral');
    } finally {
      setLoading(false);
      setFallbackStatus(null);
    }
  };

  const samplePrompts = [
    { text: 'Tớ vừa ghép lệnh nhưng chú mèo không chịu chạy!', icon: '🐱' },
    { text: 'Tại sao chú mèo khi chạm cạnh lại bị lộn ngược đầu?', icon: '🔄' },
    { text: 'Có người lạ trong game xin mật khẩu để tặng thẻ, tớ nên làm gì?', icon: '🛡️' },
    { text: 'Phím F và phím J trên bàn phím có gì đặc biệt thế NUTA?', icon: '⌨️' },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Header Bar: Grade, Topic & Socratic Flow Progress */}
      <div className="bg-white border-b border-slate-200 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <NutaAvatar mood={nutaMood} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">
                  NUTA - Trợ lý Gợi mở Tư duy
                </h2>
                <span className="bg-sky-100 text-sky-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-sky-300">
                  {grade}
                </span>
                <span className="hidden sm:inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {topic}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Nguyên tắc: <span className="font-bold text-emerald-600">Nghĩ trước - Thử nghiệm - Tự tìm ra lời giải</span> ✨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Student Identification Pill */}
            {currentStudent ? (
              <button
                onClick={() => {
                  playClickPop();
                  if (onOpenStudentModal) onOpenStudentModal();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                title="Nhấn để đổi học sinh hoặc xem chi tiết Google Sheet"
              >
                <span>{currentStudent.gender === 'Nữ' ? '👧' : '👦'}</span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] font-black border border-amber-200 text-indigo-700">
                  {currentStudent.id}
                </span>
                <span className="max-w-[110px] truncate">{currentStudent.name}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playClickPop();
                  if (onOpenStudentModal) onOpenStudentModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 border border-sky-300 text-sky-900 font-black text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
                title="Bấm để chọn tên hoặc số thứ tự của em để vào học cùng NUTA"
              >
                <span className="text-sm group-hover:scale-110 transition-transform">🎓</span>
                <span>Chọn Tên / Mã HS</span>
                <span className="bg-sky-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">Vào học</span>
              </button>
            )}

            {/* Hint Strategy Level Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 px-1 text-[11px] hidden md:inline">
                Mức gợi ý:
              </span>
            {[
              { lvl: 1 as HintLevel, label: 'Mức 1 (Nhẹ)', tip: 'Nhắc lại kiến thức & gợi ý quan sát' },
              { lvl: 2 as HintLevel, label: 'Mức 2 (Vừa)', tip: 'Giả thuyết: Nếu... thì...' },
              { lvl: 3 as HintLevel, label: 'Mức 3 (Rõ)', tip: 'Chia nhỏ nhiệm vụ từng bước' },
            ].map((item) => (
              <button
                key={item.lvl}
                onClick={() => {
                  playClickPop();
                  setHintLevel(item.lvl);
                }}
                title={item.tip}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  hintLevel === item.lvl
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6-step Socratic Flow Journey bar (Theo AI_INSTRUCTIONS.md: Quản lý trạng thái & lỗi) */}
        <div className={`rounded-xl p-2.5 transition-all border ${stepError ? 'bg-rose-50/80 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="flex items-center gap-1 text-slate-600">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Luồng tư duy 6 bước:
            </span>
            {stepError ? (
              <span className="text-rose-600 font-black flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Đã dừng do lỗi (Bước {currentStepIndex + 1}/6: {SOCRATIC_STEPS[currentStepIndex].label})</span>
              </span>
            ) : (
              <span className="text-sky-600 font-extrabold">
                Bước {currentStepIndex + 1}/6: {SOCRATIC_STEPS[currentStepIndex].desc}
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 gap-1">
            {SOCRATIC_STEPS.map((s, idx) => {
              const isFailed = idx === currentStepIndex && stepError;
              const isActive = idx === currentStepIndex && !stepError;
              const isPassed = idx < currentStepIndex && !stepError; // Chỉ hiển thị trạng thái hoàn thành (xanh) khi bước đó thực sự thành công

              return (
                <button
                  key={s.step}
                  onClick={() => {
                    playClickPop();
                    setStepError(false);
                    setCurrentStepIndex(idx);
                  }}
                  className={`py-1 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isFailed
                      ? 'bg-rose-500 text-white font-black shadow-sm ring-2 ring-rose-400'
                      : isActive
                      ? 'bg-sky-500 text-white font-extrabold shadow-sm scale-102 ring-2 ring-sky-300'
                      : isPassed
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : 'bg-white text-slate-400 font-medium hover:bg-slate-100'
                  }`}
                  title={isFailed ? `Bước ${s.label}: Đã dừng do lỗi` : `${s.label}: ${s.desc}`}
                >
                  <span className="text-xs">{isFailed ? '⚠️' : s.icon}</span>
                  <span className="text-[10px] leading-tight truncate w-full">
                    {isFailed ? 'Đã dừng' : s.step}
                  </span>
                </button>
              );
            })}
          </div>
          {stepError && (
            <div className="mt-1.5 pt-1.5 border-t border-rose-200 text-[11px] font-bold text-rose-700 flex items-center justify-between flex-wrap gap-1">
              <span>Trạng thái: <strong>Đã dừng do lỗi</strong>. Quy trình không được đánh dấu hoàn tất.</span>
              {onOpenApiKeyModal && (
                <button
                  onClick={() => {
                    playClickPop();
                    onOpenApiKeyModal();
                  }}
                  className="underline text-rose-800 hover:text-rose-950 font-black cursor-pointer"
                >
                  Đổi API Key ngay 🔑
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {msg.role === 'user' ? (
              /* User Bubble */
              <div className="max-w-[85%] bg-sky-500 text-white rounded-2xl rounded-tr-xs p-3.5 shadow-sm">
                {msg.image && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-white/20">
                    <img
                      src={msg.image}
                      alt="Ảnh bài tập đính kèm"
                      className="max-h-56 w-auto object-cover"
                    />
                  </div>
                )}
                <p className="text-sm sm:text-base font-semibold leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
                <div className="text-[10px] text-sky-100 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : msg.isError ? (
              /* NUTA Error Card (Màu đỏ theo AI_INSTRUCTIONS.md) */
              <div className="w-full max-w-[95%] sm:max-w-[85%] bg-rose-50/95 border-2 border-rose-300 rounded-2xl rounded-tl-xs p-4 shadow-sm space-y-3 relative animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="font-black text-rose-700 text-sm">
                      {msg.greeting || 'Đã dừng do lỗi kết nối'}
                    </span>
                  </div>
                  <span className="bg-rose-200/80 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Lỗi API
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-800 leading-relaxed">
                  {msg.hint}
                </div>

                {msg.errorMessage && (
                  <div className="p-3 bg-white/90 border border-rose-200 rounded-xl">
                    <div className="text-[10px] font-black uppercase text-rose-600 mb-1 flex items-center gap-1">
                      <span>Nguyên văn phản hồi từ Google AI:</span>
                    </div>
                    <code className="text-xs font-mono text-rose-900 break-all select-all block leading-tight">
                      {msg.errorMessage}
                    </code>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2 flex-wrap">
                  {onOpenApiKeyModal && (
                    <button
                      onClick={() => {
                        playClickPop();
                        onOpenApiKeyModal();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-colors shadow-2xs cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Cài đặt / Đổi API Key</span>
                    </button>
                  )}
                  <button
                    onClick={() => sendMessage('Chào NUTA, chúng mình kiểm tra lại nhé!')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100/60 text-rose-700 border border-rose-300 font-black text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử gửi lại</span>
                  </button>
                </div>
              </div>
            ) : (
              /* NUTA Socratic Card (Structured 4-part format) */
              <div className="w-full max-w-[95%] sm:max-w-[85%] bg-white border-2 border-sky-200 rounded-2xl rounded-tl-xs p-4 shadow-sm space-y-3 relative">
                {/* Header with audio TTS button, Model tag and Hint Level badge */}
                <div className="flex items-center justify-between pb-2 border-b border-sky-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Bot className="w-5 h-5 text-sky-500" />
                    <span className="font-extrabold text-sky-700 text-sm">
                      NUTA Gợi Mở
                    </span>
                    {msg.usedModel && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200">
                        {msg.usedModel.replace('-preview', '')}
                      </span>
                    )}
                    {msg.metadata && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                        {msg.metadata.skill_assessed}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSpeechPlay(msg)}
                    className="flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl transition-colors border border-sky-200"
                    title="Nghe NUTA đọc câu này"
                  >
                    {isSpeakingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-rose-600">Dừng đọc</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Nghe đọc</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1. Lời chào & Khích lệ */}
                {msg.greeting && (
                  <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-2.5 text-sm font-semibold flex items-start gap-2">
                    <span className="text-base">🌟</span>
                    <span>{msg.greeting}</span>
                  </div>
                )}

                {/* 2. Câu hỏi gợi mở / Gợi ý tư duy */}
                {msg.hint && (
                  <div className="bg-sky-50 text-sky-950 border border-sky-200 rounded-xl p-3 text-sm font-bold flex items-start gap-2.5">
                    <div className="p-1 bg-amber-400 text-amber-950 rounded-lg shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-wider text-sky-700 mb-0.5">
                        Câu hỏi gợi suy nghĩ:
                      </div>
                      <div className="text-slate-800 leading-relaxed font-bold">
                        {msg.hint}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Yêu cầu hành động */}
                {msg.action && (
                  <div className="bg-amber-50 text-amber-950 border border-amber-200 rounded-xl p-2.5 text-sm font-semibold flex items-start gap-2">
                    <span className="text-base">🚀</span>
                    <div>
                      <span className="font-extrabold text-amber-800">Thử thách cho bạn: </span>
                      <span>{msg.action}</span>
                    </div>
                  </div>
                )}

                {/* 4. Câu hỏi chuyển giao (khi hoàn thành) */}
                {msg.transfer && (
                  <div className="bg-purple-50 text-purple-950 border border-purple-200 rounded-xl p-2.5 text-sm font-semibold flex items-start gap-2">
                    <span className="text-base">✨</span>
                    <div>
                      <span className="font-extrabold text-purple-800">Thử thách mở rộng: </span>
                      <span>{msg.transfer}</span>
                    </div>
                  </div>
                )}

                {/* Diagnostic tag for Teacher */}
                {msg.metadata?.teacher_note && (
                  <div className="pt-1 text-[11px] text-slate-400 italic flex items-center gap-1">
                    <span>📝 Ghi chú tư duy: {msg.metadata.teacher_note}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-sky-200 w-fit shadow-xs animate-in fade-in duration-150">
            <NutaAvatar mood="thinking" size="sm" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-sky-700 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                <span>{fallbackStatus || 'NUTA đang phân tích và chuẩn bị câu hỏi gợi ý...'}</span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-sky-600 animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts For Primary School Kids */}
      <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Gợi ý câu hỏi:
          </span>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.text)}
              className="text-xs font-bold bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 px-3 py-1.5 rounded-full transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span className="mr-1">{p.icon}</span>
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box with Image attachment & Voice */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        {/* Attached image preview banner */}
        {attachedImage && (
          <div className="mb-2 p-2 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={attachedImage}
                alt="Ảnh chuẩn bị gửi"
                className="w-12 h-12 object-cover rounded-lg border border-sky-300"
              />
              <span className="text-xs font-bold text-sky-800">
                Đã đính kèm ảnh chụp bài tập/lỗi Scratch
              </span>
            </div>
            <button
              onClick={removeImage}
              className="p-1 hover:bg-sky-200 text-sky-800 rounded-full"
              title="Gỡ ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File upload button for Scratch screenshot */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => {
              playClickPop();
              fileInputRef.current?.click();
            }}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
            title="Tải ảnh màn hình Scratch hoặc bài tập lên cho NUTA xem"
          >
            <ImageIcon className="w-5 h-5 text-sky-600" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Bạn đang thử làm gì? Hãy kể cho NUTA nghe..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 text-sm sm:text-base"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || (!input.trim() && !attachedImage)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold flex items-center gap-1.5 shadow-md hover:from-sky-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};
