import { EventAuthHandler } from "./EventHandler/EventAuthHandler";

export class CallConfiguration {
  public connectionString: string;
  public sourceIdentity: string;
  public sourcePhoneNumber: string;
  public appBaseUrl: string;
  public audioFileName: string;
  public appCallbackUrl: string;
  public audioFileUrl: string;

  constructor(
    connectionString: string,
    sourceIdentity: string,
    sourcePhoneNumber: string,
    appBaseUrl: string,
    audioFileName: string
  ) {
    this.connectionString = connectionString;
    this.sourceIdentity = sourceIdentity;
    this.sourcePhoneNumber = sourcePhoneNumber;
    this.appBaseUrl = appBaseUrl;
    this.audioFileName = audioFileName;
    var eventhandler: EventAuthHandler = EventAuthHandler.getInstance();
    this.appCallbackUrl =
      appBaseUrl +
      "/api/outboundcall/callback?" +
      eventhandler.getSecretQuerystring();
    this.audioFileUrl = appBaseUrl + "/audio?filename=" + this.audioFileName;
  }
}
