import { NgrokService } from "./Ngrok/NgrokService";
import { CallConfiguration } from "./CallConfiguration";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { Logger, MessageType } from "./Logger";
import { CommunicationUserIdentifier } from "@azure/communication-common";
import { OutboundCallReminder } from "./OutboundCallreminder";
var configuration = require("./config");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const fs = require("fs");

export class Program {
  url = "http://localhost:9007";
  static ngrokService: NgrokService;
  serverPort = "9007";
  private static instance = null;

  static getInstance(): Program {
    if (this.instance == null) {
      this.instance = new Program();
    }
    return this.instance;
  }

  async main() {
    Logger.logMessage(MessageType.INFORMATION, "Starting ACS Sample App");
    // Start Ngrok service
    const ngrokUrl = await Program.startNgrokService();

    try {
      if (ngrokUrl) {
        Logger.logMessage(
          MessageType.INFORMATION,
          "Server started at:" + this.url
        );
        await this.runSample(ngrokUrl);
      } else {
        Logger.logMessage(MessageType.ERROR, "Failed to start Ngrok service");
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to start Ngrok service : " + ex.message
      );
    }
    Logger.logMessage(
      MessageType.INFORMATION,
      "Press 'Ctrl + C' to exit the sample"
    );
  }

  async runSample(ngrokUrl: string) {
    var appBaseUrl: string = ngrokUrl;
    var callConfiguration: CallConfiguration = await this.initiateConfiguration(
      appBaseUrl
    );
    var outboundCallPairs: string = configuration.DestinationIdentities;

    try {
      if (outboundCallPairs != null && outboundCallPairs) {
        var identities: string[] = outboundCallPairs.split(";");
        var tasks = new Array(identities.length);

        for (var i = 0; i < identities.length; i++) {
          var pair: string[] = identities[i].split(",");
          if (pair[0] && pair[1]) {
            tasks[i] = new Promise((resolve) =>
              new OutboundCallReminder(callConfiguration).report(
                pair[0].trim(),
                pair[1].trim()
              )
            );
          } else {
            Logger.logMessage(
              MessageType.ERROR,
              "Failed to initiate the outbound call, identities are not in correct format"
            );
          }
        }
        const results = await Promise.all(tasks);
      }
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Failed to initiate the outbound call Exception -- > " + ex.getMessage()
      );
    }
    await this.deleteUser(
      callConfiguration.connectionString,
      callConfiguration.sourceIdentity
    );
  }

  private static async startNgrokService() {
    try {
      var ngrokPath = configuration.NgrokExePath;

      if (!ngrokPath) {
        console.log("Ngrok path not provided");
        return null;
      }

      console.log("Starting Ngrok");
      this.ngrokService = new NgrokService();
      await this.ngrokService.ensureNgrokNotRunning(ngrokPath);
      console.log("Fetching Ngrok Url");
      const ngrokUrl = await this.ngrokService.getNgrokUrl();
      console.log("Ngrok Started with url: " + ngrokUrl);
      return ngrokUrl;
    } catch (ex) {
      console.log("Ngrok service got failed : " + ex.message);
      return null;
    }
  }

  /// <summary>
  /// Get .wav Audio file
  /// </summary>
  async generateCustomAudioMessage(): Promise<string> {
    var key: string = configuration.CognitiveServiceKey;
    var region: string = configuration.CognitiveServiceRegion;
    var customMessage: string = configuration.CustomMessage;

    try {
      if (
        key != null &&
        !key &&
        region != null &&
        !region &&
        customMessage != null &&
        !customMessage
      ) {
        const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);

        let pushStream = sdk.AudioInputStream.createPushStream();

        fs.createReadStream("./audio/custom-message.wav")
          .on("data", function (customMessage) {
            pushStream.write(customMessage);
          })
          .on("end", function () {
            pushStream.close();
          });

        let audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        let recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync((result) => {
          console.log(`RECOGNIZED: Text=${result.text}`);
          recognizer.close();
        });
        return "custom-message.wav";
      }
      return "sample-message.wav";
    } catch (ex) {
      Logger.logMessage(
        MessageType.ERROR,
        "Exception while generating text to speech, falling back to sample audio. Exception -- > " +
          ex.message
      );
      return "sample-message.wav";
    }
  }

  /// <summary>
  /// Fetch configurations from App Settings and create source identity
  /// </summary>
  /// <param name="appBaseUrl">The base url of the app.</param>
  /// <returns>The <c CallConfiguration object.</returns>
  async initiateConfiguration(appBaseUrl) {
    var connectionString = configuration.Connectionstring;
    var sourcePhoneNumber = configuration.SourcePhone;
    var sourceIdentity = await this.createUser(connectionString);
    var audioFileName = await this.generateCustomAudioMessage();
    return new CallConfiguration(
      connectionString,
      sourceIdentity,
      sourcePhoneNumber,
      appBaseUrl,
      audioFileName
    );
  }

  /// <summary>
  /// Create new user
  /// </summary>
  async createUser(connectionString) {
    const client = new CommunicationIdentityClient(connectionString);
    const user = await client.createUser();
    return user.communicationUserId;
  }

  /// <summary>
  /// Delete the user
  /// </summary>
  async deleteUser(connectionString: string, source: string) {
    const client = new CommunicationIdentityClient(connectionString);
    var user: CommunicationUserIdentifier = { communicationUserId: source };
    client.deleteUser(user);
  }
}
