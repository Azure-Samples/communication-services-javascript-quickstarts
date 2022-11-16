import { UnsupportedBrowser } from '@azure/communication-react';
import { Modal } from '@fluentui/react';

export const BrowserUnsupportedModal = (): JSX.Element => (
  <Modal isOpen={true}>
    <UnsupportedBrowser
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
      strings={undefined as any} /* remove when API is fixed */
    />
  </Modal>
);
