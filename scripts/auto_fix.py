#!/usr/bin/env python3
"""
Jira 高優先度タスク自動修正エージェント

使い方:
  cd <project_root>
  python scripts/auto_fix.py

  # 最初の1件以外を処理したい場合:
  python scripts/auto_fix.py --index 1

環境変数 (musicrpg_backend/.env から自動ロード):
  JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
  ANTHROPIC_API_KEY
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import anthropic
import requests
from dotenv import load_dotenv

# ── 設定 ──────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "musicrpg_backend" / ".env")

JIRA_BASE_URL  = os.getenv("JIRA_BASE_URL", "")
JIRA_EMAIL     = os.getenv("JIRA_EMAIL", "")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN", "")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

MODEL = "claude-sonnet-4-6"
MAX_AGENT_TURNS = 20  # 無限ループ防止

# エージェントが操作してよいディレクトリ
SAFE_DIRS = [
    ROOT / "musicrpg_backend",
    ROOT / "musicrpg-frontend",
]

# ── Jira ─────────────────────────────────────────────────────

def _jira_headers():
    cred = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_API_TOKEN}".encode()).decode()
    return {
        "Authorization": f"Basic {cred}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def get_high_priority_issues(max_results: int = 5) -> list[dict]:
    """優先度高・未完了のタスクを取得（日英両対応）"""
    jql = (
        f'project = {JIRA_PROJECT_KEY} '
        'AND priority in ("High", "高", "Highest", "最高") '
        'AND statusCategory != Done '
        'ORDER BY priority DESC, created DESC'
    )
    url = f"{JIRA_BASE_URL.rstrip('/')}/rest/api/3/search/jql"
    res = requests.post(
        url,
        headers=_jira_headers(),
        json={"jql": jql, "maxResults": max_results, "fields": ["summary", "description", "status", "priority"]},
        timeout=10,
    )
    res.raise_for_status()
    return res.json().get("issues", [])


def adf_to_text(node) -> str:
    """Atlassian Document Format → プレーンテキスト"""
    if not node:
        return ""
    parts: list[str] = []

    def _walk(n):
        if isinstance(n, dict):
            t = n.get("type", "")
            if t == "text":
                parts.append(n.get("text", ""))
            elif t == "hardBreak":
                parts.append("\n")
            for child in n.get("content", []):
                _walk(child)
        elif isinstance(n, list):
            for item in n:
                _walk(item)

    _walk(node)
    return "".join(parts).strip()


# ── Git ───────────────────────────────────────────────────────

def git(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=check)


def create_branch(branch_name: str):
    git(["checkout", "main"])
    git(["pull", "origin", "main"], check=False)
    result = git(["checkout", "-b", branch_name], check=False)
    if result.returncode != 0:
        # ブランチが既に存在する場合は切り替えるだけ
        git(["checkout", branch_name])


def commit_changes(branch_name: str, summary: str) -> bool:
    git(["add", "-A"])
    diff = git(["diff", "--cached", "--quiet"], check=False)
    if diff.returncode == 0:
        return False  # 変更なし
    git(["commit", "-m", f"{branch_name}: {summary}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"])
    return True


# ── エージェントツール ────────────────────────────────────────

def _safe_path(path_str: str) -> Path:
    """許可ディレクトリ外へのアクセスを拒否する"""
    p = (ROOT / path_str).resolve()
    if not any(str(p).startswith(str(d)) for d in SAFE_DIRS):
        raise PermissionError(f"アクセス禁止: {p}（許可ディレクトリ外）")
    return p


MAX_FILE_CHARS = 6000  # 1ファイルの読み込み上限（トークン節約）

def tool_read_file(path: str) -> str:
    p = _safe_path(path)
    if not p.exists():
        return f"[ファイルが見つかりません: {path}]"
    text = p.read_text(encoding="utf-8")
    if len(text) > MAX_FILE_CHARS:
        return text[:MAX_FILE_CHARS] + f"\n... ({len(text) - MAX_FILE_CHARS} 文字省略。必要なら行番号を指定して再度依頼してください)"
    return text


def tool_write_file(path: str, content: str) -> str:
    p = _safe_path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return f"書き込み完了: {path} ({len(content)} 文字)"


def tool_list_files(directory: str, pattern: str = "*") -> str:
    p = _safe_path(directory)
    if not p.is_dir():
        return f"[ディレクトリが見つかりません: {directory}]"
    files = sorted(p.rglob(pattern))
    # .next / __pycache__ 等を除く
    skip = {".next", "__pycache__", "node_modules", ".git", "migrations"}
    filtered = [f for f in files if not any(s in f.parts for s in skip) and f.is_file()]
    lines = [str(f.relative_to(ROOT)) for f in filtered[:100]]
    suffix = f"\n...（{len(filtered) - 100} 件省略）" if len(filtered) > 100 else ""
    return "\n".join(lines) + suffix


def tool_search_files(query: str, directory: str = ".") -> str:
    base = ROOT / directory
    result = subprocess.run(
        ["grep", "-rn", "--include=*.py", "--include=*.ts", "--include=*.tsx", "-l", query, str(base)],
        capture_output=True, text=True,
    )
    if not result.stdout.strip():
        return f"'{query}' に一致するファイルは見つかりませんでした"
    lines = []
    for fpath in result.stdout.strip().splitlines()[:20]:
        lines.append(str(Path(fpath).relative_to(ROOT)))
    return "\n".join(lines)


TOOLS = [
    {
        "name": "read_file",
        "description": "指定パス（プロジェクトルートからの相対）のファイルを読む。",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "相対ファイルパス (例: musicrpg_backend/apps/feedback/views.py)"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "指定パスにファイルを書き込む（新規作成・上書き）。",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "相対ファイルパス"},
                "content": {"type": "string", "description": "書き込む内容（ファイル全体）"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "list_files",
        "description": "ディレクトリ内のファイル一覧を返す。",
        "input_schema": {
            "type": "object",
            "properties": {
                "directory": {"type": "string", "description": "相対ディレクトリパス"},
                "pattern": {"type": "string", "description": "glob パターン (省略時 '*')"},
            },
            "required": ["directory"],
        },
    },
    {
        "name": "search_files",
        "description": "コードベース内でキーワードを含むファイルを検索する。",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "検索キーワード"},
                "directory": {"type": "string", "description": "検索対象ディレクトリ（省略時 '.')"},
            },
            "required": ["query"],
        },
    },
]

TOOL_FN = {
    "read_file": lambda inp: tool_read_file(inp["path"]),
    "write_file": lambda inp: tool_write_file(inp["path"], inp["content"]),
    "list_files": lambda inp: tool_list_files(inp["directory"], inp.get("pattern", "*")),
    "search_files": lambda inp: tool_search_files(inp["query"], inp.get("directory", ".")),
}

# ── エージェントループ ────────────────────────────────────────

SYSTEM_PROMPT = """\
あなたは Musician RPG Card アプリのコーディングエージェントです。

