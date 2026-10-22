import { GradeLevel, Student, GoogleSheetConfig } from '../types';

export const SAMPLE_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing';

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
    notes: 'Cần hướng dẫn thêm về tư duy vòng lặp',
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
 * Hỗ trợ URL thông thường, xuất bản lên web (/d/e/), /open?id=, hoặc ID trực tiếp.
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Published sheet: /spreadsheets/d/e/{ID}/pub... (phải kiểm tra trước /d/ để không bị nhận nhầm ID là 'e')
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    return pubMatch[1];
  }

  // 2. Standard Google Sheets URL: /spreadsheets/d/{ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1] && match[1] !== 'e') {
    return match[1];
  }

  // 3. /open?id={ID}
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // 4. If it's already a raw ID (alphanumeric, dashes, underscores, 20-70 chars)
  if (/^[a-zA-Z0-9-_]{20,70}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Trích xuất Tab ID (gid) từ đường dẫn Google Sheets nếu có
 */
export function extractGid(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[#?&]gid=([0-9]+)/);
  return match && match[1] ? match[1] : null;
}

/**
 * Xây dựng URL CSV để tải dữ liệu trực tiếp từ Google Sheets
 */
export function buildGoogleSheetCsvUrl(rawUrl: string, sheetName?: string, gid?: string | null): string {
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

  const tabGid = gid || extractGid(trimmed);

  // If published sheet with /d/e/
  if (trimmed.includes('/spreadsheets/d/e/')) {
    let pubUrl = `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv`;
    if (tabGid) pubUrl += `&gid=${tabGid}`;
    return pubUrl;
  }

  // Standard Google Sheet gviz/tq export
  let csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  if (sheetName && sheetName.trim()) {
    csvUrl += `&sheet=${encodeURIComponent(sheetName.trim())}`;
  } else if (tabGid) {
    csvUrl += `&gid=${tabGid}`;
  }
  return csvUrl;
}

/**
 * Phân tích cú pháp văn bản bảng (CSV hoặc Tab-separated từ copy paste Google Sheets / Excel)
 * Xử lý đúng dấu ngoặc kép, ký tự xuống dòng và tiếng Việt UTF-8
 */
export function parseCsv(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  // Tự động phát hiện dấu phân cách: TAB (\t), Phẩy (,), hoặc Chấm phẩy (;)
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (!firstLine.includes(',') && firstLine.includes(';')) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
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
 * Chuẩn hóa khối lớp ('Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5')
 */
export function normalizeGradeLevel(val: string): GradeLevel {
  const str = (val || '').toLowerCase().trim();
  if (str.includes('1') || str.includes('lớp 1') || str.includes('khối 1')) return 'Lớp 1';
  if (str.includes('2') || str.includes('lớp 2') || str.includes('khối 2')) return 'Lớp 2';
  if (str.includes('4') || str.includes('lớp 4') || str.includes('khối 4')) return 'Lớp 4';
  if (str.includes('5') || str.includes('lớp 5') || str.includes('khối 5')) return 'Lớp 5';
  return 'Lớp 3';
}

/**
 * Tải dữ liệu Google Sheets trực tiếp qua JSONP (GViz API)
 * Hoàn toàn không bị CORS chặn trên trình duyệt, không cần backend server.
 */
export function fetchGoogleSheetJsonp(
  sheetId: string,
  sheetName?: string,
  gid?: string | null
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('JSONP chỉ hoạt động trong môi trường trình duyệt.'));
      return;
    }

    const callbackName = 'gviz_jsonp_' + Math.random().toString(36).substring(2, 10);
    const script = document.createElement('script');

    let url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}`;
    if (sheetName && sheetName.trim()) {
      url += `&sheet=${encodeURIComponent(sheetName.trim())}`;
    } else if (gid) {
      url += `&gid=${encodeURIComponent(gid)}`;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Quá thời gian kết nối tới Google Sheets (15s). Vui lòng kiểm tra lại đường truyền mạng hoặc quyền chia sẻ.'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      try {
        delete (window as any)[callbackName];
      } catch {
        (window as any)[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      try {
        if (!data) {
          reject(new Error('Không nhận được dữ liệu từ Google Sheets.'));
          return;
        }

        if (data.status === 'error') {
          const detail = (data.errors && data.errors[0]?.detailed_message) || data.errors?.[0]?.message || 'Không có quyền truy cập';
          reject(new Error(`Google Sheet phản hồi lỗi: ${detail}. Hãy chắc chắn bảng tính đã mở quyền: "Bất kỳ ai có đường liên kết -> Người xem".`));
          return;
        }

        if (!data.table) {
          reject(new Error('Dữ liệu Google Sheets không đúng cấu trúc bảng tính.'));
          return;
        }

        const table = data.table;
        const rows: string[][] = [];

        // Tiêu đề từ cols (nếu có nhãn thực tế)
        const headerRow: string[] = (table.cols || []).map((col: any) =>
          (col?.label || '').trim()
        );
        if (headerRow.some((h) => h.length > 0)) {
          rows.push(headerRow);
        }

        // Dữ liệu từng hàng
        for (const rowObj of table.rows || []) {
          const cells = (rowObj.c || []).map((cell: any) => {
            if (!cell) return '';
            // Ưu tiên cell.f (giá trị chuỗi hiển thị có định dạng như "HS001", "01", ngày tháng)
            // để không bị mất số 0 đầu dòng và không bị chuyển thành đối tượng Date
            if (cell.f !== undefined && cell.f !== null && String(cell.f).trim() !== '') {
              return String(cell.f).trim();
            }
            if (cell.v !== undefined && cell.v !== null) {
              return String(cell.v).trim();
            }
            return '';
          });
          if (cells.some((c: string) => c.length > 0)) {
            rows.push(cells);
          }
        }

        resolve(rows);
      } catch (err: any) {
        reject(err);
      }
    };

    script.src = url;
    script.onerror = () => {
      cleanup();
      reject(new Error('Không thể tải Google Sheet qua GViz. Vui lòng mở quyền: "Bất kỳ ai có đường liên kết" ➔ vai trò "Người xem".'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Chuyển đổi dữ liệu bảng 2 chiều từ Google Sheet / CSV / Clipboard thành danh sách Student[]
 * Tối ưu hóa đặc biệt cho các bảng điểm / danh sách lớp tiểu học Việt Nam (vnEdu, SMAS, CSDL ngành...)
 */
export function mapCsvRowsToStudents(rows: string[][]): Student[] {
  if (!rows || rows.length === 0) return [];

  let headerIndex = -1;
  let idCol = -1;
  let sttCol = -1;
  let nameCol = -1;
  let hoCol = -1;
  let tenCol = -1;
  let classCol = -1;
  let genderCol = -1;
  let dobCol = -1;
  let noteCol = -1;
  let starsCol = -1;

  // Quét qua các dòng đầu tiên (tối đa 25 dòng) để tìm dòng tiêu đề thật của bảng
  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const rawCells = rows[r] || [];
    const row = rawCells.map((cell) => (cell || '').toLowerCase().trim());
    if (row.filter((c) => c.length > 0).length < 2) continue; // Dòng tiêu đề thực tế phải có từ 2 cột trở lên

    let curIdCol = -1;
    let curSttCol = -1;
    let curNameCol = -1;
    let curHoCol = -1;
    let curTenCol = -1;
    let curClassCol = -1;
    let curGenderCol = -1;
    let curDobCol = -1;
    let curNoteCol = -1;
    let curStarsCol = -1;

    row.forEach((col, idx) => {
      // 1. Cột STT
      if (col === 'stt' || col === 'số tt' || col === 'số thứ tự' || col === 'no.' || col === 'no') {
        if (curSttCol === -1) curSttCol = idx;
      }
      // 2. Cột Mã HS / Mã định danh / SBD (không trùng với STT)
      else if (
        col.includes('mã hs') ||
        col.includes('ma hs') ||
        col.includes('mahs') ||
        col.includes('mã học sinh') ||
        col.includes('mã số học sinh') ||
        col.includes('mã định danh') ||
        col.includes('số định danh') ||
        col.includes('mshs') ||
        col === 'mã số' ||
        col === 'mã' ||
        col === 'id' ||
        col === 'student id' ||
        col === 'student_id' ||
        col === 'code' ||
        col === 'sbd' ||
        col.includes('số báo danh')
      ) {
        if (curIdCol === -1) curIdCol = idx;
      }
      // 3. Họ và tên đệm (tách rời)
      else if (
        col.includes('họ và tên đệm') ||
        col.includes('họ và chữ lót') ||
        col.includes('họ đệm') ||
        col.includes('họ lót') ||
        col === 'họ'
      ) {
        if (curHoCol === -1) curHoCol = idx;
      }
      // 4. Tên học sinh (tách rời)
      else if (col === 'tên' || col === 'tên hs' || col === 'tên học sinh' || col === 'ten') {
        if (curTenCol === -1) curTenCol = idx;
      }
      // 5. Họ và tên đầy đủ (Gộp chung)
      // Lưu ý: Không dùng c.includes('họ') đơn thuần để tránh dính "học sinh" hoặc "học kỳ"
      else if (
        col.includes('họ và tên') ||
        col.includes('họ tên') ||
        col.includes('họ & tên') ||
        col === 'full name' ||
        col === 'fullname' ||
        col === 'name' ||
        col === 'học sinh'
      ) {
        if (curNameCol === -1) curNameCol = idx;
      }
      // 6. Cột Lớp / Khối
      else if (
        col.includes('lớp') ||
        col.includes('khối') ||
        col === 'class' ||
        col === 'grade'
      ) {
        if (curClassCol === -1) curClassCol = idx;
      }
      // 7. Cột Giới tính
      else if (
        col.includes('giới tính') ||
        col.includes('phái') ||
        col.includes('nam/nữ') ||
        col.includes('nam nữ') ||
        col === 'gender' ||
        col === 'sex'
      ) {
        if (curGenderCol === -1) curGenderCol = idx;
      }
      // 8. Cột Ngày sinh
      else if (
        col.includes('ngày sinh') ||
        col.includes('năm sinh') ||
        col === 'dob' ||
        col === 'birthday' ||
        col === 'birth'
      ) {
        if (curDobCol === -1) curDobCol = idx;
      }
      // 9. Cột Ghi chú
      else if (
        col.includes('ghi chú') ||
        col.includes('nhận xét') ||
        col === 'note' ||
        col === 'notes'
      ) {
        if (curNoteCol === -1) curNoteCol = idx;
      }
      // 10. Cột Điểm / Số sao
      else if (
        col.includes('số sao') ||
        col.includes('sao') ||
        col.includes('điểm') ||
        col === 'stars' ||
        col === 'star' ||
        col === 'point'
      ) {
        if (curStarsCol === -1) curStarsCol = idx;
      }
    });

    const hasNameInfo = curNameCol >= 0 || (curHoCol >= 0 && curTenCol >= 0) || curTenCol >= 0;
    const hasIdInfo = curIdCol >= 0 || curSttCol >= 0;

    // Điều kiện nhận diện dòng tiêu đề chuẩn
    if (hasNameInfo && (hasIdInfo || curClassCol >= 0 || curGenderCol >= 0 || curDobCol >= 0)) {
      headerIndex = r;
      idCol = curIdCol;
      sttCol = curSttCol;
      nameCol = curNameCol;
      hoCol = curHoCol;
      tenCol = curTenCol;
      classCol = curClassCol;
      genderCol = curGenderCol;
      dobCol = curDobCol;
      noteCol = curNoteCol;
      starsCol = curStarsCol;
      break;
    }
  }

  // Nếu không thấy header rõ ràng, thử phán đoán dựa vào các cột đầu
  if (headerIndex === -1) {
    headerIndex = -1;
    idCol = 0;
    nameCol = 1;
    classCol = 2;
    genderCol = 3;
    dobCol = 4;
  } else {
    // Nếu có STT mà không có cột Mã HS riêng, dùng STT làm Mã HS
    if (idCol === -1 && sttCol >= 0) {
      idCol = sttCol;
    }
    // Nếu không có tên gộp mà có cột tên tách
    if (nameCol === -1 && hoCol === -1 && tenCol >= 0) {
      nameCol = tenCol;
    }
  }

  const students: Student[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawId = (idCol >= 0 && row[idCol] ? row[idCol] : '').trim();

    let rawName = '';
    if (hoCol >= 0 && tenCol >= 0) {
      const ho = (row[hoCol] || '').trim();
      const ten = (row[tenCol] || '').trim();
      rawName = `${ho} ${ten}`.trim();
    } else if (nameCol >= 0) {
      rawName = (row[nameCol] || '').trim();
    } else if (tenCol >= 0) {
      rawName = (row[tenCol] || '').trim();
    }

    // Bỏ qua dòng trống hoặc dòng lặp lại tiêu đề
    if (!rawId && !rawName) continue;
    const lowerName = rawName.toLowerCase();
    const lowerId = rawId.toLowerCase();
    if (
      lowerName.includes('họ và tên') ||
      lowerName.includes('họ tên') ||
      lowerId.includes('mã hs') ||
      lowerId === 'stt'
    ) {
      continue;
    }

    // Xử lý tạo Mã HS chuẩn:
    // Nếu có rawId thì dùng, nếu rawId là số thuần túy (VD: STT 1, 2) thì chuẩn hóa HS001 hoặc giữ nguyên
    let finalId = rawId;
    if (!finalId) {
      finalId = `HS${String(students.length + 1).padStart(3, '0')}`;
    }

    const finalName = rawName || `Học sinh ${finalId}`;
    const rawClass = classCol >= 0 && row[classCol] ? row[classCol].trim() : '3A';
    const grade = normalizeGradeLevel(rawClass);
    const gender = genderCol >= 0 && row[genderCol] ? row[genderCol].trim() : undefined;
    const dob = dobCol >= 0 && row[dobCol] ? row[dobCol].trim() : undefined;
    const notes = noteCol >= 0 && row[noteCol] ? row[noteCol].trim() : undefined;
    const rawStars = starsCol >= 0 && row[starsCol] ? parseInt(row[starsCol].trim(), 10) : NaN;
    const stars = !isNaN(rawStars) ? rawStars : Math.floor(Math.random() * 8) + 12;

    students.push({
      id: finalId,
      name: finalName,
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
 * Phân tích trực tiếp dữ liệu do giáo viên copy từ Google Sheets / Excel rồi dán (Ctrl+V) vào ứng dụng
 * Không cần mở quyền chia sẻ, không phụ thuộc vào internet hay CORS.
 */
export function parseRawClipboardOrText(rawText: string): Student[] {
  if (!rawText || !rawText.trim()) return [];
  const rows = parseCsv(rawText.trim());
  return mapCsvRowsToStudents(rows);
}

/**
 * Tải danh sách học sinh trực tuyến từ Google Sheets
 * Kiến trúc đa tầng (JSONP GViz -> CORS Proxies -> Server Proxy)
 */
export async function fetchStudentsFromGoogleSheet(
  sheetUrl: string,
  sheetName?: string
): Promise<{ students: Student[]; count: number; source: string }> {
  if (!sheetUrl || !sheetUrl.trim()) {
    throw new Error('Vui lòng nhập đường dẫn Google Sheet hợp lệ.');
  }

  const trimmedUrl = sheetUrl.trim();
  const sheetId = extractSpreadsheetId(trimmedUrl);
  const gid = extractGid(trimmedUrl);

  // 1. Google Apps Script Web App JSON
  if (trimmedUrl.includes('script.google.com/macros/s/')) {
    try {
      const resp = await fetch(trimmedUrl, { redirect: 'follow' });
      if (resp.ok) {
        const parsed = await resp.json();
        const list = Array.isArray(parsed) ? parsed : parsed.data || parsed.students || [];
        if (list.length > 0) {
          const students: Student[] = list.map((item: any, idx: number) => ({
            id: String(item.id || item.maHS || item['Mã HS'] || item['Mã định danh'] || `HS${String(idx + 1).padStart(3, '0')}`).trim(),
            name: String(item.name || item.hoVaTen || item['Họ và tên'] || `Học sinh ${idx + 1}`).trim(),
            grade: normalizeGradeLevel(item.grade || item.lop || item['Lớp'] || 'Lớp 3'),
            className: item.className || item.lop || item['Lớp'] || '3A',
            gender: item.gender || item.gioiTinh || item['Giới tính'],
            dob: item.dob || item.ngaySinh || item['Ngày sinh'],
            notes: item.notes || item.ghiChu || item['Ghi chú'],
            stars: item.stars || item.soSao || 12,
          }));
          return { students, count: students.length, source: 'apps-script-json' };
        }
      }
    } catch (e) {
      console.warn('Apps script direct fetch failed, trying GViz/JSONP...', e);
    }
  }

  // 2. Google Visualization API qua JSONP (Cực nhanh, 0% lỗi CORS trên mọi trình duyệt)
  if (sheetId && !trimmedUrl.includes('/spreadsheets/d/e/') && typeof window !== 'undefined') {
    try {
      const rows = await fetchGoogleSheetJsonp(sheetId, sheetName, gid);
      if (rows && rows.length > 0) {
        const students = mapCsvRowsToStudents(rows);
        if (students.length > 0) {
          return { students, count: students.length, source: 'gviz-jsonp' };
        }
      }
    } catch (jsonpErr: any) {
      console.warn('JSONP fetch failed, trying proxy methods:', jsonpErr?.message || jsonpErr);
    }
  }

  // 3. Tải trực tiếp CSV hoặc qua các cổng CORS Proxy an toàn
  const csvUrl = buildGoogleSheetCsvUrl(trimmedUrl, sheetName, gid);
  let csvText = '';

  // Thử Direct Fetch
  try {
    const directResp = await fetch(csvUrl);
    if (directResp.ok) {
      const text = await directResp.text();
      if (!text.includes('<!DOCTYPE html>') && !text.includes('accounts.google.com') && text.length > 10) {
        csvText = text;
      }
    }
  } catch {
    // Dự kiến bị CORS chặn trên browser với Google URL
  }

  // Thử qua CORS Proxies
  if (!csvText && typeof window !== 'undefined') {
    const proxies = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(csvUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(csvUrl)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const pResp = await fetch(proxyUrl, { signal: AbortSignal.timeout(7000) });
        if (pResp.ok) {
          const pText = await pResp.text();
          if (pText && !pText.includes('accounts.google.com') && pText.length > 10) {
            csvText = pText;
            break;
          }
        }
      } catch {
        // thử proxy tiếp theo
      }
    }
  }

  // 4. Server Proxy cục bộ (nếu chạy qua server.ts)
  if (!csvText) {
    try {
      const serverResp = await fetch('/api/google-sheet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl: trimmedUrl, sheetName: sheetName || '' }),
      });
      // Kiểm tra chắc chắn là JSON, không phải HTML fallback của SPA
      const contentType = serverResp.headers.get('content-type') || '';
      if (serverResp.ok && contentType.includes('application/json')) {
        const data = await serverResp.json();
        if (data && Array.isArray(data.students) && data.students.length > 0) {
          return { students: data.students, count: data.students.length, source: 'server-proxy' };
        }
      }
    } catch {
      // bỏ qua
    }
  }

  if (csvText) {
    const rows = parseCsv(csvText);
    const students = mapCsvRowsToStudents(rows);
    if (students.length > 0) {
      return { students, count: students.length, source: 'cors-proxy-csv' };
    }
  }

  throw new Error(
    'Không thể đọc dữ liệu học sinh từ liên kết Google Sheet này.\n\n' +
    '📌 Cách khắc phục nhanh:\n' +
    '1. Mở bảng tính Google Sheets → Bấm nút "Chia sẻ" (Share) ở góc trên bên phải.\n' +
    '2. Tại mục "Quyền truy cập chung", chọn "Bất kỳ ai có đường liên kết" với vai trò "Người xem".\n' +
    '3. Hoặc bạn có thể dùng tính năng: "📋 Dán trực tiếp từ Google Sheet" (Bôi đen bảng tính → Ctrl+C → Dán vào NUTA) để nhập ngay 100% không lo quyền chia sẻ!'
  );
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

/**
 * Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt hoa thường và không phân biệt dấu
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
    .trim();
}

/**
 * Thuật toán tìm kiếm học sinh thông minh trong danh sách:
 * - Khớp chính xác Mã HS (HS001, 240101)
 * - Khớp STT dạng số (1, 01 -> HS001)
 * - Khớp Họ và tên có dấu và không dấu (Nguyễn Gia Bảo, nguyen gia bao)
 * - Khớp tên gọi (Bảo, Bao, Quân, Quan)
 */
export function findStudentInRoster(rawInput: string, students: Student[]): Student | undefined {
  const raw = rawInput.trim();
  if (!raw) return undefined;

  const term = raw.toLowerCase();
  const termClean = term.replace(/[^0-9a-z]/g, '');
  const termNorm = removeVietnameseTones(raw);
  const termDigitsOnly = term.replace(/[^0-9]/g, '');
  const termNum = termDigitsOnly ? parseInt(termDigitsOnly, 10) : NaN;

  // 1. So khớp chính xác ID (VD: "HS001", "240101")
  const exactId = students.find((s) => s.id.toLowerCase() === term);
  if (exactId) return exactId;

  // 2. So khớp ID làm sạch (bỏ khoảng cách, gạch nối: "HS-001" -> "hs001")
  if (termClean) {
    const cleanId = students.find(
      (s) => s.id.toLowerCase().replace(/[^0-9a-z]/g, '') === termClean
    );
    if (cleanId) return cleanId;
  }

  // 3. So khớp dạng số thứ tự (VD: gõ "1" hoặc "01" -> khớp "HS001")
  if (!isNaN(termNum) && termNum > 0) {
    const numMatch = students.find((s) => {
      const sDigits = s.id.replace(/[^0-9]/g, '');
      if (!sDigits) return false;
      return parseInt(sDigits, 10) === termNum;
    });
    if (numMatch) return numMatch;
  }

  // 4. So khớp theo Họ và tên chính xác (kể cả có dấu hoặc không dấu)
  const nameExact = students.find(
    (s) => s.name.toLowerCase() === term || removeVietnameseTones(s.name) === termNorm
  );
  if (nameExact) return nameExact;

  // 5. So khớp theo tên riêng (VD: gõ "Bảo", "Bao", "Quân", "Quan")
  const firstNameMatch = students.find((s) => {
    const normName = removeVietnameseTones(s.name);
    const parts = normName.split(' ');
    const firstName = parts[parts.length - 1];
    return firstName === termNorm || normName.includes(termNorm);
  });
  if (firstNameMatch) return firstNameMatch;

  // 6. So khớp ID dạng chứa (VD: gõ "001" -> tìm "HS001")
  if (term.length >= 2) {
    const partialId = students.find((s) => s.id.toLowerCase().includes(term));
    if (partialId) return partialId;
  }

  return undefined;
}

/**
 * Tìm hoặc tự động tạo học sinh mới để vào học ngay lập tức:
 * Đảm bảo 100% học sinh tiểu học không bao giờ bị chặn hay báo lỗi!
 */
export function findOrRegisterStudent(
  rawInput: string,
  students: Student[],
  fallbackGrade: GradeLevel = 'Lớp 3'
): { student: Student; updatedStudents: Student[]; isNew: boolean } | null {
  const raw = rawInput.trim();
  if (!raw) return null;

  const found = findStudentInRoster(raw, students);
  if (found) {
    return { student: found, updatedStudents: students, isNew: false };
  }

  // Nếu chưa có trong danh sách: Tự động khởi tạo ngay lập tức
  const isOnlyNumber = /^[0-9]+$/.test(raw);
  let finalId = raw.toUpperCase();
  if (isOnlyNumber) {
    if (raw.length <= 3) {
      finalId = `HS${raw.padStart(3, '0')}`;
    } else {
      finalId = raw; // Mã thẻ số dài
    }
  }

  let finalName = `Học sinh ${finalId}`;
  if (!isOnlyNumber && !raw.toUpperCase().startsWith('HS')) {
    finalName = raw; // Học sinh gõ trực tiếp họ tên
  }

  const newStudent: Student = {
    id: finalId,
    name: finalName,
    grade: fallbackGrade,
    className: `${fallbackGrade.replace('Lớp ', '')}A`,
    stars: 12,
  };

  const updatedStudents = [newStudent, ...students.filter((s) => s.id !== finalId)];
  return { student: newStudent, updatedStudents, isNew: true };
}
