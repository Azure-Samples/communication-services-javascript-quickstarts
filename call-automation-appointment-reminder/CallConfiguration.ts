export class CallConfiguration {
  TimedoutAudio: "";
  public connectionString: string;
  public sourcePhoneNumber: string;
  public targetIdentifier: string;
  public appBaseUri: string;
  public eventCallBackRoute: string;
  public appointmentReminderMenuAudio: string;
  public appointmentConfirmedAudio: string;
  public appointmentCancelledAudio: string;
  public invalidInputAudio: string;
  public timedoutAudio: string;
  public appCallbackUrl: string;
  public audioFileUrl: string;
  // public audioFileName: string;

  constructor(
    connectionString: string,
    sourcePhoneNumber: string,
    targetIdentifier: string,
    appBaseUri: string,
    eventCallBackRoute: string,
    appointmentReminderMenuAudio: string,
    appointmentConfirmedAudio: string,
    appointmentCancelledAudio: string,
    invalidInputAudio: string,
    timedoutAudio: string,
  ) {
    this.connectionString= connectionString;
    this.sourcePhoneNumber= sourcePhoneNumber;
    this.targetIdentifier= targetIdentifier
    this.appBaseUri= appBaseUri,
    this.eventCallBackRoute= eventCallBackRoute,
    this.appointmentReminderMenuAudio= appointmentReminderMenuAudio,
    this.appointmentConfirmedAudio= appointmentConfirmedAudio,
    this.appointmentCancelledAudio= appointmentCancelledAudio,
    this.invalidInputAudio= invalidInputAudio,
    this.timedoutAudio= timedoutAudio,
    this.appCallbackUrl =appBaseUri +eventCallBackRoute;
    this.audioFileUrl = appBaseUri + "/audio?filename=" + appointmentReminderMenuAudio;
  }
}
