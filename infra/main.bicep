// Hockey League Hub — Azure Infrastructure
// Provisions all resources for the dev or prod environment.

targetScope = 'resourceGroup'

// ─── Parameters ───────────────────────────────────────────────────────────────

@description('Environment name (dev or prod)')
@allowed(['dev', 'prod'])
param environmentName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Base name for all resources')
param appName string = 'hockeyhub'

@description('Backend container image (full ACR path with tag)')
param backendImage string = ''

@description('SQL Server admin password')
@secure()
param sqlAdminPassword string

@description('SQL Server connection string override (for prod managed DB)')
param sqlConnectionString string = ''

@description('Redis connection string override (for prod managed Redis)')
param redisConnectionString string = ''

@description('Allowed CORS origins for the backend API (prod only, dev defaults to localhost)')
param allowedOrigins array = []

// ─── Variables ────────────────────────────────────────────────────────────────

var suffix = '${appName}-${environmentName}'
var acrName = replace('${appName}${environmentName}acr', '-', '')
var keyVaultName = '${appName}-${environmentName}-kv'
var logAnalyticsName = '${suffix}-logs'
var appInsightsName = '${suffix}-ai'
var containerEnvName = '${suffix}-env'
var backendAppName = '${suffix}-api'
var sqlServerName = '${suffix}-sql'
var sqlDbName = 'hockeyhub'
var redisAppName = '${suffix}-redis'
var isDev = environmentName == 'dev'
var tags = {
  environment: environmentName
  project: appName
  managedBy: 'Bicep'
}

// ─── Log Analytics Workspace ──────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ─── Application Insights ─────────────────────────────────────────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ─── Azure Container Registry ─────────────────────────────────────────────────

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

// ─── Key Vault ────────────────────────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource secretDatabase 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DatabaseConnectionString'
  properties: {
    value: isDev
      ? 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${sqlDbName};User ID=sqladmin;Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;'
      : sqlConnectionString
  }
}

resource secretRedis 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'RedisConnectionString'
  properties: {
    value: isDev ? '${redisAppName}.internal.${containerEnv.properties.defaultDomain}:6379' : redisConnectionString
  }
}

resource secretAppInsights 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'AppInsightsConnectionString'
  properties: {
    value: appInsights.properties.ConnectionString
  }
}

// ─── Container Apps Environment ───────────────────────────────────────────────

resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerEnvName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── Dev-only: Azure SQL Database (Serverless) ────────────────────────────────────

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = if (isDev) {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: 'sqladmin'
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource sqlFirewall 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = if (isDev) {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDb 'Microsoft.Sql/servers/databases@2023-08-01-preview' = if (isDev) {
  parent: sqlServer
  name: sqlDbName
  location: location
  tags: tags
  sku: {
    name: 'GP_S_Gen5_1'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: 34359738368 // 32 GB
    autoPauseDelay: 60 // Auto-pause after 60 minutes of inactivity
    minCapacity: json('0.5') // Minimum 0.5 vCores when active
    zoneRedundant: false
    requestedBackupStorageRedundancy: 'Local'
  }
}

// ─── Dev-only: Redis Container App ────────────────────────────────────────────

resource redisApp 'Microsoft.App/containerApps@2024-03-01' = if (isDev) {
  name: redisAppName
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 6379
        transport: 'tcp'
      }
    }
    template: {
      containers: [
        {
          name: 'redis'
          image: 'redis:7-alpine'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 1 }
    }
  }
}

// ─── Backend API Container App ────────────────────────────────────────────────

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      activeRevisionsMode: 'Multiple'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: isDev ? ['http://localhost:4200', 'https://localhost:4200'] : allowedOrigins
          allowedMethods: ['GET', 'POST', 'OPTIONS']
          allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'db-connection'
          keyVaultUrl: secretDatabase.properties.secretUri
          identity: 'system'
        }
        {
          name: 'redis-connection'
          keyVaultUrl: secretRedis.properties.secretUri
          identity: 'system'
        }
        {
          name: 'appinsights-connection'
          keyVaultUrl: secretAppInsights.properties.secretUri
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: !empty(backendImage) ? backendImage : 'mcr.microsoft.com/dotnet/samples:aspnetapp'
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ConnectionStrings__DefaultConnection', secretRef: 'db-connection' }
            { name: 'ConnectionStrings__Redis', secretRef: 'redis-connection' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', secretRef: 'appinsights-connection' }
            { name: 'ASPNETCORE_ENVIRONMENT', value: isDev ? 'Staging' : 'Production' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health/live'
                port: 8080
              }
              initialDelaySeconds: 15
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health/ready'
                port: 8080
              }
              initialDelaySeconds: 20
              periodSeconds: 15
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: isDev ? 0 : 1
        maxReplicas: isDev ? 1 : 5
        rules: isDev ? [] : [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// ─── RBAC: Backend App → ACR Pull ─────────────────────────────────────────────

// AcrPull role definition ID
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource backendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, backendApp.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ─── RBAC: Backend App → Key Vault Secrets User ───────────────────────────────

var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'

resource backendKvAccess 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendApp.id, kvSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalId: backendApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ─── Alert Rules ──────────────────────────────────────────────────────────────

resource alertActionGroup 'Microsoft.Insights/actionGroups@2023-09-01-preview' = {
  name: '${suffix}-alerts'
  location: 'global'
  properties: {
    groupShortName: 'HHAlerts'
    enabled: true
  }
}

resource alertHighErrorRate 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${suffix}-high-error-rate'
  location: 'global'
  properties: {
    description: 'API error rate exceeds 1% over 5 minutes'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          metricName: 'requests/failed'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 1
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [{ actionGroupId: alertActionGroup.id }]
  }
}

resource alertSlowResponse 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${suffix}-slow-response'
  location: 'global'
  properties: {
    description: 'API P95 response time exceeds 2 seconds'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'SlowResponse'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 2000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [{ actionGroupId: alertActionGroup.id }]
  }
}

// ─── Outputs ──────────────────────────────────────────────────────────────────

output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output backendAppUrl string = 'https://${backendApp.properties.configuration.ingress.fqdn}'
output backendAppName string = backendApp.name
output containerEnvName string = containerEnv.name
output keyVaultName string = keyVault.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalytics.id
