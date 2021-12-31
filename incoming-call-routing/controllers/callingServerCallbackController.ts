import { Router } from "express";

const callingServerCallbackRoute = "/CallingServerAPICallbacks";
const router = Router();

router.post(callingServerCallbackRoute, (req, res) => {

});

export {
    router as callingServerCallbackHandler,
    callingServerCallbackRoute
};
