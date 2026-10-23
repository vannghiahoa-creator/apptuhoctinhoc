import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK (server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const NUTA_SYSTEM_INSTRUCTION = `
Bạn là NUTA, một nhân vật Robot trợ lý ảo thông minh, thân thiện, được thiết kế chuyên biệt để đồng hành cùng học sinh tiểu học (lớp 1 đến lớp 5) tại Việt Nam trong môn Tin học. Bạn đóng vai trò là một người hướng dẫn (Facilitator) theo phương pháp Socratic (gợi mở), không phải là một công cụ giải bài tập hộ.

MỤC TIÊU:
- Kích thích tư duy phản biện: Hướng dẫn học sinh tự suy nghĩ, phân tích vấn đề và tìm ra giải pháp thay vì cung cấp đáp án có sẵn.
- Hỗ trợ thực hành: Giúp học sinh phát hiện lỗi (debug) trong các thao tác máy tính, lập trình Scratch, Kodu và các tình huống an toàn số.
- Cá nhân hóa giáo dục: Điều chỉnh mức độ gợi ý dựa trên khả năng của từng học sinh, đồng thời cung cấp dữ liệu phân tích kỹ năng cho giáo viên.
- Đảm bảo an toàn: Tạo môi trường học tập số an toàn, bảo mật thông tin và phù hợp với tâm sinh lý trẻ em.

QUY TẮC CỐT LÕI (The "Think-First" Rule):
1. Tuyệt đối không cho đáp án ngay lập tức: Dù học sinh hỏi trực tiếp, NUTA phải bắt đầu bằng cách hỏi ngược lại về những gì học sinh đã quan sát hoặc đã thử làm.
2. Quy trình 6 bước: Tuân thủ luồng: Hỏi → Nghĩ → Dự đoán → Thử → Kiểm chứng → Giải thích.
3. Chiến lược gợi ý (Hinting Strategy):
   - Gợi ý 1 (Nhẹ): Nhắc lại kiến thức nền hoặc yêu cầu quan sát kỹ một chi tiết.
   - Gợi ý 2 (Vừa): Đưa ra giả thuyết "Nếu... thì..." để học sinh dự đoán.
   - Gợi ý 3 (Rõ): Chia nhỏ nhiệm vụ thành các bước cực đơn giản.
4. Phản hồi về lỗi sai: Tuyệt đối không dùng từ "Sai rồi", "Kém thế". Hãy dùng: "Ồ, kết quả này hơi khác một chút, chúng mình cùng kiểm tra lại xem sao nhé!", "Bạn đã đi được nửa đường rồi đấy, cố lên!".

HƯỚNG DẪN NGHIỆP VỤ:
1. Lập trình (Scratch/Kodu): Khi học sinh gặp lỗi, hãy yêu cầu học sinh mô tả "Nhân vật đang làm gì?" và "Bạn muốn nhân vật làm gì?". Gợi ý tập trung vào các khối lệnh điều kiện, lặp hoặc thứ tự logic.
2. An toàn số: Luôn nhấn mạnh việc bảo vệ thông tin cá nhân. Nếu gặp tình huống nguy hiểm hoặc nhạy cảm, hãy hướng dẫn học sinh báo ngay cho giáo viên hoặc cha mẹ.
3. Xử lý thông tin: Đánh giá dựa trên lập luận của học sinh. Yêu cầu "Bạn có thể giải thích rõ hơn tại sao bạn chọn thế không?".

GIỚI HẠN VÀ BẢO MẬT:
1. Không bao giờ hỏi hoặc lưu trữ tên đầy đủ, số điện thoại, địa chỉ của học sinh.
2. Chỉ trả lời các vấn đề liên quan đến Tin học, tư duy logic và kỹ năng số tiểu học. Từ chối khéo léo các câu hỏi ngoài lứa tuổi.
3. Tính trung thực: Nếu chưa chắc chắn, nói: "NUTA chưa chắc chắn lắm, bạn hãy thử thực hiện trên máy tính hoặc hỏi thầy/cô để chúng mình cùng biết nhé!".

TONE & PERSONA:
- Robot NUTA màu trắng - xanh dương, dễ thương, thông thái nhưng khiêm tốn.
- Xưng hô: "Tớ" - "Bạn" hoặc "NUTA" - "Bạn". Tiếng Việt trong sáng, gần gũi.
- Ngắn gọn: Mỗi phản hồi không quá 3-4 câu để học sinh không nản đọc.
- Tích cực & Emoji: 🤖, 💻, ✨, 🚀, 💡.

CẤU TRÚC PHẢN HỒI (RẤT QUAN TRỌNG):
Luôn trình bày theo cấu trúc phân định rõ ràng như sau:

[GREETING]
Lời chào khích lệ ngắn (1 câu)

[HINT]
Câu hỏi gợi mở hoặc gợi ý tư duy theo cấp độ (1-2 câu)

[ACTION]
Yêu cầu hành động cụ thể để học sinh bấm thử hoặc quan sát (1 câu)

[METADATA]
{
  "skill_assessed": "Phân tích lỗi" | "Tư duy logic" | "An toàn số" | "Thao tác máy tính",
  "hint_level": 1 | 2 | 3,
  "student_state": "Cần hỗ trợ" | "Đang tiến bộ" | "Hoàn thành",
  "teacher_note": "Ghi chú phân tích ngắn gọn cho giáo viên"
}

[TRANSFER]
(Chỉ có nếu học sinh đã giải xong hoặc đạt bước hoàn thành: 1 câu hỏi thử thách mở rộng. Nếu chưa hoàn thành thì để trống hoặc 1 câu khuyến khích tiếp theo).
`;

app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      grade = 'Lớp 3',
      topic = 'Tin học chung',
      hintLevel = 1,
      currentStep = 'Nghĩ',
      studentName,
      studentId,
      studentClass,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Danh sách tin nhắn không hợp lệ.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Phản hồi Socratic thông minh khi không có khóa API trên server
      const greetingName = studentName ? `Chào bạn ${studentName}! ` : 'Chào bạn nhỏ! ';
      const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
      let hint = `Tớ thấy bạn đang tìm hiểu về "${topic}" (${studentClass || grade}). Bạn có nhận ra điểm gì khác biệt khi thử bước này không nhỉ?`;
      let action = "Bạn hãy thử bấm lại hoặc quan sát kỹ khối lệnh xem sao nhé!";
      let skillAssessed = topic.includes('Scratch') ? "Tư duy logic" : topic.includes('An toàn') ? "An toàn số" : "Phân tích lỗi";

      if (lastMsg.includes('di chuyển') || lastMsg.includes('không chạy') || lastMsg.includes('đứng yên')) {
        hint = "Để nhân vật di chuyển, bạn đã kiểm tra xem khối 'di chuyển 10 bước' đã gắn liền với sự kiện cờ xanh chưa?";
        action = "Hãy kiểm tra lại việc ghép nối khối lệnh trên sân khấu nhé!";
      } else if (lastMsg.includes('unikey') || lastMsg.includes('tiếng việt') || lastMsg.includes('dấu')) {
        hint = "Để gõ tiếng Việt có dấu, bạn hãy kiểm tra biểu tượng Unikey ở góc phải màn hình đang là chữ V đỏ hay chữ E xanh nhé!";
        action = "Nháy chuột vào Unikey hoặc bấm Ctrl + Shift để chuyển sang chữ V!";
        skillAssessed = "Thao tác máy tính";
      } else if (lastMsg.includes('mật khẩu') || lastMsg.includes('người lạ') || lastMsg.includes('thông tin')) {
        hint = "Mật khẩu an toàn cần có cả chữ hoa, chữ thường và chữ số. Tuyệt đối không chia sẻ thông tin cá nhân cho người lạ trên mạng nhé!";
        action = "Hãy nhớ quy tắc bảo vệ thông tin cá nhân an toàn số!";
        skillAssessed = "An toàn số";
      }

      return res.json({
        greeting: `${greetingName}NUTA đã sẵn sàng đồng hành cùng bạn rồi đây! 🌟🤖`,
        hint,
        action,
        metadata: {
          skill_assessed: skillAssessed,
          hint_level: hintLevel,
          student_state: "Đang tiến bộ",
          teacher_note: `Học sinh ${studentName || ''} (${studentId || ''}) đang thảo luận chủ đề ${topic} ở mức gợi ý ${hintLevel}.`,
        },
        transfer: "Nếu hoàn thành thử thách này, bạn có muốn thử tăng tốc độ hoặc mở rộng bài toán không?",
        raw: hint,
        usedModel: "NUTA Socratic (Tích hợp sẵn)"
      });
    }

    // Format conversation for Gemini
    const contents: any[] = [];

    // Context message introducing student grade, identity, and preference
    const studentInfo = studentName
      ? `Học sinh tên là "${studentName}" (Mã HS: ${studentId || 'Chưa rõ'}, Lớp: ${studentClass || grade}). Hãy gọi tên học sinh thân mật và khích lệ (ví dụ: "Chào bạn ${studentName}", "${studentName} ơi"). `
      : '';
    const systemContext = `Bối cảnh học sinh: ${studentInfo}Đang học ${grade}, chủ đề hiện tại: "${topic}", mức độ gợi ý ưu tiên: Mức ${hintLevel}, bước tư duy hiện tại: "${currentStep}". Hãy nhớ tuân thủ nghiêm ngặt phương pháp gợi mở, không đưa đáp án trực tiếp!`;

    // Process past messages
    for (const msg of messages) {
      const parts: any[] = [];

      if (msg.image) {
        // msg.image format: data:image/png;base64,...
        const match = msg.image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      parts.push({ text: msg.content || '' });

      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts,
      });
    }

    // Call Gemini 3.8 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: `${NUTA_SYSTEM_INSTRUCTION}\n\n${systemContext}`,
        temperature: 0.7,
      },
    });

    const responseText = response.text || '';

    // Parse the sections: [GREETING], [HINT], [ACTION], [METADATA], [TRANSFER]
    const greetingMatch = responseText.match(/\[GREETING\]\s*([\s\S]*?)(?=\[(?:HINT|ACTION|METADATA|TRANSFER)\]|$)/i);
    const hintMatch = responseText.match(/\[HINT\]\s*([\s\S]*?)(?=\[(?:GREETING|ACTION|METADATA|TRANSFER)\]|$)/i);
    const actionMatch = responseText.match(/\[ACTION\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|METADATA|TRANSFER)\]|$)/i);
    const metaMatch = responseText.match(/\[METADATA\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|ACTION|TRANSFER)\]|$)/i);
    const transferMatch = responseText.match(/\[TRANSFER\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|ACTION|METADATA)\]|$)/i);

    let parsedMeta = {
      skill_assessed: "Tư duy logic",
      hint_level: hintLevel,
      student_state: "Đang tiến bộ",
      teacher_note: "Học sinh tích cực phản hồi và suy luận."
    };

    if (metaMatch && metaMatch[1]) {
      try {
        const jsonStr = metaMatch[1].replace(/```json/g, '').replace(/```/g, '').trim();
        parsedMeta = { ...parsedMeta, ...JSON.parse(jsonStr) };
      } catch (e) {
        console.warn('Could not parse metadata JSON from NUTA response', e);
      }
    }

    const greeting = greetingMatch ? greetingMatch[1].trim() : "Chào bạn! Tớ rất vui vì bạn đã đặt câu hỏi! 🤖✨";
    const hint = hintMatch ? hintMatch[1].trim() : (responseText.slice(0, 160) || "Hãy quan sát thật kỹ các bước vừa làm nhé!");
    const action = actionMatch ? actionMatch[1].trim() : "Bạn hãy thử kiểm tra lại trên màn hình xem điều gì xảy ra!";
    const transfer = transferMatch ? transferMatch[1].trim() : "";

    res.json({
      greeting,
      hint,
      action,
      metadata: parsedMeta,
      transfer,
      raw: responseText,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      error: 'NUTA gặp chút trục trặc nhỏ khi suy nghĩ. Bạn thử bấm gửi lại nhé! 🤖',
      details: err?.message,
    });
  }
});

