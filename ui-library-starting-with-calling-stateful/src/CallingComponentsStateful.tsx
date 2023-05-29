import { usePropsFor, VideoGallery, ControlBar, CameraButton, MicrophoneButton, ScreenShareButton, EndCallButton, useCall, VideoStreamOptions } from '@azure/communication-react';
import { mergeStyles, Stack } from '@fluentui/react';

function CallingComponents(): JSX.Element {

  const videoGalleryProps = usePropsFor(VideoGallery);
  const cameraProps = usePropsFor(CameraButton);
  const microphoneProps = usePropsFor(MicrophoneButton);
  const screenShareProps = usePropsFor(ScreenShareButton);
  const endCallProps = usePropsFor(EndCallButton);

  const call = useCall();

  // Only enable buttons when the call has connected.
  // For more advanced handling of pre-call configuration, see our other samples such as [Call Readiness](../../ui-library-call-readiness/README.md)
  const buttonsDisabled = !(call?.state === 'InLobby' || call?.state === 'Connected');

  if (call?.state === 'Disconnected') {
    return <CallEnded />;
  }

  return (
    <Stack className={mergeStyles({ height: '100%' })}>
      <div style={{ width: '100vw', height: '100vh' }}>
        {videoGalleryProps && <VideoGallery {...videoGalleryProps} localVideoViewOptions={localViewVideoOptions} />}
      </div>

      <ControlBar layout='floatingBottom'>
        {cameraProps && <CameraButton {...cameraProps} disabled={buttonsDisabled ?? cameraProps.disabled} />}
        {microphoneProps && <MicrophoneButton   {...microphoneProps} disabled={buttonsDisabled ?? microphoneProps.disabled} />}
        {screenShareProps && <ScreenShareButton  {...screenShareProps} disabled={buttonsDisabled} />}
        {endCallProps && <EndCallButton {...endCallProps} disabled={buttonsDisabled} />}
      </ControlBar>
    </Stack>
  );
}

const localViewVideoOptions: VideoStreamOptions = {
  isMirrored: true,
  scalingMode: 'Fit'
};

function CallEnded(): JSX.Element {
  return <h1>You ended the call.</h1>;
}

export default CallingComponents;