import { CallAutomationClient, CallConnection } from "@azure/communication-call-automation"
import { CommunicationIdentifier } from "@azure/communication-common"
import { CallState } from "../enum/callState"

/**
 * Represents the context of a call, including call connection details, participant information, and call state.
 * Provides methods to set and retrieve various properties related to the call.
 */
class CallContext {

    callConnectionId: string
    recordingId: string
    serverCallId: string
    retryCounter: number
    callConnection: CallConnection
    targetParticipant: CommunicationIdentifier
    acsClient: CallAutomationClient 
    callState: CallState

    constructor() {
      // Initialize properties
      this.callConnectionId = '';
      this.recordingId = '';
      this.serverCallId = '';
      this.retryCounter = 0;
      this.callConnection = null;
      this.targetParticipant = null;
      this.acsClient = null;
      this.callState = null;
    }

    // Setter methods for individual properties
  
    setCallConnectionId(callConnectionId: string) {
      this.callConnectionId = callConnectionId;
    }
  
    setRecordingId(recordingId: string) {
      this.recordingId = recordingId;
    }
  
    setServerCallId(serverCallId: string) {
        this.serverCallId = serverCallId;
    }

    setRetryCounter(retryCounter: number) {
        this.retryCounter = retryCounter;
    }

    setCallConnection(callConnection: CallConnection) {
      this.callConnection = callConnection;
    }
  
    setTargetParticipant(targetParticipant: CommunicationIdentifier) {
      this.targetParticipant = targetParticipant;
    }
  
    setAcsClient(acsClient: CallAutomationClient) {
      this.acsClient = acsClient;
    }
  
    setCallState(callState: CallState) {
      this.callState = callState;
    }

    cleanup() {
        // Reset properties to initial values
        this.callConnectionId = '';
        this.recordingId = '';
        this.serverCallId = '';
        this.retryCounter = 0;
        this.callConnection = null;
        this.targetParticipant = null;
        this.acsClient = null;
        this.callState = null;
    }
  }
  
// Create a single instance of CallContext to be shared across modules
export const callContext = new CallContext();
  
