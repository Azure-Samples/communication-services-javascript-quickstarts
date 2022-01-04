import { CallingServerClient } from "@azure/communication-calling-server";
import config from "../appsettings.json";

export const getCallingServerClient = () => new CallingServerClient(config.resourceConnectionString);
