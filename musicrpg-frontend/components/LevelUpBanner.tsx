'use client';

import { useEffect, useState } from 'react';

interface Props {
  show: boolean;
  onDone: () => void;
}

export default function LevelUpBanner({ show, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onDone();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      aria-live="polite"
    >
      <div
        className="px-8 py-4 rounded-[18px] border-2 shadow-lg text-center animate-bounce"
        style={{
          background: 'linear-gradient(135deg, #f5a623, #ff7eb3)',
          borderColor: '#f5a623',
          color: '#fff',
        }}
      >
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: 'DotGothic16, monospace' }}
        >
          ✨ LEVEL UP! ✨
        </p>
        <p className="text-sm mt-1">ステータスが更新されました</p>
      </div>
    </div>
  );
}
