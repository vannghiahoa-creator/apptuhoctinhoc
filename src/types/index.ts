export type GradeLevel = 'Lớp 1' | 'Lớp 2' | 'Lớp 3' | 'Lớp 4' | 'Lớp 5';

export type SocraticStep = 
  | 'Hỏi'        // Step 1: Clarify & observe
  | 'Nghĩ'       // Step 2: Formulate hypothesis
  | 'Dự đoán'    // Step 3: Predict outcomes
  | 'Thử'        // Step 4: Experiment & test
  | 'Kiểm chứng' // Step 5: Verify results
  | 'Giải thích';// Step 6: Explain reasoning

export type HintLevel = 1 | 2 | 3;

export type SkillCategory = 
  | 'Phân tích lỗi' 
  | 'Tư duy logic' 
  | 'An toàn số' 
  | 'Thao tác máy tính';

export type StudentState = 'Cần hỗ trợ' | 'Đang tiến bộ' | 'Hoàn thành';

export interface Student {
  id: string; // Mã HS (VD: HS001, 240101, TH01)
  name: string; // Họ và tên học sinh
  grade: GradeLevel; // Khối lớp
  className?: string; // Tên lớp cụ thể (VD: 3A1, 4B)
  gender?: string; // Nam / Nữ
  dob?: string; // Ngày sinh
  notes?: string; // Ghi chú
  stars?: number; // Số sao tích lũy
}

export interface GoogleSheetConfig {
  sheetUrl: string;
  sheetName?: string;
  lastSyncTime?: number;
  autoSync?: boolean;
}

export interface AssessmentRecord {
  id: string;
  timestamp: number;
  grade: GradeLevel;
  topic: string;
  metadata: TeacherMetadata;
  studentId?: string;
  studentName?: string;
  studentClass?: string;
}

export interface TeacherMetadata {
  skill_assessed: SkillCategory | string;
  hint_level: HintLevel;
  student_state: StudentState;
  teacher_note: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
  greeting?: string;
  hint?: string;
  action?: string;
  transfer?: string;
  metadata?: TeacherMetadata;
  grade?: GradeLevel;
  topic?: string;
  isError?: boolean;
  errorMessage?: string;
  usedModel?: string;
}

export interface ScratchBlock {
  id: string;
  type: 'event' | 'motion' | 'control' | 'looks' | 'sound';
  text: string;
  color: string;
  value?: number | string;
  hasInput?: boolean;
}

export interface ScratchChallenge {
  id: string;
  title: string;
  grade: GradeLevel;
  goal: string;
  bugDescription: string;
  correctBlocks: string[]; // sequence of block ids or keywords
  sampleBlocks: ScratchBlock[];
  initialActiveBlocks: ScratchBlock[];
  hint: string;
}

export interface SafetyScenario {
  id: string;
  title: string;
  grade: GradeLevel;
  category: string;
  sender: string;
  context: string;
  avatar: string;
  dilemma: string;
  options: {
    id: string;
    text: string;
    isSafe: boolean;
    feedback: string;
    socraticPrompt: string;
  }[];
}

export interface HardwarePart {
  id: string;
  name: string;
  icon: string;
  role: string;
  tip: string;
  funFact: string;
  soundName?: string;
}
