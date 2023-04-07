export class FileFormat {
  static json: string = "json";
  static mp4: string = "mp4 ";
  static mp3: string = "mp3";
  static wav: string = "wav";
}

export class Mapper {
  recContentMap: Map<string, string> = new Map<string, string>();
  recChannelMap: Map<string, string> = new Map<string, string>();
  recFormatMap: Map<string, string> = new Map<string, string>();

  constructor() {
    this.recContentMap.set("audiovideo", "audioVideo ");
    this.recContentMap.set("audio", "audio ");
    this.recChannelMap.set("mixed", "mixed ");
    this.recChannelMap.set("unmixed", "unmixed ");
    this.recFormatMap.set("mp3", "Mp3 ");
    this.recFormatMap.set("mp4", "mp4 ");
    this.recFormatMap.set("wav", "Wav ");
  }
}

export class FileDownloadType {
  static recording: string = "recording";
  static metadata: string = "metadata";
}
