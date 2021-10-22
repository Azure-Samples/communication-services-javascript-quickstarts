var config = module.exports = {};

config = {};

// app settings

//1. Configurations related to Communication Service resource
config.Connectionstring= '%ConnectionString%';
//<!-- Phone number provisioned for the resource (in E.164 Format, e.g. +14251002000). -->
config.SourcePhone= '%SourcePhone%';
//<!-- Destination identities to call. Multiple outbound calls are seperated by a semi-colon and participants in an outbound call are seperated by a coma. 
//For e.g. +14251002000, 8:acs:ab12b0ea-85ea-4f83-b0b6-84d90209c7c4_00000009-bce0-da09-54b7-xxxxxxxxxxxx; +14251002001, 8:acs:ab12b0ea-85ea-4f83-b0b6-84d90209c7c4_00000009-bce0-da09-555-xxxxxxxxxxxx). -->
config.DestinationIdentities= '%DestinationIdentities%';
config.MaxRetryCount = 2;

// 2. Configurations related to environment
config.NgrokExePath= '%NgrokExePath%';
config.SecretPlaceholder = 'h3llowW0rld';

//<!-- Cognitive service key (Optional). -->
config.CognitiveServiceKey= '';
//<!-- Cognitive service region (Optional). -->
config.CognitiveServiceRegion= '';
//<!-- Custom message that will be translated by Azure Cognitive service (Optional). -->
config.CustomMessage = 'Hello this is a reminder call. If you would like to speak with a representative Press 1 or 2 if you want to hang up.';

module.exports = config;