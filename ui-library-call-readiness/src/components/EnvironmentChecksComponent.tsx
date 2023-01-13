import { useEffect, useState } from 'react';
import { BrowserUnsupportedPrompt, BrowserVersionUnsupportedPrompt, OperatingSystemUnsupportedPrompt } from './UnsupportedEnvironmentPrompts';
import { useCallClient } from '@azure/communication-react';
import { checkEnvironmentSupport } from '../helpers/browserSupportUtils';

export type EnvironmentChecksState = 'runningEnvironmentChecks' |
  'operatingSystemUnsupported' |
  'browserUnsupported' |
  'browserVersionUnsupported';

/**
 * This component is a demo of how to use the StatefulCallClient with CallReadiness Components to get a user
 * ready to join a call.
 * This component checks the browser support.
 */
export const EnvironmentChecksComponent = (props: {
  /**
   * Callback triggered when the tests are complete and successful
   */
  onTestsSuccessful: () => void
}): JSX.Element => {
  const [currentCheckState, setCurrentCheckState] = useState<EnvironmentChecksState>('runningEnvironmentChecks');
  

  // Run call readiness checks when component mounts
  const callClient = useCallClient();
  useEffect(() => {
    const runEnvironmentChecks = async (): Promise<void> => {

      // First we will get the environment information from the calling SDK.
      const environmentInfo = await checkEnvironmentSupport(callClient);

      if (!environmentInfo.isSupportedPlatform) {
        setCurrentCheckState('operatingSystemUnsupported');
        // if the platform or operating system is not supported we'll stop here and display a modal to the user.
        return;
      } else if (!environmentInfo.isSupportedBrowser) {
        setCurrentCheckState('browserUnsupported');
        // If browser support fails, we'll stop here and display a modal to the user.
        return;
      } else if (!environmentInfo.isSupportedBrowserVersion) {
        setCurrentCheckState('browserVersionUnsupported');
        /**
         *  if the browser version is unsupported, we'll stop here and show a modal that can allow the user 
         *  to continue into the call.
         */
        return;
      } else {
        props.onTestsSuccessful();
      }
    };

    runEnvironmentChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* We show this when the operating system is unsupported */}
      <OperatingSystemUnsupportedPrompt isOpen={currentCheckState === 'operatingSystemUnsupported'} />

      {/* We show this when the browser is unsupported */}
      <BrowserUnsupportedPrompt isOpen={currentCheckState === 'browserUnsupported'} />

      {/* We show this when the browser version is unsupported */}
      <BrowserVersionUnsupportedPrompt isOpen={currentCheckState === 'browserVersionUnsupported'} onContinueAnyway={props.onTestsSuccessful} />
    </>
  );
}
