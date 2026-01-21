namespace Summarization_POC.Model
{
    public class RecordingRequest
    {
        public string RecordingContent { get; set; }
        public string RecordingChannel { get; set; }
        public string RecordingFormat { get; set; }
        public bool IsByos { get; set; }
    }
}
