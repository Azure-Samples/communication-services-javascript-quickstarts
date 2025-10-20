#!/bin/bash

# ========================================
# Node.js Azure App Deployment Script
# ========================================

# ======== Configuration ========
RESOURCE_GROUP="<RESOURCE-GROUP>"
APP_NAME="APP-NAME"
LOCATION="LOCATION"
PLAN_NAME="APP-SERVICE-PLAN"
RUNTIME="NODE|22-lts"
ZIP_FILE="app.zip"

# ======== Login to Azure ========
echo "Checking Azure login..."
az login

# ======== Resource Group ========
echo "Checking for resource group..."
if az group exists --name "$RESOURCE_GROUP"; then
    echo "Resource group '$RESOURCE_GROUP' already exists."
else
    echo "Creating resource group '$RESOURCE_GROUP'..."
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
fi

# ======== App Service Plan ========
echo "Checking for App Service plan..."
if az appservice plan show --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "App Service plan '$PLAN_NAME' already exists."
else
    echo "Creating App Service plan '$PLAN_NAME'..."
    az appservice plan create --name "$PLAN_NAME" --resource-group "$RESOURCE_GROUP" --sku FREE
fi

# ======== Web App ========
echo "Checking for Web App..."
if az webapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "Web App '$APP_NAME' already exists."
else
    echo "Creating Web App '$APP_NAME'..."
    az webapp create \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$PLAN_NAME" \
        --name "$APP_NAME" \
        --runtime "$RUNTIME"
fi

# Remove existing app.zip if it exists
rm -f "$ZIP_FILE"

# Create zip using 7-Zip, excluding .git, .env, and .log files
7z a -tzip "$ZIP_FILE" ./\* \
  -xr'!.git' \
  -xr'!*.env' \
  -xr'!*.log'

echo "Deploying to Azure Web App..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --src "$ZIP_FILE"

# ======== Output URL ========
echo "App deployed successfully."
echo "URL: https://$APP_NAME.azurewebsites.net"
echo "Deployment script finished."
