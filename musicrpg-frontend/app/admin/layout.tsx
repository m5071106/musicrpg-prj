'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout, getAdminUsername } from '@/lib/api';

const NAV = [
  { href: '/admin/feedback', label: 'コメント一覧', icon: '💬' },
  { href: '/admin/history',  label: 'ログイン履歴', icon: '🕓' },
  { href: '/admin/users',    label: 'ユーザー一覧', icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  function handleLogout() {
    adminLogout();
    router.push('/admin/login');
  }

  return (
    <div className="min-h-dvh" style={{ background: '#f0f9ff', color: '#0c4a6e' }}>
      {!isLogin && (
        <header
          className="flex items-center justify-between px-5 py-3 border-b shadow-sm"
          style={{ background: '#ffffff', borderColor: '#bae6fd' }}
        >
          <span
            className="font-bold text-sm"
            style={{ color: '#0284c7', fontFamily: 'var(--font-dot-gothic), monospace' }}
          >
            🎵 ADMIN
          </span>
          <div className="flex items-center gap-2">
            {NAV.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className="text-xs font-bold px-3 py-1.5 rounded-[8px] transition-all"
                style={{
                  background: pathname === href ? '#e0f2fe' : 'transparent',
                  color: pathname === href ? '#0284c7' : '#64748b',
                }}
              >
                {icon} {label}
              </Link>
            ))}
            <span className="text-xs ml-2" style={{ color: '#94a3b8' }}>
              {getAdminUsername()}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-[8px] border transition-all ml-1"
              style={{ borderColor: '#bae6fd', color: '#64748b', background: '#f0f9ff' }}
            >
              ログアウト
            </button>
          </div>
        </header>
      )}
      <main className="px-4 py-6 max-w-4xl mx-auto">{children}</main>
    </div>
  );
}
