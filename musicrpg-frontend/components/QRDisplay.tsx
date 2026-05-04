'use client';

import QRCode from 'react-qr-code';

interface Props {
  data: string;
  size?: number;
  label?: string;
}

export default function QRDisplay({ data, size = 200, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="p-4 rounded-[18px] border-2"
        style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <QRCode value={data} size={size} fgColor="#3a2a4a" bgColor="#ffffff" />
      </div>
      {label && (
        <p className="text-xs text-center" style={{ color: 'var(--dim)' }}>
          {label}
        </p>
      )}
    </div>
  );
}
