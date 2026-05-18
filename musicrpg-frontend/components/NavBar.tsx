'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

/** 下部バーに常時表示するナビ項目 */
const PRIMARY_NAV = [
  { href: '/qr',      label: 'QR',        icon: '🎴' },
  { href: '/compare', label: '比較',      icon: '⚔️' },
  { href: '/songs',   label: '曲',        icon: '🎵' },
  { href: '/status',  label: 'ステータス', icon: '📊' },
] as const;

/** ドロワー内に表示するナビ項目 */
const DRAWER_NAV = [
  { href: '/history',  label: '履歴',  icon: '📋' },
  { href: '/feedback', label: '意見',  icon: '💬' },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const updatedPartners = useAppStore(s => s.updatedPartners);
  const hasUpdates = updatedPartners.length > 0;

  function handleLogout() {
    setDrawerOpen(false);
    logout();
    router.push('/login');
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <>
      {/* ===== ドロワーオーバーレイ ===== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(58,42,74,0.35)' }}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ===== スライドアップ ドロワー ===== */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="メニュー"
        className="fixed left-0 right-0 z-50 transition-transform duration-300"
        style={{
          bottom: drawerOpen ? 0 : '-100%',
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(176,110,224,0.18)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {/* ドロワーハンドル */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="rounded-full"
            style={{ width: 40, height: 4, background: '#e8c9f0' }}
          />
        </div>

        <p
          className="text-center text-xs font-bold pb-2"
          style={{
            color: 'var(--dim)',
            fontFamily: 'var(--font-dot-gothic), monospace',
            letterSpacing: '0.08em',
          }}
        >
          メニュー
        </p>

        {/* ドロワーナビ項目 */}
        <div className="flex flex-col px-4 gap-1 pb-2">
          {DRAWER_NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                className="flex items-center gap-4 px-5 py-4 rounded-[14px] transition-all active:scale-[0.98]"
                style={{
                  background: active ? 'var(--lavender)' : 'transparent',
                  color: active ? 'var(--purple)' : 'var(--text)',
                }}
              >
                <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
                <span
                  className="font-bold text-base"
                  style={{ fontFamily: 'var(--font-dot-gothic), monospace' }}
                >
                  {label}
                </span>
                {active && (
                  <span
                    className="ml-auto text-xs font-bold"
                    style={{ color: 'var(--purple)' }}
                  >
                    ●
                  </span>
                )}
              </Link>
            );
          })}

          {/* 区切り */}
          <div
            className="my-1 mx-2 rounded-full"
            style={{ height: 1, background: 'var(--border)' }}
          />

          {/* ログアウト */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 rounded-[14px] transition-all active:scale-[0.98] w-full text-left"
            style={{ color: '#e05555' }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>🚪</span>
            <span
              className="font-bold text-base"
              style={{ fontFamily: 'var(--font-dot-gothic), monospace' }}
            >
              ログアウト
            </span>
          </button>
        </div>
      </div>

      {/* ===== 下部ナビバー ===== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t-2"
        style={{
          background: '#ffffff',
          borderColor: '#e8c9f0',
          boxShadow: '0 -2px 8px rgba(176,110,224,0.08)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {PRIMARY_NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          const showBadge = href === '/compare' && hasUpdates;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-1 py-3 rounded-[12px] transition-all flex-1 min-w-0 active:scale-95"
              style={{
                color: active ? '#b06ee0' : '#9a8aaa',
                background: active ? '#e8d5f8' : 'transparent',
                fontFamily: 'var(--font-dot-gothic), monospace',
                margin: '4px 2px',
              }}
            >
              <span style={{ fontSize: 26, lineHeight: 1 }}>{icon}</span>
              <span
                className="font-bold truncate w-full text-center"
                style={{ fontSize: 11 }}
              >
                {label}
              </span>
              {showBadge && (
                <span
                  className="absolute top-2 right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                  style={{ background: '#e05555' }}
                >
                  {updatedPartners.length}
                </span>
              )}
            </Link>
          );
        })}

        {/* ハンバーガーメニューボタン */}
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(prev => !prev)}
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-[12px] transition-all flex-1 min-w-0 active:scale-95"
          style={{
            color: drawerOpen ? '#b06ee0' : '#9a8aaa',
            background: drawerOpen ? '#e8d5f8' : 'transparent',
            fontFamily: 'var(--font-dot-gothic), monospace',
            margin: '4px 2px',
          }}
        >
          {/* ハンバーガーアイコン（3本線） */}
          <span
            className="flex flex-col items-center justify-center gap-[5px]"
            style={{ width: 26, height: 26 }}
            aria-hidden="true"
          >
            <span
              className="block rounded-full transition-all"
              style={{
                width: 22,
                height: 3,
                background: drawerOpen ? '#b06ee0' : '#9a8aaa',
                transformOrigin: 'center',
                transform: drawerOpen ? 'translateY(8px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block rounded-full transition-all"
              style={{
                width: 22,
                height: 3,
                background: drawerOpen ? '#b06ee0' : '#9a8aaa',
                opacity: drawerOpen ? 0 : 1,
              }}
            />
            <span
              className="block rounded-full transition-all"
              style={{
                width: 22,
                height: 3,
                background: drawerOpen ? '#b06ee0' : '#9a8aaa',
                transformOrigin: 'center',
                transform: drawerOpen ? 'translateY(-8px) rotate(-45deg)' : 'none',
              }}
            />
          </span>
          <span
            className="font-bold"
            style={{ fontSize: 11 }}
          >
            メニュー
          </span>
        </button>
      </nav>
    </>
  );
}
