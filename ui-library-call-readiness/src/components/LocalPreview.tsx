import {
  StreamMedia,
  VideoTile,
  ControlBar,
  CameraButton,
  useTheme,
  MicrophoneButton
} from '@azure/communication-react';
import { Stack, mergeStyles, Text, ITheme } from '@fluentui/react';
import { VideoOff20Filled } from '@fluentui/react-icons';
import { useEffect } from 'react';
import { useCameras, useLocalPreview } from '../helpers/deviceSetupHooks';

/** LocalPreview component has a camera and microphone toggle buttons, along with a video preview of the local camera. */
export const LocalPreview = (props: {
  cameraOn: boolean,
  microphoneOn: boolean,
  cameraToggled: (isCameraOn: boolean) => void,
  microphoneToggled: (isMicrophoneOn: boolean) => void
}): JSX.Element => {
  const { cameraOn, microphoneOn, cameraToggled, microphoneToggled } = props;
  const { localPreview, startLocalPreview, stopLocalPreview } = useLocalPreview();
  const canTurnCameraOn = useCameras().cameras.length > 0;

  // Start and stop the local video preview based on if the user has turned the camera on or off and if the camera is available.
  useEffect(() => {
    if (!localPreview && cameraOn && canTurnCameraOn) {
      startLocalPreview();
    } else if (!cameraOn) {
      stopLocalPreview();
    }
  }, [canTurnCameraOn, cameraOn, localPreview, startLocalPreview, stopLocalPreview]);

  const theme = useTheme();
  const shouldShowLocalVideo = canTurnCameraOn && cameraOn && localPreview;
  return (
    <Stack verticalFill verticalAlign="center">
      <Stack className={localPreviewContainerStyles(theme)}>
        <VideoTile
          renderElement={shouldShowLocalVideo ? <StreamMedia videoStreamElement={localPreview.target} /> : undefined}
          onRenderPlaceholder={() => <CameraOffPlaceholder />}
        >
          <ControlBar layout="floatingBottom">
            <CameraButton
              checked={cameraOn}
              onClick={() => {
                cameraToggled(!cameraOn)
              }}
            />
            <MicrophoneButton
              checked={microphoneOn}
              onClick={() => {
                microphoneToggled(!microphoneOn)
              }}
            />
          </ControlBar>
        </VideoTile>
      </Stack>
    </Stack>
  );
};

/** Placeholder shown in the local preview window when the camera is off */
const CameraOffPlaceholder = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack style={{ width: '100%', height: '100%' }} verticalAlign="center">
      <Stack.Item align="center">
        <VideoOff20Filled primaryFill="currentColor" />
      </Stack.Item>
      <Stack.Item align="center">
        <Text variant='small' styles={{ root: { color: theme.palette.neutralTertiary }}}>Your camera is turned off</Text>
      </Stack.Item>
    </Stack>
  );
};

/** Default styles for the local preview container */
const localPreviewContainerStyles = (theme: ITheme): string =>
  mergeStyles({
    minWidth: '25rem',
    maxHeight: '18.75rem',
    minHeight: '16.875rem',
    margin: '0 auto',
    background: theme.palette.neutralLighter,
    color: theme.palette.neutralTertiary
  });
