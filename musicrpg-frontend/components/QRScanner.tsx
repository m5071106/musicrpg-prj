'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

interface Props {
  onScan: (data: string) => void;
}

export default function QRScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: 640, height: 480 },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setScanning(true);
        tick();
      } catch {
        setError('カメラへのアクセスを許可してください');
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !active) return;
      if (video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        onScanRef.current(code.data);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      active = false;
      stopStream();
    };
  }, [stopStream]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-[18px] border-2"
        style={{ borderColor: 'var(--border)', background: '#000' }}
      >
        <video
          ref={videoRef}
          className="w-full block"
          playsInline
          muted
        />
        {/* 照準フレーム */}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-48 h-48 border-4 rounded-[8px]"
              style={{ borderColor: 'var(--cyan)', opacity: 0.8 }}
            />
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      {error && (
        <p className="text-sm text-center" style={{ color: '#e05555' }}>
          {error}
        </p>
      )}
      {!error && !scanning && (
        <p className="text-sm text-center" style={{ color: 'var(--dim)' }}>
          カメラを起動中...
        </p>
      )}
      {scanning && (
        <p className="text-xs text-center" style={{ color: 'var(--dim)' }}>
          相手のQRコードをカメラに向けてください
        </p>
      )}
    </div>
  );
}
