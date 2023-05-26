# Welcome to an Azure Communication Services Click to Call Sample

![image.png](./tutorialImages/Sample-app-splash.png)

This project is aimed to teach developers on how to create a Click to Call experience using the Azure Communication UI Library.

Depending on your needs, you might need to create an experience for your customers to be able to get a hold of you with minimal setup on their part.
Click to call is a concept that is meant for allowing instant interaction with your support team. Whether that is reaching out to customer support, a quick call
with your financial advisor. The goal of this tutorial is to help you make you one click away from your customers.

If you want to just try it out follow the instructions that follow. If you are interested in information on how to build it into your application continue to the
Tutorial section below

## Get started

In the project directory, run:

### `npm install`

## Run the application

In the project directory, run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Tutorial

Following this tutorial will:

- Allow you to control your customers Audio and video experience depending on your customer scenario
- Move your customers call into a new window so they can continue browsing while on the call

This tutorial will be broken down into 3 parts:

- Creating your widget
- Embed your calling experience
- using post messaging to start a calling experience in a new window

### Setup the project

If you are not creating a new application you can skip this step.

To setup the react App, we will use the create-react-app template. This `create-react-app` command
creates an easy to run Typescript application powered by React. This command will also install the
Azure Communication Services packages that we need to run the sample as well.

```bash
# Create an Azure Communication Services App powered by React.
npx create-react-app ui-library-click-to-call-app --template communication-react

# Change to the directory of the newly created App.
cd ui-library-click-to-call-app
```

Once you have run these commands you will be in your new project ready to get started. For this tutorial we will be modifying the files in the
`src` directory.

### Initial App Setup

To get us started we will replace the provided `app.tsx` content with a main page that will:

- Store all of the Azure Communication information that we need to create a CallAdapter to power our Calling experience
- Control the different pages of our application
- Register the different fluent icons we use in the UI library as well as for our purposes

`src/App.tsx`

```typescript
type AppPages = "click-to-call" | "same-origin-call";

registerIcons({
  icons: { dismiss: <Dismiss20Regular />, callAdd: <CallAdd20Regular /> },
});
initializeIcons();
function App() {
  const [page, setPage] = useState<AppPages>("click-to-call");

  /**
   * Token for local user.
   */
  const token = "Enter your Azure Communication Services token here";

  /**
   * User identifier for local user.
   */
  const userId: CommunicationIdentifier = {
    communicationUserId: "<Enter your user Id>",
  };

  /**
   * This decides where the call will be going. This supports many different calling modalities in the Call Composite.
   *
   * - teams meeting locator: {meetingLike: 'url to join link for a meeting'}
   * - Azure communications group call: {groupId: 'GUID that defines the call'}
   * - Azure Communications Rooms call: {roomId: 'guid that represents a rooms call'}
   * - teams adhoc, Azure communications 1:n, PSTN calls all take a participants locator: {participantIds: ['Array of participant id's to call']}
   *
   * You can call teams voice apps like a Call queue with the participants locator.
   */
  const locator: CallAdapterLocator = {
    participantIds: ["<Enter a Participants Id here>"],
  };

  /**
   * Phone number needed from your Azure Communications resource to start a PSTN call. Can be created under the phone numbers
   * tab of your resource.
   *
   * For more information on phone numbers and Azure Communications go to this link: https://learn.microsoft.com/en-us/azure/communication-services/concepts/telephony/plan-solution
   *
   * This can be left alone if not making a PSTN call.
   */
  const alternateCallerId = "<Enter your alternate CallerId here>";

  switch (page) {
    case "click-to-call": {
      if (!token || !userId || !locator || startSession === undefined) {
        return (
          <Stack style={{ height: "100%", width: "100%" }}>
            <Spinner
              label={"Getting user credentials from server"}
              ariaLive="assertive"
              labelPosition="top"
            />
            ;
          </Stack>
        );
      }
    }
    case "same-origin-call": {
      if (!adapterArgs) {
        return (
          <Stack style={{ height: "100%", width: "100%" }}>
            <Spinner
              label={"Getting user credentials from server"}
              ariaLive="assertive"
              labelPosition="top"
            />
            ;
          </Stack>
        );
      }
    }
  }
}

export default App;
```

### Running the App

We can then test to see that this is working by running:

```bash
# run the React app
npm run start
```

once the app is running you can see it on `http://localhost:3000` in your browser. You should see a little spinner saying: `getting credentials from server` as
a test message.

## Part 1 Creating Your Widget

To get started we are going to make a new component. This component is the widget that you will use to start your calling experience.

First we are going to make a new directory `src/components` and in this directory we are going to make a new file called `ClickToCallComponent.tsx`. For the
purpose of this tutorial we will give this component the following properties:

`ClickToCallComponent.tsx`

