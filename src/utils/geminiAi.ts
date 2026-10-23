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
    const fromStorage = (localStorage.getItem(STORAGE_KEYS.API_KEY) || '').trim();
    if (fromStorage) return fromStorage;
    const fromEnv = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    return fromEnv;
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
 * Kiểm tra kết nối API Key với Google AI Studio (Tùy chọn)
 */
export async function testApiKey(apiKey: string, modelId = DEFAULT_MODEL): Promise<{ success: boolean; message: string }> {
  const key = (apiKey || '').trim();
  if (!key) {
    return { success: true, message: 'Đang ở chế độ trợ lý NUTA tích hợp sẵn (không cần khóa API, sẵn sàng sử dụng 100%)! ✨' };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`;

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

    return { success: true, message: `Kết nối thành công với Google Gemini (${modelId})! 🎉` };
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
 * Bộ máy Socratic sư phạm Tin học Tiểu học tích hợp sẵn.
 * Hoạt động độc lập, thông minh, không cần bất kỳ khóa API nào!
 */
export function generateBuiltinSocraticResponse(params: CallGeminiParams): CallGeminiResult {
  const {
    messages,
    grade = 'Lớp 3',
    topic = 'Tin học Tiểu học',
    hintLevel = 1,
    currentStep = 'Nghĩ',
    studentName,
    studentId,
    studentClass,
  } = params;

  // Lấy tin nhắn người dùng gần nhất
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content.trim() : '';
  const lower = lastUserMsg.toLowerCase();

  const greetingName = studentName ? `Chào bạn ${studentName}! ` : 'Chào bạn nhỏ! ';
  let greeting = `${greetingName}NUTA rất vui được đồng hành cùng bạn khám phá Tin học! 🤖✨`;
  let hint = '';
  let action = '';
  let transfer = '';
  let teacherNote = '';
  let skillAssessed: TeacherMetadata['skill_assessed'] = 'Tư duy logic';
  let studentState: TeacherMetadata['student_state'] = 'Đang tiến bộ';

  // Nhận diện theo từ khóa & chủ đề bài học
  if (
    lower.includes('di chuyển') ||
    lower.includes('bước đi') ||
    lower.includes('không chạy') ||
    lower.includes('đứng yên') ||
    lower.includes('kẹt')
  ) {
    skillAssessed = 'Tư duy logic';
    if (hintLevel === 1) {
      hint = `Để chú Mèo có thể di chuyển, bạn đã kiểm tra xem trong khối lệnh đã có câu lệnh sự kiện màu vàng (như "Khi bấm vào lá cờ xanh") gắn cùng câu lệnh "di chuyển 10 bước" chưa nhỉ?`;
      action = 'Hãy kiểm tra lại khu vực lắp ghép khối lệnh xem các khối đã được gắn khít vào nhau chưa!';
    } else if (hintLevel === 2) {
      hint = `Nếu bấm cờ xanh mà nhân vật không nhúc nhích, có thể khối lệnh di chuyển đang nằm rời rạc bên ngoài. Bạn thử gắn kết nó với sự kiện bắt đầu xem sao?`;
      action = 'Bấm thử vào khối "di chuyển 10 bước" bằng chuột xem chú Mèo có nhích lên không nhé!';
    } else {
      hint = `Bạn hãy kéo khối "Khi bấm vào lá cờ xanh" (màu vàng) đặt lên đầu, sau đó gắn ngay khối "di chuyển 10 bước" (màu xanh dương) vào bên dưới nào!`;
      action = 'Gắn 2 khối lệnh vào nhau rồi bấm biểu tượng lá cờ xanh ở góc trên sân khấu nhé!';
    }
    teacherNote = `Học sinh đang khám phá liên kết giữa khối sự kiện và khối lệnh chuyển động cơ bản trong Scratch.`;
  } else if (
    lower.includes('mép') ||
    lower.includes('cạnh') ||
    lower.includes('biến mất') ||
    lower.includes('bật lại') ||
    lower.includes('quay lại')
  ) {
    skillAssessed = 'Tư duy logic';
    if (hintLevel === 1) {
      hint = `Khi chú Mèo đi mãi về phía trước và chạm vào rìa màn hình, bạn nghĩ có khối lệnh nào giúp Mèo nhận biết mép sân khấu và tự quay ngược lại không?`;
      action = 'Tìm trong nhóm lệnh Chuyển động (màu xanh dương) xem có khối lệnh nào nhắc đến từ "cạnh" nhé!';
    } else {
      hint = `Trong nhóm Chuyển động có khối lệnh "Nếu tiếp xúc với cạnh, bật lại". Khi kết hợp với lệnh đặt kiểu xoay trái - phải, chú Mèo sẽ không bị lộn ngược đầu đấy!`;
      action = 'Kéo khối "Nếu tiếp xúc với cạnh, bật lại" thả vào bên trong vòng lặp di chuyển nhé!';
    }
    teacherNote = `Học sinh tìm hiểu cách xử lý va chạm biên sân khấu và định hướng nhân vật.`;
  } else if (
    lower.includes('vòng lặp') ||
    lower.includes('lặp lại') ||
    lower.includes('liên tục') ||
    lower.includes('mãi') ||
    lower.includes('forever') ||
    lower.includes('repeat')
  ) {
    skillAssessed = 'Tư duy logic';
    if (hintLevel === 1) {
      hint = `Trong nhóm Điều khiển (màu cam), bạn thấy có 2 loại vòng lặp: "lặp lại 10 lần" và "liên tục". Bạn muốn chú Mèo hành động có điểm dừng hay tiếp diễn mãi mãi?`;
      action = 'Hãy xác định xem yêu cầu bài toán là lặp lại có số lần cụ thể hay liên tục không ngừng!';
    } else {
      hint = `Khối "lặp lại ... lần" dùng khi biết trước số bước lặp, còn khối "liên tục" sẽ chạy mãi cho đến khi bạn bấm nút dừng màu đỏ.`;
      action = 'Hãy thử bọc khối di chuyển vào bên trong khối "liên tục" rồi quan sát chú Mèo nào!';
    }
    teacherNote = `Học sinh phân biệt vòng lặp xác định số lần và vòng lặp vô hạn trong thuật toán.`;
  } else if (
    lower.includes('phím') ||
    lower.includes('mũi tên') ||
    lower.includes('bàn phím') ||
    lower.includes('điều khiển') ||
    lower.includes('trái phải')
  ) {
    skillAssessed = 'Tư duy logic';
    hint = `Để điều khiển nhân vật bằng các phím mũi tên, ta dùng khối sự kiện "Khi bấm phím [mũi tên...]". Bạn có nhớ hướng 90 độ là sang phải, còn -90 độ là sang trái không?`;
    action = 'Hãy thử tạo một khối "Khi bấm phím mũi tên phải" gắn với lệnh "đặt hướng bằng 90" và "di chuyển 10 bước" nhé!';
    teacherNote = `Học sinh học cách tiếp nhận sự kiện bàn phím để tương tác trong lập trình.`;
  } else if (
    lower.includes('trang phục') ||
    lower.includes('costume') ||
    lower.includes('dáng đi') ||
    lower.includes('hoạt hình')
  ) {
    skillAssessed = 'Tư duy logic';
    hint = `Để chú Mèo bước đi như thật sinh động, chúng ta cần chuyển đổi qua lại giữa các hình ảnh trong tab Trang phục. Bạn đã thử lệnh "trang phục kế tiếp" chưa?`;
    action = 'Thêm lệnh "trang phục kế tiếp" và chèn thêm một lệnh "đợi 0.1 giây" để bước đi trông tự nhiên nhất nhé!';
    teacherNote = `Học sinh ứng dụng chuyển đổi trang phục tạo hiệu ứng hoạt họa nhân vật.`;
  } else if (
    lower.includes('unikey') ||
    lower.includes('tiếng việt') ||
    lower.includes('dấu') ||
    lower.includes('telex') ||
    lower.includes('vni') ||
    lower.includes('gõ chữ')
  ) {
    skillAssessed = 'Thao tác máy tính';
    if (hintLevel === 1) {
      hint = `Để gõ tiếng Việt có dấu, bạn hãy nhìn xuống góc dưới cùng bên phải màn hình: Biểu tượng Unikey đang là chữ "V" màu đỏ hay chữ "E" màu xanh?`;
      action = 'Nháy chuột vào biểu tượng hoặc bấm tổ hợp phím Ctrl + Shift để đổi chữ E thành chữ V nhé!';
    } else {
      hint = `Với kiểu gõ Telex quen thuộc: s là sắc, f là huyền, r là hỏi, x là ngã, j là nặng; gõ 2 lần aa được â, oo được ô, ee được ê, dd được đ, ow được ơ, uw được ư.`;
      action = 'Mở phần mềm Word hoặc Notepad rồi gõ thử dòng chữ "Học Tin học" để kiểm tra dấu nhé!';
    }
    teacherNote = `Học sinh rèn luyện kỹ năng gõ bàn phím tiếng Việt và sử dụng bộ gõ Unikey.`;
  } else if (
    lower.includes('chuột') ||
    lower.includes('nháy đúp') ||
    lower.includes('chuột phải') ||
    lower.includes('chuột trái') ||
    lower.includes('con lăn')
  ) {
    skillAssessed = 'Thao tác máy tính';
    hint = `Nút chuột trái dùng để chọn hoặc mở khi nháy đúp (2 lần nhanh). Còn nút chuột phải dùng để mở bảng chọn lệnh (menu). Ngón tay của bạn đã đặt đúng vị trí chưa?`;
    action = 'Thử nháy đúp chuột trái vào một biểu tượng thư mục trên màn hình để mở nó xem sao nhé!';
    teacherNote = `Học sinh thực hành thao tác cầm chuột và phân biệt chức năng các nút chuột.`;
  } else if (
    lower.includes('xóa') ||
    lower.includes('backspace') ||
    lower.includes('delete') ||
    lower.includes('viết hoa') ||
    lower.includes('caps lock') ||
    lower.includes('shift')
  ) {
    skillAssessed = 'Thao tác máy tính';
    hint = `Phím Backspace xóa ký tự đứng TRƯỚC con trỏ, còn phím Delete xóa ký tự đứng SAU con trỏ. Muốn viết hoa 1 chữ cái, hãy nhấn giữ phím Shift kết hợp gõ chữ đó nhé!`;
    action = 'Đặt con trỏ vào giữa một từ và thử bấm Backspace 1 lần rồi bấm Delete 1 lần để quan sát!';
    teacherNote = `Học sinh phân biệt công dụng của các phím chức năng Backspace, Delete, Caps Lock và Shift.`;
  } else if (
    lower.includes('mật khẩu') ||
    lower.includes('password') ||
    lower.includes('tài khoản')
  ) {
    skillAssessed = 'An toàn số';
    hint = `Một mật khẩu mạnh cần có ít nhất 8 ký tự, kết hợp chữ in hoa, chữ thường và chữ số. Tuyệt đối không dùng ngày sinh nhật hoặc tên riêng làm mật khẩu nhé!`;
    action = 'Hãy nghĩ ra một mật khẩu bí mật mà chỉ riêng bạn và bố mẹ biết, không nói cho bạn bè khác nghe nhé!';
    teacherNote = `Học sinh hình thành thói quen bảo vệ thông tin tài khoản và thiết lập mật khẩu an toàn.`;
  } else if (
    lower.includes('người lạ') ||
    lower.includes('kết bạn') ||
    lower.includes('nhắn tin') ||
    lower.includes('quà') ||
    lower.includes('game') ||
    lower.includes('link lạ')
  ) {
    skillAssessed = 'An toàn số';
    hint = `Khi gặp người lạ trên mạng nhắn tin tặng quà, hỏi thăm trường lớp hoặc gửi đường link lạ, bạn cần làm gì để giữ an toàn cho bản thân?`;
    action = 'Tuyệt đối không bấm vào link lạ, không trả lời và hãy báo ngay cho thầy cô hoặc bố mẹ biết nhé!';
    teacherNote = `Học sinh rèn luyện kỹ năng tự bảo vệ trước các nguy cơ lừa đảo hoặc tiếp cận từ người lạ trên Internet.`;
  } else if (
    lower.includes('thông tin cá nhân') ||
    lower.includes('địa chỉ') ||
    lower.includes('số điện thoại')
  ) {
    skillAssessed = 'An toàn số';
    hint = `Họ tên đầy đủ, số điện thoại của bố mẹ, địa chỉ nhà và tên trường lớp là những thông tin cá nhân quan trọng cần được giữ bí mật trên mạng xã hội.`;
    action = 'Hãy ghi nhớ nguyên tắc: "Không tự ý chia sẻ thông tin cá nhân lên mạng Internet!"';
    teacherNote = `Học sinh hiểu và tôn trọng quyền riêng tư, bảo mật thông tin cá nhân trực tuyến.`;
  } else if (
    lower.includes('rùa') ||
    lower.includes('logo') ||
    lower.includes('hình vuông') ||
    lower.includes('tam giác') ||
    lower.includes('fd') ||
    lower.includes('rt')
  ) {
    skillAssessed = 'Tư duy logic';
    hint = `Để vẽ hình khép kín có các cạnh bằng nhau, ta dùng lệnh repeat. Ví dụ hình vuông có 4 cạnh góc quay 90 độ: repeat 4 [fd 100 rt 90]. Bạn có đoán được góc quay của tam giác đều là bao nhiêu độ không (360 chia 3)?`;
    action = 'Thử gõ dòng lệnh repeat 4 [fd 100 rt 90] và bấm Enter để xem chú Rùa vẽ hình vuông nào!';
    teacherNote = `Học sinh ứng dụng câu lệnh lặp và số đo góc trong hình học rùa Logo.`;
  } else if (
    lower.includes('đáp án') ||
    lower.includes('giải hộ') ||
    lower.includes('kết quả') ||
    lower.includes('bài giải') ||
    lower.includes('làm hộ')
  ) {
    greeting = `${greetingName}NUTA là bạn đồng hành gợi mở, không phải máy giải bài hộ đâu nhé! 🌟🤖`;
    hint = `Thay vì nhận đáp án ngay, chúng mình cùng nhau tìm hiểu từng bước để bạn tự làm ra sản phẩm cực xịn nào! Bạn đã thực hiện được bước nào của bài toán rồi?`;
    action = 'Hãy chia sẻ cho NUTA phần bạn đã làm được hoặc gửi ảnh bài tập để chúng mình cùng khám phá nhé!';
    studentState = 'Cần hỗ trợ';
    teacherNote = `Học sinh cần được định hướng phương pháp tư duy gợi mở Socratic thay vì xin đáp án trực tiếp.`;
  } else if (
    lower.includes('chào') ||
    lower.includes('hi') ||
    lower.includes('hello') ||
    lower.includes('xin chào')
  ) {
    greeting = `${greetingName}Rất vui được gặp bạn! Hôm nay chúng mình cùng học Tin học nhé! 🌟💻`;
    hint = `Bạn đang muốn cùng NUTA khám phá chủ đề nào hôm nay: Lập trình Scratch, Thực hành máy tính, hay Khám phá an toàn số?`;
    action = 'Hãy gõ câu hỏi hoặc chia sẻ bài tập của bạn vào ô bên dưới để chúng mình bắt đầu nào!';
    teacherNote = `Học sinh bắt đầu phiên học tập tương tác với trợ lý NUTA.`;
  } else {
    // Phản hồi theo các bước Socratic chuẩn
    if (currentStep === 'Hỏi') {
      hint = `Để bắt đầu giải quyết nhiệm vụ này trong môn ${topic} (${grade}), chúng mình cùng làm rõ: Mục tiêu cuối cùng bạn muốn máy tính hoặc nhân vật làm được là gì?`;
      action = 'Hãy nói cho NUTA biết kết quả mà bạn mong muốn đạt được sau bài học này nhé!';
    } else if (currentStep === 'Nghĩ') {
      hint = `Bạn hãy quan sát thật kỹ bài tập hoặc màn hình hiện tại (${topic}). Bạn nhận thấy có những dữ liệu hoặc khối lệnh nào có thể sử dụng được?`;
      action = 'Hãy kiểm tra lại từng chi tiết và suy nghĩ xem bước đầu tiên cần làm là gì!';
    } else if (currentStep === 'Dự đoán') {
      hint = `Theo bạn, nếu chúng mình thực hiện thao tác này thì trên màn hình sẽ có điều gì thay đổi? Kết quả có giống như bạn nghĩ không?`;
      action = 'Hãy đưa ra dự đoán của riêng bạn trước khi chúng mình bấm thử nghiệm nhé!';
    } else if (currentStep === 'Thử') {
      hint = `Thực hành là cách học tốt nhất! Bạn hãy tự tin thao tác thử trên máy tính, nếu chưa đúng chúng mình cùng sửa lại, không lo sai nhé!`;
      action = 'Thực hiện thao tác thử trên máy và quan sát xem kết quả hiển thị ra sao nào!';
    } else if (currentStep === 'Kiểm chứng') {
      hint = `Kết quả vừa xuất hiện trên máy tính có đúng như dự đoán ban đầu của bạn không? Bạn đã thấy điểm nào tốt và điểm nào cần chỉnh sửa chưa?`;
      action = 'So sánh lại với yêu cầu của đề bài và chỉ ra điểm khác biệt (nếu có) nhé!';
    } else if (currentStep === 'Giải thích') {
      hint = `Bạn làm rất xuất sắc! Bây giờ bạn có thể giải thích ngắn gọn vì sao làm như thế lại ra kết quả đúng cho NUTA và thầy cô nghe được không?`;
      action = 'Hãy tự hào chia sẻ bài học hoặc kinh nghiệm bạn vừa rút ra được nhé!';
      studentState = 'Hoàn thành';
      transfer = 'Thử thách nâng cao: Bạn có nghĩ ra cách nào khác để làm bài này nhanh hơn hoặc sáng tạo hơn không?';
    } else {
      hint = `Tớ thấy bạn đang tìm hiểu về "${topic}" (${grade}). Bạn đã thực hiện đến bước nào rồi và đang gặp khó khăn ở điểm nào?`;
      action = 'Bạn hãy thử kiểm tra lại từng khối lệnh hoặc thao tác trên màn hình xem sao nhé!';
    }
    teacherNote = `Học sinh đang thực hiện bước tư duy "${currentStep}" trong quy trình Socratic đối với chủ đề ${topic}.`;
  }

  const raw = `[GREETING]\n${greeting}\n\n[HINT]\n${hint}\n\n[ACTION]\n${action}\n\n[METADATA]\n${JSON.stringify({
    skill_assessed: skillAssessed,
    hint_level: hintLevel,
    student_state: studentState,
    teacher_note: teacherNote,
  })}\n\n[TRANSFER]\n${transfer}`;

  return {
    greeting,
    hint,
    action,
    metadata: {
      skill_assessed: skillAssessed,
      hint_level: hintLevel,
      student_state: studentState,
      teacher_note: teacherNote,
    },
    transfer,
    raw,
    usedModel: 'NUTA Socratic (Tích hợp sẵn)',
  };
}

/**
 * Gọi Gemini API với cơ chế Fallback và Retry tự động.
 * Khi KHÔNG có API key, tự động dùng trợ lý NUTA Socratic tích hợp sẵn!
 */
export async function callGeminiWithFallback(params: CallGeminiParams): Promise<CallGeminiResult> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    // Không cần API key: Trả về phản hồi từ bộ máy Socratic tích hợp sẵn ngay lập tức!
    return generateBuiltinSocraticResponse(params);
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
          // Tất cả model đều thất bại -> tự động chuyển sang trợ lý Socratic tích hợp sẵn
          console.warn(`[Gemini Fallback] Tất cả model đều gặp lỗi (${lastErrorDetail}). Tự động chuyển sang trợ lý Socratic tích hợp sẵn.`);
          const fallbackRes = generateBuiltinSocraticResponse(params);
          return {
            ...fallbackRes,
            usedModel: 'NUTA Socratic (Tự động dự phòng)',
          };
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
        console.warn(`[Gemini Fallback] Lỗi kết nối (${lastErrorDetail}). Tự động chuyển sang trợ lý Socratic tích hợp sẵn.`);
        const fallbackRes = generateBuiltinSocraticResponse(params);
        return {
          ...fallbackRes,
          usedModel: 'NUTA Socratic (Tự động dự phòng)',
        };
      }
    }
  }

  const fallbackRes = generateBuiltinSocraticResponse(params);
  return {
    ...fallbackRes,
    usedModel: 'NUTA Socratic (Tự động dự phòng)',
  };
}
