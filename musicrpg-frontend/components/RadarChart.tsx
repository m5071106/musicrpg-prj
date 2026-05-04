'use client';

import { useEffect, useRef } from 'react';
import type { Stats } from '@/types';

const LABELS = ['TEMPO', 'EMOTION', 'RANGE', 'EFFORT', 'STAGE'] as const;

const statsToArray = (s: Stats) =>
  [s.stat_tempo, s.stat_emotion, s.stat_range, s.stat_effort, s.stat_stage];

export default function RadarChart({
  stats,
  compareStats,
}: {
  stats: Stats;
  compareStats?: Stats;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 8;
    const r = 76;
    const n = 5;

    ctx.clearRect(0, 0, W, H);

    const angles = Array.from(
      { length: n },
      (_, i) => (Math.PI * 2 * i) / n - Math.PI / 2
    );

    const pt = (val: number, a: number): [number, number] => [
      cx + Math.cos(a) * (val / 5) * r,
      cy + Math.sin(a) * (val / 5) * r,
    ];

    // Grid
    [1, 2, 3, 4, 5].forEach((lv) => {
      ctx.beginPath();
      angles.forEach((a, i) => {
        const [x, y] = pt(lv, a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = lv === 5 ? '#d4b0f0' : '#ede0f8';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Axis lines
    angles.forEach((a) => {
      const [x, y] = pt(5, a);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#ede0f8';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const drawPoly = (vals: number[], fill: string, stroke: string) => {
      ctx.beginPath();
      angles.forEach((a, i) => {
        const [x, y] = pt(vals[i], a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    if (compareStats) {
      drawPoly(statsToArray(compareStats), 'rgba(255,126,179,0.18)', '#ff7eb3');
    }
    drawPoly(statsToArray(stats), 'rgba(91,200,232,0.28)', '#5bc8e8');

    // Labels
    ctx.font = '11px DotGothic16, monospace';
    ctx.fillStyle = '#9a8aaa';
    ctx.textAlign = 'center';
    angles.forEach((a, i) => {
      const labelR = r + 18;
      const lx = cx + Math.cos(a) * labelR;
      const ly = cy + Math.sin(a) * labelR + 4;
      ctx.fillText(LABELS[i], lx, ly);
    });
  }, [stats, compareStats]);

  return <canvas ref={canvasRef} width={280} height={230} />;
}
