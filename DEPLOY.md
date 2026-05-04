# Azure Container Apps デプロイ手順

Musician RPG Card を Azure Container Apps へデプロイしてモバイルからテストする手順です。

---

## 前提条件

| ツール | バージョン確認コマンド | インストール先 |
|--------|----------------------|---------------|
| Azure CLI | `az --version` | https://learn.microsoft.com/ja-jp/cli/azure/install-azure-cli |
| Docker Desktop | `docker --version` | https://www.docker.com/products/docker-desktop/ |

### Azure サブスクリプション
Azure アカウントと有効なサブスクリプションが必要です。  
初回は [portal.azure.com](https://portal.azure.com) で無料アカウントを作成できます（$200 クレジット付き）。

---

## 初回デプロイ（インフラ + アプリ一括）

```bash
cd /path/to/prj   # このディレクトリ（deploy.sh がある場所）
./deploy.sh
```

実行すると以下が自動で作成されます：

1. リソースグループ `musicrpg-rg`（リージョン: japaneast）
2. Azure Container Registry (ACR) — Docker イメージ保管
3. Azure PostgreSQL Flexible Server — 本番 DB
4. Container Apps Environment — アプリ実行基盤
5. バックエンド Container App（Django + gunicorn）
6. フロントエンド Container App（Next.js standalone）

完了後、ターミナルに以下のような URL が表示されます：

```
╔══════════════════════════════════════════════════════════╗
║  デプロイ完了！                                          ║
╠══════════════════════════════════════════════════════════╣
║  フロントエンド: https://musicrpg-frontend.xxxx.japaneast.azurecontainerapps.io  ║
║  バックエンド:   https://musicrpg-backend.xxxx.japaneast.azurecontainerapps.io   ║
╚══════════════════════════════════════════════════════════╝
```

---

## モバイルからのアクセス方法

1. **フロントエンド URL をスマホのブラウザで開く**  
   Safari / Chrome どちらでも OK。HTTPS なのでカメラ権限も問題なく使えます。

2. **PWA としてホーム画面に追加（推奨）**  
   - iOS: Safari の共有ボタン → "ホーム画面に追加"
   - Android: Chrome のメニュー → "アプリをインストール"  
   これでアプリのように全画面で使えます。

3. **2台で比較テストする場合**  
   それぞれのスマホで別アカウントを登録 → QR スキャンし合って比較画面を確認。

---

## コードを修正した後の再デプロイ

インフラは変えず、アプリイメージだけ更新する場合：

```bash
./deploy.sh --skip-infra
```

---

## 環境変数でカスタマイズ

`deploy.sh` を実行する前に環境変数をセットすることで各リソース名をカスタマイズできます：

```bash
export RESOURCE_GROUP=my-musicrpg-rg
export LOCATION=eastus
export ACR_NAME=myuniquacr123
./deploy.sh
```

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `RESOURCE_GROUP` | `musicrpg-rg` | リソースグループ名 |
| `LOCATION` | `japaneast` | Azure リージョン |
| `ACR_NAME` | `musicrpgacr<乱数>` | Container Registry 名（グローバル一意） |
| `PG_USER` | `musicrpgadmin` | PostgreSQL 管理者ユーザー名 |
| `PG_PASSWORD` | 自動生成 | PostgreSQL パスワード（`.deploy_state` に保存） |

---

## API の動作確認

バックエンドには Swagger UI が付いています：

```
https://<バックエンドURL>/api/schema/swagger-ui/
```

---

## 概算コスト（参考）

テスト用の最小構成（min-replicas=0 でアイドル時は停止）：

| リソース | SKU | 月額概算 |
|---------|-----|---------|
| Container Apps × 2 | Consumption（従量課金） | ~$0〜$5 |
| PostgreSQL Flexible Server | Standard_B1ms | ~$15 |
| Container Registry | Basic | ~$5 |
| **合計** | | **~$20〜25/月** |

> テスト後は不要リソースを削除してコストを抑えてください（下記参照）。

---

## クリーンアップ（全リソース削除）

```bash
az group delete --name musicrpg-rg --yes --no-wait
```

リソースグループを削除すると、その中の全リソース（DB、ACR、Container Apps）が削除されます。

---

## トラブルシューティング

### `az: command not found`
Azure CLI をインストールしてください。Mac の場合：
```bash
brew install azure-cli
```

### `Cannot connect to the Docker daemon`
Docker Desktop が起動しているか確認してください。

### バックエンドが 500 エラー
ログを確認します：
```bash
az containerapp logs show --name musicrpg-backend --resource-group musicrpg-rg --follow
```

### データベース接続エラー
PostgreSQL サーバーがプロビジョニング完了しているか確認（通常5〜10分かかります）：
```bash
az postgres flexible-server show --name musicrpg-pg --resource-group musicrpg-rg --query state
```