// Endpoint đồng bộ danh sách mã HS trực tuyến từ Google Sheet
app.post('/api/google-sheet/sync', async (req, res) => {
  try {
    const { sheetUrl, sheetName } = req.body;
    if (!sheetUrl || typeof sheetUrl !== 'string') {
      return res.status(400).json({ error: 'Thiếu đường dẫn Google Sheet.' });
    }

    const targetUrl = sheetUrl.trim();

    // Trường hợp 1: Google Apps Script Web App trả về JSON
    if (targetUrl.includes('script.google.com/macros/s/')) {
      const scriptResp = await fetch(targetUrl);
      if (!scriptResp.ok) {
        return res.status(scriptResp.status).json({ error: `Apps Script trả về lỗi ${scriptResp.status}` });
      }
      const jsonData: any = await scriptResp.json();
      const list = Array.isArray(jsonData) ? jsonData : (jsonData.students || jsonData.data || []);
      return res.json({ success: true, students: list, count: list.length });
    }

    // Trường hợp 2: Google Spreadsheet thông thường hoặc Published Sheet
    let csvUrl = targetUrl;
    const pubMatch = targetUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
    const standardMatch = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = targetUrl.match(/[#?&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    if (pubMatch && pubMatch[1]) {
      csvUrl = `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv` + (gid ? `&gid=${gid}` : '');
    } else if (standardMatch && standardMatch[1]) {
      csvUrl = `https://docs.google.com/spreadsheets/d/${standardMatch[1]}/gviz/tq?tqx=out:csv`;
      if (sheetName && sheetName.trim()) {
        csvUrl += `&sheet=${encodeURIComponent(sheetName.trim())}`;
      } else if (gid) {
        csvUrl += `&gid=${gid}`;
      }
    }

    const sheetResp = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NUTA-App/1.0',
        'Accept': 'text/csv,text/plain,*/*',
      },
    });

    if (!sheetResp.ok) {
      return res.status(sheetResp.status).json({
        error: `Không thể kết nối đến Google Sheet (HTTP ${sheetResp.status}). Vui lòng kiểm tra lại URL.`,
      });
    }

    const text = await sheetResp.text();

    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
      return res.status(403).json({
        error: 'Google Sheet đang ở chế độ Riêng tư. Vui lòng bấm "Chia sẻ" -> chọn "Bất kỳ ai có đường liên kết" -> quyền "Người xem".',
      });
    }

    // Phân tích CSV đơn giản tại server
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return res.status(400).json({ error: 'Bảng tính Google Sheet rỗng.' });
    }

    // Phân tách từng dòng có tính đến dấu ngoặc kép
    const parsedRows: string[][] = lines.map(line => {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim().replace(/^"|"$/g, ''));
      return row;
    });

    // Tìm dòng header
    let headerIdx = -1;
    let idIdx = -1;
    let sttIdx = -1;
    let nameIdx = -1;
    let hoIdx = -1;
    let tenIdx = -1;
    let classIdx = -1;
    let genderIdx = -1;
    let dobIdx = -1;
    let noteIdx = -1;

    for (let r = 0; r < Math.min(parsedRows.length, 25); r++) {
      const lowerRow = parsedRows[r].map(c => c.toLowerCase().trim());
      if (lowerRow.filter(c => c.length > 0).length < 2) continue;

      lowerRow.forEach((c, idx) => {
        if (c === 'stt' || c === 'số tt' || c === 'số thứ tự' || c === 'no.' || c === 'no') {
          if (sttIdx === -1) sttIdx = idx;
        } else if (
          c.includes('mã hs') || c.includes('ma hs') || c.includes('mã học sinh') ||
          c.includes('mã định danh') || c.includes('số định danh') || c.includes('mshs') ||
          c === 'mã số' || c === 'mã' || c === 'id' || c === 'code' || c === 'sbd' || c.includes('số báo danh')
        ) {
          if (idIdx === -1) idIdx = idx;
        } else if (c.includes('họ và tên đệm') || c.includes('họ và chữ lót') || c.includes('họ đệm') || c === 'họ') {
          if (hoIdx === -1) hoIdx = idx;
        } else if (c === 'tên' || c === 'tên học sinh' || c === 'tên hs') {
          if (tenIdx === -1) tenIdx = idx;
        } else if (c.includes('họ và tên') || c.includes('họ tên') || c === 'name' || c === 'full name') {
          if (nameIdx === -1) nameIdx = idx;
        } else if (c.includes('lớp') || c.includes('khối') || c === 'class') {
          if (classIdx === -1) classIdx = idx;
        } else if (c.includes('giới tính') || c.includes('phái') || c.includes('nam/nữ') || c === 'gender') {
          if (genderIdx === -1) genderIdx = idx;
        } else if (c.includes('ngày sinh') || c.includes('năm sinh') || c === 'dob' || c === 'birthday') {
          if (dobIdx === -1) dobIdx = idx;
        } else if (c.includes('ghi chú') || c.includes('nhận xét') || c === 'note') {
          if (noteIdx === -1) noteIdx = idx;
        }
      });

      const hasName = nameIdx >= 0 || (hoIdx >= 0 && tenIdx >= 0) || tenIdx >= 0;
      const hasId = idIdx >= 0 || sttIdx >= 0;
      if (hasName && (hasId || classIdx >= 0 || dobIdx >= 0)) {
        headerIdx = r;
        break;
      }
    }

    if (idIdx === -1 && sttIdx >= 0) idIdx = sttIdx;
    if (idIdx === -1) idIdx = 0;
    if (nameIdx === -1 && hoIdx === -1 && tenIdx === -1) nameIdx = 1;
    if (classIdx === -1) classIdx = 2;

    const students: any[] = [];
    for (let r = headerIdx + 1; r < parsedRows.length; r++) {
      const row = parsedRows[r];
      if (!row || row.length === 0) continue;
      const rawId = (idIdx >= 0 && row[idIdx] ? row[idIdx] : '').trim();

      let rawName = '';
      if (hoIdx >= 0 && tenIdx >= 0) {
        rawName = `${(row[hoIdx] || '').trim()} ${(row[tenIdx] || '').trim()}`.trim();
      } else if (nameIdx >= 0) {
        rawName = (row[nameIdx] || '').trim();
      } else if (tenIdx >= 0) {
        rawName = (row[tenIdx] || '').trim();
      }

      if (!rawId && !rawName) continue;
      if (rawName.toLowerCase().includes('họ và tên') || rawId.toLowerCase().includes('mã hs')) continue;

      const rawClass = classIdx >= 0 && row[classIdx] ? row[classIdx].trim() : '3A';
      let grade = 'Lớp 3';
      if (rawClass.includes('1')) grade = 'Lớp 1';
      else if (rawClass.includes('2')) grade = 'Lớp 2';
      else if (rawClass.includes('4')) grade = 'Lớp 4';
      else if (rawClass.includes('5')) grade = 'Lớp 5';

      students.push({
        id: rawId || `HS${String(students.length + 1).padStart(3, '0')}`,
        name: rawName || `Học sinh ${rawId || students.length + 1}`,
        grade,
        className: rawClass,
        gender: genderIdx >= 0 ? row[genderIdx] : undefined,
        dob: dobIdx >= 0 ? row[dobIdx] : undefined,
        notes: noteIdx >= 0 ? row[noteIdx] : undefined,
        stars: 12,
      });
    }

    res.json({
      success: true,
      students,
      count: students.length,
      source: csvUrl,
    });
  } catch (err: any) {
    console.error('Error in /api/google-sheet/sync:', err);
    res.status(500).json({
      error: 'Không thể đồng bộ dữ liệu từ Google Sheet. Vui lòng kiểm tra lại đường dẫn và kết nối mạng.',
      details: err?.message,
    });
  }
});

// Sound / Audio effects or TTS endpoint if needed
app.post('/api/speech', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Text is required or API key missing' });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Đọc giọng robot thân thiện, vui tươi dành cho trẻ em: ${text}`,
              speechMetadata: {
                style: "Friendly, cheerful, robotic cute companion for children",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated' });
    }

    res.json({ audio: base64Audio });
  } catch (err: any) {
    console.warn('Gemini TTS error or not enabled for current key:', err?.message);
    res.status(500).json({ error: 'TTS unavailable, client will use browser synthesis.' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 NUTA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
