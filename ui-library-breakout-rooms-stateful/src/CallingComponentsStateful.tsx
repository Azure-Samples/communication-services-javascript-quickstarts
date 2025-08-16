import { Features } from "@azure/communication-calling";
import {
  CameraButton,
  ControlBar,
  EndCallButton,
  MicrophoneButton,
  NotificationStack,
  ScreenShareButton,
  useCall,
  usePropsFor,
  VideoGallery,
  VideoStreamOptions,
} from "@azure/communication-react";
import { IStackStyles, PrimaryButton, Stack } from "@fluentui/react";

export type CallingComponentsProps = {
  returnToMainMeeting?: () => Promise<void>;
};

export const CallingComponents = (
  props: CallingComponentsProps
): JSX.Element => {
  const videoGalleryProps = usePropsFor(VideoGallery);
  const cameraProps = usePropsFor(CameraButton);
  const microphoneProps = usePropsFor(MicrophoneButton);
  const screenShareProps = usePropsFor(ScreenShareButton);
  const endCallProps = usePropsFor(EndCallButton);
  const notificationProps = usePropsFor(NotificationStack);

  const call = useCall();

  // Only enable buttons when the call has connected.
  // For more advanced handling of pre-call configuration, see our other samples such as [Call Readiness](../../ui-library-call-readiness/README.md)
  const buttonsDisabled = !(
    call?.state === "InLobby" || call?.state === "Connected"
  );

  if (call?.state === "Disconnected") {
    return <CallEnded />;
  }

  let breakoutRoomMenuProps = undefined;
  // Breakout room menu items are shown only if the breakout room settings allow returning to the main meeting
  if (
    props.returnToMainMeeting &&
    call?.feature(Features.BreakoutRooms).breakoutRoomsSettings
      ?.disableReturnToMainMeeting === false
  ) {
    breakoutRoomMenuProps = {
      items: [
        {
          key: "leaveRoom",
          text: "Leave room",
          title: "Leave room",
          onClick: () => {
            call.hangUp();
            props.returnToMainMeeting?.();
          },
        },
        {
          key: "leaveMeeting",
          text: "Leave meeting",
          title: "Leave meeting",
          onClick: () => endCallProps.onHangUp(),
        },
      ],
    };
  }
  const assignedBreakoutRoom = call?.feature(
    Features.BreakoutRooms
  ).assignedBreakoutRooms;

  return (
    <Stack style={{ height: "100%" }}>
      {videoGalleryProps && (
        <Stack verticalAlign="center" style={{ height: "100%" }}>
          <Stack styles={NotificationStackContainerStyles}>
            <NotificationStack {...notificationProps} />
          </Stack>
          <VideoGallery
            {...videoGalleryProps}
            styles={VideoGalleryStyles}
            localVideoViewOptions={localViewVideoOptions}
          />
          <Stack>
            <ControlBar layout="floatingBottom">
              {assignedBreakoutRoom?.state === "open" &&
                assignedBreakoutRoom.call && (
                  <PrimaryButton
                    text="Join breakout room"
                    onClick={() => assignedBreakoutRoom.join()}
                    style={{ height: "3.5rem" }}
                  />
                )}
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
                  menuProps={breakoutRoomMenuProps}
                />
              )}
            </ControlBar>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

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

const NotificationStackContainerStyles: IStackStyles = {
  root: {
    zIndex: 1,
    position: "absolute",
    top: "2rem",
    left: "50%",
    transform: "translate(-50%, 0)",
  },
};

export default CallingComponents;
