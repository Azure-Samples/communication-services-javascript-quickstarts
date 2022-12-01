import { Features } from "@azure/communication-calling";
import { StatefulCallClient } from "@azure/communication-react";

/** Use the callClient's getEnvironmentInfo() method to check if the browser is supported. */
export const checkBrowserSupport = async (callClient: StatefulCallClient): Promise<boolean> =>
  (await callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedBrowser;
