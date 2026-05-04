#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/musicrpg_backend"
FRONTEND="$ROOT/musicrpg-frontend"
VENV="$BACKEND/.venv"

# ── カラー定義 ──────────────────────────────────────────
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

log()    { echo -e "${GREEN}[start]${RESET} $*"; }
info_b() { echo -e "${PURPLE}[backend]${RESET} $*"; }
info_f() { echo -e "${CYAN}[frontend]${RESET} $*"; }
warn()   { echo -e "${YELLOW}[warn]${RESET} $*"; }

# ── プロセス管理 ────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  log "シャットダウン中..."
  [[ -n "$BACKEND_PID" ]]  && kill "$BACKEND_PID"  2>/dev/null && info_b "停止しました (PID $BACKEND_PID)"
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null && info_f "停止しました (PID $FRONTEND_PID)"
  log "完了。またね！"
  exit 0
}
trap cleanup INT TERM

# ── Python 3.10+ を探す ────────────────────────────────
find_python() {
  for cmd in python3.13 python3.12 python3.11 python3.10 \
             /opt/homebrew/bin/python3 /usr/local/bin/python3; do
    if command -v "$cmd" &>/dev/null; then
      local ver
      ver=$("$cmd" -c 'import sys; print(sys.version_info[:2])' 2>/dev/null)
      # (3, 10) 以上ならOK
      if "$cmd" -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
        echo "$cmd"
        return 0
      fi
    fi
  done
  return 1
}

PYTHON=$(find_python) || {
  echo -e "${YELLOW}[error]${RESET} Python 3.10 以上が見つかりません。Homebrew でインストールしてください:"
  echo "  brew install python@3.13"
  exit 1
}
info_b "使用 Python: $PYTHON ($(${PYTHON} --version))"

# ── バックエンドセットアップ ────────────────────────────
info_b "セットアップ確認中..."

# venv が古い Python で作られていたら作り直す
if [[ -d "$VENV" ]]; then
  VENV_PY=$(cat "$VENV/pyvenv.cfg" 2>/dev/null | grep "^version" | awk '{print $3}')
  VENV_MAJOR=$(echo "$VENV_PY" | cut -d. -f1)
  VENV_MINOR=$(echo "$VENV_PY" | cut -d. -f2)
  if [[ "$VENV_MAJOR" -lt 3 ]] || { [[ "$VENV_MAJOR" -eq 3 ]] && [[ "$VENV_MINOR" -lt 10 ]]; }; then
    warn "venv が Python ${VENV_PY} で作られています。再作成します..."
    rm -rf "$VENV"
  fi
fi

if [[ ! -d "$VENV" ]]; then
  warn "仮想環境が見つかりません。作成します..."
  "$PYTHON" -m venv "$VENV"
  info_b "仮想環境を作成しました: $VENV"
fi

source "$VENV/bin/activate"

# pip install（requirements.txtが更新されていたら自動で再インストール）
STAMP="$VENV/.install_stamp"
REQ="$BACKEND/requirements.txt"
if [[ ! -f "$STAMP" ]] || [[ "$REQ" -nt "$STAMP" ]]; then
  info_b "依存パッケージをインストール中..."
  pip install -q -r "$REQ"
  touch "$STAMP"
  info_b "インストール完了"
fi

# マイグレーション
info_b "マイグレーション確認中..."
cd "$BACKEND"
python manage.py migrate --run-syncdb -v 0

# ── フロントエンドセットアップ ──────────────────────────
info_f "セットアップ確認中..."
if [[ ! -d "$FRONTEND/node_modules" ]]; then
  warn "node_modules が見つかりません。npm install を実行します..."
  cd "$FRONTEND" && npm install --silent
  info_f "インストール完了"
fi

# .env.local が無ければ作成
if [[ ! -f "$FRONTEND/.env.local" ]]; then
  echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api' > "$FRONTEND/.env.local"
  info_f ".env.local を作成しました"
fi

# ── サーバー起動 ────────────────────────────────────────
echo ""
log "🎵 Musician RPG Card — ローカルサーバーを起動します"
echo ""

# バックエンド起動
cd "$BACKEND"
python manage.py runserver 8000 \
  2>&1 | sed "s/^/$(printf "${PURPLE}[backend]${RESET}") /" &
BACKEND_PID=$!
info_b "起動中... (PID $BACKEND_PID)"

# フロントエンド起動（バックエンドが立ち上がるまで少し待つ）
sleep 1
cd "$FRONTEND"
npm run dev \
  2>&1 | sed "s/^/$(printf "${CYAN}[frontend]${RESET}") /" &
FRONTEND_PID=$!
info_f "起動中... (PID $FRONTEND_PID)"

echo ""
echo -e "  ${PURPLE}Backend${RESET}   → http://localhost:8000"
echo -e "  ${PURPLE}API Docs${RESET}  → http://localhost:8000/api/docs/"
echo -e "  ${CYAN}Frontend${RESET}  → http://localhost:3000"
echo ""
echo -e "  ${YELLOW}Ctrl+C で両サーバーを同時に停止します${RESET}"
echo ""

# 両プロセスが生きている間待機
wait "$BACKEND_PID" "$FRONTEND_PID"
