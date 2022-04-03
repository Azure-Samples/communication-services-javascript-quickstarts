using System;

namespace Contoso
{
    static class Settings
    {
        public static string GetACSConnectionString()
        {
            return GetEnvironmentVariable("ACS_CONNECTION_STRING");
        }
        public static string GetRecordingStoreConnectionString()
        {
            return GetEnvironmentVariable("RECORDING_STORE_CONNECTION_STRING");
        }
        public static string GetRecordingStoreContainerName()
        {
            return GetEnvironmentVariable("RECORDING_STORE_CONTAINER_NAME");
        }
        private static string GetEnvironmentVariable(string name)
        {
            return Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process);
        }
    }
}