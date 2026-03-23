# Azure & GitHub Setup Guide

One-time manual setup steps to connect the infrastructure code (`infra/`, `.github/workflows/`) to live Azure and GitHub environments.

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- An Azure subscription
- GitHub repo admin access

## 1. Azure Login & Resource Group

```bash
az login

# Create the dev resource group (pick your preferred region)
az group create --name hockeyhub-dev-rg --location eastus
```

## 2. Create a Service Principal

```bash
# Replace <YOUR_SUBSCRIPTION_ID> with your actual subscription ID
# (find it with: az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name "hockeyhub-github-deploy" \
  --role Contributor \
  --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-dev-rg \
  --json-auth
```

**Save the JSON output** — this becomes the `AZURE_CREDENTIALS` GitHub secret.

The SP needs two additional roles so the Bicep template can assign RBAC (ACR pull, Key Vault access):

```bash
# Get the SP's appId from the JSON output above
SP_APP_ID="<appId from JSON>"

az role assignment create \
  --assignee $SP_APP_ID \
  --role "Key Vault Secrets Officer" \
  --scope /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-dev-rg

az role assignment create \
  --assignee $SP_APP_ID \
  --role "User Access Administrator" \
  --scope /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-dev-rg
```

## 3. Deploy Infrastructure (Bicep)

```bash
# From the repo root — provisions all Azure resources
az deployment group create \
  --resource-group hockeyhub-dev-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.dev.json \
  --parameters postgresPassword="<CHOOSE_A_SECURE_PASSWORD>"
```

This creates:
- Container Apps Environment + backend API Container App
- Dev PostgreSQL and Redis containers (with persistent storage)
- Azure Container Registry (admin disabled)
- Key Vault (with connection string secrets)
- Application Insights + Log Analytics Workspace
- Alert rules (error rate, response time)

The backend Container App starts with a placeholder image — the first deploy-dev workflow run will push the real image.

## 4. Create the Static Web App

```bash
az staticwebapp create \
  --name hockeyhub-dev-swa \
  --resource-group hockeyhub-dev-rg \
  --location eastus2
```

Grab the deployment token:

```bash
az staticwebapp secrets list \
  --name hockeyhub-dev-swa \
  --resource-group hockeyhub-dev-rg \
  --query properties.apiKey -o tsv
```

Save this — it becomes the `AZURE_SWA_TOKEN_DEV` GitHub secret.

## 5. Configure GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `AZURE_CREDENTIALS` | Full JSON blob from step 2 (`az ad sp create-for-rbac --json-auth` output) |
| `AZURE_SWA_TOKEN_DEV` | Static Web App deployment token from step 4 |

## 6. Branch Protection (recommended)

Go to **Settings → Branches → Add branch ruleset** for `main`:

- **Require status checks to pass before merging** — add:
  - `Backend Build & Test`
  - `Frontend Build, Lint & Test`
- **Require branches to be up to date before merging**

This enforces that all PRs must pass CI before merge.

## 7. Test the Pipeline

```bash
# Create a branch, make a small change, open a PR
# → ci.yml runs (build/test/lint for both backend and frontend)

# Merge the PR to main
# → deploy-dev.yml triggers (build image → push ACR → migrate DB → deploy → smoke tests)
```

## Production Setup (when ready)

Repeat steps 1–5 with prod values:

```bash
# Prod resource group
az group create --name hockeyhub-prod-rg --location eastus

# Add Contributor + RBAC roles for the SP on the prod resource group
az role assignment create --assignee $SP_APP_ID --role Contributor \
  --scope /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-prod-rg
az role assignment create --assignee $SP_APP_ID --role "Key Vault Secrets Officer" \
  --scope /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-prod-rg
az role assignment create --assignee $SP_APP_ID --role "User Access Administrator" \
  --scope /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/hockeyhub-prod-rg

# Deploy prod infra (uses managed PostgreSQL + Redis instead of containers)
az deployment group create \
  --resource-group hockeyhub-prod-rg \
  --template-file infra/main.bicep \
  --parameters infra/parameters.prod.json \
  --parameters postgresPassword="<PROD_PASSWORD>" \
  --parameters postgresConnectionString="<MANAGED_PG_CONN_STRING>" \
  --parameters redisConnectionString="<MANAGED_REDIS_CONN_STRING>"

# Prod Static Web App
az staticwebapp create --name hockeyhub-prod-swa --resource-group hockeyhub-prod-rg --location eastus2
# → grab token → add as AZURE_SWA_TOKEN_PROD GitHub secret
```

Then in GitHub → **Settings → Environments → New environment** → name it `production`:
- Enable **Required reviewers** and add yourself
- This creates the approval gate on `deploy-prod.yml` (the migration step requires approval before running)

## Estimated Dev Costs

| Service | Monthly Cost |
|---|---|
| Azure Static Web Apps (Free tier) | $0 |
| Azure Container Apps (backend API — consumption) | $5–15 |
| Azure Container Apps (PostgreSQL container) | $3–8 |
| Azure Container Apps (Redis container) | $2–5 |
| Azure Container Registry (Basic tier) | $5 |
| Azure Monitor / Application Insights (free tier) | $0 |
| Azure Key Vault (standard) | < $1 |
| **Total** | **$15–35/mo** |

Container Apps consumption pricing charges only for active CPU/memory seconds — services scale to zero when idle.
