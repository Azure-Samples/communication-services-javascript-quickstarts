import axios from 'axios';
export const acsOpenAiPromptsApi = {
    base: 'https://fhlopenaicalling.azurewebsites.net/api/',
    summary: 'getSummary',
    feedback: 'getPersonalFeedback',
    sentiment: 'GetSentiments',
    supportAgent: 'getSuggestionForSupportAgent',
    callInsights: 'CallInsights',
    getBriefSummary: 'GetBriefSummary'
}

export const utils = {
    sendCaptionsDataToAcsOpenAI: async (apiEndpoint, participantName, lastResponse, newCaptionsData, isTranscriptType = false, callId ="") => {
        let response = await axios({
            url: acsOpenAiPromptsApi.base + apiEndpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': "*",
                'X-Requested-With': 'XMLHttpRequest',
            },
            data: (isTranscriptType || apiEndpoint === acsOpenAiPromptsApi.callInsights) ?
                {
                    "transcript": newCaptionsData.join(' '),
                    "callId": callId
                } :
                {
                    "CurrentParticipant": participantName,
                    "Captions": JSON.stringify(newCaptionsData),
                    "LastSummary": JSON.stringify(lastResponse),
                }
        });
        if (response.status === 200) {
            return response.data;
        } else {
            console.log("Error message");
            console.log(response);
        }
    }
};
