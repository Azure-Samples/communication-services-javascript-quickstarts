using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Azure.AI.OpenAI;
using Azure;
using System.Collections.Generic;
using Microsoft.Extensions.FileSystemGlobbing;
using System.Reflection.PortableExecutable;
using Azure.Identity;
using Azure.Monitor.Ingestion;
using Azure.Core;
using System.Net;
using Microsoft.Extensions.Options;

namespace OpenAIGateway
{
    public class OpenAIGateway
    {
        [FunctionName("GetSummary")]
        public static async Task<IActionResult> GetSummary(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[0]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("GetSentiments")]
        public static async Task<IActionResult> GetSentiments(
           [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
           ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[1]);

            return new OkObjectResult(response.Value);
        }

        public class CallInsightInfo
        {
            [JsonProperty("CallSentiment")]
            public string CallSentiment { get; set; }
            [JsonProperty("CallInsight")]
            public string CallInsight { get; set; }
        }

        [FunctionName("CallInSights")]
        public async Task<IActionResult> CallInSights(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req, ILogger log)
        {
            log.LogInformation("Processing call insights on transcription request");


            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            String transcript = data?.transcript;

            OpenAIClient openAIClient = new OpenAIClient(
                new Uri("<<https://your-azure-openai-resource.com/>>"),
                new AzureKeyCredential("<<your-azure-openai-resource-api-key>>"));

            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                Messages = 
                   {
                        new ChatMessage(ChatRole.System, Constants.sentimentScoreSystemPrompt),
                        new ChatMessage(ChatRole.User, transcript),
                        new ChatMessage(ChatRole.User, Constants.sentimentScoreUserPrompt),
                    },
                Temperature = (float)1,
                MaxTokens = 800
            };

            Response<ChatCompletions> response = await openAIClient.GetChatCompletionsAsync(
            "<<your-deployment-name>>", chatCompletionsOptions);

            return new OkObjectResult(response.Value.Choices[0].Message.Content);
        }


        [FunctionName("GetPersonalFeedback")]
        public static async Task<IActionResult> GetPersonalFeedback(
          [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
          ILogger log)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            string prompt = $"The assistant's role is to provide personal feedback for the active user : {data?.CurrentParticipant}. Please analyze their language and grammar and phrasing and suggest ways to speak better.";

            Response<ChatCompletions> response = await GetApiResponse(data, prompt);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("GetSuggestions")]
        public static async Task<IActionResult> GetSuggestions(
          [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
          ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[3]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("GetOutstandingQuestions")]
        public static async Task<IActionResult> GetOutstandingQuestions(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[4]);

            return new OkObjectResult(response.Value);
        }


        [FunctionName("GetUnResolvedQuestions")]
        public static async Task<IActionResult> GetUnResolvedQuestions(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[5]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("TranslateToFrench")]
        public static async Task<IActionResult> TranslateToFrench(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[6]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("SuggestSmartReplies")]
        public static async Task<IActionResult> SuggestSmartReplies(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[7]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("SuggestFollowUpMeetings")]
        public static async Task<IActionResult> SuggestFollowUpMeetings(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[8]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("GetAnswers")]
        public static async Task<IActionResult> GetAnswers(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[9]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("RecommendUserPreferences")]
        public static async Task<IActionResult> RecommendUserPreferences(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[10]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("FilterInappropriateContent")]
        public static async Task<IActionResult> FilterInappropriateContent(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[11]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("IdentifySecurityThreats")]
        public static async Task<IActionResult> IdentifySecurityThreats(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[12]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("GenerateClarity")]
        public static async Task<IActionResult> GenerateClarity(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[13]);

