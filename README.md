# 🎵 Musician RPG Card

初対面のミュージシャンと **QR を見せ合うだけで共通曲が10秒でわかる** スマホアプリ。

演奏スタイルをRPGのステータスとして持ち歩き、会場でその場でセッション曲を決められます。

---

## 機能概要

| 機能 | 説明 |
|------|------|
| **QR 表示 / スキャン** | 自分のプロフィールを QR に変換して相手に見せる。相手の QR をスキャンすると即座に比較画面へ |
| **共通曲マッチング** | 両者が登録した曲を照合し、一緒に演奏できる曲をハイライト表示 |
| **演奏スタイルの可視化** | TEMPO / EMOTION / RANGE / EFFORT / STAGE の5軸をレーダーチャートで比較 |
| **セッション記録** | やった曲と相手を localStorage に保存。履歴からいつでも再比較 |
| **オフライン対応** | QR 表示・スキャン・比較はネット不要。SWR キャッシュで曲データも持ち歩ける |
| **PWA 対応** | ホーム画面に追加するとアプリとして起動。iOS Safari / Android Chrome 両対応 |

---

## 技術スタック

### バックエンド (`musicrpg_backend/`)

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Python | 3.12 | ランタイム |
| Django | 5.0 | Web フレームワーク |
| Django REST Framework | 3.15 | REST API |
| dj-rest-auth + django-allauth | 6.0 / 0.63 | ユーザー登録・JWT 認証 |
| djangorestframework-simplejwt | 5.3 | JWT トークン発行 |
| drf-spectacular | 0.27 | OpenAPI / Swagger UI |
| PostgreSQL (本番) / SQLite (開発) | — | データベース |
| gunicorn | 22.0 | WSGI サーバー（本番） |
| whitenoise | 6.7 | 静的ファイル配信 |

### フロントエンド (`musicrpg-frontend/`)

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Next.js (App Router) | 16.2 | React フレームワーク |
| TypeScript | 5 | 型安全 |
| Tailwind CSS | 4 | スタイリング |
| Zustand | 5 | グローバル状態管理 |
| SWR | 2 | データフェッチ・キャッシュ |
| react-qr-code | 2 | QR コード生成 |
| jsQR | 1.4 | カメラ映像から QR デコード |

---

## ディレクトリ構成

```
prj/
├── musicrpg_backend/          # Django バックエンド
│   ├── apps/
│   │   ├── users/             # カスタムユーザーモデル
│   │   └── music/             # MusicProfile / Song モデル
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py        # 共通設定
│   │   │   ├── local.py       # 開発用（SQLite）
│   │   │   └── production.py  # 本番用（PostgreSQL）
│   │   └── urls.py
│   ├── Dockerfile
│   └── requirements*.txt
│
├── musicrpg-frontend/         # Next.js フロントエンド
│   ├── app/
│   │   ├── (app)/             # 認証済みページ群
│   │   │   ├── qr/            # QR 表示・スキャン
│   │   │   ├── compare/       # プロフィール比較・セッション記録
│   │   │   ├── songs/         # 曲の追加・管理
│   │   │   ├── status/        # 演奏ステータス編集
│   │   │   └── history/       # セッション履歴
│   │   ├── login/             # ログイン・新規登録
│   │   └── guide/             # 使い方ガイド
│   ├── components/            # 共通 UI コンポーネント
│   ├── lib/
│   │   ├── api.ts             # バックエンド API クライアント
│   │   └── localStore.ts      # QR エンコード・localStorage 操作
│   ├── store/useAppStore.ts   # Zustand ストア
│   └── Dockerfile
│
├── start.sh                   # ローカル開発用起動スクリプト
├── deploy.sh                  # Azure Container Apps デプロイスクリプト
└── DEPLOY.md                  # デプロイ手順書
```

---

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| `POST` | `/api/auth/login/` | ログイン → JWT 返却 |
| `POST` | `/api/auth/registration/` | 新規登録 → JWT 返却 |
| `GET/PATCH` | `/api/music/profile/` | 自分の MusicProfile 取得・更新 |
| `GET/POST` | `/api/music/songs/` | 曲の一覧取得・追加 |
| `DELETE` | `/api/music/songs/<id>/` | 曲の削除 |
| `GET` | `/api/docs/` | Swagger UI |

---

## データモデル

```
User (users テーブル)
 └─ MusicProfile  1:1
      ├── instrument: piano / esax / vocal
      ├── stat_tempo / emotion / range / effort / stage: 1–5
      └─ Song  1:N
           ├── title
           └── stars: 1–5
```

---

## QR の仕組み

QR にはプロフィールデータを **UTF-8 safe base64 の JSON** としてエンコード。スキャン側はサーバー通信なしで比較できるためオフライン動作が可能。

```
QR データ = base64( JSON { username, instrument, songs: [{title, stars}] } )
```

---

## ローカル開発

```bash
# Python 3.10+ と Node.js 18+ が必要
./start.sh
```

- バックエンド: http://localhost:8000
- フロントエンド: http://localhost:3000
- Swagger UI: http://localhost:8000/api/docs/

環境変数（`.env` をバックエンドルートに配置）：

```env
SECRET_KEY=your-secret-key
```

---

## 本番デプロイ（Azure Container Apps）

詳細は [DEPLOY.md](DEPLOY.md) を参照。

```bash
# 初回（インフラ + アプリ一括）
./deploy.sh

# コード修正後の再デプロイ
./deploy.sh --skip-infra
```

**必要なもの：** Azure CLI、Docker Desktop

---

## PWA インストール方法

| プラットフォーム | 手順 |
|----------------|------|
| **iOS** | Safari でアクセス → 共有ボタン →「ホーム画面に追加」 |
| **Android** | Chrome でアクセス → メニュー →「ホーム画面に追加」 |
