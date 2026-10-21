import React, { useState } from 'react';
import {
  GraduationCap,
  TrendingUp,
  Brain,
  ShieldCheck,
  Bug,
  Monitor,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Users,
  Star,
  Sparkles,
  ChevronRight,
  Presentation,
  FileText,
  Code,
  Copy,
  X
} from 'lucide-react';
import { GradeLevel, Student, GoogleSheetConfig, AssessmentRecord } from '../types';
import { playClickPop, playSuccessChime } from '../utils/audio';
import {
  fetchStudentsFromGoogleSheet,
  saveStudents,
  saveSheetConfig,
  exportRosterToCsv,
  SAMPLE_GOOGLE_SHEET_URL,
  DEFAULT_STUDENTS_ROSTER,
} from '../utils/googleSheets';
import { exportStudentAssessmentDocx, exportClassSummaryDocx, exportLessonPlanDocx } from '../utils/exportDocx';
import { CompetencyRadarChart } from './CompetencyRadarChart';
import { SlideViewerModal } from './SlideViewerModal';

export { type AssessmentRecord } from '../types';

interface TeacherDashboardProps {
  currentGrade: GradeLevel;
  records: AssessmentRecord[];
  onClearRecords?: () => void;
  students?: Student[];
  onUpdateStudents?: (students: Student[]) => void;
  googleSheetConfig?: GoogleSheetConfig;
  onUpdateGoogleSheetConfig?: (config: GoogleSheetConfig) => void;
  onSelectStudent?: (student: Student) => void;
  currentStudent?: Student | null;
}

