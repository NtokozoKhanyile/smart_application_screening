param name string
param location string = resourceGroup().location
param tags object = {}

param containerAppsEnvironmentName string
param containerRegistryName string = ''
param serviceName string = 'backend'
param env array = []
param secrets array = []
param externalIngress bool = true
param targetPort int = 8000

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: resourceId('Microsoft.App/managedEnvironments', containerAppsEnvironmentName)
    configuration: {
      secrets: secrets
      registries: !empty(containerRegistryName) ? [
        {
          server: '${containerRegistryName}.azurecr.io'
          identity: 'system'
        }
      ] : []
      ingress: {
        external: externalIngress
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: serviceName
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          env: env
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 10
      }
    }
  }
}

output name string = containerApp.name
output principalId string = containerApp.identity.principalId
output uri string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
