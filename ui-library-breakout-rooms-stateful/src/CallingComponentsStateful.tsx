import {
  CameraButton,
  ControlBar,
  EndCallButton,
  MicrophoneButton,
  ScreenShareButton,
  useCall,
  usePropsFor,
  VideoGallery,
  VideoStreamOptions,
} from "@azure/communication-react";
import { Stack } from "@fluentui/react";

function CallingComponents(): JSX.Element {
  const videoGalleryProps = usePropsFor(VideoGallery);
  const cameraProps = usePropsFor(CameraButton);
  const microphoneProps = usePropsFor(MicrophoneButton);
  const screenShareProps = usePropsFor(ScreenShareButton);
  const endCallProps = usePropsFor(EndCallButton);

  const call = useCall();

  // Only enable buttons when the call has connected.
  // For more advanced handling of pre-call configuration, see our other samples such as [Call Readiness](../../ui-library-call-readiness/README.md)
  const buttonsDisabled = !(
    call?.state === "InLobby" || call?.state === "Connected"
  );

  if (call?.state === "Disconnected") {
    return <CallEnded />;
  }

  return (
    <Stack style={{ height: "100%" }}>
      {videoGalleryProps && (
        <Stack verticalAlign="center" style={{ height: "100%" }}>
          <VideoGallery
            {...videoGalleryProps}
            styles={VideoGalleryStyles}
            localVideoViewOptions={localViewVideoOptions}
          />
          <Stack>
            <ControlBar layout="floatingBottom">
              {cameraProps && (
                <CameraButton
                  {...cameraProps}
                  disabled={buttonsDisabled ?? cameraProps.disabled}
                />
              )}
              {microphoneProps && (
                <MicrophoneButton
                  {...microphoneProps}
                  disabled={buttonsDisabled ?? microphoneProps.disabled}
                />
              )}
              {screenShareProps && (
                <ScreenShareButton
                  {...screenShareProps}
                  disabled={buttonsDisabled}
                />
              )}
              {endCallProps && (
                <EndCallButton
                  {...endCallProps}
                />
              )}
            </ControlBar>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

const localViewVideoOptions: VideoStreamOptions = {
  isMirrored: true,
  scalingMode: "Fit",
};

function CallEnded(): JSX.Element {
  return <h1>You ended the call.</h1>;
}

const VideoGalleryStyles = {
  root: {
    height: "100%",
    width: "100%",
    minHeight: "10rem",
    minWidth: "6rem",
  },
};

export default CallingComponents;
