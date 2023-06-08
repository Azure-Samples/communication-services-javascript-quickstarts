//Caution: Logging should be removed/disabled if you want to use this sample in production to avoid exposing sensitive information
export enum MessageType {
  INFORMATION = "Information",
  ERROR = "Error",
}

export class Logger {
  /// <summary>
  /// Log message to console
  /// </summary>
  /// <param name="messageType">Type of the message: Information or Error</param>
  /// <param name="message">Message string</param>
  public static logMessage(messageType: MessageType, message: string) {
    var logMessage = "";
    logMessage = messageType + " : " + message;
    console.log(logMessage);
  }
}
