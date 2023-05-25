# Welcome to an Azure Communication Services Click to Call Sample

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
type AppPages = 'click-to-call' | 'same-origin-call';

registerIcons({ icons: { dismiss: <Dismiss20Regular />, callAdd: <CallAdd20Regular /> } });
initializeIcons();
function App() {

  const [page, setPage] = useState<AppPages>('click-to-call');

  /**
   * Token for local user.
   */
  const token = 'Enter your Azure Communication Services token here';
  
  /**
   * User identifier for local user.
   */
  const userId: CommunicationIdentifier = { communicationUserId: '<Enter your user Id>'};
  
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
  const locator: CallAdapterLocator = {participantIds: ['<Enter a Participants Id here>']};

  /**
   * Phone number needed from your Azure Communications resource to start a PSTN call. Can be created under the phone numbers
   * tab of your resource.
   * 
   * For more information on phone numbers and Azure Communications go to this link: https://learn.microsoft.com/en-us/azure/communication-services/concepts/telephony/plan-solution
   * 
   * This can be left alone if not making a PSTN call.
   */
  const alternateCallerId = '<Enter your alternate CallerId here>';

  switch (page) {
    case 'click-to-call': {
      if (!token || !userId || !locator || startSession === undefined) {
        return (
          <Stack style={{height: '100%', width: '100%'}}>
            <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
          </Stack>
        )
        
      }
    }
    case 'same-origin-call': {
      if (!adapterArgs) {
        return (
          <Stack style={{ height: '100%', width: '100%' }}>
            <Spinner label={'Getting user credentials from server'} ariaLive="assertive" labelPosition="top" />;
          </Stack>
        )
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