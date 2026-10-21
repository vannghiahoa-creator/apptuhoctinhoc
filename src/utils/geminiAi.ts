import { GradeLevel, HintLevel, TeacherMetadata } from '../types';

export interface GeminiModelInfo {
  id: string;
  name: string;
  tag: string;
  desc: string;
  badgeColor: string;
}

export const GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    tag: 'Khuyên dùng (Default)',
    desc: 'Tốc độ phản hồi cực nhanh, tối ưu cho hỏi đáp gợi mở Socratic tiểu học',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    tag: 'Tư duy nâng cao',
    desc: 'Suy luận logic sâu sắc, phân tích và gỡ lỗi lập trình Scratch chuyên sâu',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tag: 'Dự phòng ổn định',
    desc: 'Tốc độ cao, độ ổn định tuyệt đối khi các model preview gặp sự cố hoặc quá tải quota',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const FALLBACK_MODELS_SEQUENCE = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

export const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  SELECTED_MODEL: 'gemini_selected_model',
};

export function getStoredApiKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEYS.API_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function saveStoredApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  } catch (e) {
    console.warn('Could not save API key to localStorage', e);
  }
}

export function getStoredModel(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (saved && GEMINI_MODELS.some((m) => m.id === saved)) {
      return saved;
    }
  } catch {
    // fallback
  }
  return DEFAULT_MODEL;
}

export function saveStoredModel(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  } catch (e) {
    console.warn('Could not save selected model to localStorage', e);
  }
}

export const NUTA_SYSTEM_INSTRUCTION = `
Bạn là NUTA, một nhân vật Robot trợ lý ảo thông minh, thân thiện, được thiết kế chuyên biệt để đồng hành cùng học sinh tiểu học (lớp 1 đến lớp 5) tại Việt Nam trong môn Tin học. Bạn đóng vai trò là một người hướng dẫn (Facilitator) theo phương pháp Socratic (gợi mở), không phải là một công cụ giải bài tập hộ.

MỤC TIÊU:
- Kích thích tư duy phản biện: Hướng dẫn học sinh tự suy nghĩ, phân tích vấn đề và tìm ra giải pháp thay vì cung cấp đáp án có sẵn.
- Hỗ trợ thực hành: Giúp học sinh phát hiện lỗi (debug) trong các thao tác máy tính, lập trình Scratch và các tình huống an toàn số.
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
(Chỉ có nếu học sinh đã giải xong hoặc đạt bước hoàn thành: 1 câu hỏi thử thách mở rộng. Nếu chưa hoàn thành thì để trống).
`;

/**
 * Kiểm tra kết nối API Key với Google AI Studio
 */
export async function testApiKey(apiKey: string, modelId = DEFAULT_MODEL): Promise<{ success: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey.trim()}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Chào NUTA, kiểm tra kết nối API Key nhé!' }],
          },
        ],
        generationConfig: { maxOutputTokens: 20 },
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const statusName = errorJson?.error?.status ? ` ${errorJson.error.status}` : '';
      const errMsg = errorJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      return { success: false, message: `Lỗi kết nối API: ${response.status}${statusName}: ${errMsg}` };
    }

    return { success: true, message: `Kết nối thành công với model ${modelId}! 🎉` };
  } catch (err: any) {
    return { success: false, message: `Lỗi mạng hoặc không thể kết nối tới Google AI: ${err?.message}` };
  }
}

export interface CallGeminiParams {
  messages: { role: 'user' | 'assistant'; content: string; image?: string }[];
  grade?: GradeLevel;
  topic?: string;
  hintLevel?: HintLevel;
  currentStep?: string;
  studentName?: string;
  studentId?: string;
  studentClass?: string;
  onModelFallback?: (fromModel: string, toModel: string, error: string) => void;
}

export interface CallGeminiResult {
  greeting: string;
  hint: string;
  action: string;
  metadata: TeacherMetadata;
  transfer: string;
  raw: string;
  usedModel: string;
}

/**
 * Gọi Gemini API với cơ chế Fallback và Retry tự động theo AI_INSTRUCTIONS.md
 */
