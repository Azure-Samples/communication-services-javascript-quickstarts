import { UnsupportedBrowser, UnsupportedOperatingSystem, UnsupportedBrowserVersion } from '@azure/communication-react';
import { Modal } from '@fluentui/react';
import { EnvironmentChecksState } from './EnvironmentChecksComponent';

export const BrowserUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowser
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
    />
  </Modal>
);


export const OperatingSystemUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedOperatingSystem
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
    />
  </Modal>
);


export const BrowserVersionUnsupportedPrompt = (props: { isOpen: boolean, onContinueAnyway:() => void }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowserVersion
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      onContinueAnywayClick={() => props.onContinueAnyway()}
    />
  </Modal>
);
