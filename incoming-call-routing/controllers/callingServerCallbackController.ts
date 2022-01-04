import { EventGridDeserializer } from "@azure/eventgrid";
import { Router } from "express";
import { authorize } from "../eventHandlers/eventAuthHandler";

const callingServerCallbackRoute = "/CallingServerAPICallbacks";
const router = Router();
const deserializer = new EventGridDeserializer();

router.post(callingServerCallbackRoute, async (req, res) => {
    try {
        const secret = req.query["secret"]?.toString();

        if (authorize(secret)) {
            const events = await deserializer.deserializeCloudEvents(req.body[0]);

            for (const { type: eventType, data } of events) {
                console.log(eventType);
                console.log(data);
            }

            return res.sendStatus(200);
        } else {
            return res.sendStatus(401);
        }
    } catch (e) {
        return res.status(500).send(e);
    }
});

export {
    router as callingServerCallbackHandler,
    callingServerCallbackRoute
};
