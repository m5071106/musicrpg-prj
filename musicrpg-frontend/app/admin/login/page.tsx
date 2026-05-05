'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(username, password);
      router.push('/admin/feedback');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4"
      style={{ background: '#f0f9ff' }}
    >
      <div
        className="w-full max-w-sm p-6 rounded-[18px] border-2"
        style={{ background: '#ffffff', borderColor: '#bae6fd', boxShadow: '0 3px 0 #bae6fd' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ background: '#e0f2fe' }}
        >
          <span className="text-2xl">🎵</span>
        </div>
        <h1
          className="text-xl font-bold text-center mb-1"
          style={{ color: '#0284c7', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          ADMIN LOGIN
        </h1>
        <p className="text-center text-xs mb-6" style={{ color: '#94a3b8' }}>
          管理者アカウントでログインしてください
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-[12px] border-2 text-sm outline-none focus:border-sky-400"
            style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e' }}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-[12px] border-2 text-sm outline-none focus:border-sky-400"
            style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0c4a6e' }}
          />

          {error && (
            <p className="text-xs text-center" style={{ color: '#e05555' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[12px] font-bold text-white text-sm transition-all active:translate-y-0.5 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              boxShadow: '0 3px 0 #7dd3fc',
            }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
