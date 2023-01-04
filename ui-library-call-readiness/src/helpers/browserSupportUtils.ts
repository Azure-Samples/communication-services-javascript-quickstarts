import { Features } from "@azure/communication-calling";
import { StatefulCallClient } from "@azure/communication-react";

/** Use the callClient's getEnvironmentInfo() method to check if the browser is supported. */
export const checkBrowserSupport = async (callClient: StatefulCallClient): Promise<boolean> =>
  (await callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedBrowser;

/** Use the callClient's getEnvironmentInfo() method to check if the operating system is supported. */
export const checkOperatingSystemSupport = async (callClient: StatefulCallClient): Promise<boolean> =>
  (await callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedPlatform;

/** Use the callClient's getEnvironmentInfo() method to check if the browser version is supported. */
export const checkBrowserVersionSupport = async (callClient: StatefulCallClient): Promise<boolean> =>
  (await callClient.feature(Features.DebugInfo).getEnvironmentInfo()).isSupportedBrowserVersion;