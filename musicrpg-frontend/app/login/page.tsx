'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        router.push('/qr');
      } else {
        await register(username, password, password2);
        router.push('/guide?welcome=1');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm p-6 rounded-[18px] border-2"
        style={{
          background: 'var(--panel)',
          borderColor: 'var(--border)',
          boxShadow: '0 3px 0 #e8c9f0',
        }}
      >
        <h1
          className="text-2xl font-bold text-center mb-1"
          style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          🎵 MUSICIAN RPG
        </h1>
        <p className="text-center text-sm mb-3" style={{ color: 'var(--dim)' }}>
          演奏家のRPGカード
        </p>
        <Link
          href="/guide"
          className="flex items-center justify-center gap-1.5 w-full py-2 mb-4 rounded-[10px] border text-xs font-bold transition-all active:translate-y-0.5"
          style={{ borderColor: 'var(--border)', color: 'var(--purple)', background: 'var(--lavender)' }}
        >
          📖 使い方を見る
        </Link>

        <div className="flex rounded-[12px] overflow-hidden border-2 mb-5" style={{ borderColor: 'var(--border)' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex-1 py-2 text-sm font-bold transition-all"
              style={{
                background: mode === m ? 'var(--lavender)' : 'transparent',
                color: mode === m ? 'var(--purple)' : 'var(--dim)',
              }}
            >
              {m === 'login' ? 'ログイン' : '新規登録'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-[12px] border-2 text-sm outline-none focus:border-purple-400"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fdfaff' }}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 rounded-[12px] border-2 text-sm outline-none focus:border-purple-400"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fdfaff' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--dim)' }}
              aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {mode === 'register' && (
            <div className="relative">
              <input
                type={showPassword2 ? 'text' : 'password'}
                placeholder="パスワード（確認）"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-[12px] border-2 text-sm outline-none focus:border-purple-400"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fdfaff' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword2((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--dim)' }}
                aria-label={showPassword2 ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {showPassword2 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: '#e05555' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[12px] font-bold text-white transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              boxShadow: '0 3px 0 #c87ee0',
            }}
          >
            {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '登録して始める'}
          </button>
        </form>
      </div>
      {version && version !== 'dev' && (
        <p
          className="absolute bottom-2 right-3 text-[10px]"
          style={{ color: 'var(--dim)', opacity: 0.5 }}
        >
          v{version}
        </p>
      )}
    </div>
  );
}
