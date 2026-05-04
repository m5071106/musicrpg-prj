#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  MUSICIAN RPG CARD — Azure Container Apps deployment script
# ============================================================
# Prerequisites: Azure CLI (az), Docker Desktop running
# Usage: ./deploy.sh [--skip-infra]
# ============================================================

# ── Config (edit before first run) ──────────────────────────
RESOURCE_GROUP="${RESOURCE_GROUP:-musicrpg-rg}"
LOCATION="${LOCATION:-japaneast}"
ACR_NAME="${ACR_NAME:-musicrpgacr$RANDOM}"          # must be globally unique
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-musicrpg-env}"
BACKEND_APP="${BACKEND_APP:-musicrpg-backend}"
FRONTEND_APP="${FRONTEND_APP:-musicrpg-frontend}"
PG_SERVER="${PG_SERVER:-musicrpg-pg}"
PG_DB="${PG_DB:-musicrpg}"
PG_USER="${PG_USER:-musicrpgadmin}"
PG_PASSWORD="${PG_PASSWORD:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)}"
SECRET_KEY="${SECRET_KEY:-$(openssl rand -base64 48)}"

SKIP_INFRA=false
for arg in "$@"; do [[ "$arg" == "--skip-infra" ]] && SKIP_INFRA=true; done

# ── Resolve ACR name (persist between runs) ──────────────────
ACR_STATE_FILE=".deploy_state"
if [[ -f "$ACR_STATE_FILE" ]]; then
  # shellcheck source=/dev/null
  source "$ACR_STATE_FILE"
fi

# ── Helpers ──────────────────────────────────────────────────
info()    { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
success() { echo -e "\033[1;32m[OK]\033[0m    $*"; }
step()    { echo -e "\n\033[1;35m━━ $* ━━\033[0m"; }

# ── 1. Login check ───────────────────────────────────────────
step "Azure ログイン確認"
if ! az account show &>/dev/null; then
  info "ブラウザでログインします..."
  az login
fi
SUBSCRIPTION=$(az account show --query name -o tsv)
success "サブスクリプション: $SUBSCRIPTION"

if [[ "$SKIP_INFRA" == false ]]; then
  # ── 2. Resource Group ──────────────────────────────────────
  step "リソースグループ作成"
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o none
  success "$RESOURCE_GROUP ($LOCATION)"

  # ── 3. ACR ────────────────────────────────────────────────
  step "Azure Container Registry 作成"
  az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    -o none
  # persist ACR name for future runs
  echo "ACR_NAME=$ACR_NAME" > "$ACR_STATE_FILE"
  success "ACR: $ACR_NAME"

  # ── 4. PostgreSQL Flexible Server ─────────────────────────
  step "PostgreSQL プロバイダー登録 (初回のみ)"
  az provider register --namespace Microsoft.DBforPostgreSQL --wait
  success "Microsoft.DBforPostgreSQL 登録済み"

  step "PostgreSQL Flexible Server 作成 (数分かかります)"
  az postgres flexible-server create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$PG_SERVER" \
    --location "$LOCATION" \
    --admin-user "$PG_USER" \
    --admin-password "$PG_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --storage-size 32 \
    --version 16 \
    --public-access All \
    -o none
  az postgres flexible-server db create \
    --resource-group "$RESOURCE_GROUP" \
    --server-name "$PG_SERVER" \
    --database-name "$PG_DB" \
    -o none
  success "PostgreSQL: $PG_SERVER / DB: $PG_DB"
  # persist password
  echo "PG_PASSWORD=$PG_PASSWORD" >> "$ACR_STATE_FILE"

  # ── 5. Container Apps Environment ─────────────────────────
  step "Container Apps Environment 作成"
  az containerapp env create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ENVIRONMENT_NAME" \
    --location "$LOCATION" \
    -o none
  success "$ENVIRONMENT_NAME"
fi  # end SKIP_INFRA

# ── 6. Docker 起動確認 ───────────────────────────────────────
step "Docker Desktop 起動確認"
if ! docker info &>/dev/null; then
  info "Docker Desktop が起動していません。自動起動します..."
  open -a Docker
  info "Docker Desktop が準備完了するまで待機中 (最大 60 秒)..."
  for i in $(seq 1 30); do
    docker info &>/dev/null && break
    sleep 2
    [[ $i -eq 30 ]] && { echo "Docker Desktop の起動がタイムアウトしました。手動で起動してから再実行してください。"; exit 1; }
  done
fi
success "Docker Desktop 起動済み"

# ── 7. Docker login to ACR ────────────────────────────────────
step "ACR へ Docker ログイン"
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
az acr login --name "$ACR_NAME"
success "Login server: $ACR_LOGIN_SERVER"

# ── 7. Build & push backend ───────────────────────────────────
step "バックエンド Docker イメージ ビルド & プッシュ"
BACKEND_IMAGE="$ACR_LOGIN_SERVER/musicrpg-backend:latest"
docker build --platform linux/amd64 -t "$BACKEND_IMAGE" ./musicrpg_backend
docker push "$BACKEND_IMAGE"
success "Pushed: $BACKEND_IMAGE"

# ── 8. Deploy backend container app ──────────────────────────
step "バックエンド Container App デプロイ"
DATABASE_URL="postgresql://$PG_USER:$PG_PASSWORD@$PG_SERVER.postgres.database.azure.com/$PG_DB?sslmode=require"

if az containerapp show --name "$BACKEND_APP" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az containerapp update \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$BACKEND_IMAGE" \
    -o none
else
  az containerapp create \
    --name "$BACKEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "$BACKEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$(az acr credential show --name "$ACR_NAME" --query username -o tsv)" \
    --registry-password "$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)" \
    --target-port 8000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 2 \
    --cpu 0.5 --memory 1.0Gi \
    --env-vars \
        DJANGO_SETTINGS_MODULE=config.settings.production \
        SECRET_KEY="$SECRET_KEY" \
        DATABASE_URL="$DATABASE_URL" \
        CORS_ALLOW_ALL=true \
        ALLOWED_HOSTS="*" \
    -o none
