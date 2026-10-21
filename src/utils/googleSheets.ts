import { GradeLevel, Student, GoogleSheetConfig } from '../types';

export const SAMPLE_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1gC9aQ4m2yqV5pU-x6nJ0Z3k9Xw7W0A4eF8u8R3kQ7sM/edit?usp=sharing';

export const STORAGE_KEYS = {
  STUDENTS: 'nuta_students_roster',
  SHEET_CONFIG: 'nuta_google_sheet_config',
  ACTIVE_STUDENT_ID: 'nuta_active_student_id',
};

// Default high-quality sample roster for Vietnamese elementary schools
export const DEFAULT_STUDENTS_ROSTER: Student[] = [
  {
    id: 'HS001',
    name: 'Nguyễn Gia Bảo',
    grade: 'Lớp 3',
    className: '3A',
    gender: 'Nam',
    dob: '12/03/2015',
    notes: 'Rất nhanh nhạy với khối lệnh Scratch',
    stars: 15,
  },
  {
    id: 'HS002',
    name: 'Trần Minh Quân',
    grade: 'Lớp 3',
    className: '3A',
    gender: 'Nam',
    dob: '25/08/2015',
    notes: 'Thích tìm tòi các phím tắt và thao tác chuột',
    stars: 18,
  },
  {
    id: 'HS003',
    name: 'Lê Thảo My',
    grade: 'Lớp 3',
    className: '3A',
    gender: 'Nữ',
    dob: '08/11/2015',
    notes: 'Cẩn thận, ghi chép đầy đủ các bước Socratic',
    stars: 20,
  },
  {
    id: 'HS004',
    name: 'Phạm Đăng Khoa',
    grade: 'Lớp 3',
    className: '3B',
    gender: 'Nam',
    dob: '19/02/2015',
    notes: 'Cần hướng dẫn thêm về tư duy vòng lặp lặp lại mãi',
    stars: 12,
  },
  {
    id: 'HS005',
    name: 'Đỗ Phương Linh',
    grade: 'Lớp 3',
    className: '3B',
    gender: 'Nữ',
    dob: '30/05/2015',
    notes: 'Hiểu rất tốt về an toàn số và mật khẩu',
    stars: 16,
  },
  {
    id: 'HS006',
    name: 'Hoàng Anh Đức',
    grade: 'Lớp 4',
    className: '4A',
    gender: 'Nam',
    dob: '14/01/2014',
    notes: 'Lập trình chuyển động nhân vật mượt mà',
    stars: 22,
  },
  {
    id: 'HS007',
    name: 'Vũ Mai Anh',
    grade: 'Lớp 4',
    className: '4A',
    gender: 'Nữ',
    dob: '02/09/2014',
    notes: 'Có tư duy gỡ lỗi (debug) độc lập tốt',
    stars: 19,
  },
  {
    id: 'HS008',
    name: 'Bùi Tuấn Kiệt',
    grade: 'Lớp 4',
    className: '4B',
    gender: 'Nam',
    dob: '17/07/2014',
    notes: 'Nhiệt tình giúp đỡ bạn cùng bàn',
    stars: 14,
  },
  {
    id: 'HS009',
    name: 'Nguyễn Ngọc Hà',
    grade: 'Lớp 5',
    className: '5A',
    gender: 'Nữ',
    dob: '28/04/2013',
    notes: 'Hoàn thành tốt các dự án trò chơi phức tạp',
    stars: 25,
  },
  {
    id: 'HS010',
    name: 'Trịnh Quốc Bảo',
    grade: 'Lớp 5',
    className: '5A',
    gender: 'Nam',
    dob: '05/10/2013',
    notes: 'Tự tin thuyết trình giải pháp thuật toán',
    stars: 21,
  },
  {
    id: 'HS011',
    name: 'Đinh Bảo Ngọc',
    grade: 'Lớp 2',
    className: '2A',
    gender: 'Nữ',
    dob: '16/06/2016',
    notes: 'Gõ phím hai tay đúng tư thế',
    stars: 11,
  },
  {
    id: 'HS012',
    name: 'Phan Tiến Dũng',
    grade: 'Lớp 1',
    className: '1A',
    gender: 'Nam',
    dob: '22/12/2017',
    notes: 'Nhận biết đúng màn hình, bàn phím và chuột',
    stars: 10,
  },
];

