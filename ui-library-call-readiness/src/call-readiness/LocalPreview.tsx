import { VideoDeviceInfo } from '@azure/communication-calling';
import {
  StreamMedia,
  VideoTile,
  ControlBar,
  CameraButton,
  useTheme,
  MicrophoneButton,
  VideoStreamRendererViewState
} from '@azure/communication-react';
import { Stack, mergeStyles, Text, ITheme } from '@fluentui/react';
import { VideoOff20Filled } from '@fluentui/react-icons';
import { useEffect, useState } from 'react';
import { CallReadinessHelper } from './CallReadinessHelper';

export const LocalPreview = (props: {
  callReadinessHelper: CallReadinessHelper,
  cameraOn: boolean,
  microphoneOn: boolean,
  cameraToggled: (isCameraOn: boolean) => void,
  microphoneToggled: (isMicrophoneOn: boolean) => void
}): JSX.Element => {
  const { callReadinessHelper, cameraOn, microphoneOn, cameraToggled, microphoneToggled } = props;
  const canTurnOnCamera = callReadinessHelper.getCameras().length > 0;

  const [localPreviewView, setLocalPreviewView] = useState<VideoStreamRendererViewState | undefined>();
  useEffect(() => {
    const changeCameraSource = async (newSource: VideoDeviceInfo | undefined): Promise<void> => {
      if (newSource) {
        callReadinessHelper.stopAllLocalPreviews();
        const newLocalPreview = await callReadinessHelper.startLocalPreview();
        setLocalPreviewView(newLocalPreview);
      }
    }

    const startVideo = async () => {
      const localPreviewResult = await callReadinessHelper.startLocalPreview();
      setLocalPreviewView(localPreviewResult);
      callReadinessHelper.onCameraSelectionChanged(changeCameraSource);
    }
    const stopVideo = () => {
      callReadinessHelper.offCameraSelectionChanged(changeCameraSource);
      callReadinessHelper.stopAllLocalPreviews();
      setLocalPreviewView(undefined);
    }
    
    if (!localPreviewView && cameraOn && canTurnOnCamera) {
      startVideo();
    } else if (!cameraOn) {
      stopVideo();
    }
  }, [canTurnOnCamera, cameraOn, localPreviewView, callReadinessHelper]);

  const theme = useTheme();
  const shouldShowLocalVideo = canTurnOnCamera && cameraOn && localPreviewView;
  return (
    <Stack verticalFill verticalAlign="center">
      <Stack className={localPreviewContainerMergedStyles(theme)}>
        <VideoTile
          renderElement={shouldShowLocalVideo ? <StreamMedia videoStreamElement={localPreviewView.target} /> : undefined}
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

const CameraOffPlaceholder = (): JSX.Element => {
  const theme = useTheme();
  return (
    <Stack style={{ width: '100%', height: '100%' }} verticalAlign="center">
      <Stack.Item align="center">
        <VideoOff20Filled primaryFill="currentColor" />
      </Stack.Item>
      <Stack.Item align="center">
        <Text className={cameraOffLabelMergedStyles(theme)}>Your camera is turned off</Text>
      </Stack.Item>
    </Stack>
  );
};

const localPreviewContainerMergedStyles = (theme: ITheme): string =>
  mergeStyles({
    minWidth: '25rem',
    maxHeight: '18.75rem',
    minHeight: '16.875rem',
    margin: '0 auto',
    background: theme.palette.neutralLighter,
    color: theme.palette.neutralTertiary
  });

const cameraOffLabelMergedStyles = (theme: ITheme): string =>
  mergeStyles({
    fontFamily: 'Segoe UI Regular',
    fontSize: '0.625rem', // 10px
    color: theme.palette.neutralTertiary
  });
