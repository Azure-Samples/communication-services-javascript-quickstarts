using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenAIGateway
{
    public static class Constants
    {
        public static List<string> Prompts = new List<string>()
        {
         "The assistant's role is to provide a summary on the given transcript.",
        "The assistant's role is to provide a sentiment analysis on the given transcript, if no sentiment is detected just state 'neutral'",
        "The assistant's role is to provide personal feedback for the active user. Please analyze their language and grammar and phrasing and suggest ways to speak better.",
        "The assistant's role is to provide topic suggestions for the given transcript",
        "The assistant's role is to provide outstanding questions for the given transcript",
        "The assistant's role is to extract unresolved questions from the transcript",
        "The assistant's role is to provide language translation for the given transcript to french",
        "The assistant's role is to suggest contextually relevant smart replies based on the given transcript",
        "The assistant's role is to suggest follow up meetings for the user based on the given transcript",
        "The assistant's role is to answer questions and provide information related to the topics discussed in the transcript",
        "The assistant's role is to recommend tailored content based on the user preferences detected in the transcript",
        "The assistant's role is to detect and filter inappropriate content within the given transcript",
        "The assistant's role is to identify and alert about security threats within the given transcript",
        "The assistant's role is to rephrase the users with the intent of increasing clarity in the conversation",
        "The assistant's role is to take this transcript and turn it into a cute, short story",
        };

        public static string getBriefSummarySystemPrompt = "You are an AI assist, listening to the conversation between the support agent and the user.";
        public static string getBriefSummaryUserPrompt = "From the conversation generate a brief summary of the discussion that can be sent to the support agent supervisor to get context on the conversation so far.";

        
        // Prompts for call insight generation 
        public static string sentimentScoreSystemPrompt = "You are an AI assistant listening to the conversation between the support agent and the user.";
        public static string sentimentScoreUserPrompt = @"From the above conversation between the agent and the user,
                        Generate a sentiment score Positive, Negative or Neutral, based on the conversation, customer satisfaction, and agent ability to support the user.
                        Geneate a call insight. 

                        The response should be a JSON format.
                            {
                                ""callSentiment"": """",
                                ""callInsight"": """"
                            }";


        // Prompt for ContosoAgentSupport
        public static string ContosoAgentSupportUserPrompt = @"From the above conversation between the support agent and the user,
                        Extract user content and fill in the requirements form data
                        If the user-provided content is incomplete, stuttered, or unclear, suggest the support agent with polite suggestions to clarify what was understood and what the agent should ask to fulfill the questions. 
                        The goal is the make sure the user details and issues are well understood and the required details are collected on the form.
                        If the date or mailing address is not valid, suggest agent to get the details from the user.
                        If the purchase date is older than 2 years from the current date, then mark product_under_warranty form data as false.
                        Suggest an agent with troubleshooting suggestions.
                        The response should be a JSON format.
                     
                                {
                                  ""requirements"": {
                                   ""name_provided"": true/fale,
                                    ""mailing_address_provided"": true/false,
                                    ""date_of_purchase_provided"": true/false,
                                    ""phone_number_provided"": true/false,
                                    ""issue_outlined"": true/false
                                  },
                                  ""form_data"": {
                                    ""name"": ""..."",
                                    ""address"": ""..."",
                                    ""phone_number"": ""..."",
                                    ""date_of_purchase"": ""dd/mm/yyyy"",
                                    ""issue_description"": ""..."",
                                   ""product_under_warranty"":"""",
                                   ""issue_resolved_oncall"": """",
                                   ""support_ticket_number"": """"
                                  },
                                  ""suggested_reply"": ""..."",
                                } ";
        public static string ContosoAgentSupportSystemPrompt = "You are an AI assistant assisting an support agent, listening to the conversation between the support agent and the user.";

    }
}