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
import { playClickPop, playSuccessChime } from '../utils/audio';
import {
  fetchStudentsFromGoogleSheet,
  saveStudents,
  saveSheetConfig,
  parseRawClipboardOrText,
  DEFAULT_STUDENTS_ROSTER,
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
  // Chế độ cho học sinh tiểu học:
  // 'pick': Chạm vào tên (Cách dễ nhất - 1 chạm là vào)
  // 'numpad': Bàn phím số to (Gõ số thứ tự hoặc mã số)
  // 'new': Em là học sinh mới (Tự nhập tên và vào học ngay)
  const [kidMode, setKidMode] = useState<'pick' | 'numpad' | 'new'>('pick');

  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Nhập số thứ tự qua Numpad
  const [numpadInput, setNumpadInput] = useState('');

  // Đăng ký học sinh mới trực tiếp
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState<GradeLevel>('Lớp 3');
  const [newStudentGender, setNewStudentGender] = useState<'Nam' | 'Nữ'>('Nam');

  // Quản lý panel kết nối Google Sheet của Giáo viên
  const [showTeacherConnect, setShowTeacherConnect] = useState(false);
  const [connectTab, setConnectTab] = useState<'link' | 'paste' | 'guide'>('link');
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

  // Lấy danh sách các lớp con (3A, 3B, 4A...)
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    students.forEach((s) => {
      if (s.className) classes.add(s.className);
    });
    return Array.from(classes).sort();
  }, [students]);

  // Lọc học sinh theo từ khóa tìm kiếm, khối lớp và lớp con
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedClass !== 'all' && s.className !== selectedClass) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      return (
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        (s.className && s.className.toLowerCase().includes(term))
      );
    });
  }, [students, selectedGrade, selectedClass, searchTerm]);

  // Tìm học sinh theo số thứ tự hoặc mã khi dùng bàn phím số
  const numpadMatchedStudent = useMemo(() => {
    if (!numpadInput.trim()) return null;
    const term = numpadInput.trim().toLowerCase();
    const termNum = parseInt(term, 10);

    return students.find((s) => {
      // 1. Khớp chính xác ID
      if (s.id.toLowerCase() === term) return true;
      // 2. Khớp số thứ tự (VD: gõ 1 -> khớp HS001 hoặc 01)
      if (!isNaN(termNum) && termNum > 0) {
        const sDigits = s.id.replace(/[^0-9]/g, '');
        if (sDigits && parseInt(sDigits, 10) === termNum) return true;
      }
      return false;
    });
  }, [students, numpadInput]);

  // Chọn học sinh và reo chuông chúc mừng
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

  // Tạo học sinh mới nhanh
  const handleCreateNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newStudentName.trim();
    if (!name) return;

    // Tự sinh mã dễ nhớ từ tên (VD: HS-BAO, HS-AN...)
    const nameParts = name.split(' ');
    const firstName = nameParts[nameParts.length - 1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'EM';
    const autoId = `HS${String(students.length + 1).padStart(3, '0')}`;

    const newStudent: Student = {
      id: autoId,
      name,
      grade: newStudentGrade,
      className: `${newStudentGrade.replace('Lớp ', '')}A`,
      gender: newStudentGender,
      stars: 12,
    };

    const updated = [newStudent, ...students];
    if (onUpdateStudents) {
      onUpdateStudents(updated);
    }
    saveStudents(updated);

    playSuccessChime();
    onSelectStudent(newStudent);
    onClose();
  };

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

        playSuccessChime();
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

      playSuccessChime();
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden font-['Nunito',sans-serif]">
        
        {/* HEADER DÀNH CHO TIỂU HỌC: THÂN THIỆN, VUI TƯƠI, MÀU SẮC TƯƠI SÁNG */}
        <div className="p-4 sm:p-5 border-b border-sky-400 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 text-white relative shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner border border-white/30 animate-bounce duration-1000">
                🎓
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  Chào Bạn Nhỏ! 👋
                  <span className="bg-amber-400 text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Vào Học Cùng NUTA
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-sky-100 font-bold mt-0.5">
                  Hãy chọn tên hoặc số thứ tự của em để nhận sao tích lũy nhé! ⭐
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

          {/* 3 NÚT CHỌN CÁCH ĐĂNG NHẬP DỄ NHẤT CHO BÉ */}
          <div className="mt-4 grid grid-cols-3 gap-2 bg-black/15 p-1 rounded-2xl backdrop-blur-xs">
            <button
              onClick={() => {
                playClickPop();
                setKidMode('pick');
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                kidMode === 'pick'
                  ? 'bg-white text-sky-700 shadow-md scale-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>🎈</span>
              <span className="truncate">1. Chọn Tên Em</span>
            </button>

            <button
              onClick={() => {
                playClickPop();
                setKidMode('numpad');
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                kidMode === 'numpad'
                  ? 'bg-white text-indigo-700 shadow-md scale-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>🔢</span>
              <span className="truncate">2. Bấm Số Thứ Tự</span>
            </button>

            <button
              onClick={() => {
                playClickPop();
                setKidMode('new');
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                kidMode === 'new'
                  ? 'bg-white text-emerald-700 shadow-md scale-100'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>✨</span>
              <span className="truncate">3. Em Là Bạn Mới</span>
            </button>
          </div>
        </div>

        {/* THÔNG BÁO HỌC SINH ĐANG HỌC HIỆN TẠI */}
        {currentStudent ? (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentStudent.gender === 'Nữ' ? '👧' : '👦'}</span>
              <span className="font-bold text-slate-600">Đang học:</span>
              <span className="font-black text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-amber-300 font-mono">
                {currentStudent.id}
              </span>
              <span className="font-black text-amber-900">{currentStudent.name}</span>
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
            <span>👤 Chưa chọn học sinh (Đang học chế độ Khách).</span>
          </div>
        )}

        {/* ===================== CÁCH 1: CHỌN TÊN EM (1 CHẠM LÀ VÀO) ===================== */}
        {kidMode === 'pick' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Bộ lọc Khối Lớp to rõ */}
            <div className="p-3 bg-sky-50/70 border-b border-sky-100 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black text-sky-900 flex items-center gap-1">
                  <span>🏫 Chọn khối lớp của em:</span>
                </span>

                {/* Ô tìm kiếm nhanh tên */}
                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Gõ tên em để tìm nhanh..."
                    className="w-full bg-white border border-sky-200 rounded-xl pl-8 pr-3 py-1 font-bold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-2xs"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Nút bấm chọn Khối lớp to, đẹp cho ngón tay chạm */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {['all', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map((g) => {
                  const isActive = selectedGrade === g;
                  return (
                    <button
                      key={g}
                      onClick={() => {
                        playClickPop();
                        setSelectedGrade(g);
                        setSelectedClass('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xs scale-102 ring-2 ring-sky-300'
                          : 'bg-white text-slate-700 hover:bg-sky-100 border border-sky-200'
                      }`}
                    >
                      {g === 'all' ? 'Tất cả lớp' : g}
                    </button>
                  );
                })}
              </div>

              {/* Nút lọc lớp con nếu có (3A, 3B...) */}
              {availableClasses.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Lớp cụ thể:</span>
                  <button
                    onClick={() => setSelectedClass('all')}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                      selectedClass === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {availableClasses.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedClass(c)}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                        selectedClass === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      Lớp {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Danh sách thẻ tên học sinh: To, rõ, bo góc tròn, chạm vào là xong */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[46vh]">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-4xl">🔍</div>
                  <p className="font-black text-slate-700 text-base">
                    Chưa thấy bạn nào tên "{searchTerm}"
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                    Em có thể chuyển sang tab <strong>"✨ 3. Em là bạn mới"</strong> ở trên để tự ghi tên mình vào học ngay nhé!
                  </p>
                  <button
                    onClick={() => {
                      setKidMode('new');
                      setNewStudentName(searchTerm.trim());
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tự ghi tên em "{searchTerm.trim()}" để vào học</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredStudents.map((student, idx) => {
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
                          {/* Avatar ngộ nghĩnh */}
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-xs ${
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
                              {/* Số thứ tự / Mã số to rõ */}
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

                        {/* Nút bấm chọn */}
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
                              <span>Em đây</span>
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

        {/* ===================== CÁCH 2: BÀN PHÍM SỐ NUMPAD TO (NHẬP STT HOẶC MÃ SỐ) ===================== */}
        {kidMode === 'numpad' && (
          <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center space-y-4 max-h-[55vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <span className="text-xs sm:text-sm font-black text-slate-700 flex items-center justify-center gap-1">
                <span>🔢 Em hãy bấm số thứ tự của em trong sổ lớp hoặc mã số:</span>
              </span>
              <p className="text-xs text-slate-400 font-medium">
                (Ví dụ: Bạn số 1 thì bấm số 1, bạn số 5 bấm số 5, bạn mã HS003 thì bấm 3)
              </p>
            </div>

            {/* Ô hiển thị số to đùng */}
            <div className="w-full max-w-xs bg-slate-100 border-2 border-indigo-300 rounded-2xl p-3 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-slate-400">Số của em:</span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-indigo-700 tracking-wider">
                {numpadInput || '___'}
              </span>
              {numpadInput && (
                <button
                  onClick={handleNumpadClear}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Xóa hết
                </button>
              )}
            </div>

            {/* Nếu tìm thấy học sinh tương ứng với số vừa bấm */}
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
              <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                Chưa thấy học sinh số <strong>"{numpadInput}"</strong>. Em thử bấm lại nhé!
              </div>
            ) : null}

            {/* Bàn phím số Numpad ảo to đẹp */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="h-12 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl font-black text-xl text-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleNumpadBackspace}
                className="h-12 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 rounded-2xl font-black text-xs text-rose-700 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <Delete className="w-4 h-4" />
                <span>Xóa</span>
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-12 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl font-black text-xl text-slate-800 transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => {
                  if (numpadMatchedStudent) {
                    handleSelect(numpadMatchedStudent);
                  }
                }}
                disabled={!numpadMatchedStudent}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-black text-xs transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Vào học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== CÁCH 3: EM LÀ BẠN MỚI (TỰ NHẬP TÊN TRONG 3 GIÂY) ===================== */}
        {kidMode === 'new' && (
          <form onSubmit={handleCreateNewStudent} className="p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-4 max-h-[55vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <span className="text-sm sm:text-base font-black text-slate-800 flex items-center justify-center gap-1.5">
                <span>✨ Em chưa có tên trong danh sách? Hãy tự ghi tên em nhé!</span>
              </span>
              <p className="text-xs text-slate-500 font-medium">
                NUTA sẽ tự động tạo thẻ học sinh và lưu sao tích lũy cho em ngay lập tức!
              </p>
            </div>

            <div className="space-y-3 max-w-md mx-auto w-full">
              {/* Ô nhập tên */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  1. Họ và tên của em:
                </label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Gia Bảo, Lê Thảo My..."
                  className="w-full bg-slate-50 border-2 border-sky-300 rounded-2xl px-4 py-2.5 font-bold text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white shadow-2xs"
                />
              </div>

              {/* Chọn Giới tính */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  2. Em là bạn nam hay bạn nữ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickPop();
                      setNewStudentGender('Nam');
                    }}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      newStudentGender === 'Nam'
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">👦</span>
                    <span>Bạn Nam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickPop();
                      setNewStudentGender('Nữ');
                    }}
                    className={`p-2.5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      newStudentGender === 'Nữ'
                        ? 'bg-pink-50 border-pink-500 text-pink-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">👧</span>
                    <span>Bạn Nữ</span>
                  </button>
                </div>
              </div>

              {/* Chọn Khối lớp */}
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  3. Em đang học khối lớp mấy?
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'] as GradeLevel[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        playClickPop();
                        setNewStudentGrade(g);
                      }}
                      className={`py-2 rounded-xl border-2 font-black text-xs cursor-pointer transition-all ${
                        newStudentGrade === g
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nút vào học */}
              <button
                type="submit"
                disabled={!newStudentName.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>🚀 Bắt đầu học cùng NUTA ngay!</span>
              </button>
            </div>
          </form>
        )}

        {/* ===================== KHU VỰC DÀNH CHO THẦY CÔ (KẾT NỐI GOOGLE SHEET) ===================== */}
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-bold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>
                Tổng số học sinh lớp: <strong>{students.length}</strong> bạn
              </span>
            </div>

            {/* Nút bật tắt cấu hình dành riêng cho Thầy Cô */}
            <button
              onClick={() => {
                playClickPop();
                setShowTeacherConnect(!showTeacherConnect);
              }}
              className="text-indigo-700 hover:text-indigo-900 font-black flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition-colors"
            >
              <span>👩‍🏫 Dành cho Giáo viên: {showTeacherConnect ? 'Đóng cấu hình' : 'Nạp danh sách từ Google Sheet'}</span>
            </button>
          </div>

          {/* Form cấu hình Google Sheet mở ra khi thầy cô bấm */}
          {showTeacherConnect && (
            <div className="p-4 bg-white border-t border-indigo-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                  <span>⚙️ Chọn cách nạp danh sách học sinh cho cả lớp:</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setConnectTab('link')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      connectTab === 'link' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    🔗 Link Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectTab('paste')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      connectTab === 'paste' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📋 Dán bảng (Ctrl+V)
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleRoster}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                  >
                    ⭐ Mẫu chuẩn
                  </button>
                </div>
              </div>

              {connectTab === 'link' && (
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
                    💡 Đảm bảo bảng tính đã bấm nút <strong>"Chia sẻ"</strong> ➔ chọn <strong>"Bất kỳ ai có đường liên kết ➔ Người xem"</strong>.
                  </p>
                </form>
              )}

              {connectTab === 'paste' && (
                <form onSubmit={handleTeacherPaste} className="space-y-2">
                  <textarea
                    rows={3}
                    value={clipboardData}
                    onChange={(e) => setClipboardData(e.target.value)}
                    placeholder={`Bôi đen các cột trong Google Sheet hoặc Excel (Mã HS, Họ và tên, Lớp...), bấm Ctrl+C rồi dán vào đây:`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">100% không lo lỗi CORS hay quyền chia sẻ.</span>
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
        </div>

      </div>
    </div>
  );
};
