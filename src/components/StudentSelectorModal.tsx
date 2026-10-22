import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Search,
  X,
  CheckCircle2,
  GraduationCap,
  Star,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  AlertCircle,
  PlusCircle,
  Check,
  ClipboardPaste,
  HelpCircle,
  BookOpen,
  Sparkles,
  Smile,
  Hash,
  Delete,
  UserPlus,
  Heart
} from 'lucide-react';
import { GradeLevel, Student, GoogleSheetConfig } from '../types';
import { playClickPop, playSuccessChime, playVictoryFanfare } from '../utils/audio';
import {
  fetchStudentsFromGoogleSheet,
  saveStudents,
  saveSheetConfig,
  parseRawClipboardOrText,
  DEFAULT_STUDENTS_ROSTER,
  findStudentInRoster,
  findOrRegisterStudent,
  removeVietnameseTones,
} from '../utils/googleSheets';

interface StudentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
  onOpenTeacherDashboard?: () => void;
  isSyncing?: boolean;
  onSyncFromSheet?: () => void;
  sheetConfig?: GoogleSheetConfig;
  onUpdateStudents?: (students: Student[]) => void;
  onUpdateSheetConfig?: (config: GoogleSheetConfig) => void;
}

export const StudentSelectorModal: React.FC<StudentSelectorModalProps> = ({
  isOpen,
  onClose,
  students,
  currentStudent,
  onSelectStudent,
  onOpenTeacherDashboard,
  isSyncing = false,
  onSyncFromSheet,
  sheetConfig,
  onUpdateStudents,
  onUpdateSheetConfig,
}) => {
  // Ô nhập nhanh Mã HS hoặc Tên ở đầu trang (Ưu tiên hàng đầu)
  const [quickCodeInput, setQuickCodeInput] = useState('');

  // Chế độ xem bên dưới:
  // 'roster': Danh sách thẻ học sinh chạm là vào (mặc định)
  // 'numpad': Bàn phím số Numpad to rõ cho bé bấm số thứ tự
  // 'teacher': Bảng cấu hình Google Sheet dành riêng cho Thầy Cô
  const [viewMode, setViewMode] = useState<'roster' | 'numpad' | 'teacher'>('roster');

  // Bộ lọc danh sách
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Numpad bấm số thứ tự
  const [numpadInput, setNumpadInput] = useState('');

  // Thầy cô quản lý Google Sheet
  const [teacherTab, setTeacherTab] = useState<'link' | 'paste' | 'sample'>('link');
  const [sheetUrlInput, setSheetUrlInput] = useState(sheetConfig?.sheetUrl || '');
  const [sheetNameInput, setSheetNameInput] = useState(sheetConfig?.sheetName || '');
  const [clipboardData, setClipboardData] = useState('');
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (sheetConfig?.sheetUrl) {
      setSheetUrlInput(sheetConfig.sheetUrl);
    }
    if (sheetConfig?.sheetName) {
      setSheetNameInput(sheetConfig.sheetName);
    }
  }, [sheetConfig]);

  if (!isOpen) return null;

  // Thuật toán tìm kiếm thông minh tuyệt đối không bỏ sót
  const findStudentByCode = (rawInput: string): Student | undefined => {
    return findStudentInRoster(rawInput, students);
  };

  // XỬ LÝ NHẬP MÃ HS VÀO HỌC (HOÀN CHỈNH 100% - KHÔNG BAO GIỜ BỊ CHẶN)
  const handleQuickCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickCodeInput.trim();
    if (!raw) return;

    const res = findOrRegisterStudent(
      raw,
      students,
      (currentStudent?.grade as GradeLevel) || 'Lớp 3'
    );

    if (res) {
      if (res.isNew) {
        if (onUpdateStudents) {
          onUpdateStudents(res.updatedStudents);
        }
        saveStudents(res.updatedStudents);
      }
      playVictoryFanfare();
      onSelectStudent(res.student);
      onClose();
    }
  };

  // Chọn học sinh từ thẻ
  const handleSelect = (student: Student) => {
    playSuccessChime();
    onSelectStudent(student);
    onClose();
  };

  const handleClearStudent = () => {
    playClickPop();
    onSelectStudent(null);
    onClose();
  };

  // Numpad bấm số
  const handleNumpadPress = (val: string) => {
    playClickPop();
    if (numpadInput.length < 10) {
      setNumpadInput((prev) => prev + val);
    }
  };

  const handleNumpadBackspace = () => {
    playClickPop();
    setNumpadInput((prev) => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    playClickPop();
    setNumpadInput('');
  };

  // Tìm học sinh theo numpad
  const numpadMatchedStudent = useMemo(() => {
    if (!numpadInput.trim()) return null;
    return findStudentByCode(numpadInput.trim());
  }, [students, numpadInput]);

  // Đồng bộ qua link Google Sheet của Giáo viên
  const handleTeacherSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setSyncStatus({ type: 'error', message: 'Vui lòng dán liên kết Google Sheet của lớp vào ô.' });
      return;
    }

    setIsSyncingLocal(true);
    setSyncStatus({ type: 'info', message: 'Đang kết nối và lấy danh sách Mã HS từ Google Sheets...' });

    try {
      const res = await fetchStudentsFromGoogleSheet(sheetUrlInput.trim(), sheetNameInput.trim());

      if (res.students && res.students.length > 0) {
        if (onUpdateStudents) {
          onUpdateStudents(res.students);
        }
        saveStudents(res.students);

        const newConfig: GoogleSheetConfig = {
          sheetUrl: sheetUrlInput.trim(),
          sheetName: sheetNameInput.trim(),
          lastSyncTime: Date.now(),
          status: 'success',
          autoSync: true,
        };

        if (onUpdateSheetConfig) {
          onUpdateSheetConfig(newConfig);
        }
        saveSheetConfig(newConfig);

        playVictoryFanfare();
        setSyncStatus({
          type: 'success',
          message: `Đã nạp thành công ${res.students.length} học sinh từ Google Sheet vào ứng dụng! 🎉`,
        });
      } else {
        throw new Error('Không tìm thấy dòng học sinh hợp lệ nào trong bảng tính.');
      }
    } catch (err: any) {
      console.error('Direct Sheet sync failed:', err);
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Không thể đồng bộ. Hãy kiểm tra lại quyền xem công khai của Google Sheet.',
      });
    } finally {
      setIsSyncingLocal(false);
    }
  };

  // Dán trực tiếp từ bảng tính
  const handleTeacherPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipboardData.trim()) {
      setSyncStatus({ type: 'error', message: 'Vui lòng dán nội dung bảng đã copy (Ctrl+V) vào ô dưới.' });
      return;
    }

    try {
      const parsedStudents = parseRawClipboardOrText(clipboardData);
      if (parsedStudents.length === 0) {
        throw new Error('Chưa nhận diện được cột học sinh. Hãy đảm bảo copy cả dòng tiêu đề (Mã HS, Họ và tên, Lớp...).');
      }

      if (onUpdateStudents) {
        onUpdateStudents(parsedStudents);
      }
      saveStudents(parsedStudents);

      playVictoryFanfare();
      setSyncStatus({
        type: 'success',
        message: `Đã dán và nhập thành công ${parsedStudents.length} học sinh từ bảng tính! 🎉`,
      });
      setClipboardData('');
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Lỗi phân tích bảng tính. Vui lòng kiểm tra lại dữ liệu.',
      });
    }
  };

  // Nạp 12 học sinh mẫu chuẩn
  const handleLoadSampleRoster = () => {
    playClickPop();
    if (onUpdateStudents) {
      onUpdateStudents(DEFAULT_STUDENTS_ROSTER);
    }
    saveStudents(DEFAULT_STUDENTS_ROSTER);
    playSuccessChime();
    setSyncStatus({
      type: 'success',
      message: 'Đã nạp danh sách 12 học sinh mẫu chuẩn tiểu học (Lớp 1 đến Lớp 5)! ✨',
    });
  };

  // Lọc học sinh cho danh sách thẻ
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const termNorm = removeVietnameseTones(term);
      const nameNorm = removeVietnameseTones(s.name);

      return (
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        nameNorm.includes(termNorm) ||
        (s.className && s.className.toLowerCase().includes(term))
      );
    });
  }, [students, selectedGrade, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-['Nunito',sans-serif]">
        
        {/* ==================== PHẦN HEADER: Ô NHẬP MÃ HS TO RÕ NỔI BẬT ==================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 text-white relative shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner border border-white/30 animate-bounce duration-1000 shrink-0">
                🎓
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  Đăng Nhập Mã Học Sinh
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    NUTA AI
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-sky-100 font-bold mt-0.5">
                  Nhập Mã HS hoặc bấm chọn tên em bên dưới để vào học cùng Robot NUTA nhé!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClickPop();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Ô NHẬP NHANH MÃ HS TO RÕ RÀNG (KHÔNG THỂ BỎ LỠ) */}
          <form onSubmit={handleQuickCodeSubmit} className="mt-3.5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickCodeInput}
                onChange={(e) => setQuickCodeInput(e.target.value)}
                placeholder="Nhập Mã HS hoặc Tên của em (VD: HS001, 1, 240101, Bảo...)"
                className="w-full bg-white text-slate-900 placeholder-slate-400 font-black text-sm sm:text-base pl-10 pr-4 py-3 rounded-2xl border-2 border-white/40 focus:outline-none focus:ring-4 focus:ring-amber-300 shadow-md transition-all"
                autoFocus
              />
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-black text-sm sm:text-base rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <span>VÀO HỌC NGAY</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* 3 Tab chọn cách thức thuận tiện */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 bg-black/15 p-1 rounded-2xl backdrop-blur-xs text-xs font-black">
            <button
              type="button"
              onClick={() => {
                playClickPop();
                setViewMode('roster');
              }}
              className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'roster'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>🎈</span>
              <span className="truncate">Danh Sách Lớp ({students.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickPop();
                setViewMode('numpad');
              }}
              className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'numpad'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>🔢</span>
              <span className="truncate">Bàn Phím Số STT</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playClickPop();
                setViewMode('teacher');
              }}
              className={`py-1.5 px-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === 'teacher'
                  ? 'bg-white text-purple-800 shadow-sm'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>📁</span>
              <span className="truncate">Nguồn Google Sheet</span>
            </button>
          </div>
        </div>

        {/* THÔNG BÁO TRẠNG THÁI ĐĂNG NHẬP HIỆN TẠI */}
        {currentStudent ? (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentStudent.gender === 'Nữ' ? '👧' : '👦'}</span>
              <span className="font-bold text-slate-600">Đang học:</span>
              <span className="font-black text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 font-mono">
                {currentStudent.id}
              </span>
              <span className="font-black text-emerald-900">{currentStudent.name}</span>
              <span className="text-slate-500 font-bold">({currentStudent.className || currentStudent.grade})</span>
            </div>
            <button
              onClick={handleClearStudent}
              className="text-slate-500 hover:text-rose-600 font-bold underline cursor-pointer text-xs"
            >
              Đổi sang Khách
            </button>
          </div>
        ) : (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
            <span>👤 Chưa chọn học sinh (Đang học chế độ Khách). Nhập mã ở trên hoặc chọn tên bên dưới:</span>
          </div>
        )}

        {/* ===================== VIEW 1: DANH SÁCH HỌC SINH (CHẠM LÀ VÀO) ===================== */}
        {viewMode === 'roster' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Bộ lọc Khối Lớp & Tìm kiếm */}
            <div className="p-3 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['all', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map((g) => {
                  const isActive = selectedGrade === g;
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        playClickPop();
                        setSelectedGrade(g);
                      }}
                      className={`px-3 py-1 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả khối' : g}
                    </button>
                  );
                })}
              </div>

              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Lọc tên nhanh..."
                  className="w-full bg-white border border-sky-200 rounded-xl pl-8 pr-3 py-1 font-bold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                />
              </div>
            </div>

            {/* Lưới thẻ học sinh to rõ */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[46vh]">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl">🔍</div>
                  <p className="font-black text-slate-700 text-sm">
                    Không tìm thấy học sinh phù hợp với "{searchTerm}"
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Em có thể gõ trực tiếp tên hoặc mã số của em vào ô trên cùng rồi bấm <strong>"VÀO HỌC NGAY"</strong> để bắt đầu nhé!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredStudents.map((student) => {
                    const isCurrent = currentStudent?.id === student.id;
                    const isBoy = student.gender === 'Nam' || !student.gender;

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleSelect(student)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group select-none ${
                          isCurrent
                            ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300'
                            : 'bg-white border-slate-200 hover:border-sky-400 hover:bg-sky-50/70 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${
                              isCurrent
                                ? 'bg-amber-400 text-white'
                                : isBoy
                                ? 'bg-sky-100 text-sky-700 border border-sky-200'
                                : 'bg-pink-100 text-pink-700 border border-pink-200'
                            }`}
                          >
                            {isBoy ? '👦' : '👧'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 border border-slate-300">
                                {student.id}
                              </span>
                              <span className="font-black text-sm text-slate-900 truncate">
                                {student.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1">
                              <span className="text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 text-[11px]">
                                {student.className || student.grade}
                              </span>
                              {student.stars !== undefined && (
                                <span className="flex items-center gap-0.5 text-amber-600 font-black">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> {student.stars}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCurrent ? (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center gap-1 shadow-xs">
                              <UserCheck className="w-4 h-4" /> Đang học
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-xl bg-sky-500 group-hover:bg-sky-600 text-white font-black text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>Vào học</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: BÀN PHÍM SỐ NUMPAD (BẤM SỐ THỨ TỰ) ===================== */}
        {viewMode === 'numpad' && (
          <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center space-y-4 max-h-[50vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <span className="text-xs sm:text-sm font-black text-slate-700 flex items-center justify-center gap-1">
                <span>🔢 Em hãy bấm số thứ tự của em trong sổ lớp hoặc mã số:</span>
              </span>
            </div>

            {/* Ô hiển thị số to */}
            <div className="w-full max-w-xs bg-slate-100 border-2 border-indigo-300 rounded-2xl p-3 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-slate-400">Số em bấm:</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-indigo-700 tracking-wider">
                {numpadInput || '___'}
              </span>
              {numpadInput && (
                <button
                  onClick={handleNumpadClear}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Nhận diện học sinh khớp số */}
            {numpadMatchedStudent ? (
              <div className="w-full max-w-xs p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl animate-in zoom-in-95 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{numpadMatchedStudent.gender === 'Nữ' ? '👧' : '👦'}</span>
                  <div>
                    <div className="font-black text-sm text-emerald-900">{numpadMatchedStudent.name}</div>
                    <div className="text-xs text-emerald-700 font-bold">
                      [{numpadMatchedStudent.id}] • {numpadMatchedStudent.className || numpadMatchedStudent.grade}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSelect(numpadMatchedStudent)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>Đúng em rồi!</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : numpadInput ? (
              <button
                onClick={() => {
                  setQuickCodeInput(numpadInput);
                  handleQuickCodeSubmit({ preventDefault: () => {} } as any);
                }}
                className="text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-300 cursor-pointer"
              >
                Vào học ngay với mã số "{numpadInput}" ➔
              </button>
            ) : null}

            {/* Bàn phím số Numpad ảo to đẹp */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="h-11 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl font-black text-lg text-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="h-11 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 rounded-2xl font-black text-xs text-rose-700 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <Delete className="w-4 h-4" />
                <span>Xóa</span>
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-11 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl font-black text-lg text-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => {
                  if (numpadMatchedStudent) {
                    handleSelect(numpadMatchedStudent);
                  } else if (numpadInput) {
                    setQuickCodeInput(numpadInput);
                    handleQuickCodeSubmit({ preventDefault: () => {} } as any);
                  }
                }}
                disabled={!numpadInput}
                className="h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-black text-xs transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Vào học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: NGUỒN DỮ LIỆU GOOGLE SHEET ===================== */}
        {viewMode === 'teacher' && (
          <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3 max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                <span>📁 Chọn phương thức kết nối Google Sheet danh sách lớp:</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTeacherTab('link')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    teacherTab === 'link' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  🔗 1. Link Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherTab('paste')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    teacherTab === 'paste' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  📋 2. Dán bảng (Ctrl+V)
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleRoster}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                >
                  ⭐ 3. Mẫu chuẩn
                </button>
              </div>
            </div>

            {teacherTab === 'link' && (
              <form onSubmit={handleTeacherSync} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="Dán link Google Sheet (https://docs.google.com/spreadsheets/d/...)"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={isSyncingLocal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocal ? 'animate-spin' : ''}`} />
                    <span>{isSyncingLocal ? 'Đang nạp...' : 'Đồng bộ ngay'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  💡 Bấm nút <strong>"Chia sẻ"</strong> trên Google Sheet ➔ chọn <strong>"Bất kỳ ai có đường liên kết ➔ Người xem"</strong>.
                </p>
              </form>
            )}

            {teacherTab === 'paste' && (
              <form onSubmit={handleTeacherPaste} className="space-y-2">
                <textarea
                  rows={3}
                  value={clipboardData}
                  onChange={(e) => setClipboardData(e.target.value)}
                  placeholder={`Bôi đen bảng trong Google Sheet hoặc Excel (Mã HS, Họ và tên, Lớp...), bấm Ctrl+C rồi dán vào đây:`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">100% không lo lỗi CORS hay quyền chia sẻ riêng tư.</span>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Nhập vào hệ thống</span>
                  </button>
                </div>
              </form>
            )}

            {syncStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : syncStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {syncStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
                <button onClick={() => setSyncStatus(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="p-3 sm:px-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              Tổng số học sinh: <strong>{students.length}</strong> bạn
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenTeacherDashboard && (
              <button
                onClick={() => {
                  playClickPop();
                  onClose();
                  onOpenTeacherDashboard();
                }}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Góc Giáo viên</span>
              </button>
            )}

            <button
              onClick={handleClearStudent}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Học chế độ Khách
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
