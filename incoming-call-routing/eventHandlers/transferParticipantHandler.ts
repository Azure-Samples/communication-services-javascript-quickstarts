import config from "../appsettings.json";
import { getCallingServerClient } from "../clients/callingServerClient";

async function transferCall(callConnectionId: string) {
    const callConnection = getCallingServerClient().getCallConnection(callConnectionId);
    
    await callConnection.transferToParticipant({ communicationUserId: config.targetParticipant });
}

export { transferCall };
