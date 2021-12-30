import { Request, Response } from "express";

const incomingCallRoute = "/OnIncomingCall";

function incomingCallHandler(req: Request, res: Response) {
    return res.send("hello world");
}

export { incomingCallHandler, incomingCallRoute };
