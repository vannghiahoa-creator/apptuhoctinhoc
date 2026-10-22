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
  Sparkles
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [quickCodeInput, setQuickCodeInput] = useState('');
  
  // Quản lý panel kết nối Google Sheet
  const [showSheetConnect, setShowSheetConnect] = useState(false);
  const [connectTab, setConnectTab] = useState<'link' | 'paste' | 'guide'>('link');
  const [sheetUrlInput, setSheetUrlInput] = useState(sheetConfig?.sheetUrl || '');
  const [sheetNameInput, setSheetNameInput] = useState(sheetConfig?.sheetName || '');
  const [clipboardData, setClipboardData] = useState('');
  
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [unfoundCode, setUnfoundCode] = useState<string | null>(null);

  useEffect(() => {
    if (sheetConfig?.sheetUrl) {
      setSheetUrlInput(sheetConfig.sheetUrl);
    }
    if (sheetConfig?.sheetName) {
      setSheetNameInput(sheetConfig.sheetName);
    }
  }, [sheetConfig]);

  if (!isOpen) return null;

  // Lọc học sinh theo từ khóa tìm kiếm và khối lớp
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      return (
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        (s.className && s.className.toLowerCase().includes(term))
      );
    });
  }, [students, selectedGrade, searchTerm]);

  // Tìm kiếm thông minh Mã HS hoặc tên học sinh
  const findStudentByCode = (rawInput: string): Student | undefined => {
    const raw = rawInput.trim();
    if (!raw) return undefined;

    const term = raw.toLowerCase();
    const termClean = term.replace(/[^0-9a-z]/g, '');
    const termDigitsOnly = term.replace(/[^0-9]/g, '');
    const termNum = termDigitsOnly ? parseInt(termDigitsOnly, 10) : NaN;

    // 1. So khớp chính xác ID (không phân biệt hoa thường)
    const exactId = students.find((s) => s.id.toLowerCase() === term);
    if (exactId) return exactId;

    // 2. So khớp ID sau khi lược bỏ khoảng trắng, dấu gạch ngang (VD: HS-01 -> HS01)
    const cleanId = students.find((s) => s.id.toLowerCase().replace(/[^0-9a-z]/g, '') === termClean);
    if (cleanId) return cleanId;

    // 3. So khớp dạng số thứ tự / số ID (VD: gõ "1" hoặc "01" -> khớp "HS001", "HS01", "1")
    if (!isNaN(termNum) && termNum > 0) {
      const numMatch = students.find((s) => {
        const sDigits = s.id.replace(/[^0-9]/g, '');
        if (!sDigits) return false;
        const sNum = parseInt(sDigits, 10);
        return sNum === termNum;
      });
      if (numMatch) return numMatch;
    }

    // 4. So khớp theo tên học sinh chính xác
    const exactName = students.find((s) => s.name.toLowerCase() === term);
    if (exactName) return exactName;

    // 5. So khớp theo tên gọi (tên cuối cùng, VD: học sinh chỉ gõ "Bảo" -> tìm thấy nếu chỉ có 1 bạn tên Bảo)
    const matchingByName = students.filter((s) => {
      const nameParts = s.name.toLowerCase().split(' ');
      const lastName = nameParts[nameParts.length - 1];
      return lastName === term || s.name.toLowerCase().includes(term);
    });
    if (matchingByName.length === 1) {
      return matchingByName[0];
    }

    return undefined;
  };

  // Xử lý gửi mã nhanh
  const handleQuickCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnfoundCode(null);
    if (!quickCodeInput.trim()) return;

    const found = findStudentByCode(quickCodeInput);

    if (found) {
      playSuccessChime();
      onSelectStudent(found);
      onClose();
    } else {
      setUnfoundCode(quickCodeInput.trim().toUpperCase());
      // Tự động điền vào ô tìm kiếm bên dưới để học sinh dễ quan sát danh sách
      setSearchTerm(quickCodeInput.trim());
    }
  };

  // Vào học trực tiếp với mã mới (không bị chặn)
  const handleCreateAndJoin = (code: string) => {
    const newStudent: Student = {
      id: code,
      name: `Học sinh ${code}`,
      grade: 'Lớp 3',
      className: 'Lớp Tin học',
      stars: 12,
    };

    const updated = [newStudent, ...students.filter((s) => s.id !== code)];
    if (onUpdateStudents) {
      onUpdateStudents(updated);
    }
    saveStudents(updated);

    playSuccessChime();
    onSelectStudent(newStudent);
    onClose();
  };

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

  // Đồng bộ qua link Google Sheet
  const handleDirectSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setSyncStatus({ type: 'error', message: 'Vui lòng dán liên kết Google Sheet của lớp vào ô bên dưới.' });
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
          message: `Đã nhập thành công ${res.students.length} học sinh từ Google Sheet vào ứng dụng! 🎉`,
        });
        setUnfoundCode(null);
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

  // Nhập trực tiếp bằng cách dán văn bản (Ctrl+V) từ Google Sheets / Excel
  const handleImportFromClipboard = (e: React.FormEvent) => {
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
      setUnfoundCode(null);
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
    setUnfoundCode(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl shadow-inner">
                🎓
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                  Đăng Nhập Mã Học Sinh
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Google Sheet
                  </span>
                </h3>
                <p className="text-xs text-sky-100 font-medium">
                  Nhập Mã HS hoặc chọn tên của em để NUTA đồng hành và ghi nhận thành tích nhé!
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
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Code Input Box */}
          <form onSubmit={handleQuickCodeSubmit} className="mt-3.5 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickCodeInput}
                onChange={(e) => {
                  setQuickCodeInput(e.target.value);
                  if (unfoundCode) setUnfoundCode(null);
                }}
                placeholder="Nhập Mã HS hoặc Tên (VD: HS001, 1, 240101, Bảo...)"
                className="w-full bg-white text-slate-800 placeholder-slate-400 font-bold text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Vào học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Cảnh báo khi chưa tìm thấy mã */}
          {unfoundCode && (
            <div className="mt-2.5 p-2.5 bg-amber-50 text-slate-800 rounded-xl border border-amber-300 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Chưa thấy mã <strong>"{unfoundCode}"</strong> trong danh sách hiện tại.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCreateAndJoin(unfoundCode)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-[11px] flex items-center gap-1 shadow-2xs"
                  title="Tạo nhanh tài khoản với mã này để tiếp tục học"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Vào học với mã này</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSheetConnect(true);
                    setConnectTab('link');
                  }}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer text-[11px]"
                >
                  🔗 Đồng bộ Google Sheet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Thanh trạng thái Google Sheet & Nút mở kết nối */}
        <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold truncate">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            {sheetConfig?.sheetUrl ? (
              <span className="truncate">
                Nguồn Sheet: <strong className="font-mono text-indigo-700">{sheetConfig.sheetUrl.slice(0, 42)}...</strong>
              </span>
            ) : (
              <span className="text-slate-600">Chưa gắn link Google Sheet của lớp</span>
            )}
          </div>
          <button
            onClick={() => {
              playClickPop();
              setShowSheetConnect(!showSheetConnect);
            }}
            className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer text-[11px] shrink-0 ml-2 flex items-center gap-1"
          >
            <span>{showSheetConnect ? 'Thu gọn' : '⚙️ Nhập / Đổi nguồn Google Sheet'}</span>
          </button>
        </div>

        {/* Panel kết nối / Nhập dữ liệu Google Sheet đa phương thức */}
        {showSheetConnect && (
          <div className="p-3.5 sm:px-4 bg-slate-50 border-b border-indigo-200 space-y-3 animate-in fade-in">
            {/* Tab chuyển đổi cách thức nhập */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setConnectTab('link')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  connectTab === 'link'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                🔗 1. Đồng bộ bằng Link Google Sheet
              </button>
              <button
                type="button"
                onClick={() => setConnectTab('paste')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  connectTab === 'paste'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                📋 2. Dán trực tiếp từ Sheet (Ctrl+V)
              </button>
              <button
                type="button"
                onClick={handleLoadSampleRoster}
                className="ml-auto text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                title="Khôi phục 12 học sinh mẫu chuẩn để trải nghiệm"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Nạp mẫu chuẩn</span>
              </button>
            </div>

            {/* TAB 1: NHẬP QUA ĐƯỜNG LINK GOOGLE SHEET */}
            {connectTab === 'link' && (
              <form onSubmit={handleDirectSync} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Dán liên kết Google Sheet đã mở quyền xem:
                  </span>
                  <button
                    type="button"
                    onClick={() => setConnectTab('guide')}
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Cách mở quyền xem?</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                  />
                  <input
                    type="text"
                    value={sheetNameInput}
                    onChange={(e) => setSheetNameInput(e.target.value)}
                    placeholder="Tên sheet (Tùy chọn)"
                    className="w-full sm:w-36 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                    title="Nếu bảng tính có nhiều Sheet, hãy nhập tên sheet tại đây"
                  />
                  <button
                    type="submit"
                    disabled={isSyncingLocal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocal ? 'animate-spin' : ''}`} />
                    <span>{isSyncingLocal ? 'Đang tải...' : 'Đồng bộ ngay'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: DÁN TRỰC TIẾP TỪ BẢNG TÍNH GOOGLE SHEET / EXCEL (CTRL+V) */}
            {connectTab === 'paste' && (
              <form onSubmit={handleImportFromClipboard} className="space-y-2">
                <div className="text-xs text-slate-600 font-medium">
                  💡 <strong>Cách làm nhanh:</strong> Mở Google Sheet → Bôi đen các cột (Mã HS, Họ tên, Lớp...) → Bấm <strong>Ctrl+C</strong> → Dán <strong>Ctrl+V</strong> vào khung bên dưới:
                </div>
                <textarea
                  rows={3}
                  value={clipboardData}
                  onChange={(e) => setClipboardData(e.target.value)}
                  placeholder={`Mã HS\tHọ và tên\tLớp\tGiới tính\nHS001\tNguyễn Gia Bảo\t3A\tNam\nHS002\tTrần Minh Quân\t3A\tNam`}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    100% không lo lỗi CORS hay quyền truy cập riêng tư.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Nhập danh sách học sinh</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: HƯỚNG DẪN MỞ QUYỀN CHIA SẺ */}
            {connectTab === 'guide' && (
              <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-indigo-900 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>3 bước mở quyền xem Google Sheet công khai:</span>
                </div>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-600">
                  <li>Mở bảng tính Google Sheet của bạn trên trình duyệt.</li>
                  <li>Bấm nút <strong>"Chia sẻ" (Share)</strong> ở góc trên bên phải.</li>
                  <li>Tại mục <em>Quyền truy cập chung</em>, đổi thành <strong>"Bất kỳ ai có đường liên kết"</strong> với vai trò <strong>"Người xem"</strong>.</li>
                </ol>
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setConnectTab('link')}
                    className="text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    ← Quay lại dán liên kết
                  </button>
                </div>
              </div>
            )}

            {/* Thông báo kết quả đồng bộ */}
            {syncStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : syncStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200 whitespace-pre-line'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {syncStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : syncStatus.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
                <button
                  onClick={() => setSyncStatus(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Học sinh hiện tại đang chọn */}
        {currentStudent ? (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-600">Đang học:</span>
              <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                [{currentStudent.id}]
              </span>
              <span className="font-bold text-slate-800">{currentStudent.name}</span>
              <span className="text-slate-500">({currentStudent.className || currentStudent.grade})</span>
            </div>
            <button
              onClick={handleClearStudent}
              className="text-slate-500 hover:text-rose-600 font-bold underline cursor-pointer text-[11px]"
            >
              Đổi sang Khách
            </button>
          </div>
        ) : (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>👤 Hiện đang học với tư cách: <strong>Khách vãng lai</strong> (Chưa chọn Mã HS).</span>
            </span>
          </div>
        )}

        {/* Thanh công cụ tìm kiếm và lọc khối lớp */}
        <div className="p-3 sm:px-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Mã HS, Họ và tên hoặc Lớp..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'].map((g) => {
              const isActive = selectedGrade === g;
              return (
                <button
                  key={g}
                  onClick={() => {
                    playClickPop();
                    setSelectedGrade(g);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g === 'all' ? 'Tất cả' : g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danh sách thẻ học sinh */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 max-h-[48vh]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="font-bold text-slate-700 text-sm">
                Không tìm thấy học sinh nào phù hợp với "{searchTerm}"
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Bấm nút <strong>"Nhập / Đổi nguồn Google Sheet"</strong> ở thanh trên để đồng bộ danh sách lớp của bạn, hoặc bấm "Vào học với mã này" để bắt đầu ngay!
              </p>
              {searchTerm.trim() && (
                <button
                  onClick={() => handleCreateAndJoin(searchTerm.trim().toUpperCase())}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Vào học với mã "{searchTerm.trim().toUpperCase()}"</span>
                </button>
              )}
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-sky-50 border-sky-400 shadow-xs ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-xs hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          isCurrent
                            ? 'bg-sky-500 text-white'
                            : isBoy
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {isBoy ? '👦' : '👧'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {student.id}
                          </span>
                          <span className="font-black text-xs text-slate-800 truncate">
                            {student.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-0.5">
                          <span className="text-indigo-600">{student.className || student.grade}</span>
                          {student.dob && <span>• {student.dob}</span>}
                          {student.stars !== undefined && (
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400" /> {student.stars}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isCurrent ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 shadow-2xs">
                          <UserCheck className="w-3 h-3" /> Đang chọn
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-600 font-bold text-[10px] transition-colors">
                          Chọn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>
              Tổng số: <strong>{students.length}</strong> học sinh
            </span>
            {onSyncFromSheet && (
              <button
                onClick={onSyncFromSheet}
                disabled={isSyncing || isSyncingLocal}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold ml-1 cursor-pointer disabled:opacity-50"
                title="Đồng bộ lại từ Google Sheet"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing || isSyncingLocal ? 'animate-spin' : ''}`} />
                <span>{isSyncing || isSyncingLocal ? 'Đang đồng bộ...' : 'Tải lại'}</span>
              </button>
            )}
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
                <span>Quản lý Google Sheet</span>
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
