param environmentName string
param location string
param resourceToken string
param tags object
@secure()
param postgresPassword string

var abbrs = loadJsonContent('./abbreviations.json')

// Log Analytics Workspace for monitoring
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2021-12-01-preview' existing = {
  name: '${abbrs.insightsLogAnalytics}${resourceToken}'
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: '${abbrs.insightsApplicationInsights}${resourceToken}'
}

// Container Registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: '${abbrs.containerRegistryRegistries}${resourceToken}'
}

// Key Vault for secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: '${abbrs.keyVaultVaults}${resourceToken}'
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${abbrs.dBforPostgreSQLServers}${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'psqladmin'
    administratorLoginPassword: postgresPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'ai_app_db'
}

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Storage Account for blobs
resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: '${abbrs.storageStorageAccounts}${resourceToken}'
}

// Backend Container App
module backend './core/host/container-app.bicep' = {
  name: 'backend'
  params: {
    name: '${abbrs.appContainerApps}backend-${resourceToken}'
    location: location
    containerAppsEnvironmentName: '${abbrs.appManagedEnvironments}${resourceToken}'
    containerRegistryName: containerRegistry.name
    targetPort: 8000
    tags: union(tags, { 'azd-service-name': 'backend' })
    env: [
      {
        name: 'DATABASE_URL'
        value: 'postgresql://psqladmin:${postgresPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${postgresDatabase.name}'
      }
      {
        name: 'FRONTEND_URL'
        value: '*' // Use '*' for initial CORS to break cycle
      }
    ]
  }
}

// Frontend Container App
module frontend './core/host/container-app.bicep' = {
  name: 'frontend'
  params: {
    name: '${abbrs.appContainerApps}frontend-${resourceToken}'
    location: location
    containerAppsEnvironmentName: '${abbrs.appManagedEnvironments}${resourceToken}'
    containerRegistryName: containerRegistry.name
    targetPort: 80
    tags: union(tags, { 'azd-service-name': 'frontend' })
    env: [
      {
        name: 'VITE_API_URL'
        value: backend.outputs.uri
      }
    ]
  }
}

resource acrPullRoleBackend 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: containerRegistry
  name: guid(containerRegistry.id, backend.name, 'AcrPull')
  properties: {
    principalId: backend.outputs.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-a505-4991-8403-ba071878b6ca')
    principalType: 'ServicePrincipal'
  }
}

resource acrPullRoleFrontend 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: containerRegistry
  name: guid(containerRegistry.id, frontend.name, 'AcrPull')
  properties: {
    principalId: frontend.outputs.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-a505-4991-8403-ba071878b6ca')
    principalType: 'ServicePrincipal'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = subscription().tenantId
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.properties.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.name
output BACKEND_URI string = backend.outputs.uri
output FRONTEND_URI string = frontend.outputs.uri
