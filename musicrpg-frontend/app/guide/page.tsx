import Link from 'next/link';

const STEPS = [
  {
    number: '01',
    icon: '📝',
    title: 'アカウントを作る',
    color: '#b06ee0',
    bg: '#f5eeff',
    border: '#d4a8f0',
    lines: [
      'ユーザー名とパスワードを決めて「登録して始める」を押す',
      'メール不要・入力はそれだけでOK',
    ],
  },
  {
    number: '02',
    icon: '🎵',
    title: '演奏できる曲を登録',
    color: '#5bc8e8',
    bg: '#edfaff',
    border: '#a8e4f5',
    lines: [
      '「曲」タブ → 曲名を入力して難易度★を選んで追加',
      '3〜5曲登録すると比較がより楽しくなる',
    ],
  },
  {
    number: '03',
    icon: '🎴',
    title: '自分のQRを相手に見せる',
    color: '#ff7eb3',
    bg: '#fff0f6',
    border: '#ffb3d0',
    lines: [
      '「QR」タブ → 自分のQRコードが表示される',
      '相手のスマホで読み取ってもらうだけ',
      '通信なしでも使えるのでライブ会場でも安心',
    ],
  },
  {
    number: '04',
    icon: '📷',
    title: '相手のQRをスキャン',
    color: '#6dcc7f',
    bg: '#f0fdf4',
    border: '#a8e6b0',
    lines: [
      '「QR」タブ → 「スキャン」に切り替えてカメラを向ける',
      '読み取ると自動で比較画面へ移動する',
    ],
  },
  {
    number: '05',
    icon: '⚔️',
    title: '共通曲を確認してセッション開始',
    color: '#f5a623',
    bg: '#fffbf0',
    border: '#fcd99a',
    lines: [
      '比較画面の上部に「一緒にできる曲」が表示される',
      '曲をタップして選択 → 「セッション記録」で保存',
    ],
  },
  {
    number: '06',
    icon: '📋',
    title: '過去のセッションを振り返る',
    color: '#9a8aaa',
    bg: '#faf7ff',
    border: '#e8c9f0',
    lines: [
      '「履歴」タブで誰とどの曲をやったか確認できる',
      '「再比較」ボタンでいつでも比較画面に戻れる',
    ],
  },
] as const;

