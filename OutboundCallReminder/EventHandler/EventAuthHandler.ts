import { Logger, MessageType } from "../Logger";
var configuration = require("../config");

export class EventAuthHandler {
  private secretValue: string;
  public static eventAuthHandler: EventAuthHandler = null;

  constructor() {
    this.secretValue = configuration.SecretPlaceholder;

    if (this.secretValue == null) {
      Logger.logMessage(MessageType.INFORMATION, "SecretPlaceholder is null");
      this.secretValue = "h3llowW0rld";
    }
  }

  public static getInstance(): EventAuthHandler {
    if (this.eventAuthHandler == null) {
      this.eventAuthHandler = new EventAuthHandler();
    }
    return this.eventAuthHandler;
  }

  public authorize(requestSecretValue: string): Boolean {
    return requestSecretValue != null && requestSecretValue == this.secretValue;
  }

  public getSecretQuerystring(): string {
    var secretKey: string = "secret";
    return secretKey + "=" + this.secretValue;
  }
}
