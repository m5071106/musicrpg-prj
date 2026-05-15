'use client';

import { useState } from 'react';
import { PRESET_INSTRUMENTS, getInstrumentInfo } from '@/lib/constants';

const MAX = 3;

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export default function InstrumentSelector({ values, onChange, disabled }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');

  function openPicker(index: number) {
    setEditingIndex(index);
    setShowCustomInput(false);
    setCustomText('');
  }

  function closePicker() {
    setEditingIndex(null);
    setShowCustomInput(false);
    setCustomText('');
  }

  function selectPreset(key: string) {
    if (editingIndex === null) return;
    const next = [...values];
    if (editingIndex >= next.length) {
      next.push(key);
    } else {
      next[editingIndex] = key;
    }
    onChange(next);
    closePicker();
  }

  function confirmCustom() {
    const trimmed = customText.trim();
    if (!trimmed || editingIndex === null) return;
    selectPreset(trimmed);
  }

  function removeInstrument(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
    closePicker();
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 登録済み楽器チップ */}
      {values.map((inst, i) => {
        const { emoji, label } = getInstrumentInfo(inst);
        const isEditing = editingIndex === i;
        return (
          <div key={i}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => isEditing ? closePicker() : openPicker(i)}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[12px] border-2 text-sm font-bold text-left transition-all"
                style={{
                  borderColor: isEditing ? '#b06ee0' : '#e8c9f0',
                  background: isEditing ? '#e8d5f8' : '#fdfaff',
                  color: 'var(--text)',
                }}
              >
                <span className="text-base">{emoji}</span>
                <span className="flex-1">{label}</span>
                {!disabled && <span style={{ color: 'var(--dim)', fontSize: '10px' }}>▼</span>}
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeInstrument(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
                  style={{ color: 'var(--dim)', background: '#f0e8ff' }}
                  aria-label="削除"
                >
                  ×
                </button>
              )}
            </div>

            {/* インラインピッカー */}
            {isEditing && (
              <div
                className="mt-2 rounded-[12px] border-2 p-3"
                style={{ borderColor: '#e8c9f0', background: '#fdfaff' }}
              >
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_INSTRUMENTS.map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => selectPreset(p.key)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all"
                      style={{
                        borderColor: values[i] === p.key ? '#b06ee0' : '#e8c9f0',
                        background: values[i] === p.key ? '#e8d5f8' : '#fff',
                        color: values[i] === p.key ? '#b06ee0' : 'var(--text)',
                      }}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(v => !v)}
                    className="px-2.5 py-1 rounded-full border text-xs font-bold transition-all"
                    style={{
                      borderColor: showCustomInput ? '#b06ee0' : '#e8c9f0',
                      background: showCustomInput ? '#e8d5f8' : '#fff',
                      color: showCustomInput ? '#b06ee0' : 'var(--dim)',
                    }}
                  >
                    その他
                  </button>
                </div>
                {showCustomInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="楽器名を入力"
                      className="flex-1 px-3 py-2 rounded-[10px] border-2 text-sm outline-none focus:border-purple-400"
                      style={{ borderColor: '#e8c9f0', background: '#fff', color: 'var(--text)' }}
                      onKeyDown={e => e.key === 'Enter' && confirmCustom()}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={confirmCustom}
                      className="px-4 py-2 rounded-[10px] text-sm font-bold text-white"
                      style={{ background: 'var(--purple)' }}
                    >
                      決定
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 楽器追加ボタン */}
      {!disabled && values.length < MAX && (
        <div>
          <button
            type="button"
            onClick={() => openPicker(values.length)}
            className="w-full flex items-center justify-center gap-1 py-2.5 rounded-[12px] border-2 border-dashed text-sm font-bold transition-all"
            style={{ borderColor: '#e8c9f0', color: 'var(--dim)' }}
          >
            ＋ 楽器を追加（最大{MAX}つ）
          </button>

          {/* 追加用インラインピッカー */}
          {editingIndex === values.length && (
            <div
              className="mt-2 rounded-[12px] border-2 p-3"
              style={{ borderColor: '#e8c9f0', background: '#fdfaff' }}
            >
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_INSTRUMENTS.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => selectPreset(p.key)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold transition-all"
                    style={{
                      borderColor: '#e8c9f0',
                      background: '#fff',
                      color: 'var(--text)',
                    }}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(v => !v)}
                  className="px-2.5 py-1 rounded-full border text-xs font-bold transition-all"
                  style={{
                    borderColor: showCustomInput ? '#b06ee0' : '#e8c9f0',
                    background: showCustomInput ? '#e8d5f8' : '#fff',
                    color: showCustomInput ? '#b06ee0' : 'var(--dim)',
                  }}
                >
                  その他
                </button>
              </div>
              {showCustomInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="楽器名を入力"
                    className="flex-1 px-3 py-2 rounded-[10px] border-2 text-sm outline-none focus:border-purple-400"
                    style={{ borderColor: '#e8c9f0', background: '#fff', color: 'var(--text)' }}
                    onKeyDown={e => e.key === 'Enter' && confirmCustom()}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={confirmCustom}
                    className="px-4 py-2 rounded-[10px] text-sm font-bold text-white"
                    style={{ background: 'var(--purple)' }}
                  >
                    決定
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
