import { UnsupportedBrowser, UnsupportedOperatingSystem, UnsupportedBrowserVersion } from '@azure/communication-react';
import { Modal } from '@fluentui/react';

export const BrowserUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowser
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      strings={undefined as any} /* remove when API is fixed */
    />
  </Modal>
);


export const OperatingSystemUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedOperatingSystem
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      strings={undefined as any} /* remove when API is fixed */
    />
  </Modal>
);


export const BrowserVersionUnsupportedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <UnsupportedBrowserVersion
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      onContinueAnywayClick={() => alert('This callback should be used to allow the user to continue into the calling application')}
      strings={undefined as any} /* remove when API is fixed */
    />
  </Modal>
);
