import config from "../appsettings.json";
import { EventGridDeserializer, SubscriptionValidationEventData } from "@azure/eventgrid";
import { Router } from "express";
import { report } from "../incomingCallHandler";

const incomingCallRoute = "/OnIncomingCall";
const router = Router();
const { deserializeEventGridEvents } = new EventGridDeserializer();

router.post(incomingCallRoute, async (req, res) => {
    try {
        const events = await deserializeEventGridEvents(req.body[0]);

        for (const { eventType, data } of events) {
            console.log(`Incoming call event: ${eventType}`);
            console.log(`incoming call data: ${JSON.stringify(data)}`);

            if (eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
                const validationEventData = data as SubscriptionValidationEventData;

                if (!validationEventData?.validationCode) {
                    throw new Error("Unable to validate Event Grid subscription");
                }

                return res.status(200).send({ validationResponse: validationEventData.validationCode });
            }

            if (eventType === "Microsoft.Communication.IncomingCall") {
                const { incomingCallContext, to } = data as any;

                if (config.allowedRecipientList.includes(to?.communicationUser?.id)) {
                    report(incomingCallContext);
                }
            }
        }

        return res.sendStatus(200);
    } catch (e) {
        return res.status(500).send(e);
    }
});

export {
    router as incomingCallHandler,
    incomingCallRoute
};
