import { CallLocator, StartRecordingOptions, FileSource, CallMediaRecognizeDtmfOptions } from '@azure/communication-call-automation';
import { CallState } from '../enum/callState'
import { callContext } from '../models/callContext';

/**
 * This service interacts with the Azure Communication
 * Call Automation SDK to execute call actions and manage the call flow.
 */
class CallAutomationService {

  // Method to start call recording
  async startRecording() {
    try {
      const callLocator: CallLocator = {
        id: callContext.serverCallId,
        kind: 'serverCallLocator',
      };

      const recordingOptions: StartRecordingOptions = {
        callLocator: callLocator,
      };

      const response = await callContext.acsClient.getCallRecording().start(recordingOptions);
      callContext.recordingId = response.recordingId;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Method to play audio prompt
  async playAudio(prompt: string) {
    try {
      const audioPrompt: FileSource = {
          url: process.env.MEDIA_CALLBACK_URI + prompt,
          kind: 'fileSource'
      };

      if (callContext.callState !== CallState.TerminateCall) {
        callContext.callState = CallState.CallInProgress;
      }

      await callContext.callConnection.getCallMedia().playToAll(audioPrompt);
    } catch (error) {
      console.error('An error occurred while playing audio prompt:', error);
    }
  }

  // Method to start tone recognition
  async startToneRecognition() {
    try {
      const audioPrompt: FileSource = {
          url: callContext.callState !== CallState.Retrying
              ? process.env.MEDIA_CALLBACK_URI + 'PROMPT_MAIN_MENU.wav'
              : process.env.MEDIA_CALLBACK_URI + 'PROMPT_RETRY.wav',
          kind: 'fileSource'
      };

      const recognizeOptions: CallMediaRecognizeDtmfOptions = {
          playPrompt: audioPrompt,
          kind: 'callMediaRecognizeDtmfOptions'
      };

      callContext.callState = CallState.CallInProgress;

      await callContext.callConnection.getCallMedia().startRecognizing(callContext.targetParticipant, 1, recognizeOptions);
    } catch (error) {
      console.error('Error starting tone recognition:', error);
      throw error;
    }
  }

  // Method to hang up the call
  async hangUpCall() {
    await callContext.acsClient.getCallRecording().stop(callContext.recordingId);
    callContext.callConnection.hangUp(true);
    callContext.cleanup();
  }
}

export const callAutomationService = new CallAutomationService();
