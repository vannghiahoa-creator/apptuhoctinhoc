import React, { useState, useMemo } from 'react';
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
  UserCheck
} from 'lucide-react';
import { GradeLevel, Student } from '../types';
import { playClickPop, playSuccessChime } from '../utils/audio';

interface StudentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
  onOpenTeacherDashboard?: () => void;
  isSyncing?: boolean;
  onSyncFromSheet?: () => void;
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
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [quickCodeInput, setQuickCodeInput] = useState('');

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

  // Handle quick code submit
  const handleQuickCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim()) return;

    const term = quickCodeInput.trim().toLowerCase();
    const found = students.find(
      (s) => s.id.toLowerCase() === term || s.id.toLowerCase().replace(/[^0-9a-z]/g, '') === term
    );

    if (found) {
      playSuccessChime();
      onSelectStudent(found);
      onClose();
    } else {
      alert(`Không tìm thấy mã học sinh "${quickCodeInput}". Bạn hãy kiểm tra lại hoặc tìm kiếm theo tên nhé!`);
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
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
                onChange={(e) => setQuickCodeInput(e.target.value)}
                placeholder="Nhập nhanh Mã HS (VD: HS001, HS002...)"
                className="w-full bg-white text-slate-800 placeholder-slate-400 font-bold text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Vào học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Currently Logged In Banner */}
        {currentStudent ? (
          <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs">
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
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2 max-h-[50vh]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="font-bold text-slate-600 text-sm">
                Không tìm thấy học sinh nào phù hợp với "{searchTerm}"
              </p>
              <p className="text-xs text-slate-400">
                Thử tìm lại bằng Mã HS hoặc kiểm tra kết nối với Google Sheet của lớp.
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
                disabled={isSyncing}
                className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold ml-1 cursor-pointer disabled:opacity-50"
                title="Đồng bộ lại từ Google Sheet"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Tải lại'}</span>
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
