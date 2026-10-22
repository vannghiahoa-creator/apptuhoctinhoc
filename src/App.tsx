import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Code2,
  Shield,
  Monitor,
  GraduationCap,
  Star,
  Volume2,
  VolumeX,
  Info,
  X,
  Sparkles,
  ChevronDown,
  Key
} from 'lucide-react';
import { GradeLevel, TeacherMetadata, Student, GoogleSheetConfig, AssessmentRecord } from './types';
import { NutaAvatar } from './components/NutaAvatar';
import { SocraticChat } from './components/SocraticChat';
import { ScratchPlayground } from './components/ScratchPlayground';
import { SafetyQuest } from './components/SafetyQuest';
import { ComputerLab } from './components/ComputerLab';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentSelectorModal } from './components/StudentSelectorModal';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { getStoredApiKey } from './utils/geminiAi';
import {
  isSoundEnabled,
  setSoundEnabled,
  playClickPop,
  playVictoryFanfare,
} from './utils/audio';
import {
  loadSavedStudents,
  saveStudents,
  loadSavedSheetConfig,
  saveSheetConfig,
  loadSavedActiveStudentId,
  saveActiveStudentId,
  fetchStudentsFromGoogleSheet,
} from './utils/googleSheets';

type ActiveTab = 'chat' | 'scratch' | 'safety' | 'computer' | 'teacher';

const INITIAL_TEACHER_RECORDS: AssessmentRecord[] = [
  {
    id: 'seed-1',
    timestamp: Date.now() - 3600000 * 2,
    grade: 'Lớp 3',
    topic: 'Lập trình Scratch',
    metadata: {
      skill_assessed: 'Tư duy logic',
      hint_level: 1,
      student_state: 'Hoàn thành',
      teacher_note: 'Học sinh nhận biết chính xác vị trí cần đặt khối lệnh di chuyển trong vòng lặp.',
    },
  },
  {
    id: 'seed-2',
    timestamp: Date.now() - 3600000 * 1.5,
    grade: 'Lớp 3',
    topic: 'An toàn số',
    metadata: {
      skill_assessed: 'An toàn số',
      hint_level: 1,
      student_state: 'Hoàn thành',
      teacher_note: 'Học sinh có ý thức tự bảo vệ mật khẩu cá nhân, không chia sẻ cho người lạ trên game.',
    },
  },
  {
    id: 'seed-3',
    timestamp: Date.now() - 3600000 * 0.8,
    grade: 'Lớp 4',
    topic: 'Lập trình Scratch',
    metadata: {
      skill_assessed: 'Phân tích lỗi',
      hint_level: 2,
      student_state: 'Đang tiến bộ',
      teacher_note: 'Học sinh cần chú ý hơn về cấu hình kiểu xoay trái-phải của nhân vật để không bị lộn ngược.',
    },
  },
  {
    id: 'seed-4',
    timestamp: Date.now() - 3600000 * 0.3,
    grade: 'Lớp 3',
    topic: 'Thao tác máy tính',
    metadata: {
      skill_assessed: 'Thao tác máy tính',
      hint_level: 1,
      student_state: 'Hoàn thành',
      teacher_note: 'Học sinh đã thuộc vị trí hai phím cơ sở F & J và phân biệt được thân máy CPU và màn hình.',
    },
  },
];

const STORAGE_KEY_RECORDS = 'nuta_teacher_records';