## リポジトリ構成
- musicrpg_backend/  : Django 5 + Django REST Framework バックエンド
  - apps/users/      : カスタムユーザーモデル
  - apps/music/      : カードデータ
  - apps/feedback/   : フィードバック・管理者機能・Jira 連携
  - config/          : Django 設定・URL
- musicrpg-frontend/ : Next.js (App Router) + TypeScript + Tailwind CSS フロントエンド
  - app/             : ページコンポーネント (App Router)
  - components/      : 共通コンポーネント
  - lib/api.ts       : API クライアント

## 作業ルール
1. まず `list_files` でディレクトリ構造を把握してから作業する
2. 既存ファイルは `read_file` で内容を確認してから編集する
3. `write_file` は **ファイル全体** を書き込む（部分書き換え不可）
4. 変更は最小限に。タスク外のリファクタや機能追加は行わない
5. 作業完了したら **変更したファイルの一覧と変更内容** を日本語で報告する
"""


def run_agent(issue_key: str, summary: str, description: str) -> str:
    """エージェントを実行して実装させる。最終メッセージテキストを返す。"""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    user_message = f"""
以下の Jira タスクをこのリポジトリで実装してください。

**タスクキー**: {issue_key}
**タイトル**: {summary}
**説明**:
{description or '（説明なし）'}

