var config = module.exports = { ConnectionString: '', SourcePhoneNumber: '', TargetIdentifier: '', AppBaseUri: '', EventCallBackRoute: '', AppointmentReminderMenuAudio: '', AppointmentConfirmedAudio: '', AppointmentCancelledAudio: '', InvalidInputAudio: '', TimedoutAudio:''};

config = { 'ConnectionString': '', 'SourcePhoneNumber': '', 'TargetIdentifier': '', 'AppBaseUri': '', 'EventCallBackRoute': '', 'AppointmentReminderMenuAudio': '', 'AppointmentConfirmedAudio':'', 'AppointmentCancelledAudio':'', 'InvalidInputAudio':'', 'TimedoutAudio':''};


config.ConnectionString= "",
config.SourcePhoneNumber= "",
config.TargetIdentifier= "",
config.AppBaseUri= "%AppBaseUri%",
config.EventCallBackRoute= "/api/callbacks",
config.AppointmentReminderMenuAudio= "/audio?filename=AppointmentReminderMenu.wav",
config.AppointmentConfirmedAudio= "/audio?filename=AppointmentConfirmedAudio.wav",
config.AppointmentCancelledAudio= "/audio?filename=AppointmentCancelledAudio.wav",
config.InvalidInputAudio= "/audio?filename=InvalidInputAudio.wav",
config.TimedoutAudio= "/audio?filename=TimedoutAudio.wav",
module.exports = config;