```typescript
export interface clickToCallComponentProps {
  /**
   * if provided, will be used to create a new window for call experience. if not provided
   * will use the current window.
   */
  onRenderStartCall: () => void;
  /**
   * Custom render function for displaying logo.
   * @returns
   */
  onRenderLogo?: () => JSX.Element;
  /**
   * Handler to set displayName for the user in the call.
   * @param displayName
   * @returns
   */
  onSetDisplayName?: (displayName: string | undefined) => void;
  /**
   * Handler to set whether to use video in the call.
   */
  onSetUseVideo?: (useVideo: boolean) => void;
}
```

Each of these callbacks will control different behaviors for the calling experience.

- `onRenderStartCall` - This callback will used to trigger any handlers in your app to do things like create a new window for your calling experience.
- `onRenderLogo` - This will be used as a rendering callback to have a custom logo or image render inside the widget when getting user information.
- `onSetDisplayName` - We will use this callback to set the `displayName` of the participant when they are calling your support center.
- `onSetUseVideo` - Finally, this callback will be used to control for our tutorial whether the user will have camera and screen sharing controls (more on that later).

Next we will set up the widget component:

`ClickToCallComponent.tsx`

```typescript
/**
 * Widget for Click to Call
 * @param props
 */
export const ClickToCallComponent = (
  props: clickToCallComponentProps
): JSX.Element => {
  const { onRenderStartCall, onRenderLogo, onSetDisplayName, onSetUseVideo } =
    props;

  const [widgetState, setWidgetState] = useState<"new" | "setup">();
  const [displayName, setDisplayName] = useState<string>();
  const [consentToData, setConsentToData] = useState<boolean>(false);

  const theme = useTheme();

  useEffect(() => {
    if (widgetState === "new" && onSetUseVideo) {
      onSetUseVideo(false);
    }
  }, [widgetState, onSetUseVideo]);

  /** widget template for when open, put any fields here for user information desired */
  if (widgetState === "setup" && onSetDisplayName && onSetUseVideo) {
    return (
      <Stack
        styles={clicktoCallSetupContainerStyles(theme)}
        tokens={{ childrenGap: "1rem" }}
      >
        <IconButton
          styles={collapseButtonStyles}
          iconProps={{ iconName: "Dismiss" }}
          onClick={() => setWidgetState("new")}
        />
        <Stack tokens={{ childrenGap: "1rem" }} styles={logoContainerStyles}>
          <Stack style={{ transform: "scale(1.8)" }}>
            {onRenderLogo && onRenderLogo()}
          </Stack>
        </Stack>
        <TextField
          label={"Name"}
          required={true}
          placeholder={"Enter your name"}
          onChange={(_, newValue) => {
            setDisplayName(newValue);
          }}
        />
        <Checkbox
          styles={checkboxStyles(theme)}
          label={
            "Use video - Checking this box will enable camera controls and screen sharing"
          }
          onChange={(_, checked?: boolean | undefined) => {
            onSetUseVideo(!!checked);
          }}
        ></Checkbox>
        <Checkbox
          required={true}
          styles={checkboxStyles(theme)}
          label={
            "By checking this box you are consenting that we will collect data from the call for customer support reasons"
          }
          onChange={(_, checked?: boolean | undefined) => {
            setConsentToData(!!checked);
          }}
        ></Checkbox>
        <PrimaryButton
          styles={startCallButtonStyles(theme)}
          onClick={() => {
            if (displayName && consentToData) {
              onSetDisplayName(displayName);
              onRenderStartCall();
            }
          }}
        >
          StartCall
        </PrimaryButton>
      </Stack>
    );
  }

  /** default waiting state for the widget */
  return (
    <Stack
      horizontalAlign="center"
      verticalAlign="center"
      styles={clickToCallContainerStyles(theme)}
      onClick={() => {
        setWidgetState("setup");
      }}
    >
      <Stack
        horizontalAlign="center"
        verticalAlign="center"
        style={{
          height: "4rem",
          width: "4rem",
          borderRadius: "50%",
          background: theme.palette.themePrimary,
        }}
      >
        <Icon iconName="callAdd" styles={callIconStyles(theme)} />
      </Stack>
    </Stack>
  );
};
```

### Time For Some Styles

Once you have your component you will need some styles to give it some looks. For this we will create a new folder `src/styles` here we will create a new file called `ClickToCallComponent.styles.ts` and we will add the following styles.

`ClickToCallComponent.styles.ts`