/**
 * Trích xuất Sheet ID từ đường dẫn Google Sheets
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If it's already an ID (alphanumeric, dashes, underscores, usually 30-50 chars)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }

  // Standard Google Sheets URL: /spreadsheets/d/{ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Published sheet: /spreadsheets/d/e/{ID}/pub...
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    return pubMatch[1];
  }

  return null;
}

/**
 * Xây dựng URL CSV để tải dữ liệu trực tiếp từ Google Sheets
 */
export function buildGoogleSheetCsvUrl(rawUrl: string, sheetName?: string): string {
  const trimmed = rawUrl.trim();

  // If already a direct CSV or published export URL
  if (trimmed.includes('output=csv') || trimmed.includes('format=csv') || trimmed.includes('out:csv')) {
    return trimmed;
  }

  // If Google Apps Script Web App
  if (trimmed.includes('script.google.com/macros/s/')) {
    return trimmed;
  }

  const sheetId = extractSpreadsheetId(trimmed);
  if (!sheetId) {
    return trimmed;
  }

  // If published sheet with /d/e/
  if (trimmed.includes('/spreadsheets/d/e/')) {
    return `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv`;
  }

  // Standard Google Sheet gviz/tq export
  let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  if (sheetName && sheetName.trim()) {
    csvUrl += `&sheet=${encodeURIComponent(sheetName.trim())}`;
  }
  return csvUrl;
}

/**
 * Bộ phân tích cú pháp CSV tuân thủ RFC-4180
 * Xử lý chính xác dấu ngoặc kép, dấu phẩy bên trong ô và ký tự có dấu tiếng Việt UTF-8
 */
