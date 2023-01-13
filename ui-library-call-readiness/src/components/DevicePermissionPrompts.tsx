import { CameraAndMicrophoneSitePermissions } from '@azure/communication-react';
import { Modal } from '@fluentui/react';

/** Modal dialog that prompt the user to accept the Browser's device permission request. */
export const AcceptDevicePermissionRequestPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <PermissionsModal isOpen={props.isOpen} type="request" />
);

/** Modal dialog that informs the user we are checking for device access. */
export const CheckingDeviceAccessPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <PermissionsModal isOpen={props.isOpen} type="check" />
)

/** Modal dialog that informs the user they denied permission to the camera or microphone with corrective steps. */
export const PermissionsDeniedPrompt = (props: { isOpen: boolean }): JSX.Element => (
  <PermissionsModal isOpen={props.isOpen} type="denied" />
);

/** Base component utilitzed by the above prompts for better code separation. */
const PermissionsModal = (props: { isOpen: boolean, type: "denied" | "request" | "check" }): JSX.Element => (
  <Modal isOpen={props.isOpen}>
    <CameraAndMicrophoneSitePermissions
      appName={'this site'}
      type={props.type}
      onTroubleshootingClick={() => alert('This callback should be used to take the user to further troubleshooting')}
    />
  </Modal>
);
