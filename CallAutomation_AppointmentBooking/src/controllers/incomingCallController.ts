import express from 'express';
import { callContext } from '../models/callContext';
import { acsClientService } from '../services/acsClientService';

// Create a new router instance
const incomingCallController = express.Router();

// Define the POST route to handle IncomingCall events
incomingCallController.post("/incomingcall", async (req, res) => {
    try {
        const event = req.body[0];
        var eventData = event.data;

        // Handle subscription validation event
        if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
            console.log("Received SubscriptionValidation event");
            res.status(200).json({
                validationResponse: event.data.validationCode
            });
        }
        else {
            const targetParticipant = {
                rawId: eventData.from.rawId,
                phoneNumber: eventData.from.phoneNumber.value
            }

            // Set the target participant in the call context
            callContext.setTargetParticipant(targetParticipant);
            
            // Create the ACS client and answer the incoming call
            await acsClientService.createClient(process.env.CONNECTION_STRING);
            await callContext.acsClient.answerCall(eventData.incomingCallContext, process.env.CALLBACK_URI);

            res.sendStatus(200);
        }
    } catch (error) {
        console.error("Error handling incoming call:", error);
        res.sendStatus(500);
    }
});

// Export the router
export { incomingCallController };