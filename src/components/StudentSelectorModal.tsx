import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Search,
  X,
  CheckCircle,
  GraduationCap,
  Sparkles,
  Star,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  Link2,
  ExternalLink,
  AlertCircle,
  PlusCircle,
  Check
} from 'lucide-react';
import { GradeLevel, Student, GoogleSheetConfig } from '../types';
import { playClickPop, playSuccessChime } from '../utils/audio';
import { fetchStudentsFromGoogleSheet, saveStudents, saveSheetConfig } from '../utils/googleSheets';

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
  const [showSheetConnect, setShowSheetConnect] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState(sheetConfig?.sheetUrl || '');
  const [sheetNameInput, setSheetNameInput] = useState(sheetConfig?.sheetName || '');
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

  // Filter students based on search term and grade
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

  // Find student by code with smart loose matching (HS001, hs1, 1, 01...)
  const findStudentByCode = (rawInput: string): Student | undefined => {
    const term = rawInput.trim().toLowerCase();
    const termNum = parseInt(term.replace(/[^0-9]/g, ''), 10);

    return students.find((s) => {
      const sId = s.id.toLowerCase();
      const sClean = sId.replace(/[^0-9a-z]/g, '');

      // 1. Exact match
      if (sId === term || sClean === term) return true;

      // 2. Numeric match (e.g. user typed "1" -> matches "HS001" or "01")
      if (!isNaN(termNum) && termNum > 0) {
        const sNum = parseInt(sId.replace(/[^0-9]/g, ''), 10);
        if (sNum === termNum) return true;
      }

      // 3. Name match
      if (s.name.toLowerCase() === term) return true;

      return false;
    });
  };

  // Handle quick code submit
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
    }
  };

  // Allow entering with a new ID if not present in the list
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

  // Direct sync from Google Sheet right inside the modal
  const handleDirectSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrlInput.trim()) {
      setSyncStatus({ type: 'error', message: 'Vui lòng dán đường link Google Sheet của bạn vào ô.' });
      return;
    }

    setIsSyncingLocal(true);
    setSyncStatus({ type: 'info', message: 'Đang kết nối Google Sheets qua giao thức GViz/JSONP an toàn...' });

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
          message: `Đồng bộ thành công ${res.students.length} học sinh từ Google Sheet! 🎉`,
        });
        setUnfoundCode(null);
      } else {
        throw new Error('Không tìm thấy dòng học sinh hợp lệ nào trong bảng tính.');
      }
    } catch (err: any) {
      console.error('Direct Sheet sync failed:', err);
      setSyncStatus({
        type: 'error',
        message: err?.message || 'Không thể đồng bộ. Hãy chắc chắn bảng tính đã được mở quyền xem công khai (Bất kỳ ai có liên kết -> Người xem).',
      });
    } finally {
      setIsSyncingLocal(false);
    }
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
                  Chọn tên hoặc nhập Mã HS để NUTA đồng hành và ghi nhận thành tích riêng cho em nhé!
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
                placeholder="Nhập nhanh Mã HS (VD: HS001, 1, 240101...)"
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

          {/* Prompt if code is not found in the roster */}
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
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Vào học với mã này</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSheetConnect(true)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer text-[11px]"
                >
                  Kết nối Google Sheet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Google Sheet Direct Connector Bar */}
        <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900 font-semibold truncate">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            {sheetConfig?.sheetUrl ? (
              <span className="truncate">
                Nguồn Sheet: <strong className="font-mono text-indigo-700">{sheetConfig.sheetUrl.slice(0, 45)}...</strong>
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
            className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer text-[11px] shrink-0 ml-2"
          >
            {showSheetConnect ? 'Thu gọn' : '🔗 Cấu hình / Đổi link Google Sheet'}
          </button>
        </div>

        {/* Expandable Google Sheet Connect Form */}
        {showSheetConnect && (
          <form onSubmit={handleDirectSync} className="p-3.5 sm:px-4 bg-white border-b border-indigo-200 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>📁 Nhập liên kết Google Sheet để đồng bộ học sinh:</span>
              </span>
              <span className="text-[10px] text-slate-400">
                (Quyền chia sẻ: Bất kỳ ai có liên kết ➔ Người xem)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="Dán link Google Sheet (https://docs.google.com/spreadsheets/d/...)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                value={sheetNameInput}
                onChange={(e) => setSheetNameInput(e.target.value)}
                placeholder="Tên sheet (Tùy chọn)"
                className="w-full sm:w-32 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                disabled={isSyncingLocal}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocal ? 'animate-spin' : ''}`} />
                <span>{isSyncingLocal ? 'Đang tải...' : 'Đồng bộ ngay'}</span>
              </button>
            </div>

            {syncStatus && (
              <div
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : syncStatus.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                {syncStatus.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : syncStatus.type === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </form>
        )}

        {/* Currently Logged In Banner */}
        {currentStudent ? (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-600">Đang học:</span>
              <span className="font-black text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                [{currentStudent.id}] {currentStudent.name}
              </span>
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

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:px-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Search box */}
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

          {/* Grade filter tabs */}
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

        {/* Student Cards List */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 max-h-[48vh]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="font-bold text-slate-600 text-sm">
                Không tìm thấy học sinh nào phù hợp với "{searchTerm}"
              </p>
              <p className="text-xs text-slate-400">
                Thử tìm lại bằng Mã HS hoặc dán link Google Sheet để đồng bộ danh sách lớp của bạn.
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
