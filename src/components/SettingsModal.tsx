'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  model: string;
  onSaveModel: (model: string) => void;
}

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4.1', label: 'GPT-4.1' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.5-preview', label: 'GPT-4.5 Preview' },
  { value: 'gpt-5.2', label: 'GPT-5.2' },
];

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  model,
  onSaveModel,
}: SettingsModalProps) {
  const [keyInput, setKeyInput] = useState(apiKey);
  const [selectedModel, setSelectedModel] = useState(model);

  useEffect(() => {
    setKeyInput(apiKey);
    setSelectedModel(model);
  }, [apiKey, model, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onSaveModel(selectedModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-surface rounded-xl w-[90%] max-w-md p-6 space-y-5">
        <h2 className="text-base font-bold text-accent-gold">설정</h2>

        {/* API Key */}
        <div className="space-y-2">
          <label className="text-xs text-text-secondary block">OpenAI API Key</label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-surface border border-surface rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-purple"
          />
          <p className="text-[10px] text-text-muted">
            키는 브라우저에만 저장되며 서버에 저장되지 않습니다.
          </p>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs text-text-secondary block">모델 선택</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-surface border border-surface rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-purple"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
