using System;

namespace Contoso
{
    static class Settings
    {
        public static string GetACSConnectionString()
        {
            return GetEnvironmentVariable("ACS_CONNECTION_STRING");
        }
        private static string GetEnvironmentVariable(string name)
        {
            return Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process);
        }
    }
}