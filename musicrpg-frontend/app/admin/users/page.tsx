'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

interface UserItem {
  id: number;
  username: string;
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
  is_staff: boolean;
}

interface ResetResult {
  password: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resetting, setResetting] = useState<number | null>(null);
  const [resetInfo, setResetInfo] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    adminFetch<UserItem[]>('/admin/users/')
      .then(setUsers)
      .catch((err: Error) => {
        if (err.message.includes('403') || err.message.includes('401') || err.message.includes('権限')) {
          router.push('/admin/login');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleReset(user: UserItem) {
    if (!confirm(`@${user.username} のパスワードをリセットしますか？`)) return;
    setResetting(user.id);
    try {
      const data = await adminFetch<ResetResult>(`/admin/users/${user.id}/reset-password/`, {
        method: 'POST',
      });
      setResetInfo({ username: user.username, password: data.password });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'リセットに失敗しました');
    } finally {
      setResetting(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-sm" style={{ color: '#0c4a6e' }}>
          👥 ユーザー一覧
        </h2>
        {!loading && (
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: '#e0f2fe', color: '#0284c7' }}
          >
            {users.length} 件
          </span>
        )}
      </div>

      {/* 仮パスワード表示モーダル */}
      {resetInfo && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setResetInfo(null)}
        >
          <div
            className="rounded-[16px] p-6 max-w-sm w-full mx-4 shadow-xl"
            style={{ background: '#ffffff', border: '2px solid #bae6fd' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold mb-1" style={{ color: '#0c4a6e' }}>
              ✅ パスワードをリセットしました
            </p>
            <p className="text-xs mb-4" style={{ color: '#64748b' }}>
              @{resetInfo.username} に下記の仮パスワードを伝えてください。
            </p>
            <div
              className="rounded-[10px] px-4 py-3 text-center font-bold text-lg tracking-widest mb-4 select-all"
              style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', color: '#0284c7' }}
            >
              {resetInfo.password}
            </div>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              このダイアログを閉じるとパスワードは確認できなくなります。
            </p>
            <button
              onClick={() => setResetInfo(null)}
              className="w-full text-sm font-bold py-2 rounded-[10px] transition-all"
              style={{ background: '#0284c7', color: '#ffffff' }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>読み込み中...</p>
      )}
      {error && (
        <p className="text-xs text-center py-12" style={{ color: '#e05555' }}>{error}</p>
      )}
      {!loading && !error && users.length === 0 && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>ユーザーはいません</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="rounded-[14px] overflow-hidden border-2" style={{ borderColor: '#bae6fd' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <th className="text-left px-4 py-2.5 font-bold">ユーザー名</th>
                <th className="text-left px-4 py-2.5 font-bold hidden sm:table-cell">登録日</th>
                <th className="text-left px-4 py-2.5 font-bold hidden sm:table-cell">最終ログイン</th>
                <th className="text-center px-4 py-2.5 font-bold">権限</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  style={{
                    background: i % 2 === 0 ? '#ffffff' : '#f0f9ff',
                    borderTop: '1px solid #e0f2fe',
                  }}
                >
                  <td className="px-4 py-3 font-bold" style={{ color: '#0c4a6e' }}>
                    @{user.username}
                    {!user.is_active && (
                      <span
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fee2e2', color: '#b91c1c' }}
                      >
                        無効
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#64748b' }}>
                    {new Date(user.date_joined).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell" style={{ color: '#64748b' }}>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString('ja-JP')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.is_staff ? (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#dbeafe', color: '#1d4ed8' }}
                      >
                        管理者
                      </span>
                    ) : (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: '#f1f5f9', color: '#94a3b8' }}
                      >
                        一般
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleReset(user)}
                      disabled={resetting === user.id}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-[8px] transition-all disabled:opacity-50"
                      style={{
                        background: '#fff7ed',
                        color: '#c2410c',
                        border: '1.5px solid #fed7aa',
                      }}
                    >
                      {resetting === user.id ? '処理中...' : 'PW リセット'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
