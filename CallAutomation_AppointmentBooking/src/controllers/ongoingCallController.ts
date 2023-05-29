import express from 'express';
import { bookingService } from '../services/bookingService';

const ongoingCallController = express.Router();

// Define the POST route to handle OngoingCall events
ongoingCallController.post("/ongoingcall", async (req, res) => {
    res.sendStatus(200);
    var event = req.body[0];
    bookingService.topLevelMenu(event);
});

export { ongoingCallController };