作業完了後、変更したファイルと修正内容を報告してください。
"""

    messages: list[dict] = [{"role": "user", "content": user_message}]

    for turn in range(MAX_AGENT_TURNS):
        # レート制限時はリトライ（指数バックオフ）
        response = None
        for attempt in range(6):
            try:
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=4096,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=messages,
                )
                break
            except anthropic.RateLimitError:
                wait = 15 * (2 ** attempt)  # 15 → 30 → 60 → 120 → 240 → 480 秒
                print(f"  ⏳ レート制限中。{wait} 秒待機してリトライ ({attempt + 1}/6)...")
                time.sleep(wait)
        if response is None:
            return "[レート制限: リトライ上限に達しました。しばらく待ってから再実行してください]"

        # assistant の応答をメッセージ履歴に追加
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            # テキスト部分を返す
            return "\n".join(
                block.text for block in response.content
                if hasattr(block, "text")
            )

        if response.stop_reason != "tool_use":
            return f"[予期しない stop_reason: {response.stop_reason}]"

        # ツール呼び出しを処理
        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue
            print(f"  🔧 {block.name}({json.dumps(block.input, ensure_ascii=False)[:80]})")
            try:
                result = TOOL_FN[block.name](block.input)
            except Exception as e:
                result = f"[エラー: {e}]"
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": str(result),
            })

        messages.append({"role": "user", "content": tool_results})

    return f"[最大ターン数 ({MAX_AGENT_TURNS}) に達しました]"


# ── メイン ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Jira 高優先度タスク自動修正エージェント")
    parser.add_argument("--index", type=int, default=0, help="処理するタスクのインデックス (0始まり、デフォルト 0)")
    parser.add_argument("--dry-run", action="store_true", help="ブランチ作成・コミットをスキップしてエージェントのみ実行")
    args = parser.parse_args()

    # 環境変数チェック
    missing = [v for v in ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY", "ANTHROPIC_API_KEY"]
               if not os.getenv(v)]
    if missing:
        print(f"❌ 環境変数が未設定です: {', '.join(missing)}")
        print("   ANTHROPIC_API_KEY は musicrpg_backend/.env に追加してください")
        sys.exit(1)

    print("🔍 Jira から高優先度タスクを取得中...")
    try:
        issues = get_high_priority_issues()
    except requests.RequestException as e:
        print(f"❌ Jira API エラー: {e}")
        sys.exit(1)

    if not issues:
        print("✅ 高優先度の未完了タスクはありません")
        return

    # 一覧表示
    print(f"\n📋 高優先度タスク ({len(issues)} 件):")
    for i, iss in enumerate(issues):
        marker = "→" if i == args.index else " "
        print(f"  {marker} [{i}] {iss['key']} : {iss['fields']['summary']}")

    if args.index >= len(issues):
        print(f"❌ インデックス {args.index} は範囲外です")
        sys.exit(1)

    issue     = issues[args.index]
    key       = issue["key"]
    summary   = issue["fields"]["summary"]
    desc      = adf_to_text(issue["fields"].get("description"))
    priority  = issue["fields"]["priority"]["name"]

    print(f"\n🎯 処理対象: {key} [{priority}]")
    print(f"   タイトル: {summary}")
    if desc:
        preview = desc[:120] + ("..." if len(desc) > 120 else "")
        print(f"   説明: {preview}")

    if not args.dry_run:
        print(f"\n🌿 ブランチ作成: {key}")
        create_branch(key)
    else:
        print("\n⚠️  --dry-run: ブランチ作成・コミットをスキップします")

    print("\n🤖 Claude エージェントが修正を開始します...\n")
    agent_output = run_agent(key, summary, desc)

    print("\n" + "─" * 60)
    print("📝 エージェント作業結果:")
    print(agent_output)
    print("─" * 60)

    if not args.dry_run:
        print("\n💾 変更をコミット中...")
        committed = commit_changes(key, summary)
        if committed:
            print(f"\n✅ 完了! ブランチ \"{key}\" にコミットされました")
            print(f"   次のステップ: git push origin {key}")
        else:
            print("\n⚠️  コード変更はありませんでした。タスクの内容を確認してください")


if __name__ == "__main__":
    main()
