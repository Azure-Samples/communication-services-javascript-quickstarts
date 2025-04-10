import { CallState } from '../enum/callState'
import { callContext } from '../models/callContext';
import { callAutomationService } from './callAutomationService';

/**
 * Handles the logic and actions related to the booking service during a call.
 */
class BookingService {

    // Method to handle the various events sent by ACS
    async topLevelMenu(event) {
        const eventData = event.data

        if (event.type == "Microsoft.Communication.CallConnected") {
            console.log("Received CallConnected event");

            // Extract relevant data for the context of the call
            callContext.setCallState(CallState.CallInProgress);
            callContext.setCallConnectionId(eventData.callConnectionId);
            callContext.setServerCallId(eventData.serverCallId);
            callContext.setCallConnection(callContext.acsClient.getCallConnection(eventData.callConnectionId));

            // Start recording and play the welcome prompt
            await callAutomationService.startRecording()
            await callAutomationService.playAudio("PROMPT_PLAY_RECORDING_STARTED.wav");
        }
        else if (event.type == "Microsoft.Communication.ParticipantsUpdated") {
            console.log("Received ParticipantUpdated event");
        }
        else if (event.type == "Microsoft.Communication.PlayCompleted") {
            console.log("Received PlayCompleted event");

            // Based on the state of the call either hangup or start tone recognition
            if (callContext.callState == CallState.TerminateCall) {
                callAutomationService.hangUpCall()
            }
            else {
                await callAutomationService.startToneRecognition()
            }
        }
        else if (event.type == "Microsoft.Communication.RecognizeCompleted") {
            const tone = event.data.collectTonesResult.tones[0]
            console.log("Received RecognizeCompleted event, with following tone: " + tone);
            callContext.setCallState(CallState.TerminateCall);

            // Process and handle the received tone input
            switch (tone) {
                case "one":
                    await callAutomationService.playAudio("PROMPT_CHOICE1.wav")
                    break;
                case "two":
                    await callAutomationService.playAudio("PROMPT_CHOICE2.wav")
                    break;
                case "three":
                    await callAutomationService.playAudio("PROMPT_CHOICE3.wav")
                    break;
                default:
                    if (callContext.retryCounter == 3)
                        await callAutomationService.playAudio("PROMPT_GOODBYE.wav")
                    else {
                        callContext.setRetryCounter(callContext.retryCounter + 1);
                        callContext.setCallState(CallState.Retrying);
                        callAutomationService.startToneRecognition()
                    }
            }
        }
        else if (event.type == "Microsoft.Communication.CallDisconnected") {
            console.log("Received CallDisonnected event");
        }
        else {
            const eventType = event.type;
            console.log("Received Unexpected event: " + eventType + ". Terminating Call.");
            callAutomationService.hangUpCall();
        }
    }
}

export const bookingService = new BookingService();