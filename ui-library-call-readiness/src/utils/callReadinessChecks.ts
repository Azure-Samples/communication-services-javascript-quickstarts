import { CallClient } from "@azure/communication-calling";

export const checkBrowserSupport = async (callClient: CallClient): Promise<boolean> =>
  (await callClient.getEnvironmentInfo()).isSupportedBrowser;
