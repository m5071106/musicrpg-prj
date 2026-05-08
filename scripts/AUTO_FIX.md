# auto_fix.py — Jira 高優先度タスク自動修正エージェント

Jira の高優先度タスクを取得し、Claude AI がコードを修正してブランチにコミットするまでを自動化するスクリプトです。

---

## 前提条件

| 必要なもの | 確認方法 |
|-----------|---------|
| Python 3.11 以上 | `python3 --version` |
| Git（main ブランチが最新） | `git status` |
| Jira API トークン | `.env` に設定済み |
| Anthropic API キー | `.env` に設定済み（後述） |

---

## 初回セットアップ

### 1. 仮想環境を作成してパッケージをインストール

プロジェクトルートで実行します。

```bash
python3 -m venv scripts/.venv
scripts/.venv/bin/pip install -r scripts/requirements.txt
```

### 2. Anthropic API キーを取得する

1. [https://console.anthropic.com](https://console.anthropic.com) でサインアップ（無料）
2. 左メニュー → **API Keys** → **Create Key**
3. 表示された `sk-ant-api03-...` をコピー（画面を閉じると再表示できません）
4. クレジットカードを登録して $5 以上をチャージ

> **費用の目安**: 1回の実行あたり数円〜数十円（修正の規模による）

### 3. .env にキーを追加

`musicrpg_backend/.env` を開き、末尾に追記します。

```
ANTHROPIC_API_KEY=sk-ant-api03-ここにキーを貼り付け
```

---

## 実行手順

### ステップ 1: Jira でタスクの優先度を「高」に設定

1. Jira の BNRT プロジェクトを開く
2. 対象タスクを開く
3. 優先度 → **高**（または **最高**）に変更する

### ステップ 2: ドライランで確認（推奨）

ブランチ作成・コミットをせずにエージェントの動作だけ確認します。

```bash
scripts/.venv/bin/python scripts/auto_fix.py --dry-run
```

実行すると対象タスクの一覧と、Claude が何をするかが表示されます。

### ステップ 3: 本実行

問題なければブランチを作成してコミットまで実施します。

```bash
scripts/.venv/bin/python scripts/auto_fix.py
```

### ステップ 4: プッシュして PR を作成

```bash
git push origin BNRT-5   # BNRT-5 はタスクキーに合わせて変更
```

GitHub でプルリクエストを作成してレビューしてください。

---

## 実行例

```
🔍 Jira から高優先度タスクを取得中...

📋 高優先度タスク (2 件):
  → [0] BNRT-5 : カードの読み込みが遅い
     [1] BNRT-7 : ダークモードを追加してほしい

🎯 処理対象: BNRT-5 [高]
   タイトル: カードの読み込みが遅い
   説明: 一覧ページを開くと3秒以上かかる。もっと速くしてほしい。

🌿 ブランチ作成: BNRT-5
🤖 Claude エージェントが修正を開始します...
  🔧 list_files({"directory": "musicrpg-frontend"})
  🔧 read_file({"path": "musicrpg-frontend/app/(app)/cards/page.tsx"})
  🔧 write_file({"path": "musicrpg-frontend/app/(app)/cards/page.tsx"})
  ...

────────────────────────────────────────────────
📝 エージェント作業結果:
以下のファイルを修正しました。

- musicrpg-frontend/app/(app)/cards/page.tsx
  → useSWR のキャッシュ設定を追加し、再取得間隔を最適化

変更内容の要約:
カード一覧の API 呼び出しに SWR の revalidateOnFocus: false と
dedupingInterval を設定し、不要な再フェッチを削減しました。
────────────────────────────────────────────────

💾 変更をコミット中...
✅ 完了! ブランチ "BNRT-5" にコミットされました
   次のステップ: git push origin BNRT-5
```

---

## オプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--index N` | N 番目のタスクを処理（0 始まり） | `--index 1` で2件目を処理 |
| `--dry-run` | ブランチ作成・コミットをスキップ | 動作確認に使う |

---

## よくあるエラー

### `Jira API エラー: 410 Gone`
Jira の検索 API のバージョンが古い。スクリプトは最新の `/rest/api/3/search/jql` を使用しています。`.env` の `JIRA_BASE_URL` が正しいか確認してください。

### `レート制限中。XX 秒待機してリトライ`
Anthropic API の無料枠は 30,000 トークン/分 が上限です。スクリプトが自動でリトライします。しばらく待つと解消されます。使用量が増えると上限が自動で引き上げられます。

### `環境変数が未設定です: ANTHROPIC_API_KEY`
`musicrpg_backend/.env` に `ANTHROPIC_API_KEY=sk-ant-api03-...` を追加してください。

### `高優先度の未完了タスクはありません`
Jira でタスクの優先度が「高」または「最高」になっているか確認してください。ステータスが「完了」になっているタスクは対象外です。

---

## 注意事項

- エージェントが修正できるのは `musicrpg_backend/` と `musicrpg-frontend/` 配下のファイルのみです
- 1ファイルあたり 6,000 文字を超える部分は読み込みが省略されます
- コミット前に `git diff BNRT-XX` で変更内容を必ず確認してください
- PR のマージ前にローカルでの動作確認を推奨します
