async function main() {
	const { SipRoutingClient } = require('@azure/communication-phone-numbers');

	const connectionString = "endpoint=https://<RESOURCE_NAME>.communication.azure.com/;accesskey=<ACCESS_KEY>";

	const client = new SipRoutingClient(connectionString);

    console.log("Starting direct routing setup.");
	
	await client.setTrunks([
	{
		fqdn: 'sbc.us.contoso.com',
		sipSignalingPort: 1234
	},{
		fqdn: 'sbc.eu.contoso.com',
		sipSignalingPort: 1234
	}
	]);

    console.log("Trunks were created.");
	
	await client.setRoutes([
	{
		name: "UsRoute",
		description: "route's description",
		numberPattern: "^\+1(\d{10})$",
		trunks: [ 'sbc.us.contoso.com' ]
	},{
		name: "DefaultRoute",
		description: "route's description",
		numberPattern: "^\+\d+$",
		trunks: [ 'sbc.us.contoso.com', 'sbc.eu.contoso.com']
	}
	]);

    console.log("Routes were created.");
    console.log("Successfully created direct routing configuration.");
}

main();