```typescript
export const checkboxStyles = (theme: Theme): ICheckboxStyles => {
  return {
    label: {
      color: theme.palette.neutralPrimary,
    },
  };
};

export const clickToCallContainerStyles = (theme: Theme): IStackStyles => {
  return {
    root: {
      width: "5rem",
      height: "5rem",
      padding: "0.5rem",
      boxShadow: theme.effects.elevation16,
      borderRadius: "50%",
      bottom: "1rem",
      right: "1rem",
      position: "absolute",
      overflow: "hidden",
      cursor: "pointer",
      ":hover": {
        boxShadow: theme.effects.elevation64,
      },
    },
  };
};

export const clicktoCallSetupContainerStyles = (theme: Theme): IStackStyles => {
  return {
    root: {
      width: "18rem",
      minHeight: "20rem",
      maxHeight: "25rem",
      padding: "0.5rem",
      boxShadow: theme.effects.elevation16,
      borderRadius: theme.effects.roundedCorner6,
      bottom: 0,
      right: "1rem",
      position: "absolute",
      overflow: "hidden",
      cursor: "pointer",
    },
  };
};

export const callIconStyles = (theme: Theme): IIconStyles => {
  return {
    root: {
      paddingTop: "0.2rem",
      color: theme.palette.white,
      transform: "scale(1.6)",
    },
  };
};

export const startCallButtonStyles = (theme: Theme): IButtonStyles => {
  return {
    root: {
      background: theme.palette.themePrimary,
      borderRadius: theme.effects.roundedCorner6,
      borderColor: theme.palette.themePrimary,
    },
    textContainer: {
      color: theme.palette.white,
    },
  };
};

export const logoContainerStyles: IStackStyles = {
  root: {
    margin: "auto",
    padding: "0.2rem",
    height: "5rem",
    width: "10rem",
    zIndex: 0,
  },
};

export const collapseButtonStyles: IButtonStyles = {
  root: {
    position: "absolute",
    top: "0.2rem",
    right: "0.2rem",
    zIndex: 1,
  },
};
```

These styles should be added to the widget as seen in the snippet above.

### Adding The Widget To The App

Now we will create a new folder `src/views` and add a new file for one of our pages `ClickToCallScreen.tsx`. This screen will act as our home page for the app where the user can start a new call.

We will want to add the following props to the page:

`ClickToCallScreen.tsx`

```typescript
export interface ClickToCallPageProps {
  token: string;
  userId:
    | CommunicationUserIdentifier
    | /* @conditional-compile-remove(teams-identity-support) */ MicrosoftTeamsUserIdentifier;
  callLocator: CallAdapterLocator;
  alternateCallerId?: string;
}
```

These properties will be fed by the state that we set in `App.tsx`. We will use these props to make post messages to the app when we want to start a call in a new window (More on this later).

Next lets add the page content:

`ClickToCallScreen.tsx`

```typescript
export const ClickToCallScreen = (props: ClickToCallPageProps): JSX.Element => {
  const { token, userId, callLocator, alternateCallerId } = props;

  const [userDisplayName, setUserDisplayName] = useState<string>();
  const [useVideo, setUseVideo] = useState<boolean>(false);
  // we also want to make this memoized version of the args for the new window.
  const adapterParams = useMemo(() => {
    const args = {
      userId: userId as CommunicationUserIdentifier,
      displayName: userDisplayName ?? "",
      token,
      locator: callLocator,
      alternateCallerId,
    };
    return args;
  }, [userId, userDisplayName, token, callLocator, alternateCallerId]);

  return (
    <Stack
      style={{ height: "100%", width: "100%", padding: "3rem" }}
      tokens={{ childrenGap: "1.5rem" }}
    >
      <Stack style={{ margin: "auto" }}>
        <Stack
          style={{ padding: "3rem" }}
          horizontal
          tokens={{ childrenGap: "2rem" }}
        >
          <Text style={{ marginTop: "auto" }} variant="xLarge">
            Welcome to a Click to Call sample
          </Text>
          <img
            style={{ width: "7rem", height: "auto" }}
            src={hero}
            alt="kcup logo"
          />
        </Stack>

        <Text>
          Welcome to a Click to Call sample for the Azure Communications UI
          Library. Sample has the ability to:
        </Text>
        <ul>
          <li>
            Adhoc call teams users with a tenant set that allows for external
            calls
          </li>
          <li>Joining Teams interop meetings as a Azure Communications user</li>
          <li>Make a click to call PSTN call to a help phone line</li>
          <li>Join a Azure Communications group call</li>
        </ul>
        <Text>
          As a user all you need to do is click the widget below, enter your
          display name for the call - this will act as your caller id, and
          action the <b>start call</b> button.
        </Text>
      </Stack>
      <Stack
        horizontal
        tokens={{ childrenGap: "1.5rem" }}
        style={{ overflow: "hidden", margin: "auto" }}
      >
        <ClickToCallComponent
          onRenderStartCall={startNewWindow}
          onRenderLogo={() => {
            return (
              <img
                style={{ height: "4rem", width: "4rem", margin: "auto" }}
                src={hero}
                alt="logo"
              />
            );
          }}
          onSetDisplayName={setUserDisplayName}
          onSetUseVideo={setUseVideo}
        />
      </Stack>
    </Stack>
  );
};
```
Once you have done this you should see this when the app is running:

![image.png](./tutorialImages/Sample-app-splash.png)

Then when you action the widget button you should see: 

![image.png](./tutorialImages/Sample-app-widget-open.png)

Next we will talk about what we need to add to make this experience start a call in a new window.
## Part 2 Creating a New Window Experience

## Part 3 (Optional) Embedding Your Calling Experience
