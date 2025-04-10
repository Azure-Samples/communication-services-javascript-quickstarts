import express from 'express';
import { config } from 'dotenv';
import { incomingCallController } from './controllers/incomingCallController';
import { ongoingCallController } from './controllers/ongoingCallController';
import { mediaController } from './controllers/mediaController';
import { CallState } from './enum/callState'
import { callContext } from './models/callContext';

// Create Express server
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
config();

// Available routes
app.post('/incomingcall', incomingCallController);
app.post('/ongoingcall', ongoingCallController)
app.get('/audioprompt/:filename', mediaController)

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  callContext.setCallState(CallState.Idle)
});