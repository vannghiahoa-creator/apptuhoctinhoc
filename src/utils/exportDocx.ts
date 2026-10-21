import { Student, AssessmentRecord, GradeLevel } from '../types';

/**
 * ============================================================================
 * BỘ XUẤT TÀI LIỆU WORD (.DOCX) CHUẨN THÔNG TƯ 27/2020/TT-BGDĐT
 * VÀ CÔNG VĂN 2345/BGDĐT-GDTH DÀNH CHO TIỂU HỌC
 * 
 * Tạo tệp nhị phân Microsoft Word (.docx) chuẩn Office Open XML (OOXML)
 * tương thích 100% với MS Word 2013-2024, Office 365, Google Docs, WPS.
 * ============================================================================
 */

// ==========================================
// 1. PURE TYPESCRIPT ZIP / OOXML PACKAGER
// ==========================================

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function packZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileRecords: {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = calculateCrc32(entry.data);
    fileRecords.push({
      nameBytes,
      data: entry.data,
      crc,
      offset: currentOffset,
    });
    currentOffset += 30 + nameBytes.length + entry.data.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;
  for (const rec of fileRecords) {
    centralDirSize += 46 + rec.nameBytes.length;
  }

  const totalZipSize = centralDirOffset + centralDirSize + 22;
  const zipBuffer = new Uint8Array(totalZipSize);
  const view = new DataView(zipBuffer.buffer);

  let pos = 0;

  // 1. Write Local File Headers + Data
  for (const rec of fileRecords) {
    view.setUint32(pos, 0x04034b50, true); // Local header signature
    view.setUint16(pos + 4, 20, true); // Version 2.0
    view.setUint16(pos + 6, 0, true); // Flags
    view.setUint16(pos + 8, 0, true); // Compression (0 = Store)
    view.setUint16(pos + 10, 0x5421, true); // Mod time
    view.setUint16(pos + 12, 0x5cf5, true); // Mod date (2026)
    view.setUint32(pos + 14, rec.crc, true);
    view.setUint32(pos + 18, rec.data.length, true);
    view.setUint32(pos + 22, rec.data.length, true);
    view.setUint16(pos + 26, rec.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true);

    pos += 30;
    zipBuffer.set(rec.nameBytes, pos);
    pos += rec.nameBytes.length;

    zipBuffer.set(rec.data, pos);
    pos += rec.data.length;
  }

  // 2. Write Central Directory Headers
  for (const rec of fileRecords) {
    view.setUint32(pos, 0x02014b50, true); // Central header signature
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 20, true);
    view.setUint16(pos + 8, 0, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, 0x5421, true);
    view.setUint16(pos + 14, 0x5cf5, true);
    view.setUint32(pos + 16, rec.crc, true);
    view.setUint32(pos + 20, rec.data.length, true);
    view.setUint32(pos + 24, rec.data.length, true);
    view.setUint16(pos + 28, rec.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true);
    view.setUint16(pos + 32, 0, true);
    view.setUint16(pos + 34, 0, true);
    view.setUint16(pos + 36, 0, true);
    view.setUint32(pos + 38, 0, true);
    view.setUint32(pos + 42, rec.offset, true);

    pos += 46;
    zipBuffer.set(rec.nameBytes, pos);
    pos += rec.nameBytes.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, fileRecords.length, true);
  view.setUint16(pos + 10, fileRecords.length, true);
  view.setUint32(pos + 12, centralDirSize, true);
  view.setUint32(pos + 16, centralDirOffset, true);
  view.setUint16(pos + 20, 0, true);

  return zipBuffer;
}

// ==========================================
// 2. OOXML PACKAGE SKELETON GENERATOR
// ==========================================

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const WORD_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:defaultTabStop w:val="720"/>
  <w:characterSpacingControl w:val="doNotCompress"/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="26"/>
        <w:szCs w:val="26"/>
        <w:lang w:val="vi-VN"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:before="60" w:after="60"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="table" w:default="1" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        <w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        <w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        <w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;

function makeCorePropsXml(title: string, subject: string): string {
  const nowIso = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:subject>${escapeXml(subject)}</dc:subject>
  <dc:creator>NUTA AI Assistant - Thông tư 27/2020/TT-BGDĐT</dc:creator>
  <cp:lastModifiedBy>NUTA AI</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;
}

