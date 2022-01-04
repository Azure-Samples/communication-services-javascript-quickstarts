import config from "../appsettings.json";
import { callingServerCallbackRoute } from "../controllers/callingServerCallbackController";
import { getSecretQueryString } from "../eventHandlers/eventAuthHandler";

export const getCallbackUrl = () => `${config.appCallbackBaseUri}${callingServerCallbackRoute}?${getSecretQueryString()}`;