export async function callGeminiWithFallback(params: CallGeminiParams): Promise<CallGeminiResult> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('CHUA_CO_API_KEY');
  }

  const preferredModel = getStoredModel();

  // Xây dựng danh sách model thử nghiệm: Ưu tiên model đang chọn, sau đó là các model trong sequence
  const modelChain: string[] = [preferredModel];
  for (const m of FALLBACK_MODELS_SEQUENCE) {
    if (!modelChain.includes(m)) {
      modelChain.push(m);
    }
  }

  const {
    messages,
    grade = 'Lớp 3',
    topic = 'Tin học Tiểu học',
    hintLevel = 1,
    currentStep = 'Nghĩ',
    studentName,
    studentId,
    studentClass,
    onModelFallback,
  } = params;

  // Chuẩn bị system instruction
  const studentInfo = studentName
    ? `Học sinh tên là "${studentName}" (Mã HS: ${studentId || 'Chưa rõ'}, Lớp: ${studentClass || grade}). Hãy gọi tên học sinh thân mật và khích lệ (ví dụ: "Chào bạn ${studentName}", "${studentName} ơi"). `
    : '';
  const systemContext = `Bối cảnh học sinh: ${studentInfo}Đang học ${grade}, chủ đề hiện tại: "${topic}", mức độ gợi ý ưu tiên: Mức ${hintLevel}, bước tư duy hiện tại: "${currentStep}". Hãy nhớ tuân thủ nghiêm ngặt phương pháp gợi mở, không đưa đáp án trực tiếp!`;

  // Format contents cho Gemini REST API
  const contents: any[] = [];
  for (const msg of messages) {
    const parts: any[] = [];
    if (msg.image) {
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

  let lastErrorDetail = '';

  // Duyệt qua từng model trong chuỗi fallback
  for (let i = 0; i < modelChain.length; i++) {
    const currentModel = modelChain[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: `${NUTA_SYSTEM_INSTRUCTION}\n\n${systemContext}` }],
          },
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        const errorStatus = response.status;
        const statusName = errorJson?.error?.status ? ` ${errorJson.error.status}` : '';
        const errorMessage = errorJson?.error?.message || `HTTP ${errorStatus} ${response.statusText}`;
        lastErrorDetail = `${errorStatus}${statusName}: ${errorMessage}`;

        // Nếu có model tiếp theo, thực hiện fallback retry
        if (i < modelChain.length - 1) {
          const nextModel = modelChain[i + 1];
          console.warn(`[Gemini Fallback] Model ${currentModel} gặp lỗi (${lastErrorDetail}). Tự động chuyển đổi sang ${nextModel}...`);
          if (onModelFallback) {
            onModelFallback(currentModel, nextModel, lastErrorDetail);
          }
          continue; // thử model tiếp theo
        } else {
          // Tất cả model đều thất bại -> throw nguyên văn mã lỗi
          throw new Error(lastErrorDetail);
        }
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!candidateText) {
        throw new Error('API phản hồi dữ liệu rỗng.');
      }

      // Phân tách các khối cấu trúc: [GREETING], [HINT], [ACTION], [METADATA], [TRANSFER]
      const greetingMatch = candidateText.match(/\[GREETING\]\s*([\s\S]*?)(?=\[(?:HINT|ACTION|METADATA|TRANSFER)\]|$)/i);
      const hintMatch = candidateText.match(/\[HINT\]\s*([\s\S]*?)(?=\[(?:GREETING|ACTION|METADATA|TRANSFER)\]|$)/i);
      const actionMatch = candidateText.match(/\[ACTION\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|METADATA|TRANSFER)\]|$)/i);
      const metaMatch = candidateText.match(/\[METADATA\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|ACTION|TRANSFER)\]|$)/i);
      const transferMatch = candidateText.match(/\[TRANSFER\]\s*([\s\S]*?)(?=\[(?:GREETING|HINT|ACTION|METADATA)\]|$)/i);

      let parsedMeta: TeacherMetadata = {
        skill_assessed: topic.includes('Scratch') ? 'Tư duy logic' : topic.includes('An toàn') ? 'An toàn số' : 'Phân tích lỗi',
        hint_level: hintLevel,
        student_state: 'Đang tiến bộ',
        teacher_note: 'Học sinh tích cực phản hồi và suy luận cùng NUTA.',
      };

      if (metaMatch && metaMatch[1]) {
        try {
          const cleanJson = metaMatch[1].replace(/```json/g, '').replace(/```/g, '').trim();
          parsedMeta = { ...parsedMeta, ...JSON.parse(cleanJson) };
        } catch (e) {
          console.warn('Không thể parse metadata JSON từ phản hồi', e);
        }
      }

      const greeting = greetingMatch ? greetingMatch[1].trim() : (studentName ? `Chào bạn ${studentName}! 🤖✨` : 'Chào bạn! Tớ rất vui vì bạn đã đặt câu hỏi! 🤖✨');
      const hint = hintMatch ? hintMatch[1].trim() : (candidateText.slice(0, 160) || 'Hãy quan sát thật kỹ các bước vừa làm nhé!');
      const action = actionMatch ? actionMatch[1].trim() : 'Bạn hãy thử kiểm tra lại trên màn hình xem điều gì xảy ra!';
      const transfer = transferMatch ? transferMatch[1].trim() : '';

      return {
        greeting,
        hint,
        action,
        metadata: parsedMeta,
        transfer,
        raw: candidateText,
        usedModel: currentModel,
      };
    } catch (err: any) {
      lastErrorDetail = err?.message || 'Lỗi không xác định';
      if (i < modelChain.length - 1) {
        const nextModel = modelChain[i + 1];
        console.warn(`[Gemini Fallback] Lỗi mạng khi gọi ${currentModel} (${lastErrorDetail}). Đổi sang ${nextModel}...`);
        if (onModelFallback) {
          onModelFallback(currentModel, nextModel, lastErrorDetail);
        }
        continue;
      } else {
        throw new Error(lastErrorDetail);
      }
    }
  }

  throw new Error(lastErrorDetail || 'Tất cả các model AI đều gặp lỗi.');
}