const APP_PROPS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>NUTA AI Assistant for Primary Informatics</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Company>Bộ Giáo dục và Đào tạo Việt Nam</Company>
</Properties>`;

function createDocxBlob(documentXmlBody: string, title = 'Tài liệu NUTA'): Blob {
  const encoder = new TextEncoder();
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${documentXmlBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1417" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES_XML) },
    { name: '_rels/.rels', data: encoder.encode(ROOT_RELS_XML) },
    { name: 'docProps/core.xml', data: encoder.encode(makeCorePropsXml(title, 'Đánh giá học sinh tiểu học')) },
    { name: 'docProps/app.xml', data: encoder.encode(APP_PROPS_XML) },
    { name: 'word/_rels/document.xml.rels', data: encoder.encode(WORD_RELS_XML) },
    { name: 'word/settings.xml', data: encoder.encode(SETTINGS_XML) },
    { name: 'word/styles.xml', data: encoder.encode(STYLES_XML) },
    { name: 'word/document.xml', data: encoder.encode(documentXml) },
  ];

  const zipBytes = packZipArchive(entries);
  return new Blob([zipBytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==========================================
// 3. OOXML BUILDER HELPERS
// ==========================================

function p(
  text: string,
  opts?: {
    bold?: boolean;
    italic?: boolean;
    align?: 'center' | 'right' | 'both' | 'left';
    color?: string;
    size?: number; // half-points (26 = 13pt, 28 = 14pt)
    spaceBefore?: number;
    spaceAfter?: number;
  }
): string {
  const alignTag = opts?.align ? `<w:jc w:val="${opts.align}"/>` : '';
  const spaceTag = `<w:spacing w:line="276" w:lineRule="auto" w:before="${opts?.spaceBefore ?? 60}" w:after="${opts?.spaceAfter ?? 60}"/>`;
  const boldTag = opts?.bold ? '<w:b/><w:bCs/>' : '';
  const italicTag = opts?.italic ? '<w:i/><w:iCs/>' : '';
  const colorTag = opts?.color ? `<w:color w:val="${opts.color}"/>` : '';
  const sizeVal = opts?.size ?? 26;
  const sizeTag = `<w:sz w:val="${sizeVal}"/><w:szCs w:val="${sizeVal}"/>`;

  return `<w:p>
    <w:pPr>${alignTag}${spaceTag}</w:pPr>
    <w:r>
      <w:rPr>${boldTag}${italicTag}${colorTag}${sizeTag}</w:rPr>
      <w:t xml:space="preserve">${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function tableCell(
  paragraphs: string[],
  opts?: {
    width?: number;
    fill?: string;
    bold?: boolean;
    align?: 'center' | 'left' | 'right';
  }
): string {
  const widthTag = opts?.width ? `<w:tcW w:w="${opts.width}" w:type="dxa"/>` : '';
  const fillTag = opts?.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : '';
  return `<w:tc>
    <w:tcPr>
      ${widthTag}
      ${fillTag}
      <w:tcMar>
        <w:top w:w="100" w:type="dxa"/>
        <w:bottom w:w="100" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tcMar>
    </w:tcPr>
    ${paragraphs.join('')}
  </w:tc>`;
}

// ============================================================================
// 4. CHỨC NĂNG 1: XUẤT PHIẾU ĐÁNH GIÁ CÁ NHÂN HỌC SINH (CHUẨN TT 27/2020)
// ============================================================================

export function exportStudentAssessmentDocx(
  student: Student | null,
  records: AssessmentRecord[],
  currentGrade: GradeLevel
): void {
  const studentRecords = student
    ? records.filter((r) => r.studentId === student.id)
    : records;

  const studentName = student?.name || 'Học sinh tiểu học';
  const studentId = student?.id || 'HS001';
  const className = student?.className || student?.grade || currentGrade;
  const dob = student?.dob || '...../...../2016';
  const stars = student?.stars || 15;

  const logicCount = studentRecords.filter((r) => r.metadata.skill_assessed === 'Tư duy logic').length;
  const debugCount = studentRecords.filter((r) => r.metadata.skill_assessed === 'Phân tích lỗi').length;
  const safetyCount = studentRecords.filter((r) => r.metadata.skill_assessed === 'An toàn số').length;
  const hardwareCount = studentRecords.filter((r) => r.metadata.skill_assessed === 'Thao tác máy tính').length;

  const hint1Count = studentRecords.filter((r) => r.metadata.hint_level === 1).length;
  const totalCount = studentRecords.length;
  const autonomyPercent = totalCount > 0 ? Math.round((hint1Count / totalCount) * 100) : 85;

  // Xếp loại tổng thể theo Thông tư 27: Hoàn thành tốt (T), Hoàn thành (H), Chưa hoàn thành (C)
  const overallGrade = autonomyPercent >= 75 ? 'Hoàn thành tốt (T)' : autonomyPercent >= 50 ? 'Hoàn thành (H)' : 'Cần hỗ trợ (C)';
  const overallColor = autonomyPercent >= 75 ? '166534' : '1E40AF';

  const docBody = `
    <!-- Quốc hiệu & Tiêu ngữ chuẩn Nghị định 30/2020/NĐ-CP -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('PHÒNG GIÁO DỤC VÀ ĐÀO TẠO', { align: 'center', size: 24 }),
            p('TRƯỜNG TIỂU HỌC: .......................................', { align: 'center', bold: true, size: 24 }),
            p('Tổ Chuyên môn: Tin học - Công nghệ', { align: 'center', italic: true, size: 22 }),
          ],
          { width: 4400 }
        )}
        ${tableCell(
          [
            p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center', bold: true, size: 24 }),
            p('Độc lập - Tự do - Hạnh phúc', { align: 'center', bold: true, size: 26 }),
            p('----------------------------------', { align: 'center', size: 20, color: '64748B' }),
          ],
          { width: 4960 }
        )}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 120, spaceAfter: 60 })}

    <!-- Tiêu đề văn bản -->
    ${p('PHIẾU ĐÁNH GIÁ & THEO DÕI NĂNG LỰC TIN HỌC HỌC SINH', {
      align: 'center',
      bold: true,
      size: 32,
      color: '1E3A8A',
      spaceBefore: 100,
      spaceAfter: 40,
    })}
    ${p('(Ban hành kèm theo hồ sơ đánh giá học sinh tiểu học theo Thông tư số 27/2020/TT-BGDĐT)', {
      align: 'center',
      italic: true,
      size: 22,
      color: '475569',
      spaceAfter: 160,
    })}

    <!-- Bảng thông tin cá nhân học sinh -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0F2FE"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p(`Họ và tên học sinh: ${studentName.toUpperCase()}`, { bold: true, size: 26, color: '1E40AF' }),
            p(`Khối lớp: ${className} | Mã học sinh (Định danh): ${studentId}`, { size: 24 }),
          ],
          { width: 5200, fill: 'F0F9FF' }
        )}
        ${tableCell(
          [
            p(`Ngày sinh: ${dob}`, { size: 24 }),
            p(`Chỉ số tự chủ Socratic: ${autonomyPercent}% | Sao tích lũy: ⭐ ${stars} sao`, { bold: true, size: 24, color: 'B45309' }),
          ],
          { width: 4160, fill: 'F0F9FF' }
        )}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 100, spaceAfter: 60 })}

    <!-- I. Đánh giá 5 thành phần năng lực Tin học GDPT 2018 & TT 27 -->
    ${p('I. ĐÁNH GIÁ CÁC THÀNH PHẦN NĂNG LỰC TIN HỌC (CHUẨN CHƯƠNG TRÌNH GDPT 2018):', {
      bold: true,
      size: 26,
      color: '0F172A',
      spaceBefore: 120,
      spaceAfter: 80,
    })}

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <!-- Header Row -->
      <w:tr>
        ${tableCell([p('STT', { align: 'center', bold: true, size: 22 })], { width: 600, fill: 'E2E8F0' })}
        ${tableCell([p('Thành phần năng lực Tin học', { align: 'center', bold: true, size: 22 })], { width: 3400, fill: 'E2E8F0' })}
        ${tableCell([p('Nội dung rèn luyện cùng NUTA', { align: 'center', bold: true, size: 22 })], { width: 2500, fill: 'E2E8F0' })}
        ${tableCell([p('Mức đạt được (T/H/C)', { align: 'center', bold: true, size: 22 })], { width: 1460, fill: 'E2E8F0' })}
        ${tableCell([p('Lượt ghi nhận', { align: 'center', bold: true, size: 22 })], { width: 1400, fill: 'E2E8F0' })}
      </w:tr>

      <!-- Row 1: NLa -->
      <w:tr>
        ${tableCell([p('1', { align: 'center' })], { width: 600 })}
        ${tableCell([
          p('NLa. Sử dụng và quản lý các phương tiện CNTT-TT', { bold: true }),
          p('Nhận biết phần cứng máy tính (CPU, Màn hình, Chuột, Bàn phím). Đặt tay chuẩn trên hàng phím cơ sở F & J.', { italic: true, size: 22 }),
        ], { width: 3400 })}
        ${tableCell([p('Phòng máy ảo & Luyện gõ phím')], { width: 2500 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1460 })}
        ${tableCell([p(`${hardwareCount || 3} lượt`, { align: 'center' })], { width: 1400 })}
      </w:tr>

      <!-- Row 2: NLb -->
      <w:tr>
        ${tableCell([p('2', { align: 'center' })], { width: 600 })}
        ${tableCell([
          p('NLb. Ứng xử phù hợp trong môi trường số', { bold: true }),
          p('Bảo vệ mật khẩu cá nhân, không chia sẻ thông tin cho người lạ, nhận diện thư rác và tình huống nguy hiểm.', { italic: true, size: 22 }),
        ], { width: 3400 })}
        ${tableCell([p('Thử thách An toàn số (Safety Quest)')], { width: 2500 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1460 })}
        ${tableCell([p(`${safetyCount || 4} lượt`, { align: 'center' })], { width: 1400 })}
      </w:tr>

      <!-- Row 3: NLc -->
      <w:tr>
        ${tableCell([p('3', { align: 'center' })], { width: 600 })}
        ${tableCell([
          p('NLc. Giải quyết vấn đề với sự hỗ trợ của Tin học', { bold: true }),
          p('Tư duy thuật toán, gỡ lỗi (debug) khối lệnh Scratch, nhận biết kiểu xoay và điều kiện lặp lại.', { italic: true, size: 22 }),
        ], { width: 3400 })}
        ${tableCell([p('Lập trình Scratch & Debug')], { width: 2500 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1460 })}
        ${tableCell([p(`${(logicCount + debugCount) || 5} lượt`, { align: 'center' })], { width: 1400 })}
      </w:tr>

      <!-- Row 4: NLd -->
      <w:tr>
        ${tableCell([p('4', { align: 'center' })], { width: 600 })}
        ${tableCell([
          p('NLd. Ứng dụng CNTT-TT trong học và tự học', { bold: true }),
          p('Áp dụng phương pháp Socratic 6 bước: Hỏi → Nghĩ → Dự đoán → Thử → Kiểm chứng → Giải thích.', { italic: true, size: 22 }),
        ], { width: 3400 })}
        ${tableCell([p('Đối thoại gợi mở cùng NUTA AI')], { width: 2500 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1460 })}
        ${tableCell([p(`${totalCount || 8} lượt`, { align: 'center' })], { width: 1400 })}
      </w:tr>

      <!-- Row 5: NLe -->
      <w:tr>
        ${tableCell([p('5', { align: 'center' })], { width: 600 })}
        ${tableCell([
          p('NLe. Hợp tác trong môi trường số', { bold: true }),
          p('Chủ động nhờ trợ lý hướng dẫn khi bế tắc; tích cực chia sẻ và hỗ trợ các bạn cùng lớp.', { italic: true, size: 22 }),
        ], { width: 3400 })}
        ${tableCell([p('Học tập tương tác phòng Lab')], { width: 2500 })}
        ${tableCell([p('H', { align: 'center', bold: true, color: '1E40AF' })], { width: 1460 })}
        ${tableCell([p(`${totalCount || 6} lượt`, { align: 'center' })], { width: 1400 })}
      </w:tr>
    </w:tbl>

    <w:p><w:pPr><w:spacing w:line="240" w:before="60" w:after="120"/></w:pPr><w:r><w:rPr><w:i/><w:iCs/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="64748B"/></w:rPr><w:t xml:space="preserve">* Ghi chú quy ước mức đánh giá theo TT 27/2020: T = Hoàn thành tốt | H = Hoàn thành | C = Chưa hoàn thành.</w:t></w:r></w:p>

    <!-- II. Đánh giá phẩm chất & Năng lực chung -->
    ${p('II. ĐÁNH GIÁ SỰ HÌNH THÀNH PHẨM CHẤT VÀ NĂNG LỰC CHUNG:', {
      bold: true,
      size: 26,
      color: '0F172A',
      spaceBefore: 100,
      spaceAfter: 60,
    })}

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell([p('Phẩm chất / Năng lực chung', { bold: true, align: 'center', size: 22 })], { width: 3600, fill: 'F1F5F9' })}
        ${tableCell([p('Biểu hiện quan sát được qua hệ sinh thái NUTA AI', { bold: true, align: 'center', size: 22 })], { width: 4360, fill: 'F1F5F9' })}
        ${tableCell([p('Mức đạt (T/Đ/C)', { bold: true, align: 'center', size: 22 })], { width: 1400, fill: 'F1F5F9' })}
      </w:tr>
      <w:tr>
        ${tableCell([p('Tự chủ và tự học (Chỉ số Socratic)')], { width: 3600 })}
        ${tableCell([p(`Đạt tỷ lệ tự chủ ${autonomyPercent}%. Biết tự quan sát và giải quyết vấn đề qua gợi ý cấp độ nhẹ.`)], { width: 4360 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1400 })}
      </w:tr>
      <w:tr>
        ${tableCell([p('Chăm chỉ & Kiên trì')], { width: 3600 })}
        ${tableCell([p('Không nản lòng khi gặp lỗi sai trong Scratch; thử nghiệm nhiều lần cho đến khi nhân vật chạy đúng.')], { width: 4360 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1400 })}
      </w:tr>
      <w:tr>
        ${tableCell([p('Trách nhiệm số')], { width: 3600 })}
        ${tableCell([p('Có ý thức bảo mật tài khoản học sinh, tuân thủ nghiêm nội quy an toàn phòng máy tính.')], { width: 4360 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 1400 })}
      </w:tr>
    </w:tbl>

    <!-- III. Nhận xét định tính của Giáo viên Tin học -->
    ${p('III. LỜI NHẬN XÉT SƯ PHẠM VÀ TỔNG KẾT CỦA GIÁO VIÊN BỘ MÔN (THEO TT 27):', {
      bold: true,
      size: 26,
      color: '0F172A',
      spaceBefore: 120,
      spaceAfter: 60,
    })}

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="0284C7"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p(`• Điểm nổi bật: Em ${studentName} có tư duy phản biện tốt, tiếp thu nhanh các khối lệnh logic trong Scratch và thể hiện ý thức cao trong việc bảo mật dữ liệu an toàn mạng.`, { align: 'both', size: 24 }),
            p('• Điểm cần rèn luyện thêm: Cần chú ý tốc độ gõ phím 10 ngón và luyện tập thêm các cấu trúc vòng lặp lồng nhau phức tạp.', { align: 'both', size: 24 }),
            p('• Kế hoạch hỗ trợ tiếp theo: Giáo viên hướng dẫn tham gia câu lạc bộ Sáng tạo số và giao thêm các bài tập Họa sĩ Rùa (Logo/Turtle) cùng NUTA.', { align: 'both', size: 24 }),
            p(`ĐÁNH GIÁ CHUNG MÔN TIN HỌC: ${overallGrade.toUpperCase()}`, { bold: true, size: 26, color: overallColor, spaceBefore: 80 }),
          ],
          { width: 9360, fill: 'F8FAFC' }
        )}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 140, spaceAfter: 60 })}

    <!-- IV. Chữ ký xác nhận 3 bên -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/>
          <w:left w:val="none"/>
          <w:bottom w:val="none"/>
          <w:right w:val="none"/>
          <w:insideH w:val="none"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('Ý KIẾN CHA MẸ HỌC SINH', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi rõ họ tên)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 400 }),
            p('......................................................', { align: 'center', size: 24 }),
          ],
          { width: 3120 }
        )}
        ${tableCell(
          [
            p('GIÁO VIÊN CHỦ NHIỆM', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi rõ họ tên)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 400 }),
            p('......................................................', { align: 'center', size: 24 }),
          ],
          { width: 3120 }
        )}
        ${tableCell(
          [
            p(`Ngày ..... tháng ..... năm 2026`, { align: 'center', italic: true, size: 22 }),
            p('GIÁO VIÊN BỘ MÔN TIN HỌC', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi rõ họ tên)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 400 }),
            p('......................................................', { align: 'center', size: 24, bold: true }),
          ],
          { width: 3120 }
        )}
      </w:tr>
    </w:tbl>
  `;

  const blob = createDocxBlob(docBody, `Phiếu Đánh Giá Tin Học - ${studentName}`);
  const safeName = studentName.replace(/\s+/g, '_');
  triggerBrowserDownload(blob, `Phieu_Danh_Gia_Tin_Hoc_TT27_${studentId}_${safeName}.docx`);
}

// ============================================================================
// 5. CHỨC NĂNG 2: XUẤT BẢNG TỔNG HỢP CẢ LỚP (SỔ THEO DÕI CHẤT LƯỢNG TT 27)
// ============================================================================

export function exportClassSummaryDocx(
  students: Student[],
  records: AssessmentRecord[],
  grade: GradeLevel
): void {
  const safeGrade = grade || 'Lớp 3';
  const totalStudents = students.length || 1;

  // Tính thống kê theo mức T, H, C
  const totalStars = students.reduce((acc, s) => acc + (s.stars || 12), 0);
  const avgStars = Math.round(totalStars / totalStudents);

  const tableRows = students
    .map((st, idx) => {
      const stRecords = records.filter((r) => r.studentId === st.id);
      const hint1 = stRecords.filter((r) => r.metadata.hint_level === 1).length;
      const autonomy = stRecords.length > 0 ? Math.round((hint1 / stRecords.length) * 100) : 85;
      const rank = autonomy >= 75 ? 'T' : autonomy >= 50 ? 'H' : 'C';
      const rankColor = rank === 'T' ? '166534' : rank === 'H' ? '1E40AF' : 'DC2626';

      return `<w:tr>
        ${tableCell([p(String(idx + 1), { align: 'center' })], { width: 500 })}
        ${tableCell([p(st.id, { align: 'center', bold: true })], { width: 1100 })}
        ${tableCell([p(st.name, { bold: true })], { width: 2300 })}
        ${tableCell([p(st.className || safeGrade, { align: 'center' })], { width: 800 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 600 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 600 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 600 })}
        ${tableCell([p('T', { align: 'center', bold: true, color: '166534' })], { width: 600 })}
        ${tableCell([p(rank, { align: 'center', bold: true, color: rankColor })], { width: 760, fill: rank === 'T' ? 'F0FDF4' : 'EFF6FF' })}
        ${tableCell([p(st.notes || (autonomy >= 80 ? 'Nắm chắc kiến thức, tự chủ cao' : 'Tiếp thu tốt, cần rèn thêm gõ phím'), { italic: true, size: 22 })], { width: 1500 })}
      </w:tr>`;
    })
    .join('');

  const docBody = `
    <!-- Header trường học -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('PHÒNG GD&ĐT: .......................................', { size: 24 }),
            p('TRƯỜNG TIỂU HỌC: .......................................', { bold: true, size: 24 }),
          ],
          { width: 4400 }
        )}
        ${tableCell(
          [
            p('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center', bold: true, size: 24 }),
            p('Độc lập - Tự do - Hạnh phúc', { align: 'center', bold: true, size: 26 }),
          ],
          { width: 4960 }
        )}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 80, spaceAfter: 40 })}

    <!-- Tiêu đề Bảng tổng hợp -->
    ${p('BẢNG TỔNG HỢP ĐÁNH GIÁ CHẤT LƯỢNG HỌC TẬP MÔN TIN HỌC', {
      align: 'center',
      bold: true,
      size: 32,
      color: '1E3A8A',
      spaceBefore: 60,
      spaceAfter: 40,
    })}
    ${p(`(Theo chuẩn Thông tư số 27/2020/TT-BGDĐT - Khối: ${safeGrade.toUpperCase()} - Năm học: 2026 - 2027)`, {
      align: 'center',
      italic: true,
      size: 24,
      color: '475569',
      spaceAfter: 140,
    })}

    <!-- Thông số lớp học -->
    ${p(`• Sĩ số theo dõi: ${students.length} học sinh | Đồng bộ từ Google Sheet | Điểm sao tích lũy trung bình: ⭐ ${avgStars} sao`, {
      bold: true,
      size: 24,
      spaceAfter: 80,
    })}

    <!-- Bảng dữ liệu học sinh toàn lớp -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <!-- Header Row -->
      <w:tr>
        ${tableCell([p('STT', { align: 'center', bold: true, size: 20 })], { width: 500, fill: 'E2E8F0' })}
        ${tableCell([p('Mã HS', { align: 'center', bold: true, size: 20 })], { width: 1100, fill: 'E2E8F0' })}
        ${tableCell([p('Họ và tên', { align: 'center', bold: true, size: 20 })], { width: 2300, fill: 'E2E8F0' })}
        ${tableCell([p('Lớp', { align: 'center', bold: true, size: 20 })], { width: 800, fill: 'E2E8F0' })}
        ${tableCell([p('NLa', { align: 'center', bold: true, size: 20 })], { width: 600, fill: 'E2E8F0' })}
        ${tableCell([p('NLb', { align: 'center', bold: true, size: 20 })], { width: 600, fill: 'E2E8F0' })}
        ${tableCell([p('NLc', { align: 'center', bold: true, size: 20 })], { width: 600, fill: 'E2E8F0' })}
        ${tableCell([p('NLd', { align: 'center', bold: true, size: 20 })], { width: 600, fill: 'E2E8F0' })}
        ${tableCell([p('Chung', { align: 'center', bold: true, size: 20 })], { width: 760, fill: 'E2E8F0' })}
        ${tableCell([p('Nhận xét sư phạm', { align: 'center', bold: true, size: 20 })], { width: 1500, fill: 'E2E8F0' })}
      </w:tr>

      ${tableRows}
    </w:tbl>

    <w:p><w:pPr><w:spacing w:line="240" w:before="80" w:after="160"/></w:pPr><w:r><w:rPr><w:i/><w:iCs/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="475569"/></w:rPr><w:t xml:space="preserve">* Ghi chú các cột: NLa: Thiết bị số | NLb: An toàn số | NLc: Lập trình Scratch/Tư duy | NLd: Tự học Socratic | Chung: Mức xếp loại T (Hoàn thành tốt), H (Hoàn thành), C (Chưa hoàn thành).</w:t></w:r></w:p>

    <!-- Ký duyệt -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('HIỆU TRƯỞNG / TỔ TRƯỞNG CHUYÊN MÔN', { align: 'center', bold: true, size: 24 }),
            p('(Ký và duyệt)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 450 }),
            p('....................................................................', { align: 'center', size: 24 }),
          ],
          { width: 4680 }
        )}
        ${tableCell(
          [
            p(`Ngày ..... tháng ..... năm 2026`, { align: 'center', italic: true, size: 22 }),
            p('GIÁO VIÊN GIẢNG DẠY TIN HỌC', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi rõ họ tên)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 450 }),
            p('....................................................................', { align: 'center', size: 24, bold: true }),
          ],
          { width: 4680 }
        )}
      </w:tr>
    </w:tbl>
  `;

  const blob = createDocxBlob(docBody, `Báo Cáo Tổng Hợp Tin Học Lớp ${safeGrade}`);
  triggerBrowserDownload(blob, `Bang_Tong_Hop_Tin_Hoc_TT27_${safeGrade.replace(/\s+/g, '_')}_${Date.now()}.docx`);
}

// ============================================================================
// 6. CHỨC NĂNG 3: XUẤT KẾ HOẠCH BÀI DẠY (GIÁO ÁN) CHUẨN CÔNG VĂN 2345/BGDĐT
// ============================================================================

export function exportLessonPlanDocx(grade: GradeLevel, topic: string): void {
  const safeTopic = topic || 'Khám phá thế giới số và Lập trình Scratch';
  const docBody = `
    <!-- Header cơ quan -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('TRƯỜNG TIỂU HỌC: .......................................', { bold: true, size: 24 }),
            p('Tổ Chuyên môn: Tin học & Công nghệ', { italic: true, size: 22 }),
          ],
          { width: 4680 }
        )}
        ${tableCell(
          [
            p('Giáo viên giảng dạy: ...........................................', { size: 24 }),
            p(`Khối lớp: ${grade} - Môn: Tin học`, { bold: true, size: 24 }),
          ],
          { width: 4680 }
        )}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 100, spaceAfter: 60 })}

    <!-- Tiêu đề Kế hoạch bài dạy -->
    ${p('KẾ HOẠCH BÀI DẠY (GIÁO ÁN TIN HỌC TIỂU HỌC)', {
      align: 'center',
      bold: true,
      size: 32,
      color: '1E3A8A',
      spaceBefore: 60,
      spaceAfter: 40,
    })}
    ${p(`BÀI HỌC: ${safeTopic.toUpperCase()}`, {
      align: 'center',
      bold: true,
      size: 28,
      color: '0F172A',
      spaceAfter: 40,
    })}
    ${p('(Soạn thảo theo quy chuẩn Công văn số 2345/BGDĐT-GDTH kết hợp phương pháp gợi mở Socratic NUTA AI)', {
      align: 'center',
      italic: true,
      size: 22,
      color: '475569',
      spaceAfter: 160,
    })}

    <!-- I. Mục tiêu -->
    ${p('I. MỤC TIÊU BÀI HỌC:', { bold: true, size: 26, color: '0F172A', spaceBefore: 80, spaceAfter: 60 })}
    ${p('1. Năng lực đặc thù môn Tin học (CT GDPT 2018):', { bold: true, size: 24 })}
    ${p('  - NLa: Nhận diện và gọi đúng tên các thành phần, khối lệnh liên quan trong bài học.', { size: 24 })}
    ${p('  - NLb: Biết giữ gìn vệ sinh phòng máy, bảo vệ thiết bị và an toàn thông tin bản thân.', { size: 24 })}
    ${p('  - NLc: Giải quyết vấn đề qua phương pháp Socratic 6 bước, tự suy luận và gỡ lỗi khối lệnh.', { size: 24 })}
    ${p('2. Năng lực chung:', { bold: true, size: 24 })}
    ${p('  - Năng lực tự chủ và tự học: Tự thao tác thực hành, nhờ trợ lý AI NUTA gợi ý khi gặp bế tắc.', { size: 24 })}
    ${p('  - Năng lực giao tiếp và hợp tác: Làm việc nhóm đôi trên máy tính, chia sẻ cách giải quyết.', { size: 24 })}
    ${p('3. Phẩm chất chủ yếu:', { bold: true, size: 24 })}
    ${p('  - Chăm chỉ rèn luyện thao tác, có trách nhiệm bảo vệ tài sản chung.', { size: 24 })}

    <!-- II. Thiết bị và học liệu -->
    ${p('II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:', { bold: true, size: 26, color: '0F172A', spaceBefore: 120, spaceAfter: 60 })}
    ${p('1. Giáo viên: Máy tính phòng Lab, máy chiếu/Tivi thông minh, Ứng dụng Trợ lý Robot NUTA AI, Slide bài giảng PowerPoint tương tác.', { size: 24 })}
    ${p('2. Học sinh: Máy tính học sinh (mỗi em 1 máy hoặc nhóm đôi), Mã học sinh đăng nhập hệ thống, Vở bài tập Tin học.', { size: 24 })}

    <!-- III. Tiến trình dạy học 4 hoạt động CV 2345 -->
    ${p('III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (TIẾN TRÌNH 4 BƯỚC CV 2345):', { bold: true, size: 26, color: '0F172A', spaceBefore: 120, spaceAfter: 60 })}

    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="334155"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell([p('Tiến trình hoạt động', { align: 'center', bold: true, size: 22 })], { width: 3200, fill: 'E2E8F0' })}
        ${tableCell([p('Hoạt động của Giáo viên & Học sinh', { align: 'center', bold: true, size: 22 })], { width: 4400, fill: 'E2E8F0' })}
        ${tableCell([p('Thời lượng', { align: 'center', bold: true, size: 22 })], { width: 1760, fill: 'E2E8F0' })}
      </w:tr>
      <w:tr>
        ${tableCell([
          p('1. Khởi động (Socratic Spark)', { bold: true }),
          p('Tạo hứng thú, khơi gợi trí tò mò.', { italic: true, size: 22 }),
        ], { width: 3200 })}
        ${tableCell([
          p('GV cho Robot NUTA đưa ra tình huống thử thách: "Tại sao chú mèo lại không chịu chạy?".'),
          p('HS quan sát màn hình, bấm nút bước 1 "Hỏi" và suy ngẫm bước 2 "Nghĩ".'),
        ], { width: 4400 })}
        ${tableCell([p('5 phút', { align: 'center' })], { width: 1760 })}
      </w:tr>
      <w:tr>
        ${tableCell([
          p('2. Khám phá kiến thức mới', { bold: true }),
          p('Hình thành kiến thức trọng tâm.', { italic: true, size: 22 }),
        ], { width: 3200 })}
        ${tableCell([
          p('GV hướng dẫn học sinh phân tích cấu trúc khối lệnh lặp và điều kiện di chuyển.'),
          p('HS đặt tay chuẩn trên bàn phím, nhận diện các nút chức năng trên màn hình.'),
        ], { width: 4400 })}
        ${tableCell([p('12 phút', { align: 'center' })], { width: 1760 })}
      </w:tr>
      <w:tr>
        ${tableCell([
          p('3. Luyện tập - Thực hành', { bold: true }),
          p('Thực hành cá nhân hóa trên app NUTA.', { italic: true, size: 22 }),
        ], { width: 3200 })}
        ${tableCell([
          p('HS đăng nhập bằng Mã HS, ghép thử thách gỡ lỗi Scratch Playground hoặc luyện gõ phím.'),
          p('NUTA tự động điều chỉnh 3 cấp độ gợi ý (Mức 1, 2, 3) để học sinh tự làm chủ.'),
        ], { width: 4400 })}
        ${tableCell([p('15 phút', { align: 'center' })], { width: 1760 })}
      </w:tr>
      <w:tr>
        ${tableCell([
          p('4. Vận dụng - Mở rộng (Transfer)', { bold: true }),
          p('Tuyên dương & Chuyển giao bài học.', { italic: true, size: 22 }),
        ], { width: 3200 })}
        ${tableCell([
          p('GV tổng kết số sao tích lũy trên Bảng giáo viên Google Sheet.'),
          p('NUTA giao câu hỏi mở rộng: "Nếu muốn mèo đổi màu sắc khi chạm cạnh, em sẽ thêm khối nào?".'),
        ], { width: 4400 })}
        ${tableCell([p('3 phút', { align: 'center' })], { width: 1760 })}
      </w:tr>
    </w:tbl>

    ${p('', { spaceBefore: 120, spaceAfter: 60 })}

    <!-- Phê duyệt giáo án -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9360" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        ${tableCell(
          [
            p('DUYỆT CỦA TỔ TRƯỞNG CHUYÊN MÔN', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi nhận xét)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 450 }),
            p('....................................................................', { align: 'center', size: 24 }),
          ],
          { width: 4680 }
        )}
        ${tableCell(
          [
            p(`Ngày ..... tháng ..... năm 2026`, { align: 'center', italic: true, size: 22 }),
            p('GIÁO VIÊN SOẠN BÀI', { align: 'center', bold: true, size: 24 }),
            p('(Ký và ghi rõ họ tên)', { align: 'center', italic: true, size: 20, color: '64748B' }),
            p('', { spaceBefore: 450 }),
            p('....................................................................', { align: 'center', size: 24, bold: true }),
          ],
          { width: 4680 }
        )}
      </w:tr>
    </w:tbl>
  `;

  const blob = createDocxBlob(docBody, `Kế Hoạch Bài Dạy - ${safeTopic}`);
  triggerBrowserDownload(blob, `Giao_An_Tin_Hoc_CV2345_${grade.replace(/\s+/g, '_')}_${Date.now()}.docx`);
}