const FAQ = [
  {
    q: 'インターネットがなくても使えますか？',
    a: 'QRの表示・スキャン・比較は通信なしで動作します。曲の追加・編集にはインターネット接続が必要です。',
  },
  {
    q: 'ステータスって何ですか？',
    a: 'TEMPO・EMOTION・RANGE・EFFORT・STAGEの5軸で演奏スタイルを1〜5で表したものです。後からいつでも編集できます。入力しなくても比較は使えます。',
  },
  {
    q: '相手がアプリを入れていなくても使えますか？',
    a: '比較機能は両者がアプリを使っている場合のみ動作します。まずは一緒に登録してみてください！',
  },
] as const;

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function GuidePage({ searchParams }: Props) {
  const params = await searchParams;
  const isWelcome = params.welcome === '1';

  return (
    <div
      className="min-h-dvh overflow-x-hidden w-full"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-noto-sans-jp), sans-serif' }}
    >
      <div className="px-4 py-6 max-w-lg mx-auto w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          {isWelcome ? (
            <>
              <p className="text-3xl mb-1">🎉</p>
              <p
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
              >
                登録完了！
              </p>
              <p className="text-sm" style={{ color: 'var(--dim)' }}>
                はじめに使い方を確認しましょう
              </p>
            </>
          ) : (
            <>
              <p
                className="text-3xl font-bold mb-1"
                style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
              >
                🎵 使い方ガイド
              </p>
              <p className="text-sm" style={{ color: 'var(--dim)' }}>
                Musician RPG Card の基本的な使い方
              </p>
            </>
          )}
        </div>

        {/* コアコンセプト */}
        <div
          className="rounded-[18px] border-2 p-4 mb-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #f5eeff, #fff0f6)',
            borderColor: 'var(--border)',
            boxShadow: '0 3px 0 #e8c9f0',
          }}
        >
          <p
            className="text-base font-bold leading-relaxed"
            style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
          >
            初対面のミュージシャンと
            <br />
            <span style={{ color: 'var(--pink)' }}>10秒で</span>
            セッション曲を決めよう
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--dim)' }}>
            QRを見せ合うだけで共通曲がわかる
          </p>
        </div>

        {/* ステップ */}
        <p
          className="text-xs font-bold mb-3"
          style={{ color: 'var(--dim)', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          STEP BY STEP
        </p>
        <ol className="flex flex-col gap-3 mb-8">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="rounded-[16px] border-2 p-4"
              style={{
                background: step.bg,
                borderColor: step.border,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span
                    className="text-[10px] font-bold leading-none mb-1"
                    style={{ color: step.color, fontFamily: 'var(--font-dot-gothic), monospace' }}
                  >
                    {step.number}
                  </span>
                  <span className="text-2xl leading-none">{step.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-sm mb-1.5"
                    style={{ color: step.color }}
                  >
                    {step.title}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {step.lines.map((line) => (
                      <li
                        key={line}
                        className="text-xs flex gap-1.5 items-start"
                        style={{ color: '#3a2a4a' }}
                      >
                        <span className="mt-0.5 shrink-0" style={{ color: step.color }}>▸</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* FAQ */}
        <p
          className="text-xs font-bold mb-3"
          style={{ color: 'var(--dim)', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          よくある質問
        </p>
        <div className="flex flex-col gap-3 mb-8">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-[16px] border-2 p-4"
              style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 2px 0 #e8c9f0' }}
            >
              <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--purple)' }}>
                Q. {item.q}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>

        {/* ホーム画面に追加 */}
        <p
          className="text-xs font-bold mb-3"
          style={{ color: 'var(--dim)', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          もっと便利に使う
        </p>
        <div
          className="rounded-[18px] border-2 p-4 mb-8"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 2px 0 #e8c9f0' }}
        >
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--purple)' }}>
            📲 ホーム画面に追加するとアプリとして使えます
          </p>
          <p className="text-xs mb-3" style={{ color: 'var(--dim)' }}>
            インストール不要・ブラウザのバーが消えてアプリそっくりな見た目になります
          </p>
          <div className="flex flex-col gap-2">
            <div
              className="rounded-[12px] p-3"
              style={{ background: '#f0fdf4', border: '1.5px solid #a8e6b0' }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: '#3a7d50' }}>🍎 iPhone の場合（Safari で開く）</p>
              <ol className="flex flex-col gap-0.5">
                {[
                  '画面下の 共有ボタン（四角＋上矢印）をタップ',
                  '「ホーム画面に追加」をタップ',
                  '右上の「追加」をタップして完了',
                ].map((step, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: '#3a2a4a' }}>
                    <span style={{ color: '#3a7d50', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div
              className="rounded-[12px] p-3"
              style={{ background: '#edf6ff', border: '1.5px solid #a8cef5' }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: '#1a5fa8' }}>🤖 Android の場合（Chrome で開く）</p>
              <ol className="flex flex-col gap-0.5">
                {[
                  '右上の「⋮」メニューをタップ',
                  '「ホーム画面に追加」または「アプリをインストール」をタップ',
                  '「追加」または「インストール」をタップして完了',
                ].map((step, i) => (
                  <li key={i} className="text-xs flex gap-1.5" style={{ color: '#3a2a4a' }}>
                    <span style={{ color: '#1a5fa8', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* CTAボタン */}
        <div className="flex flex-col gap-3">
          {isWelcome ? (
            <Link
              href="/qr"
              className="block w-full py-3.5 rounded-[14px] font-bold text-white text-center text-sm active:translate-y-0.5 transition-transform"
              style={{
                background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                boxShadow: '0 3px 0 #c87ee0',
                fontFamily: 'var(--font-dot-gothic), monospace',
              }}
            >
              🎴 QRコード画面へ進む →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="block w-full py-3.5 rounded-[14px] font-bold text-white text-center text-sm active:translate-y-0.5 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, var(--purple), var(--pink))',
                  boxShadow: '0 3px 0 #c87ee0',
                  fontFamily: 'var(--font-dot-gothic), monospace',
                }}
              >
                さっそく始める →
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 rounded-[14px] font-bold text-center text-sm border-2 active:translate-y-0.5 transition-transform"
                style={{ borderColor: 'var(--border)', color: 'var(--dim)' }}
              >
                ログイン画面に戻る
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
