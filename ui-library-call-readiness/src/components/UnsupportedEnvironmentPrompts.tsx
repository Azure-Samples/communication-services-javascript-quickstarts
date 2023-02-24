import { UnsupportedBrowser, UnsupportedOperatingSystem, UnsupportedBrowserVersion } from '@azure/communication-react';
import { Modal } from '@fluentui/react';

/**
 * Modal dialog that shows a Browser Version Unsupported Prompt
 * Use the `onTroubleShootingClick` argument to redirect the user to further troublshooting.
 * Use the `onContinueAnywayClick` argument to allow the user to continue to the next step even though they are on an unsupported browser version.
 */
export const BrowserVersionUnsupportedPrompt = (props: { isOpen: boolean, onContinueAnyway:() => void }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowserVersion
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      onContinueAnywayClick={() => props.onContinueAnyway()}
    />
  </Modal>
);

/**
 * Modal dialog that shows a Browser Unsupported Prompt
 * Use the `onTroubleShootingClick` argument to redirect the user to further troublshooting.
 */
export const BrowserUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowser
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
    />
  </Modal>
);

/**
 * Modal dialog that shows an Operating System Unsupported Prompt
 * Use the `onTroubleShootingClick` argument to redirect the user to further troublshooting.
 */
export const OperatingSystemUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedOperatingSystem
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
    />
  </Modal>
);
