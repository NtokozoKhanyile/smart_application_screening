#!/bin/sh

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "${GREEN}Starting SQL data-plane access grant...${NC}"

# Get values from azd env
eval $(azd env get-values)

if [ -z "$AZURE_SQL_SERVER_NAME" ] || [ -z "$AZURE_SQL_DATABASE_NAME" ]; then
    echo "SQL server or database name not found in environment. Skipping."
    exit 0
fi

# Determine which service identity to use
PRINCIPAL_NAME=$SERVICE_BACKEND_NAME
if [ -z "$PRINCIPAL_NAME" ]; then
    PRINCIPAL_NAME=$SERVICE_API_NAME
fi

if [ -z "$PRINCIPAL_NAME" ]; then
    echo "No service identity found. Skipping."
    exit 0
fi

echo "Granting access to principal: $PRINCIPAL_NAME"

# Install extension if missing
az extension add --name rdbms-connect --yes

# Run the SQL grant
# We use 'db_owner' for simplicity in a personal project to ensure migrations work
az sql db query \
    --server "$AZURE_SQL_SERVER_NAME" \
    --database "$AZURE_SQL_DATABASE_NAME" \
    --query "IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = '$PRINCIPAL_NAME') 
             BEGIN 
                CREATE USER [$PRINCIPAL_NAME] FROM EXTERNAL PROVIDER;
                ALTER ROLE db_owner ADD MEMBER [$PRINCIPAL_NAME];
             END"

echo "${GREEN}SQL access granted successfully.${NC}"
