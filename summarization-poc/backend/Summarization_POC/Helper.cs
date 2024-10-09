using Azure.Communication.CallAutomation;
using System.Net.WebSockets;
using System.Text;

namespace Summarization_POC
{
    public class Helper
    {
        public static string data = string.Empty;
        public async Task ProcessRequest(WebSocket webSocket)
        {
            //string data = string.Empty;
            var buffer = new byte[1024 * 4];
            var receiveResult = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(buffer), CancellationToken.None);
            // using Dictionary<TKey,TValue> class
            //Dictionary<string, string> data = new Dictionary<string, string>();
            while (!receiveResult.CloseStatus.HasValue)
            {
                string msg = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);

                //var response = StreamingDataParser.Parse(buffer.Take(receiveResult.Count).ToArray());

                var response = StreamingDataParser.Parse(msg);

                if (response != null)
                {
                    if (response is AudioMetadata audioMetadata)
                    {
                        Console.WriteLine("***************************************************************************************");
                        Console.WriteLine("MEDIA SUBSCRIPTION ID-->" + audioMetadata.MediaSubscriptionId);
                        Console.WriteLine("ENCODING-->" + audioMetadata.Encoding);
                        Console.WriteLine("SAMPLE RATE-->" + audioMetadata.SampleRate);
                        Console.WriteLine("CHANNELS-->" + audioMetadata.Channels);
                        Console.WriteLine("LENGTH-->" + audioMetadata.Length);
                        Console.WriteLine("***************************************************************************************");
                    }
                    if (response is AudioData audioData)
                    {
                        Console.WriteLine("***************************************************************************************");
                        Console.WriteLine("DATA-->" + audioData.Data);
                        Console.WriteLine("TIMESTAMP-->" + audioData.Timestamp);
                        Console.WriteLine("IS SILENT-->" + audioData.IsSilent);
                        Console.WriteLine("***************************************************************************************");
                    }

                    if (response is TranscriptionMetadata transcriptionMetadata)
                    {
                        Console.WriteLine("***************************************************************************************");
                        Console.WriteLine("TRANSCRIPTION SUBSCRIPTION ID-->" + transcriptionMetadata.TranscriptionSubscriptionId);
                        Console.WriteLine("LOCALE-->" + transcriptionMetadata.Locale);
                        Console.WriteLine("CALL CONNECTION ID--?" + transcriptionMetadata.CallConnectionId);
                        Console.WriteLine("CORRELATION ID-->" + transcriptionMetadata.CorrelationId);
                        Console.WriteLine("***************************************************************************************");
                    }
                    if (response is TranscriptionData transcriptionData)
                    {
                        Console.WriteLine("***************************************************************************************");
                        Console.WriteLine("TEXT-->" + transcriptionData.Text);
                        Console.WriteLine("FORMAT-->" + transcriptionData.Format);
                        Console.WriteLine("OFFSET-->" + transcriptionData.Offset);
                        Console.WriteLine("DURATION-->" + transcriptionData.Duration);
                        Console.WriteLine("PARTICIPANT-->" + transcriptionData.Participant.RawId);
                        Console.WriteLine("CONFIDENCE-->" + transcriptionData.Confidence);
                        data += data + transcriptionData.Participant.RawId + ":" + transcriptionData.Text + ", ";
                        //Console.WriteLine("RESULT STATUS-->"+transcriptionData.ResultStatus);
                        foreach (var word in transcriptionData.Words)
                        {
                            Console.WriteLine("TEXT-->" + word.Text);
                            Console.WriteLine("OFFSET-->" + word.Offset);
                            Console.WriteLine("DURATION-->" + word.Duration);
                        }
                        Console.WriteLine("***************************************************************************************");
                    }

                }

                await webSocket.SendAsync(
                    new ArraySegment<byte>(buffer, 0, receiveResult.Count),
                    receiveResult.MessageType,
                    receiveResult.EndOfMessage,
                    CancellationToken.None);

                receiveResult = await webSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            await webSocket.CloseAsync(
                receiveResult.CloseStatus.Value,
                receiveResult.CloseStatusDescription,
                CancellationToken.None);
            //return data;
        }
        public string LiveTranscription()
        {
            return data;
        }
    }
}
