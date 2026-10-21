import React, { useState, useEffect } from 'react';
import {
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Sparkles,
  X,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  GEMINI_MODELS,
  getStoredApiKey,
  saveStoredApiKey,
  getStoredModel,
  saveStoredModel,
  testApiKey,
} from '../utils/geminiAi';
import { playClickPop, playSuccessChime } from '../utils/audio';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRequired?: boolean;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  isRequired = false,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(getStoredApiKey());
      setSelectedModel(getStoredModel());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    playClickPop();
    setIsTesting(true);
    setTestResult(null);

    const res = await testApiKey(apiKeyInput, selectedModel);
    setIsTesting(false);
    setTestResult(res);
    if (res.success) {
      playSuccessChime();
    }
  };

  const handleSave = () => {
    playClickPop();
    const trimmed = apiKeyInput.trim();
    saveStoredApiKey(trimmed);
    saveStoredModel(selectedModel);
    playSuccessChime();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl shadow-xs">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-lg text-slate-800 tracking-tight flex items-center gap-2">
                Thiết Lập Model & API Key Gemini
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý khóa API Google AI Studio cá nhân & chọn mô hình AI
              </p>
            </div>
          </div>

          {!isRequired && (
            <button
              onClick={() => {
                playClickPop();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Callout: Instruction link to Google AI Studio */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-900 flex items-center gap-1.5">
              <span>🔑 Hướng dẫn lấy API Key miễn phí (Google AI Studio):</span>
            </span>
            <a
              href="https://aistudio.google.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Lấy Key ngay</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside text-amber-900 font-medium space-y-0.5 pl-1">
            <li>Truy cập <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="underline font-bold">aistudio.google.com/api-keys</a> và đăng nhập Google.</li>
            <li>Bấm nút <strong>"Create API key"</strong> (Tạo khóa API).</li>
            <li>Sao chép khóa API và dán vào ô bên dưới.</li>
          </ol>
          <div className="text-[11px] text-amber-700 italic">
            * Khóa được lưu trực tiếp trong trình duyệt (localStorage) của bạn, hoàn toàn bảo mật và không gửi về máy chủ trung gian.
          </div>
        </div>

        {/* Input API Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 block">
            Khóa Gemini API Key của bạn:
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => {
                setApiKeyInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="Dán mã API key bắt đầu bằng AIzaSy..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showKey ? 'Ẩn' : 'Hiện'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1 break-words">{testResult.message}</span>
          </div>
        )}

        {/* Model Selection Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-700">
              Chọn Mô Hình AI (AI Model):
            </label>
            <span className="text-[11px] text-slate-400 font-bold">
              Tự động Fallback khi hết quota
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {GEMINI_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    playClickPop();
                    setSelectedModel(m.id);
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-500 shadow-xs ring-2 ring-sky-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isSelected ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {m.id.includes('pro') ? <Cpu className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-xs text-slate-900">
                          {m.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${m.badgeColor}`}>
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={isTesting || !apiKeyInput.trim()}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isRequired && !apiKeyInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thiết lập</span>
          </button>
        </div>
      </div>
    </div>
  );
};
