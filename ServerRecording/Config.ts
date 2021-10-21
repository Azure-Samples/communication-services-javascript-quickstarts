var config = module.exports = { ConnectionString: '', BlobStorageConnectionString: '', ContainerName: '', CallbackUri: '', StorageAccountName: '', StorageAccountKey: '' };

config = { 'ConnectionString': '', 'BlobStorageConnectionString': '', 'ContainerName': '', 'CallbackUri': '', 'StorageAccountName': '', 'StorageAccountKey': '' };

config.ConnectionString = 'endpoint=https://acstelephonyportaltesting.communication.azure.com/;accesskey=/cJGRzQtFVNneQVqbUlRvsvOLwEgQwsWDQxjLnWPWcTSg3RwAfnYY4v9Ce/mN4iAZ50znB8B0UMmQ/cDHLnEtw==';
config.BlobStorageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=acsfunctionappstorage;AccountKey=PWrAqh2rWldMpE/omXmabj5oqoAM6fPgBHYN/LShFgy0LczSpKlvSTnHJk6DHWPT/pbG32t9p0zDm6+Znvt5qw==;EndpointSuffix=core.windows.net';
config.ContainerName = 'acs-recording-ravi';
config.CallbackUri = 'http://localhost:3000/';
config.StorageAccountName = 'acsfunctionappstorage';
config.StorageAccountKey = 'PWrAqh2rWldMpE/omXmabj5oqoAM6fPgBHYN/LShFgy0LczSpKlvSTnHJk6DHWPT/pbG32t9p0zDm6+Znvt5qw==';

module.exports = config;