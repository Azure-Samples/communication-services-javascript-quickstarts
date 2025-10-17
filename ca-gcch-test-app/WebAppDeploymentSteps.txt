Web App Deployment steps:

1. npm install --production

2. Open git bash

3. Navigate to C:/<DRIVE>/ca-gcch-test-app

4. chmod +x deploy-node-gcch-app.sh

5. ./deploy-node-gcch-app.sh

6. Set env configuration
	In app service Environment variable. AppSettings

	PORT=8080
	CONNECTION_STRING=""
	ACS_RESOURCE_PHONE_NUMBER =""
	CALLBACK_URI=""
	COGNITIVE_SERVICES_ENDPOINT=""