targetScope = 'subscription'

@description('Name of the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

param resourceGroupName string = ''

// Hardcoded to match your existing provisioned resources
var location = 'northeurope'
var resourceToken = 'u6qh5lr5owz3e'

var abbrs = loadJsonContent('./abbreviations.json')
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: !empty(resourceGroupName) ? resourceGroupName : '${abbrs.resourcesResourceGroups}${environmentName}-${location}'
  location: location
  tags: tags
}

module resources './resources.bicep' = {
  name: 'resources'
  scope: rg
  params: {
    environmentName: environmentName
    location: location
    resourceToken: resourceToken
    tags: tags
    postgresPassword: 'P@ss${guid(resourceToken)}'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_CONTAINER_REGISTRY_NAME string = resources.outputs.AZURE_CONTAINER_REGISTRY_NAME
output BACKEND_URI string = resources.outputs.BACKEND_URI
output FRONTEND_URI string = resources.outputs.FRONTEND_URI
