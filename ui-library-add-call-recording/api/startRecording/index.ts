import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const callId = req.body?.callId;
    context.log(`Processing startRecording(${callId})`);
    if (!callId) {
        context.res = {
            // Bad request
            status: 400,
            body: 'callId is required'
        }
        return;
    }

    context.res = {
        status: 200,
        body: `Would have started recording for ${callId}`
    };
};

export default httpTrigger;