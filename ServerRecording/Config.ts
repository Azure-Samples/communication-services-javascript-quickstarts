var config = module.exports = { ConnectionString: '', BlobStorageConnectionString: '', ContainerName: '', CallbackUri: '', StorageAccountName: '', StorageAccountKey: '' };

config = { 'ConnectionString': '', 'BlobStorageConnectionString': '', 'ContainerName': '', 'CallbackUri': '', 'StorageAccountName': '', 'StorageAccountKey': '' };

config.ConnectionString = '%ConnectionString%';
config.BlobStorageConnectionString = '%BlobStorageConnectionString%';
config.ContainerName = '%ContainerName%';
config.CallbackUri = '%CallbackUri%';
config.StorageAccountName = '%StorageAccountName%';
config.StorageAccountKey = '%StorageAccountKey%';

module.exports = config;
