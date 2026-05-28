targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

param resourceGroupName string = ''

var abbrs = loadJsonContent('./abbreviations.json')
// Updated to v6 to force fresh resource names and bypass "Conflicting State" errors
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location, 'v6'))
var tags = { 'azd-env-name': environmentName }

// Organize resources in a resource group with location suffix to ensure a clean folder
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
    postgresPassword: 'P@ssw0rd1234!'
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = rg.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = resources.outputs.AZURE_CONTAINER_REGISTRY_ENDPOINT
output AZURE_CONTAINER_REGISTRY_NAME string = resources.outputs.AZURE_CONTAINER_REGISTRY_NAME
output BACKEND_URI string = resources.outputs.BACKEND_URI
output FRONTEND_URI string = resources.outputs.FRONTEND_URI
