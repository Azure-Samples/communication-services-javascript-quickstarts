import { CallAutomationClient } from "@azure/communication-call-automation";
import { callContext } from "../models/callContext";

class AcsClientService {

  client: CallAutomationClient
  
  constructor() {
    this.client = null;
  }

  // Method to create the ACS client and set it in the call context
  async createClient(connectionString: string) {
    this.client = new CallAutomationClient(connectionString);
    callContext.setAcsClient(this.client)
  }

  // Method to get the ACS client
  getClient() {
    return this.client;
  }
}

export const acsClientService = new AcsClientService();