function loadSavedRecords(): AssessmentRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not load records from localStorage', e);
  }
  return INITIAL_TEACHER_RECORDS;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [grade, setGrade] = useState<GradeLevel>('Lớp 3');
  const [soundOn, setSoundOn] = useState(true);
  const [starCount, setStarCount] = useState(12);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [records, setRecords] = useState<AssessmentRecord[]>(() => loadSavedRecords());
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  // Student and Google Sheet State
  const [students, setStudents] = useState<Student[]>(() => loadSavedStudents());
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => loadSavedSheetConfig());
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const savedId = loadSavedActiveStudentId();
    const list = loadSavedStudents();
    return list.find((s) => s.id === savedId) || null;
  });
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    if (!getStoredApiKey()) {
      setShowApiKeyModal(true);
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickPop();
  };

  const handleRewardStar = () => {
    setStarCount((s) => s + 1);
  };

  const handleSelectStudent = (student: Student | null) => {
    setCurrentStudent(student);
    saveActiveStudentId(student ? student.id : null);
    if (student) {
      setGrade(student.grade);
      if (student.stars !== undefined) {
        setStarCount(student.stars);
      }
      playVictoryFanfare();
    } else {
      playClickPop();
    }
  };

  const handleSyncSheet = async () => {
    if (!sheetConfig.sheetUrl) {
      setShowStudentModal(true);
      return;
    }
    setIsSyncingSheet(true);
    try {
      const res = await fetchStudentsFromGoogleSheet(sheetConfig.sheetUrl, sheetConfig.sheetName);
      if (res.students && res.students.length > 0) {
        setStudents(res.students);
        saveStudents(res.students);
        const updatedConfig: GoogleSheetConfig = {
          ...sheetConfig,
          lastSyncTime: Date.now(),
          status: 'success',
        };
        setSheetConfig(updatedConfig);
        saveSheetConfig(updatedConfig);
        playVictoryFanfare();
      } else {
        setShowStudentModal(true);
      }
    } catch (err: any) {
      console.error('Google Sheet sync error:', err);
      // Mở modal để người dùng thấy rõ thông báo lỗi và cách khắc phục
      setShowStudentModal(true);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleRecordAssessment = (meta: TeacherMetadata, topic: string) => {
    const newRecord: AssessmentRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
      grade,
      topic,
      metadata: meta,
      studentId: currentStudent?.id,
      studentName: currentStudent?.name,
      studentClass: currentStudent?.className || grade,
    };
    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save records to localStorage', e);
      }
      return updated;
    });
  };

  // Called when other tabs ask NUTA for help
  const handleAskNutaFromOtherTab = (prompt: string) => {
    setExternalPrompt(prompt);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Nunito',sans-serif] text-slate-800">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Robot Mascot */}
          <div
            onClick={() => {
              playClickPop();
              setActiveTab('chat');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <NutaAvatar mood="happy" size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl text-sky-600 tracking-tight group-hover:text-sky-700 transition-colors">
                  NUTA
                </span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  AI Tin Học
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold hidden sm:block">
                Trợ lý phát triển tư duy Tin học Tiểu học
              </p>
            </div>
          </div>

          {/* Center Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {[
              { id: 'chat' as const, label: 'Đối thoại NUTA', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'scratch' as const, label: 'Lập trình Scratch', icon: <Code2 className="w-4 h-4" /> },
              { id: 'safety' as const, label: 'An toàn số', icon: <Shield className="w-4 h-4" /> },
              { id: 'computer' as const, label: 'Thao tác máy tính', icon: <Monitor className="w-4 h-4" /> },
              { id: 'teacher' as const, label: 'Góc Giáo viên', icon: <GraduationCap className="w-4 h-4" /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClickPop();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Student, Grade selector, Stars, Sound, Guide */}
          <div className="flex items-center gap-2">
            {/* API Key Settings Button (Theo AI_INSTRUCTIONS.md) */}
            <button
              onClick={() => {
                playClickPop();
                setShowApiKeyModal(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 hover:from-rose-100 hover:to-amber-100 border border-rose-300 text-slate-800 px-2.5 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer group"
              title="Cài đặt Model & API Key Google Gemini (Lưu trữ trên trình duyệt)"
            >
              <Key className="w-3.5 h-3.5 text-rose-600 group-hover:rotate-12 transition-transform shrink-0" />
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[11px] font-black text-slate-700">Cài đặt API</span>
                <span className="text-[9px] font-black text-rose-600 tracking-tight">Lấy API key để sử dụng app</span>
              </div>
            </button>

            {/* Student Identification Button */}
            {currentStudent ? (
              <button
                onClick={() => {
                  playClickPop();
                  setShowStudentModal(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 font-black text-xs px-2.5 py-1.5 rounded-xl shadow-2xs hover:border-amber-400 hover:bg-amber-100 transition-all cursor-pointer"
                title="Học sinh đang đăng nhập - Nhấn để đổi hoặc xem chi tiết"
              >
                <span>{currentStudent.gender === 'Nữ' ? '👧' : '👦'}</span>
                <span className="font-mono bg-white px-1.5 py-0.5 rounded text-[10px] text-indigo-700 border border-amber-200">
                  {currentStudent.id}
                </span>
                <span className="hidden sm:inline max-w-[90px] truncate">{currentStudent.name}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playClickPop();
                  setShowStudentModal(true);
                }}
                className="flex items-center gap-1.5 bg-sky-50 border border-sky-300 text-sky-800 font-black text-xs px-2.5 py-1.5 rounded-xl shadow-2xs hover:bg-sky-100 transition-all cursor-pointer"
                title="Đăng nhập hoặc chọn Mã học sinh từ Google Sheet"
              >
                <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Mã HS</span>
                <span className="bg-sky-500 text-white text-[9px] px-1 py-0.2 rounded font-black uppercase">Sheet</span>
              </button>
            )}

            {/* Grade Selector */}
            <div className="relative">
              <select
                value={grade}
                onChange={(e) => {
                  playClickPop();
                  setGrade(e.target.value as GradeLevel);
                }}
                className="appearance-none bg-sky-50 border border-sky-300 text-sky-800 font-black text-xs pl-3 pr-7 py-1.5 rounded-xl cursor-pointer hover:bg-sky-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="Lớp 1">Lớp 1</option>
                <option value="Lớp 2">Lớp 2</option>
                <option value="Lớp 3">Lớp 3</option>
                <option value="Lớp 4">Lớp 4</option>
                <option value="Lớp 5">Lớp 5</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-sky-700 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Star Counter */}
            <div
              className="flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-800 font-black text-xs px-2.5 py-1.5 rounded-xl shadow-2xs select-none"
              title="Số ngôi sao bạn đã đạt được"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-500 animate-spin-slow" />
              <span>{starCount}</span>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundOn
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
              title={soundOn ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Help & Socratic Method Info */}
            <button
              onClick={() => {
                playClickPop();
                setShowInfoModal(true);
              }}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tìm hiểu về NUTA và phương pháp gợi mở"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto border-t border-slate-200 bg-slate-50 px-2 py-1.5 gap-1">
          {[
            { id: 'chat' as const, label: 'Hỏi đáp NUTA', icon: <MessageSquare className="w-3.5 h-3.5" /> },
            { id: 'scratch' as const, label: 'Scratch', icon: <Code2 className="w-3.5 h-3.5" /> },
            { id: 'safety' as const, label: 'An toàn số', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'computer' as const, label: 'Máy tính', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'teacher' as const, label: 'Giáo viên', icon: <GraduationCap className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playClickPop();
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-2 sm:p-4 h-[calc(100vh-4.5rem)] flex flex-col">
        {activeTab === 'chat' && (
          <SocraticChat
            grade={grade}
            topic="Tin học Tiểu học"
            onRecordAssessment={handleRecordAssessment}
            externalPrompt={externalPrompt}
            onClearExternalPrompt={() => setExternalPrompt(null)}
            currentStudent={currentStudent}
            onOpenStudentModal={() => setShowStudentModal(true)}
            onOpenApiKeyModal={() => setShowApiKeyModal(true)}
          />
        )}

        {activeTab === 'scratch' && (
          <ScratchPlayground
            grade={grade}
            onAskNuta={handleAskNutaFromOtherTab}
            onRewardStar={handleRewardStar}
          />
        )}

        {activeTab === 'safety' && (
          <SafetyQuest
            grade={grade}
            onAskNuta={handleAskNutaFromOtherTab}
            onRecordAssessment={handleRecordAssessment}
            onRewardStar={handleRewardStar}
          />
        )}

        {activeTab === 'computer' && (
          <ComputerLab
            grade={grade}
            onAskNuta={handleAskNutaFromOtherTab}
            onRecordAssessment={handleRecordAssessment}
            onRewardStar={handleRewardStar}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherDashboard
            currentGrade={grade}
            records={records}
            onClearRecords={() => {
              setRecords([]);
              try {
                localStorage.removeItem(STORAGE_KEY_RECORDS);
              } catch (e) {
                console.warn('Could not clear records in localStorage', e);
              }
            }}
            students={students}
            onUpdateStudents={setStudents}
            googleSheetConfig={sheetConfig}
            onUpdateGoogleSheetConfig={setSheetConfig}
            onSelectStudent={handleSelectStudent}
            currentStudent={currentStudent}
          />
        )}
      </main>

      {/* Student Selector / Login Modal */}
      <StudentSelectorModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        students={students}
        currentStudent={currentStudent}
        onSelectStudent={handleSelectStudent}
        onOpenTeacherDashboard={() => setActiveTab('teacher')}
        isSyncing={isSyncingSheet}
        onSyncFromSheet={handleSyncSheet}
        sheetConfig={sheetConfig}
        onUpdateStudents={(newStudents) => {
          setStudents(newStudents);
          saveStudents(newStudents);
        }}
        onUpdateSheetConfig={(newConfig) => {
          setSheetConfig(newConfig);
          saveSheetConfig(newConfig);
        }}
      />

      {/* API Key & Model Settings Modal (Theo AI_INSTRUCTIONS.md) */}
      <ApiKeySettingsModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        isRequired={!getStoredApiKey()}
      />

      {/* Info & Pedagogical Socratic Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <NutaAvatar mood="happy" size="sm" />
                <div>
                  <h3 className="font-black text-lg text-slate-800">
                    Về Robot NUTA & Phương pháp Socratic
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    Trợ lý phát triển tư duy Tin học Tiểu học
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200">
                <span className="font-black text-sky-800 text-sm block mb-1">
                  1. Triết lý "Nghĩ trước - Hỏi sau" (The "Think-First" Rule)
                </span>
                <p>
                  NUTA không phải là bot làm bài tập hộ. Khi học sinh hỏi, NUTA sẽ không đưa ngay đáp án mà hướng dẫn các em tự quan sát, suy luận và tìm ra giải pháp.
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <span className="font-black text-amber-800 text-sm block mb-1">
                  2. Quy trình 6 bước tư duy:
                </span>
                <div className="font-semibold text-slate-800 space-y-1">
                  <div>❓ <strong>Bước 1 - Hỏi:</strong> Xác định rõ điều gì đang xảy ra.</div>
                  <div>🧠 <strong>Bước 2 - Nghĩ:</strong> Nhớ lại kiến thức bài học đã biết.</div>
                  <div>🔮 <strong>Bước 3 - Dự đoán:</strong> Đoán thử nếu sửa thì kết quả ra sao.</div>
                  <div>🧪 <strong>Bước 4 - Thử:</strong> Bấm thử trên máy tính/Scratch.</div>
                  <div>🔍 <strong>Bước 5 - Kiểm chứng:</strong> So sánh kết quả thực tế với dự đoán.</div>
                  <div>💡 <strong>Bước 6 - Giải thích:</strong> Hiểu rõ bản chất vấn đề.</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="font-black text-emerald-800 text-sm block mb-1">
                  3. Chiến lược gợi ý 3 cấp độ (Hinting Strategy):
                </span>
                <p>
                  <strong>Mức 1 (Nhẹ):</strong> Nhắc lại kiến thức nền.<br />
                  <strong>Mức 2 (Vừa):</strong> Đưa ra giả thuyết "Nếu... thì...".<br />
                  <strong>Mức 3 (Rõ):</strong> Chia nhỏ nhiệm vụ thành từng bước cực đơn giản.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-sm transition-all cursor-pointer"
            >
              Đã hiểu, cùng học với NUTA nào! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
