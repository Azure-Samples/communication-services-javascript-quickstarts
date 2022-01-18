How to run
1. Create ACS resource from Azure Portal

2. Create 3 ACS User Identities(MRI)
Example
```
User 1: 8:acs:<ACS resource id>-<guid>
User 2: 8:acs:<ACS resource id>-<guid>
User 3: 8:acs:<ACS resource id>-<guid>
```

3. Put User2 MRI into the config AllowedRecipientList

4. Put User3 MRI into the config TargetParticipant

5. Start ngrok
```
ngrok http 3000
```

6. Update config with ngrok endpoint. Example
```
"appCallbackBaseUri": "https://4087-75-155-234-140.ngrok.io"
```

7. Start sample app locally
```
npm run start
```

or to hot reload
```
npm run dev
```

8. Register webhook to your ACS resource
```
armclient put "/subscriptions/<subscription id>/resourceGroups/<rg>/providers/Microsoft.Communication/CommunicationServices/<acs name>/providers/Microsoft.EventGrid/eventSubscriptions/IncomingCallEventSub?api-version=2020-06-01" "{'properties':{'destination':{'properties':{'endpointUrl':'https://<ngrok url>/OnIncomingCall'},'endpointType':'WebHook'},'filter':{'includedEventTypes': ['Microsoft.Communication.IncomingCall']}}}" -verbose
```

9. Make a call from User1 to User2