'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/qr',      label: 'QR',       icon: '🎴' },
  { href: '/compare', label: '比較',     icon: '⚔️' },
  { href: '/songs',   label: '曲',       icon: '🎵' },
  { href: '/status',  label: 'ステータス', icon: '📊' },
  { href: '/history', label: '履歴',     icon: '📋' },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1.5 border-t-2"
      style={{
        background: '#ffffff',
        borderColor: '#e8c9f0',
        boxShadow: '0 -2px 8px rgba(176,110,224,0.08)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-[10px] transition-all min-w-0"
            style={{
              color: active ? '#b06ee0' : '#9a8aaa',
              background: active ? '#e8d5f8' : 'transparent',
              fontFamily: 'var(--font-dot-gothic), monospace',
            }}
          >
            <span className="text-[18px] leading-none">{icon}</span>
            <span className="text-[9px] font-bold whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-[10px] transition-all"
        style={{ color: '#9a8aaa' }}
      >
        <span className="text-[18px] leading-none">🚪</span>
        <span className="text-[9px] font-bold" style={{ fontFamily: 'var(--font-dot-gothic), monospace' }}>
          ログアウト
        </span>
      </button>
    </nav>
  );
}
