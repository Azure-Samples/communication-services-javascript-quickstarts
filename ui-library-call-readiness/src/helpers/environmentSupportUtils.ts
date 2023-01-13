import { EnvironmentInfo, Features } from "@azure/communication-calling";
import { StatefulCallClient } from "@azure/communication-react";

/** Use the callClient's getEnvironmentInfo() method to check if the browser is supported. */
export const checkEnvironmentSupport = async (callClient: StatefulCallClient): Promise<EnvironmentInfo> =>
  await callClient.feature(Features.DebugInfo).getEnvironmentInfo();