export function parseCsv(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 BOM
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentField += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Chuẩn hóa tên khối lớp ('Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5')
 */
export function normalizeGradeLevel(val: string): GradeLevel {
  const str = (val || '').toLowerCase().trim();
  if (str.includes('1') || str.includes('lớp 1') || str.includes('khối 1')) return 'Lớp 1';
  if (str.includes('2') || str.includes('lớp 2') || str.includes('khối 2')) return 'Lớp 2';
  if (str.includes('4') || str.includes('lớp 4') || str.includes('khối 4')) return 'Lớp 4';
  if (str.includes('5') || str.includes('lớp 5') || str.includes('khối 5')) return 'Lớp 5';
  return 'Lớp 3'; // default
}

/**
 * Chuyển đổi dữ liệu bảng 2 chiều từ CSV thành danh sách Student[]
 */
export function mapCsvRowsToStudents(rows: string[][]): Student[] {
  if (rows.length === 0) return [];

  // Tìm dòng tiêu đề (Header row)
  let headerIndex = -1;
  let idCol = -1;
  let nameCol = -1;
  let classCol = -1;
  let genderCol = -1;
  let dobCol = -1;
  let noteCol = -1;
  let starsCol = -1;

  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r].map((cell) => cell.toLowerCase().trim());

    // Check if this row looks like a header
    const hasId = row.some((c) =>
      c.includes('mã') || c.includes('ma hs') || c.includes('mahs') || c === 'id' || c.includes('code')
    );
    const hasName = row.some((c) =>
      c.includes('tên') || c.includes('họ') || c.includes('name')
    );

    if (hasId || hasName) {
      headerIndex = r;
      row.forEach((col, idx) => {
        if (col.includes('mã hs') || col.includes('ma hs') || col.includes('mahs') || col.includes('mã học sinh') || col.includes('mã') || col === 'id' || col === 'code') {
          if (idCol === -1) idCol = idx;
        } else if (col.includes('họ và tên') || col.includes('họ tên') || col.includes('tên học sinh') || col.includes('tên') || col.includes('name')) {
          if (nameCol === -1) nameCol = idx;
        } else if (col.includes('lớp') || col.includes('khối') || col === 'class' || col === 'grade') {
          if (classCol === -1) classCol = idx;
        } else if (col.includes('giới tính') || col.includes('phái') || col === 'gender' || col === 'sex') {
          if (genderCol === -1) genderCol = idx;
        } else if (col.includes('ngày sinh') || col.includes('năm sinh') || col === 'dob' || col === 'birth') {
          if (dobCol === -1) dobCol = idx;
        } else if (col.includes('ghi chú') || col.includes('nhận xét') || col.includes('note')) {
          if (noteCol === -1) noteCol = idx;
        } else if (col.includes('sao') || col.includes('điểm') || col.includes('stars')) {
          if (starsCol === -1) starsCol = idx;
        }
      });
      break;
    }
  }

  // Fallback defaults if no recognizable header found
  if (headerIndex === -1) {
    headerIndex = -1;
    idCol = 0;
    nameCol = 1;
    classCol = 2;
    genderCol = 3;
    dobCol = 4;
    noteCol = 5;
  } else {
    if (idCol === -1) idCol = 0;
    if (nameCol === -1) nameCol = 1;
    if (classCol === -1) classCol = 2;
  }

  const students: Student[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawId = (row[idCol] || '').trim();
    const rawName = (row[nameCol] || '').trim();

    // Skip empty or invalid rows
    if (!rawId && !rawName) continue;
    if (rawName.toLowerCase().includes('họ và tên') || rawId.toLowerCase().includes('mã hs')) continue;

    const id = rawId || `HS${String(students.length + 1).padStart(3, '0')}`;
    const name = rawName || `Học sinh ${id}`;
    const rawClass = classCol >= 0 && row[classCol] ? row[classCol].trim() : '3A';
    const grade = normalizeGradeLevel(rawClass);
    const gender = genderCol >= 0 && row[genderCol] ? row[genderCol].trim() : undefined;
    const dob = dobCol >= 0 && row[dobCol] ? row[dobCol].trim() : undefined;
    const notes = noteCol >= 0 && row[noteCol] ? row[noteCol].trim() : undefined;
    const rawStars = starsCol >= 0 && row[starsCol] ? parseInt(row[starsCol].trim(), 10) : NaN;
    const stars = !isNaN(rawStars) ? rawStars : Math.floor(Math.random() * 10) + 10;

    students.push({
      id,
      name,
      grade,
      className: rawClass,
      gender,
      dob,
      notes,
      stars,
    });
  }

  return students;
}

/**
 * Tải danh sách học sinh trực tuyến từ Google Sheets
 * Tự động thử qua proxy Server rồi fallback trực tiếp tại Browser
 */