const APPS_SCRIPT_TEMPLATE = `// ========================================================
// MÃ NGUỒN GOOGLE APPS SCRIPT ĐỒNG BỘ 2 CHIỀU CHO APP NUTA
// Dán vào: Tiện ích mở rộng -> Apps Script trên Google Sheet
// ========================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var studentId = data.studentId;
    var stars = data.stars;
    var note = data.note;

    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == studentId) {
        if (stars !== undefined) sheet.getRange(i + 1, 7).setValue(stars); // Cột 7: Số sao
        if (note) sheet.getRange(i + 1, 6).setValue(note); // Cột 6: Ghi chú
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true, 
          message: "Đã cập nhật học sinh: " + studentId 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: "Không tìm thấy Mã HS" 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var header = rows[0];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    result.push({
      id: rows[i][0],
      name: rows[i][1],
      className: rows[i][2],
      gender: rows[i][3],
      dob: rows[i][4],
      notes: rows[i][5],
      stars: rows[i][6] || 12
    });
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentGrade,
  records,
  onClearRecords,
  students = DEFAULT_STUDENTS_ROSTER,
  onUpdateStudents,
  googleSheetConfig = {
    sheetUrl: '',
    sheetName: '',
    status: 'idle',
    autoSync: true,
  },
  onUpdateGoogleSheetConfig,
  onSelectStudent,
  currentStudent,
}) => {
  // Tabs inside Teacher Dashboard
  const [subTab, setSubTab] = useState<'analytics' | 'google-sheet'>('analytics');

  // Filters for Pedagogical Records
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');

  // State for Google Sheet Connection
  const [sheetUrlInput, setSheetUrlInput] = useState<string>(googleSheetConfig.sheetUrl || '');
  const [sheetNameInput, setSheetNameInput] = useState<string>(googleSheetConfig.sheetName || '');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Slide Viewer Modal
  const [showSlideModal, setShowSlideModal] = useState<boolean>(false);

  // Student Roster Filter & Search
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');

  // Filtered records
  const filteredRecords = records.filter((r) => {
    if (selectedGradeFilter !== 'all' && r.grade !== selectedGradeFilter) return false;
    if (selectedSkillFilter !== 'all' && r.metadata.skill_assessed !== selectedSkillFilter) return false;
    if (selectedStudentFilter !== 'all' && r.studentId !== selectedStudentFilter) return false;
    return true;
  });

  // Calculate statistics
  const totalInteractions = filteredRecords.length;

  const hintCounts = {
    lvl1: filteredRecords.filter((r) => r.metadata.hint_level === 1).length,
    lvl2: filteredRecords.filter((r) => r.metadata.hint_level === 2).length,
    lvl3: filteredRecords.filter((r) => r.metadata.hint_level === 3).length,
  };

  const stateCounts = {
    completed: filteredRecords.filter((r) => r.metadata.student_state === 'Hoàn thành').length,
    inProgress: filteredRecords.filter((r) => r.metadata.student_state === 'Đang tiến bộ').length,
    needsHelp: filteredRecords.filter((r) => r.metadata.student_state === 'Cần hỗ trợ').length,
  };

  const skillCounts = {
    logic: filteredRecords.filter((r) => r.metadata.skill_assessed === 'Tư duy logic').length,
    debug: filteredRecords.filter((r) => r.metadata.skill_assessed === 'Phân tích lỗi').length,
    safety: filteredRecords.filter((r) => r.metadata.skill_assessed === 'An toàn số').length,
    hardware: filteredRecords.filter((r) => r.metadata.skill_assessed === 'Thao tác máy tính').length,
  };

  const autonomyRate = totalInteractions > 0 ? Math.round((hintCounts.lvl1 / totalInteractions) * 100) : 80;

  // Radar chart data computation
  const totalSkillRecords = Math.max(1, filteredRecords.length);
  const radarData = {
    logic: Math.min(100, Math.round((skillCounts.logic / totalSkillRecords) * 100) + 40),
    debug: Math.min(100, Math.round((skillCounts.debug / totalSkillRecords) * 100) + 35),
    safety: Math.min(100, Math.round((skillCounts.safety / totalSkillRecords) * 100) + 50),
    hardware: Math.min(100, Math.round((skillCounts.hardware / totalSkillRecords) * 100) + 45),
  };

  // Handle Google Sheet Synchronization
  const handleSyncGoogleSheet = async (overrideUrl?: string) => {
    const urlToFetch = (overrideUrl || sheetUrlInput).trim();
    if (!urlToFetch) {
      setSyncMessage({
        type: 'error',
        text: 'Vui lòng dán liên kết Google Sheet trước khi đồng bộ.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncMessage({ type: 'info', text: 'Đang kết nối và tải dữ liệu từ Google Sheet...' });

    try {
      const result = await fetchStudentsFromGoogleSheet(urlToFetch, sheetNameInput);
      if (result.students && result.students.length > 0) {
        if (onUpdateStudents) onUpdateStudents(result.students);
        saveStudents(result.students);

        const newConfig: GoogleSheetConfig = {
          sheetUrl: urlToFetch,
          sheetName: sheetNameInput,
          lastSyncTime: Date.now(),
          status: 'success',
          autoSync: true,
        };
        if (onUpdateGoogleSheetConfig) onUpdateGoogleSheetConfig(newConfig);
        saveSheetConfig(newConfig);

        playSuccessChime();
        setSyncMessage({
          type: 'success',
          text: `Đồng bộ thành công ${result.students.length} học sinh từ Google Sheet lúc ${new Date().toLocaleTimeString()}! 🎉`,
        });
      } else {
        throw new Error('Không tìm thấy danh sách học sinh hợp lệ trong bảng tính.');
      }
    } catch (err: any) {
      console.error('Google Sheet Sync Error:', err);
      const errMsg = err?.message || 'Không thể đồng bộ dữ liệu.';
      setSyncMessage({
        type: 'error',
        text: `${errMsg} (Đảm bảo đã chia sẻ bảng tính ở chế độ: Bất kỳ ai có đường liên kết -> Người xem).`,
      });

      if (onUpdateGoogleSheetConfig) {
        onUpdateGoogleSheetConfig({
          ...googleSheetConfig,
          sheetUrl: urlToFetch,
          status: 'error',
          errorMessage: errMsg,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset / Load default demo data
  const handleLoadDemoData = () => {
    playClickPop();
    if (onUpdateStudents) onUpdateStudents(DEFAULT_STUDENTS_ROSTER);
    saveStudents(DEFAULT_STUDENTS_ROSTER);
    setSyncMessage({
      type: 'info',
      text: `Đã nạp danh sách mẫu gồm ${DEFAULT_STUDENTS_ROSTER.length} học sinh để trải nghiệm!`,
    });
  };

  // Export Class Report to Word (.docx chuẩn TT 27)
  const handleExportClassDocx = () => {
    playClickPop();
    exportClassSummaryDocx(students, records, currentGrade);
  };

  // Export Lesson Plan to Word (.docx chuẩn CV 2345)
  const handleExportLessonPlan = () => {
    playClickPop();
    exportLessonPlanDocx(currentGrade, `Tin học ${currentGrade} - Khám phá Socratic cùng Robot NUTA AI`);
  };

  // Copy Apps Script
  const handleCopyScript = () => {
    playClickPop();
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Export Roster to CSV
  const handleExportRosterCsv = () => {
    playClickPop();
    const csvContent = exportRosterToCsv(students);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NUTA_Danh_Sach_Ma_HS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    playClickPop();
    window.print();
  };

  const handleExportJSON = () => {
    playClickPop();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NUTA_Bao_Cao_Tin_Hoc_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered students for database table
  const filteredStudents = students.filter((s) => {
    if (studentGradeFilter !== 'all' && s.grade !== studentGradeFilter) return false;
    if (!studentSearchTerm.trim()) return true;
    const term = studentSearchTerm.toLowerCase().trim();
    return (
      s.id.toLowerCase().includes(term) ||
      s.name.toLowerCase().includes(term) ||
      (s.className && s.className.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-white p-3 sm:p-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl font-black">
              <GraduationCap className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-800 text-base sm:text-lg">
                  Góc Giáo Viên: Bảng Phân Tích & Cơ Sở Dữ Liệu Học Sinh
                </h3>
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Google Sheet: {students.length} Mã HS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý danh sách học sinh từ Google Sheet trực tuyến & xuất tài liệu chuẩn sư phạm.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  playClickPop();
                  setSubTab('analytics');
                }}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'analytics'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Chẩn đoán Sư phạm</span>
              </button>
              <button
                onClick={() => {
                  playClickPop();
                  setSubTab('google-sheet');
                }}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  subTab === 'google-sheet'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Cơ sở dữ liệu Google Sheet ({students.length})</span>
              </button>
            </div>

            {/* Presentation Slide Button */}
            <button
              onClick={() => {
                playClickPop();
                setShowSlideModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Mở trình chiếu slide bài giảng Tin học toàn màn hình"
            >
              <Presentation className="w-4 h-4" />
              <span>Trình chiếu Slide (.pptx)</span>
            </button>

            {/* Word Export Button - Class Summary TT 27 */}
            <button
              onClick={handleExportClassDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Xuất bảng nhận xét tổng hợp cả lớp ra Microsoft Word (.docx) chuẩn Thông tư 27/2020/TT-BGDĐT"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Báo Cáo TT27 (.docx)</span>
            </button>

            {/* Word Export Button - Lesson Plan CV 2345 */}
            <button
              onClick={handleExportLessonPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Xuất Kế hoạch bài dạy (Giáo án) ra Microsoft Word (.docx) chuẩn Công văn 2345/BGDĐT-GDTH"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Giáo Án CV2345 (.docx)</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="In phiếu nhận xét đánh giá"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In phiếu</span>
            </button>
          </div>
        </div>

        {/* Filters bar for Analytics sub-tab */}
        {subTab === 'analytics' && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold">
              <Filter className="w-3.5 h-3.5" /> Lọc theo:
            </div>

            <select
              value={selectedGradeFilter}
              onChange={(e) => setSelectedGradeFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="Lớp 1">Lớp 1</option>
              <option value="Lớp 2">Lớp 2</option>
              <option value="Lớp 3">Lớp 3</option>
              <option value="Lớp 4">Lớp 4</option>
              <option value="Lớp 5">Lớp 5</option>
            </select>

            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả nhóm năng lực</option>
              <option value="Tư duy logic">Tư duy logic</option>
              <option value="Phân tích lỗi">Phân tích lỗi</option>
              <option value="An toàn số">An toàn số</option>
              <option value="Thao tác máy tính">Thao tác máy tính</option>
            </select>

            {/* Filter by Student */}
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 cursor-pointer max-w-[200px] truncate"
            >
              <option value="all">Tất cả học sinh ({students.length})</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  [{st.id}] {st.name} ({st.className || st.grade})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {subTab === 'google-sheet' ? (
          /* ================= GOOGLE SHEET DATABASE VIEW ================= */
          <div className="space-y-4">
            {/* Connection Control Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl font-black">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                      Cấu Hình Kết Nối Google Sheet Trực Tuyến
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tự động nạp danh sách mã học sinh, họ tên, lớp và đồng bộ hai chiều với ứng dụng NUTA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAppsScriptModal(true)}
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-800 font-bold text-xs cursor-pointer px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200"
                    title="Mã Google Apps Script đồng bộ 2 chiều ghi điểm"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Mã Apps Script 2 chiều</span>
                  </button>
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold text-xs cursor-pointer px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn 3 bước'}</span>
                  </button>
                  <button
                    onClick={handleLoadDemoData}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-800 font-bold text-xs cursor-pointer px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200"
                    title="Nạp 12 học sinh mẫu"
                  >
                    <span>Dùng danh sách mẫu</span>
                  </button>
                </div>
              </div>

              {/* Instructions Callout */}
              {showGuide && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
                  <div className="font-black text-sky-900 text-sm flex items-center gap-1.5">
                    <span>💡 Các bước kết nối Google Sheet danh sách học sinh:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 font-medium pl-1">
                    <li>
                      <strong>Tạo bảng tính Google Sheets:</strong> Tạo các cột ở dòng 1 gồm:{' '}
                      <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold text-indigo-700">
                        Mã HS, Họ và tên, Lớp, Giới tính, Ngày sinh, Ghi chú, Số sao
                      </code>
                    </li>
                    <li>
                      <strong>Cấp quyền truy cập xem:</strong> Bấm nút <strong>"Chia sẻ" (Share)</strong> ở góc trên bên phải → Tại mục <em>Quyền truy cập chung</em>, chọn <strong>"Bất kỳ ai có đường liên kết"</strong> với vai trò <strong>"Người xem"</strong>.
                    </li>
                    <li>
                      <strong>Dán liên kết vào NUTA:</strong> Sao chép đường link Google Sheet (dạng <code className="bg-white px-1 rounded text-slate-600">https://docs.google.com/spreadsheets/d/...</code>) và bấm <strong>"Đồng bộ ngay"</strong>.
                    </li>
                  </ol>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="font-bold text-slate-600">Bảng tính mẫu tham khảo:</span>
                    <button
                      onClick={() => {
                        setSheetUrlInput(SAMPLE_GOOGLE_SHEET_URL);
                        handleSyncGoogleSheet(SAMPLE_GOOGLE_SHEET_URL);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Bấm vào đây để thử kết nối ngay với Sheet mẫu NUTA
                    </button>
                  </div>
                </div>
              )}

              {/* URL Input Form */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="Dán đường dẫn Google Sheet (https://docs.google.com/spreadsheets/d/...)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="w-full sm:w-44">
                  <input
                    type="text"
                    value={sheetNameInput}
                    onChange={(e) => setSheetNameInput(e.target.value)}
                    placeholder="Tên trang tính (vd: Sheet1)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    title="Nếu bảng tính có nhiều Sheet, hãy điền tên tab tại đây"
                  />
                </div>

                <button
                  onClick={() => handleSyncGoogleSheet()}
                  disabled={isSyncing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
                </button>
              </div>

              {/* Status & Feedback message */}
              {syncMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                    syncMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : syncMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-blue-50 border-blue-300 text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {syncMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : syncMessage.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    )}
                    <span>{syncMessage.text}</span>
                  </div>
                  <button
                    onClick={() => setSyncMessage(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Connection Status pill */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        students.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    ></span>
                    Trạng thái:{' '}
                    <strong className={students.length > 0 ? 'text-emerald-700' : 'text-slate-600'}>
                      {students.length > 0 ? `Đang kết nối (${students.length} học sinh)` : 'Chưa kết nối'}
                    </strong>
                  </span>
                  {googleSheetConfig.lastSyncTime && (
                    <span className="text-slate-400">
                      Đồng bộ lần cuối: {new Date(googleSheetConfig.lastSyncTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {sheetUrlInput && sheetUrlInput.includes('http') && (
                  <a
                    href={sheetUrlInput}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                  >
                    <span>Mở bảng tính Google Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Student Roster Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-black text-sm text-slate-800">
                      Danh Sách Học Sinh Trực Tuyến ({filteredStudents.length}/{students.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Bấm vào biểu tượng Word để xuất phiếu nhận xét cá nhân hoặc chọn học sinh này vào phiên học.
                    </p>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Tìm Mã HS, tên, lớp..."
                      className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>

                  <select
                    value={studentGradeFilter}
                    onChange={(e) => setStudentGradeFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-700 cursor-pointer"
                  >
                    <option value="all">Tất cả khối</option>
                    <option value="Lớp 1">Lớp 1</option>
                    <option value="Lớp 2">Lớp 2</option>
                    <option value="Lớp 3">Lớp 3</option>
                    <option value="Lớp 4">Lớp 4</option>
                    <option value="Lớp 5">Lớp 5</option>
                  </select>

                  <button
                    onClick={handleExportRosterCsv}
                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    title="Xuất file CSV danh sách học sinh"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                      <th className="py-2.5 px-3">Mã HS</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Lớp</th>
                      <th className="py-2.5 px-3">Giới tính</th>
                      <th className="py-2.5 px-3">Ngày sinh</th>
                      <th className="py-2.5 px-3">Số sao ⭐</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          Không tìm thấy học sinh nào phù hợp trong bảng tính.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st) => {
                        const isCurrent = currentStudent?.id === st.id;
                        return (
                          <tr
                            key={st.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isCurrent ? 'bg-sky-50/70 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-black text-indigo-700">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
                                {st.id}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{st.gender === 'Nữ' ? '👧' : '👦'}</span>
                                <span>{st.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-white font-black">
                                    Đang học
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {st.className || st.grade}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{st.gender || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">{st.dob || '-'}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-black text-amber-600 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                {st.stars || 0}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                              {st.notes || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    playClickPop();
                                    exportStudentAssessmentDocx(st, records, currentGrade);
                                  }}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                                  title="Xuất Phiếu nhận xét cá nhân Word (.docx) chuẩn Thông tư 27"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>

                                {onSelectStudent && (
                                  <button
                                    onClick={() => {
                                      playClickPop();
                                      onSelectStudent(st);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                                      isCurrent
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-700'
                                    }`}
                                  >
                                    {isCurrent ? '✓ Đang chọn' : 'Chọn học'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ================= PEDAGOGICAL ANALYTICS VIEW ================= */
          <>
            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Total interactions */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Tổng lượt gợi mở Socratic
                </div>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {totalInteractions}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Đang tích cực tương tác
                </div>
              </div>

              {/* Card 2: Autonomy Rate */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Chỉ số tự chủ tư duy (Mức 1)
                </div>
                <div className="text-3xl font-black text-indigo-600 mt-1">
                  {autonomyRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Học sinh tự giải quyết sau gợi ý nhẹ
                </div>
              </div>

              {/* Card 3: Completed tasks */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Trạng thái hoàn thành
                </div>
                <div className="text-3xl font-black text-emerald-600 mt-1">
                  {stateCounts.completed}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {stateCounts.needsHelp} lượt cần hỗ trợ thêm
                </div>
              </div>

              {/* Card 4: Top Skill */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">
                  Năng lực rèn luyện nhiều nhất
                </div>
                <div className="text-lg font-black text-slate-800 mt-1 truncate">
                  {skillCounts.logic >= skillCounts.debug ? 'Tư duy logic (Scratch)' : 'Phân tích & Gỡ lỗi'}
                </div>
                <div className="text-[11px] text-sky-600 font-bold mt-1">
                  Theo chuẩn GDPT 2018
                </div>
              </div>
            </div>

            {/* Charts & Radar Breakdown Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Radar Competency Chart (D3 / SVG) */}
              <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-between">
                <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Biểu đồ Radar Năng lực
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    D3 / SVG
                  </span>
                </div>
                <div className="py-2">
                  <CompetencyRadarChart
                    data={radarData}
                    studentName={
                      selectedStudentFilter !== 'all'
                        ? students.find((s) => s.id === selectedStudentFilter)?.name
                        : 'Toàn bộ học sinh'
                    }
                    size={240}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Phản ánh mức độ tích lũy trên 4 trụ cột Tin học GDPT 2018
                </p>
              </div>

              {/* Hint Distribution Breakdown */}
              <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-sky-600" /> Phân bố mức độ gợi ý đã yêu cầu
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-emerald-700">Mức 1 (Nhẹ: Tự quan sát)</span>
                      <span className="font-mono">{hintCounts.lvl1} lượt</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${totalInteractions > 0 ? (hintCounts.lvl1 / totalInteractions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-amber-700">Mức 2 (Vừa: Nếu... thì...)</span>
                      <span className="font-mono">{hintCounts.lvl2} lượt</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${totalInteractions > 0 ? (hintCounts.lvl2 / totalInteractions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-rose-700">Mức 3 (Rõ: Chia nhỏ từng bước)</span>
                      <span className="font-mono">{hintCounts.lvl3} lượt</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{
                          width: `${totalInteractions > 0 ? (hintCounts.lvl3 / totalInteractions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Four pillars counter boxes */}
              <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bốn trụ cột Năng lực
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="font-black text-blue-900">Tư duy logic</div>
                    <div className="text-xl font-black text-blue-700 mt-0.5">{skillCounts.logic}</div>
                    <div className="text-[10px] text-blue-600">Khối lệnh, vòng lặp</div>
                  </div>

                  <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="font-black text-purple-900">Phân tích lỗi</div>
                    <div className="text-xl font-black text-purple-700 mt-0.5">{skillCounts.debug}</div>
                    <div className="text-[10px] text-purple-600">Phát hiện nguyên nhân</div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="font-black text-emerald-900">An toàn số</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">{skillCounts.safety}</div>
                    <div className="text-[10px] text-emerald-600">Bảo mật thông tin</div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="font-black text-amber-900">Thao tác máy tính</div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">{skillCounts.hardware}</div>
                    <div className="text-[10px] text-amber-600">Gõ 10 ngón & tệp</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pedagogical Diagnostic Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-800">
                    Nhật ký Chẩn đoán Sư phạm của NUTA ({filteredRecords.length} ghi nhận)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Chi tiết đánh giá kỹ năng gắn với từng Mã học sinh Google Sheet.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Mã HS & Học sinh</th>
                      <th className="py-2.5 px-3">Lớp & Chủ đề</th>
                      <th className="py-2.5 px-3">Kỹ năng đánh giá</th>
                      <th className="py-2.5 px-3">Mức gợi ý</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Ghi chú Sư phạm từ AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Chưa có dữ liệu tương tác nào trong bộ lọc này.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => {
                        let stateColor = 'bg-blue-100 text-blue-800';
                        if (rec.metadata.student_state === 'Hoàn thành') {
                          stateColor = 'bg-emerald-100 text-emerald-800';
                        } else if (rec.metadata.student_state === 'Cần hỗ trợ') {
                          stateColor = 'bg-rose-100 text-rose-800';
                        }

                        return (
                          <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                              {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap font-bold">
                              {rec.studentId ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 text-[10px]">
                                    {rec.studentId}
                                  </span>
                                  <span className="text-slate-800">{rec.studentName}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Khách vãng lai</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                              <span className="text-indigo-600 mr-1">[{rec.studentClass || rec.grade}]</span>
                              {rec.topic}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {rec.metadata.skill_assessed}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                                Mức {rec.metadata.hint_level}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${stateColor}`}>
                                {rec.metadata.student_state}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium italic">
                              "{rec.metadata.teacher_note}"
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Slide Presentation Modal */}
      <SlideViewerModal
        isOpen={showSlideModal}
        onClose={() => setShowSlideModal(false)}
        grade={currentGrade}
        topic="Lập trình Scratch & An toàn số"
      />

      {/* Google Apps Script Modal */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-base text-slate-800">
                  Mã Nguồn Google Apps Script (Đồng bộ 2 chiều)
                </h3>
              </div>
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Để ghi điểm số và nhận xét từ NUTA trực tiếp ngược lại Google Sheet, giáo viên hãy copy mã bên dưới và dán vào <strong>Tiện ích mở rộng &gt; Apps Script</strong> trong Google Sheet:
            </p>

            <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-60 border border-slate-700 leading-relaxed">
              {APPS_SCRIPT_TEMPLATE}
            </pre>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-slate-500">
                Sau khi dán, bấm <em>Triển khai &gt; Tùy chọn triển khai mới &gt; Ứng dụng web</em>.
              </span>
              <button
                onClick={handleCopyScript}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Đã sao chép!' : 'Sao chép mã'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