fi

BACKEND_FQDN=$(az containerapp show \
  --name "$BACKEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn -o tsv)
BACKEND_URL="https://$BACKEND_FQDN/api"
BACKEND_DISPLAY_URL="https://$BACKEND_FQDN"
success "Backend URL: $BACKEND_DISPLAY_URL"

# ── 9. Build & push frontend ──────────────────────────────────
step "フロントエンド Docker イメージ ビルド & プッシュ (APIのURLを埋め込み)"
FRONTEND_IMAGE="$ACR_LOGIN_SERVER/musicrpg-frontend:latest"
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" \
  -t "$FRONTEND_IMAGE" \
  ./musicrpg-frontend
docker push "$FRONTEND_IMAGE"
success "Pushed: $FRONTEND_IMAGE"

# ── 10. Deploy frontend container app ────────────────────────
step "フロントエンド Container App デプロイ"
if az containerapp show --name "$FRONTEND_APP" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az containerapp update \
    --name "$FRONTEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$FRONTEND_IMAGE" \
    -o none
else
  az containerapp create \
    --name "$FRONTEND_APP" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "$FRONTEND_IMAGE" \
    --registry-server "$ACR_LOGIN_SERVER" \
    --registry-username "$(az acr credential show --name "$ACR_NAME" --query username -o tsv)" \
    --registry-password "$(az acr credential show --name "$ACR_NAME" --query 'passwords[0].value' -o tsv)" \
    --target-port 3000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 2 \
    --cpu 0.5 --memory 1.0Gi \
    --env-vars \
        NODE_ENV=production \
    -o none
fi

FRONTEND_FQDN=$(az containerapp show \
  --name "$FRONTEND_APP" \
  --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn -o tsv)
FRONTEND_URL="https://$FRONTEND_FQDN"
success "Frontend URL: $FRONTEND_URL"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  デプロイ完了！                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
printf  "║  フロントエンド: %-42s ║\n" "$FRONTEND_URL"
printf  "║  バックエンド:   %-42s ║\n" "$BACKEND_DISPLAY_URL"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  モバイルからは フロントエンドURL をブラウザで開く       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
info "再デプロイ (インフラ再作成スキップ): ./deploy.sh --skip-infra"