export async function fetchStudentsFromGoogleSheet(
  sheetUrl: string,
  sheetName?: string
): Promise<{ students: Student[]; count: number; source: string }> {
  if (!sheetUrl || !sheetUrl.trim()) {
    throw new Error('Vui lòng nhập đường dẫn Google Sheet hợp lệ.');
  }

  const trimmedUrl = sheetUrl.trim();

  // Chiến lược 1: Gọi qua API Proxy Server `/api/google-sheet/sync`
  // Giúp giải quyết triệt để vấn đề CORS và hỗ trợ phân giải URL bảo mật
  try {
    const serverResp = await fetch('/api/google-sheet/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl: trimmedUrl, sheetName: sheetName || '' }),
    });

    if (serverResp.ok) {
      const data = await serverResp.json();
      if (data && Array.isArray(data.students) && data.students.length > 0) {
        return {
          students: data.students,
          count: data.students.length,
          source: 'server-proxy',
        };
      }
    }
  } catch (serverErr) {
    console.warn('Server proxy fetch failed, falling back to direct browser fetch:', serverErr);
  }

  // Chiến lược 2: Fetch trực tiếp từ Trình duyệt (Direct Browser Fetch CSV)
  const csvDownloadUrl = buildGoogleSheetCsvUrl(trimmedUrl, sheetName);
  
  try {
    const response = await fetch(csvDownloadUrl);
    if (!response.ok) {
      throw new Error(`Google Sheets phản hồi mã trạng thái HTTP ${response.status}.`);
    }

    const text = await response.text();

    // Check if Google returned an HTML login page instead of CSV
    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
      throw new Error(
        'Không thể đọc trực tiếp bảng tính. Vui lòng kiểm tra quyền chia sẻ Google Sheet: Hãy chọn "Bất kỳ ai có đường liên kết" -> quyền "Người xem".'
      );
    }

    // Try JSON parsing if user provided Google Apps Script Web App
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : parsed.data || parsed.students || [];
        if (list.length > 0) {
          const students: Student[] = list.map((item: any, idx: number) => ({
            id: item.id || item.maHS || item['Mã HS'] || `HS${String(idx + 1).padStart(3, '0')}`,
            name: item.name || item.hoVaTen || item['Họ và tên'] || `Học sinh ${idx + 1}`,
            grade: normalizeGradeLevel(item.grade || item.lop || item['Lớp'] || 'Lớp 3'),
            className: item.className || item.lop || item['Lớp'] || '3A',
            gender: item.gender || item.gioiTinh || item['Giới tính'],
            dob: item.dob || item.ngaySinh || item['Ngày sinh'],
            notes: item.notes || item.ghiChu || item['Ghi chú'],
            stars: item.stars || item.soSao || 12,
          }));
          return { students, count: students.length, source: 'apps-script-json' };
        }
      } catch {
        // Continue to CSV parser
      }
    }

    const rows = parseCsv(text);
    const students = mapCsvRowsToStudents(rows);

    if (students.length === 0) {
      throw new Error('Đã kết nối được Google Sheet nhưng chưa tìm thấy dòng dữ liệu học sinh hợp lệ.');
    }

    return {
      students,
      count: students.length,
      source: 'browser-csv',
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Lỗi không xác định khi tải dữ liệu từ Google Sheet.';
    throw new Error(errorMsg);
  }
}

// Storage helpers
export function loadSavedStudents(): Student[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load students from storage', e);
  }
  return DEFAULT_STUDENTS_ROSTER;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.warn('Could not save students to storage', e);
  }
}

export function loadSavedSheetConfig(): GoogleSheetConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not load sheet config', e);
  }
  return {
    sheetUrl: '',
    sheetName: '',
    status: 'idle',
    autoSync: true,
  };
}

export function saveSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Could not save sheet config', e);
  }
}

export function loadSavedActiveStudentId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
  } catch {
    return null;
  }
}

export function saveActiveStudentId(studentId: string | null): void {
  try {
    if (studentId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STUDENT_ID, studentId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_STUDENT_ID);
    }
  } catch (e) {
    console.warn('Could not save active student ID', e);
  }
}

/**
 * Xuất dữ liệu học sinh sang chuỗi CSV định dạng chuẩn để tải về hoặc làm mẫu
 */
export function exportRosterToCsv(students: Student[]): string {
  const header = ['Mã HS', 'Họ và tên', 'Lớp', 'Giới tính', 'Ngày sinh', 'Ghi chú', 'Số sao'];
  const rows = students.map((s) => [
    `"${s.id}"`,
    `"${s.name}"`,
    `"${s.className || s.grade}"`,
    `"${s.gender || ''}"`,
    `"${s.dob || ''}"`,
    `"${s.notes || ''}"`,
    `${s.stars || 0}`,
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}
