using System.Collections.Generic;
using Newtonsoft.Json;

namespace Contoso
{
    namespace Transfer
    {
        class RecordingFileStatusUpdatedPayload
        {
            [JsonProperty("recordingStorageInfo")]
            public RecordingStorageInfo RecordingStorageInfo { get; set; }
            [JsonProperty("recordingStartTime")]
            public string RecordingStartTime { get; set; }
            [JsonProperty("recordingDurationMs")]
            public int RecordingDurationMs { get; set; }
            [JsonProperty("sessionEndReason")]
            public string SessionEndReason { get; set; }
        }

        class RecordingStorageInfo
        {
            [JsonProperty("recordingChunks")]
            public List<RecordingChunk> RecordingChunks { get; set; }
        }

        class RecordingChunk
        {
            [JsonProperty("documentId")]
            public string DocumentId { get; set; }
            [JsonProperty("index")]
            public int Index { get; set; }
            [JsonProperty("endReason")]
            public string EndReason { get; set; }
            [JsonProperty("contentLocation")]
            public string ContentLocation { get; set; }
            [JsonProperty("metadataLocation")]
            public string MetadataLocation { get; set; }
        }
    }
}