            return new OkObjectResult(response.Value);
        }

        [FunctionName("ConvertToAStory")]
        public static async Task<IActionResult> ConvertToAStory(
         [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
         ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            Response<ChatCompletions> response = await GetApiResponse(data, Constants.Prompts[14]);

            return new OkObjectResult(response.Value);
        }


        [FunctionName("GenerateMultipleResponses")]
        public static async Task<IActionResult> GenerateMultipleResponses(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
        ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            string userName = data?.CurrentParticipant;
            string captions = data?.Captions;
            string lastSummary = data?.LastSummary;

            OpenAIClient client = getClient();

            string deploymentName = "Summarize";
            List<Response<Completions>> completionResponses = new List<Response<Completions>>();

            foreach (string prompt in Constants.Prompts)
            {
                Console.Write($"Input: {prompt}");
                CompletionsOptions completionsOptions = new CompletionsOptions();
                completionsOptions.Prompts.Add(prompt);
                completionsOptions.MaxTokens = 1024;


                Response<Completions> completionsResponse = await client.GetCompletionsAsync(deploymentName, completionsOptions);
                completionResponses.Add(completionsResponse);
                string completion = completionsResponse.Value.Choices[0].Text;
                Console.WriteLine($"Chatbot: {completion}");
            }

            return new OkObjectResult(completionResponses);
        }


        [FunctionName("GetSuggestionOnPrompt")]
        public static async Task<IActionResult> HandleGetSuggestionOnPrompt(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req, ILogger log)
        {
            log.LogInformation("Processing handle suggesion on transcription request");

            string prompt = req.Query["prompt"];
            string transcript = req.Query["transcript"];

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);

            prompt = prompt ?? data?.prompt;
            transcript = transcript ?? data?.transcript;


            //Stream Chat Message with open AI
            var openAIClient = getClient();

            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                Messages =
                   {
                        new ChatMessage(ChatRole.System, prompt),
                        new ChatMessage(ChatRole.User, transcript)
                   }
            };

            Response<StreamingChatCompletions> chatresponse = await openAIClient.GetChatCompletionsStreamingAsync(
            deploymentOrModelName: "gpt-4", chatCompletionsOptions);
            using StreamingChatCompletions streamingChatCompletions = chatresponse.Value;

            string responseMessage = "";

            await foreach (StreamingChatChoice choice in streamingChatCompletions.GetChoicesStreaming())
            {
                await foreach (ChatMessage message in choice.GetMessageStreaming())
                {
                    responseMessage = responseMessage + message.Content;
                    Console.Write(message.Content);
                }
                Console.WriteLine();
            }
            return new OkObjectResult(responseMessage);
        }


        [FunctionName("GetBriefSummary")]
        public static async Task<IActionResult> GetBriefSummary(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
    ILogger log)
        {
            log.LogInformation("Get a Brief summary of the conversation");
            string transcript = req.Query["transcript"];

            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            transcript = transcript ?? data?.transcript;


            //Stream Chat Message with open AI
            var openAIClient = getClient();

            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                Messages =
                   {
                        new ChatMessage(ChatRole.System, Constants.getBriefSummarySystemPrompt),
                        new ChatMessage(ChatRole.User, transcript),
                        new ChatMessage(ChatRole.User, Constants.getBriefSummaryUserPrompt)
                    },
                Temperature = (float)1,
                MaxTokens = 800
            };


            Response<StreamingChatCompletions> chatresponse = await openAIClient.GetChatCompletionsStreamingAsync(
             deploymentOrModelName: "gpt-4", chatCompletionsOptions);
            using StreamingChatCompletions streamingChatCompletions = chatresponse.Value;

            string responseMessage = "";

            await foreach (StreamingChatChoice choice in streamingChatCompletions.GetChoicesStreaming())
            {
                await foreach (ChatMessage message in choice.GetMessageStreaming())
                {
                    responseMessage = responseMessage + message.Content;
                    Console.Write(message.Content);
                }
                Console.WriteLine();
            }
            return new OkObjectResult(responseMessage);
        }

        
        [FunctionName("GetSuggestionForContosoSupportAgent")]
        public static async Task<IActionResult> HandleGetSuggestionForContosoSupportAgent(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req, ILogger log)
        {
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            dynamic data = JsonConvert.DeserializeObject(requestBody);
            String transcript = data?.transcript;

            OpenAIClient client = new OpenAIClient(
                new Uri("<<https://your-azure-openai-resource.com/>>"),
                new AzureKeyCredential("<<your-azure-openai-resource-api-key>>"));

            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                Messages =
                   {
                        new ChatMessage(ChatRole.System, Constants.ContosoAgentSupportSystemPrompt),
                        new ChatMessage(ChatRole.User, transcript),
                        new ChatMessage(ChatRole.User, Constants.ContosoAgentSupportUserPrompt)
                    },
                Temperature = (float)1,
                MaxTokens = 800            
            };
            Response<ChatCompletions> response = null;
            try
            {
                response = await client.GetChatCompletionsAsync(
                "<<your-deployment-name>>", chatCompletionsOptions);
            } catch(Exception e) 
            {
                Console.WriteLine(e);
            }

            return new OkObjectResult(response.Value.Choices[0].Message.Content);
        }


        [FunctionName("SendTestCustomLogs")]
        public static async Task<IActionResult> SendTestCustomLogs(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            string endpoint = Environment.GetEnvironmentVariable("DEMO_DCE_URI");
            string ruleId = Environment.GetEnvironmentVariable("DEMO_DCR_ID");
            string streamName = Environment.GetEnvironmentVariable("DEMO_STREAM_NAME");
            string tenantId = Environment.GetEnvironmentVariable("DEMO_AZURE_TENANT_ID");
            string clientId = Environment.GetEnvironmentVariable("DEMO_AZURE_CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("DEMO_AZURE_CLIENT_SECRET");

            var endpointUri = new Uri(endpoint);

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

            var client = new LogsIngestionClient(endpointUri, credential);

            var data = BinaryData.FromObjectAsJson(
                new[]
                {
                new
                {
                    TimeGenerated = DateTimeOffset.UtcNow,
                    CallId = Guid.NewGuid().ToString(),
                    SentimentScore = "Positive",
                    CallInsights = "Test manual insight"
                }
                });

            var response = await client.UploadAsync(
                ruleId,
                streamName,
                RequestContent.Create(data));

            return new OkObjectResult("Logs sent");
        }

        private static async Task<IActionResult> LogSentiments(string callId, string sentimentScore, string callInsight)
        {
            string endpoint = Environment.GetEnvironmentVariable("DEMO_DCE_URI");
            string ruleId = Environment.GetEnvironmentVariable("DEMO_DCR_ID");
            string streamName = Environment.GetEnvironmentVariable("DEMO_STREAM_NAME");
            string tenantId = Environment.GetEnvironmentVariable("DEMO_AZURE_TENANT_ID");
            string clientId = Environment.GetEnvironmentVariable("DEMO_AZURE_CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("DEMO_AZURE_CLIENT_SECRET");

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

            var client = new LogsIngestionClient(new Uri(endpoint), credential);

            var data = BinaryData.FromObjectAsJson(
                new[]
                {
                    new
                    {
                        TimeGenerated = DateTimeOffset.UtcNow,
                        CallId = callId,
                        SentimentScore = sentimentScore,
                        CallInsights = callInsight
                    }
                });

            var response = await client.UploadAsync(
                ruleId,
                streamName,
                RequestContent.Create(data));

            return new OkObjectResult("Logs sent");
        }

        private static async Task<Response<ChatCompletions>> GetApiResponse(dynamic data, string prompt)
        {
            OpenAIClient client = getClient();

            string user = data?.CurrentParticipant;
            string captions = data?.Captions;
            string lastSummary = data?.LastSummary;

            ChatCompletionsOptions options = new ChatCompletionsOptions()
            {
                ChoicesPerPrompt = 2,
                MaxTokens = 4096,
                Temperature = (float?)0.5,
                User = user,
                Messages =
                {
                    new ChatMessage(ChatRole.System, prompt),
                    new ChatMessage(ChatRole.Assistant, lastSummary),
                    new ChatMessage(ChatRole.User, captions)
                },

            };
            Response<ChatCompletions> response = await client.GetChatCompletionsAsync(
            "gpt-4", // assumes a matching model deployment or model name
            options);

            return response;
        }

        private static OpenAIClient getClient()
        {
            return new OpenAIClient("OpenAIApiKey");
        }
    }
}
