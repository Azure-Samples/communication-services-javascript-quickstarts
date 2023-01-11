import { EnvironmentInfo, Features } from "@azure/communication-calling";
import { StatefulCallClient } from "@azure/communication-react";

/** Use the callClient's getEnvironmentInfo() method to check if the browser is supported. */
export const checkBrowserSupport = async (callClient: StatefulCallClient): Promise<EnvironmentInfo> => {
  const environmentInfo = await callClient.feature(Features.DebugInfo).getEnvironmentInfo();
  console.info(environmentInfo); // view console logs in the browser to see what environment info is returned
  return environmentInfo;
}
