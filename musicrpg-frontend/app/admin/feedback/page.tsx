'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

interface FeedbackItem {
  id: number;
  username: string;
  content: string;
  created_at: string;
  jira_issue_key: string;
}

interface JiraResult {
  id: number;
  ok: boolean;
  issue_key?: string;
  error?: string | object;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string>('');

  useEffect(() => {
    adminFetch<FeedbackItem[]>('/admin/feedback/')
      .then(setItems)
      .catch((err: Error) => {
        if (err.message.includes('403') || err.message.includes('401') || err.message.includes('権限')) {
          router.push('/admin/login');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const unsent = items.filter((i) => !i.jira_issue_key).map((i) => i.id);
    setSelected((prev) =>
      prev.size === unsent.length ? new Set() : new Set(unsent)
    );
  }

  async function handleSendToJira() {
    if (selected.size === 0) return;
    setSending(true);
    setSendResult('');
    try {
      const data = await adminFetch<{ results: JiraResult[] }>('/admin/jira/', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selected] }),
      } as RequestInit);

      const ok = data.results.filter((r) => r.ok);
      const fail = data.results.filter((r) => !r.ok);

      setItems((prev) =>
        prev.map((item) => {
          const result = ok.find((r) => r.id === item.id);
          return result ? { ...item, jira_issue_key: result.issue_key ?? '' } : item;
        })
      );
      setSelected(new Set());
      const failDetail = fail.map((r) => (typeof r.error === 'object' ? JSON.stringify(r.error) : r.error ?? '不明')).join(' / ');
      setSendResult(
        fail.length === 0
          ? `✅ ${ok.length} 件を Jira に登録しました`
          : `⚠️ ${ok.length} 件成功 / ${fail.length} 件失敗: ${failDetail}`
      );
    } catch (err) {
      setSendResult(`❌ ${err instanceof Error ? err.message : '送信に失敗しました'}`);
    } finally {
      setSending(false);
    }
  }

  const unsentItems = items.filter((i) => !i.jira_issue_key);
  const allSelected = unsentItems.length > 0 && selected.size === unsentItems.length;

  return (
    <>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-sm" style={{ color: '#0c4a6e' }}>
          💬 コメント一覧
        </h2>
        <div className="flex items-center gap-2">
          {!loading && (
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: '#e0f2fe', color: '#0284c7' }}
            >
              {items.length} 件
            </span>
          )}
          {selected.size > 0 && (
            <button
              onClick={handleSendToJira}
              disabled={sending}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-[8px] text-white transition-all active:translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0052cc, #2684ff)', boxShadow: '0 2px 0 #0041a8' }}
            >
              {sending ? '送信中...' : `Jira に送る（${selected.size} 件）`}
            </button>
          )}
        </div>
      </div>

      {sendResult && (
        <div
          className="rounded-[10px] px-4 py-2.5 text-xs font-bold mb-4"
          style={{
            background: sendResult.startsWith('✅') ? '#f0fdf4' : sendResult.startsWith('⚠️') ? '#fffbf0' : '#fff5f5',
            border: `1.5px solid ${sendResult.startsWith('✅') ? '#a8e6b0' : sendResult.startsWith('⚠️') ? '#fcd99a' : '#fca5a5'}`,
            color: sendResult.startsWith('✅') ? '#3a7d50' : sendResult.startsWith('⚠️') ? '#92500a' : '#b91c1c',
          }}
        >
          {sendResult}
        </div>
      )}

      {loading && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>読み込み中...</p>
      )}
      {error && (
        <p className="text-xs text-center py-12" style={{ color: '#e05555' }}>{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>コメントはまだありません</p>
      )}

      {/* 全選択 */}
      {unsentItems.length > 0 && (
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-sky-500"
          />
          <span className="text-xs" style={{ color: '#64748b' }}>未送信をすべて選択</span>
        </label>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isSent = Boolean(item.jira_issue_key);
          const isChecked = selected.has(item.id);
          return (
            <div
              key={item.id}
              className="rounded-[14px] border-2 p-4 transition-all"
              style={{
                background: isChecked ? '#f0f9ff' : '#ffffff',
                borderColor: isChecked ? '#7dd3fc' : '#bae6fd',
                boxShadow: isChecked ? '0 2px 0 #7dd3fc' : '0 2px 0 #e0f2fe',
              }}
            >
              <div className="flex items-start gap-3">
                {/* チェックボックス */}
                <div className="pt-0.5">
                  {isSent ? (
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
                      style={{ background: '#e0f2fe', color: '#0284c7' }}
                      title="送信済み"
                    >
                      ✓
                    </div>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#e0f2fe', color: '#0284c7' }}
                      >
                        @{item.username}
                      </span>
                      {isSent && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: '#dbeafe', color: '#1d4ed8' }}
                        >
                          🔗 {item.jira_issue_key}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>
                      {new Date(item.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#0c4a6e' }}>
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
